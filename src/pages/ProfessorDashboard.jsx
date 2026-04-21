import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { QRCodeSVG } from 'qrcode.react'
import { useNavigate } from 'react-router-dom'


function ProfessorDashboard() {

  const [loading, setLoading] = useState(true)
  const [professor, setProfessor] = useState(null)
  const [selectedMode, setSelectedMode] = useState('QR')
  const [subjectModes, setSubjectModes] = useState({})
  const [subjects, setSubjects] = useState([])
  const [activeSubjectId, setActiveSubjectId] = useState(null)
  const [activeSessionId, setActiveSessionId] = useState(null)
  const [currentToken, setCurrentToken] = useState(null)
  const [currentOTP, setCurrentOTP] = useState(null)
  const [attendanceCount, setAttendanceCount] = useState(0)
  const [subjectReports, setSubjectReports] = useState({})

  const intervalRef = useRef(null)
  const navigate = useNavigate()

  function generateOTP() {
    return Math.floor(1000 + Math.random() * 9000).toString()
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  useEffect(() => {
    async function checkUser() {

      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        setLoading(false)
        return
      }

      const role = session.user.app_metadata.role
      setProfessor({ role })
      setLoading(false)

      const { data } = await supabase
        .from('subjects')
        .select('*')
        .eq('professor_id', session.user.id)

      setSubjects(data)
    }

    checkUser()

  }, [])

  useEffect(() => {

    if (!activeSessionId) return

    intervalRef.current = setInterval(() => {

      async function refreshToken() {
        const newToken = crypto.randomUUID()
        const newTokenExpiresAt = new Date(Date.now() + 60 * 1000).toISOString()
        const newOTP = generateOTP()

        const { error } = await supabase
          .from('sessions')
          .update({
            token: newToken,
            token_expires_at: newTokenExpiresAt,
            otp: newOTP
          })
          .eq('id', activeSessionId)

        setCurrentToken(newToken)
        setCurrentOTP(newOTP)
      }

      refreshToken()

    }, 60000);

    return () => clearInterval(intervalRef.current)
  }, [activeSessionId])

  useEffect(() => {
    if (!activeSessionId) return

    async function fetchCount() {
      const { count, error } = await supabase
        .from('attendance')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', activeSessionId)

      setAttendanceCount(count || 0)
    }

    fetchCount()

    const pollInterval = setInterval(fetchCount, 5000)

    return () => clearInterval(pollInterval)
  }, [activeSessionId])



  async function handleOpenSession(subjectId) {

    const token = crypto.randomUUID()
    const tokenExpiresAt = new Date(Date.now() + 60 * 1000).toISOString()
    const closesAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('sessions')
      .insert({
        subject_id: subjectId,
        closes_at: closesAt,
        mode: selectedMode,
        token: token,
        token_expires_at: tokenExpiresAt,
        otp: generateOTP()
      })
      .select()
      .single()

    if (!error) {
      setActiveSessionId(data.id)
      setActiveSubjectId(subjectId)
      setCurrentOTP(data.otp)
    }

    setCurrentToken(token)
  }

  async function handleCloseSession() {

    const { data } = await supabase
      .from('sessions')
      .update({
        closes_at: new Date().toISOString()
      })
      .eq('id', activeSessionId)

    setActiveSessionId(null)
    setCurrentOTP(null)
    setCurrentToken(null)
    setActiveSubjectId(null)
    clearInterval(intervalRef.current)
    setAttendanceCount(0)
  }

  async function fetchSubjectReport(subject) {

    // Get all students in this subject's class
    const { data: students, error: studentsError } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('class_id', subject.class_id)
      .eq('role', 'student')

    if (studentsError) {
      console.error('Error fetching students:', studentsError)
      return
    }

    // Get all sessions for this subject
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('id')
      .eq('subject_id', subject.id)

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError)
      return
    }

    //Get all attendance records for this subject's sessions
    const sessionIds = sessions.map(s => s.id)

    const { data: attendanceRecords, error: attendanceError } = await supabase
      .from('attendance')
      .select('student_id, status')
      .in('session_id', sessionIds)

    if (attendanceError) {
      console.error('Error fetching attendance:', attendanceError)
      return
    }

    //Calculate percentage for each student
    const totalSessions = sessions.length

    const report = students.map(student => {
      const attended = attendanceRecords.filter(
        r => r.student_id === student.id && r.status === true
      ).length

      return {
        name: student.name, attended,
        total: totalSessions,
        percentage: totalSessions > 0 ? ((attended / totalSessions) * 100).toFixed(1) : 0
      }
    })
    setSubjectReports(prev => ({ ...prev, [subject.id]: report }))
  }

  return (
    <>
      <div className="min-h-screen bg-slate-100 p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
            Professor Dashboard
          </h1>
          <button onClick={handleLogout} className="bg-slate-900 text-white rounded-lg font-medium py-1 px-2 hover:bg-slate-700 transition mt5">Logout</button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {subjects.map(subject => (
            <div key={subject.id} className="bg-white shadow-sm rounded-xl p-6 flex flex-col gap-4">
              <h2 className="text-lg font-semibold text-slate-700">{subject.name}</h2>
              <select
                onChange={(e) => setSubjectModes(prev => ({ ...prev, [subject.id]: e.target.value }))}
                value={subjectModes[subject.id] || 'QR'}
              >
                <option value="QR">QR code</option>
                <option value="OTP">OTP</option>
              </select>
              <button
                onClick={() => activeSessionId ? handleCloseSession() : handleOpenSession(subject.id)}
                disabled={activeSessionId && activeSubjectId !== subject.id}
                className="bg-slate-900 text-white rounded-lg py-2 cursor-pointer hover:bg-slate-800 transition"
              >
                {activeSessionId && activeSubjectId === subject.id ? 'Close Session' : 'Open Session'}
              </button>
              <button
                onClick={() => fetchSubjectReport(subject)}
                className='text-sm text-slate-500 underline mt-1'
              >View Report</button>
              {subjectReports[subject.id] && (
                <div className='mt-4 border-t pt-4'>
                  <h3 className='text-sm font-semibold text-slate-600 mb-2'>Attendance Report</h3>
                  <table className='w-full text-sm'>
                    <thead>
                      <tr className='text-left text-slate-500'>
                        <th className='pb-1'>Student</th>
                        <th className='pb-1'>Attended</th>
                        <th className='pb-1'>Total</th>
                        <th className='pb-1'>%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subjectReports[subject.id].map(student => (
                        <tr key={student.name} className='border-t'>
                          <td className='py-1'>{student.name}</td>
                          <td className='py-1'>{student.attended}</td>
                          <td className='py-1'>{student.total}</td>
                          <td className={`py-1 font-semibold ${student.percentage < 75 ? 'text-red-500' : 'text-green-600'}`}>{student.percentage}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {activeSessionId && activeSubjectId === subject.id && currentToken && (
                subjectModes[subject.id] === 'OTP'
                  ? <p className='text-6xl font-black tracking-widest text-center text-slate-900'>
                    {currentOTP}
                  </p>
                  : <QRCodeSVG value={currentToken} size={256} />
              )}
              {activeSessionId && activeSubjectId === subject.id && (
                <p className='text-slate-600 font-medium'>
                  Students present: <span className='text-slate-900 font-bold'>{attendanceCount}</span>
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

export default ProfessorDashboard
