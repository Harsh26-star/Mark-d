import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { QRCodeSVG } from 'qrcode.react'
import { useNavigate } from 'react-router-dom'
import Papa from 'papaparse'


function ProfessorDashboard() {


  const [loading, setLoading] = useState(true)
  const [sessionLoading, setsessionLoading] = useState(false)
  const [reportLoading, setreportLoading] = useState({})
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
  const [subjectSessions, setSubjectSessions] = useState({})
  const [expandedSessionId, setExpandedSessionId] = useState(null)
  const [openReportIds, setOpenReportIds] = useState(new Set())
  const [sessionPages, setSessionPages] = useState({})
  const [sessionAttendance, setSessionAttendance] = useState({})
  const [subjectStudents, setSubjectStudents] = useState({})
  const [defaultersList, setdefaultersList] = useState([])

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
    setsessionLoading(true)

    await supabase.auth.getSession()

    const token = crypto.randomUUID()
    const tokenExpiresAt = new Date(Date.now() + 60 * 1000).toISOString()
    const closesAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject)
    })
    const { latitude, longitude } = position.coords

    const { data, error } = await supabase
      .from('sessions')
      .insert({
        subject_id: subjectId,
        closes_at: closesAt,
        mode: selectedMode,
        token: token,
        token_expires_at: tokenExpiresAt,
        otp: generateOTP(),
        latitude,
        longitude
      })
      .select()
      .single()

    if (!error) {
      setActiveSessionId(data.id)
      setActiveSubjectId(subjectId)
      setCurrentOTP(data.otp)
    }

    setCurrentToken(token)
    setsessionLoading(false)
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

    setreportLoading(prev => ({ ...prev, [subject.id]: true }))

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
      .select('id, opened_at, closes_at, mode')
      .eq('subject_id', subject.id)
      .order('opened_at', { ascending: false })

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
    setSubjectSessions(prev => ({ ...prev, [subject.id]: sessions }))
    setSubjectStudents(prev => ({ ...prev, [subject.id]: students }))
    setreportLoading(prev => ({ ...prev, [subject.id]: false }))
  }

  async function fetchSessionAttendance(session, students) {
    const { data: records, error } = await supabase
      .from('attendance')
      .select('student_id, status')
      .eq('session_id', session.id)

    if (error) {
      console.error('Error fetching session attendance:', error)
      return
    }

    const result = students.map(student => {
      const record = records.find(r => r.student_id === student.id)
      return {
        name: student.name,
        present: record ? record.status : false
      }
    })

    setSessionAttendance(prev => ({ ...prev, [session.id]: result }))
  }

  function exportCSV(subject) {
    const report = subjectReports[subject.id]
    if (!report) return

    const csv = Papa.unparse(report.map(student => ({
      'Student Name': student.name,
      'Sessions Attended': student.attended,
      'Total Sessions': student.total,
      'Attendance %': student.percentage + '%'
    })))

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${subject.name}_attendance.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    const calculated = Object.entries(subjectReports).flatMap(([subjectId, students]) => {
      const subject = subjects.find(s => s.id === subjectId)
      return students
        .filter(student => parseFloat(student.percentage) < 75)
        .map(student => ({
          subjectName: subject?.name,
          studentName: student.name,
          percentage: student.percentage
        }))
    })
    setdefaultersList(calculated)
  }, [subjectReports, subjects])

  return (
    <>
      <div className="min-h-screen bg-slate-100 p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
            Professor Dashboard
          </h1>
          <button onClick={handleLogout} className="bg-slate-900 text-white rounded-lg font-medium py-1 px-2 hover:bg-slate-700 transition mt5">Logout</button>
        </div>

        {subjects.length === 0 ? (
          <div className='flex flex-col items-center justify-center bg-white rounded-xl shadow-sm p-12 text-center '>
            <p className='text-4xl mb-4'>📚</p>
            <h2 className='text-lg font-semibold text-slate-700 mb-1'>No subjects assigned</h2>
            <p className='text-sm text-slate-400'>Contact your admin to get subjects assigned</p>
          </div>
        ) : (<div className="grid md:grid-cols-2 gap-6">
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
                disabled={activeSessionId && activeSubjectId !== subject.id || sessionLoading}
                className="bg-slate-900 text-white rounded-lg py-2 cursor-pointer hover:bg-slate-800 transition"
              >
                {sessionLoading && activeSubjectId === subject.id
                  ? 'Opening...'
                  : activeSessionId && activeSubjectId === subject.id
                    ? 'Close Session'
                    : 'Open Session'}
              </button>
              <button
                onClick={() => {
                  setOpenReportIds(prev => {
                    const next = new Set(prev)
                    if (next.has(subject.id)) {
                      next.delete(subject.id)
                    } else {
                      fetchSubjectReport(subject)
                      next.add(subject.id)
                    }
                    return next
                  })
                }}
                className='text-sm text-slate-500 underline mt-1'
              >
                {reportLoading[subject.id]
                  ? 'Loading...'
                  : openReportIds.has(subject.id)
                    ? 'Hide Report'
                    : 'View Report'}
              </button>
              {subjectReports[subject.id] && (
                <button
                  onClick={() => exportCSV(subject)}
                  className='text-sm text-slate-500 underline mt-1'
                >Export CSV</button>
              )}
              {openReportIds.has(subject.id) && subjectReports[subject.id] && (
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
                  {(() => {
                    const page = sessionPages[subject.id] || 0
                    const pageSize = 5
                    const sessions = subjectSessions[subject.id] || []
                    const paginated = sessions.slice(page * pageSize, (page + 1) * pageSize)
                    const totalPages = Math.ceil(sessions.length / pageSize)

                    return (
                      <>
                        <h3 className='text-sm font-semibold text-slate-600 mt-4 mb-2'>Sessions</h3>

                        {subjectSessions[subject.id]?.length === 0 ? (
                          <p>No sessions held yet for this subject.</p>
                        ) : (
                          paginated.map(session => (
                            <div
                              key={session.id}
                              className='border rounded-lg p-3 mb-2 text-sm text-slate-700 cursor-pointer hover:bg-slate-50'
                              onClick={() => {
                                setExpandedSessionId(prev => prev === session.id ? null : session.id)
                                fetchSessionAttendance(session, subjectStudents[subject.id])
                              }}
                            >
                              <p className='font-medium'>
                                {new Date(session.opened_at).toLocaleDateString('en-IN', {
                                  day: 'numeric', month: 'short', year: 'numeric'
                                })} — {new Date(session.opened_at).toLocaleTimeString('en-IN', {
                                  hour: '2-digit', minute: '2-digit'
                                })}
                              </p>
                              <p className='text-slate-500'>{session.mode} mode</p>
                              {expandedSessionId === session.id && sessionAttendance[session.id] && (
                                <div className='mt-2 border-t pt-2'>{sessionAttendance[session.id].map(student => (
                                  <p key={student.name} className={`py-0.5 ${student.present ? 'text-green-600' : 'text-red-500'}`}>{student.present ? '✅' : '❌'} {student.name}</p>
                                ))}</div>
                              )}
                            </div>
                          ))
                        )}
                        <div className='flex justify-between items-center mt-2 text-sm text-slate-500'>
                          <button
                            disabled={page === 0}
                            onClick={() => setSessionPages(prev => ({ ...prev, [subject.id]: page - 1 }))}
                            className='disabled:opacity-30 hover:text-slate-800'
                          >← Prev</button>
                          <span>Page {page + 1} of {totalPages}</span>
                          <button
                            disabled={page >= totalPages - 1}
                            onClick={() => setSessionPages(prev => ({ ...prev, [subject.id]: page + 1 }))}
                            className='disabled:opacity-30 hover:text-slate-800'
                          >Next →</button>
                        </div>
                      </>
                    )
                  })()}
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
        </div>)}
        {defaultersList.filter(d =>
          openReportIds.has(subjects.find(s => s.name === d.subjectName)?.id)
        ).length > 0 && (
            <div className="mt-8 bg-white shadow-sm rounded-xl p-6">
              <h2 className="text-lg font-semibold text-red-600 mb-4">⚠️ Defaulters (below 75%)</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="pb-2">Student</th>
                    <th className="pb-2">Subject</th>
                    <th className="pb-2">%</th>
                  </tr>
                </thead>
                <tbody>
                  {defaultersList
                    .filter(d => openReportIds.has(subjects.find(s => s.name === d.subjectName)?.id))
                    .map((d, i) => (
                      <tr key={i} className="border-t">
                        <td className="py-2">{d.studentName}</td>
                        <td className="py-2">{d.subjectName}</td>
                        <td className="py-2 font-semibold text-red-500">{d.percentage}%</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </>
  )
}

export default ProfessorDashboard
