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
  const [subjectId, setSubjectId] = useState()
  const [activeSubjectId, setActiveSubjectId] = useState(null)
  const [activeSessionId, setActiveSessionId] = useState(null)
  const [sessionStatus, setSessionStatus] = useState(null)
  const [currentToken, setCurrentToken] = useState(null)
  const [currentOTP, setCurrentOTP] = useState(null)
  const [attendanceCount, setAttendanceCount] = useState(0)

  const intervalRef = useRef(null)
  const channelRef = useRef(null)
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
    console.log('activeSessionId changed: ', activeSessionId)
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
        .select('*', {count: 'exact', head: true})
        .eq('session_id', activeSessionId)

      console.log('count:', count, 'error:', error)
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

    const { data: { session } } = await supabase.auth.getSession()


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
