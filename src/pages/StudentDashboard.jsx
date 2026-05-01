import React, { useEffect, useState } from 'react'
import QRScanner from '../components/QRScanner'
import { supabase } from '../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'

function StudentDashboard() {

  const [mode, setMode] = useState(null)
  const [otp, setOtp] = useState('')
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [user, setUser] = useState(null)
  const [attendanceData, setAttendanceData] = useState([]);

  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  async function getStudentData() {

    // Fetch student profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('class_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      console.error("Error fetching Profile:", profileError)
      return
    }
    const classId = profile.class_id;

    // Get all subjects for student's class
    const { data: subjects } = await supabase
      .from('subjects')
      .select('*')
      .eq('class_id', classId)

    // Get all sessions for those subjects
    const subjectsIds = subjects.map(s => s.id)
    const { data: sessions } = await supabase
      .from('sessions')
      .select('*')
      .in('subject_id', subjectsIds)

    // Get all attendance records for this student
    const { data: attended } = await supabase
      .from('attendance')
      .select('*')
      .eq('student_id', user.id)

    const result = subjects.map(subject => {
      const totalSessions = sessions.filter(s => s.subject_id === subject.id).length
      const attendedSessions = attended.filter(a =>
        sessions.find(s => s.id === a.session_id && s.subject_id === subject.id)
      ).length
      const percentage = totalSessions > 0 ? ((attendedSessions / totalSessions) * 100).toFixed(2) : 0
      return { ...subject, totalSessions, attendedSessions, percentage }
    })
    setAttendanceData(result)
  }

  useEffect(() => {
    async function fetchUser() {
      const { data, error } = await supabase.auth.getUser()
      if (error || !data?.user) {
        console.error("Error fetching user:", error)
        navigate('/login')
        return
      }
      setUser(data.user)
    }
    fetchUser()
  }, [navigate])

  async function handleOTPSubmit(e) {
    e.preventDefault()
    setSuccess(null)
    setError(null)

    if (!user) {
      setError("User not authenticated")
      return
    }

    // Find session with this OTP
    const { data: session } = await supabase
      .from('sessions')
      .select('*, subjects(name)')
      .eq('otp', otp)
      .gt('closes_at', new Date().toISOString())
      .single()

    if (!session) {
      setError('Invalid or expired OTP')
      return
    }

    // Check if already marked
    const { data: existing } = await supabase
      .from('attendance')
      .select('*')
      .eq('session_id', session.id)
      .eq('student_id', user.id)
      .maybeSingle()

    if (existing) {
      setError('Already marked present')
      return
    }

    // Distance check
    let position 
    try {
      position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject)
      })
    } catch (geoError) {
      setError('Location access is required to mark attendance. Please enable location permissions and try again.')
      return
    }

    const { latitude: studentLat, longitude: studentLon } = position.coords

    const distance = getDistanceInMeters(
      studentLat, studentLon,
      session.latitude, session.longitude
    )

    if (distance > 100) {
      setError('You must be physically present in the classroom to mark attendance.')
      return
    }

    // Mark attendance
    const { error } = await supabase
      .from('attendance')
      .insert({
        session_id: session.id,
        student_id: user.id,
        status: true
      })

    if (!error) setSuccess(`Attendance marked sucessfully! for ${session.subjects.name}`)

    await getStudentData()
  }

  useEffect(() => {
    if (!user) return
    getStudentData()
  }, [user]);

  function getDistanceInMeters(lat1, lon1, lat2, lon2) {
    const R = 6371000
    const toRad = deg => (deg * Math.PI) / 180

    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lon2 - lon1)

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }


  return (
    <div className='min-h-screen bg-slate-100 flex items-center justify-center p-8'>
      <div className='bg-white rounded-xl shadow-sm p-8 w-full max-w-md flex flex-col'>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
            Mark Attendance
          </h1>
          <button onClick={handleLogout} className="bg-slate-900 text-white rounded-lg font-medium py-1 px-2 hover:bg-slate-700 transition mt5">Logout</button>
        </div>

        <div className='flex gap-3'>
          <button
            onClick={() => setMode("qr")}
            className={`flex-1 py-2 rounded-lg font-medium transition ${mode === "qr"
              ? "bg-slate-900 text-white"
              : "border border-slate-300 text-slate-700 hover:bg-slate-50"
              }`}
          >
            Scan QR
          </button>
          <button
            onClick={() => setMode("otp")}
            className={`flex-1 py-2 rounded-lg font-medium transition ${mode === "otp"
              ? "bg-slate-900 text-white"
              : "border border-slate-300 text-slate-700 hover:bg-slate-50"
              }`}
          >
            Enter OTP
          </button>
        </div>

        {mode === "otp" && (
          <form onSubmit={handleOTPSubmit} className='flex flex-col gap-4'>
            <input
              onChange={(e) => { setOtp(e.target.value) }}
              type="text"
              placeholder='Enter OTP'
              maxLength={4}
              className='border border-slate-200 rounded-lg px-3 py-2 text-center text-2xl font-bold tracking-widest focus:outline-none focus:border-blue-500'
            />
            <button
              type='submit'
              className='bg-slate-900 text-white rounded-lg py-2 hover:bg-slate-800 transition'
            >Submit</button>
          </form>
        )}

        {mode === "qr" && <QRScanner />}

        {error && <p className='text-red-500 text-sm text-center'>{error}</p>}
        {success && <p className='text-green-600 font-semibold text-center'>{success}</p>}
        {attendanceData.length === 0 ? (
          <div className='flex flex-col items-center justify-center mt-8 text-center'>
            <p className='text-4xl mb-4'>📋</p>
            <h2 className='text-lg font-semibold text-slate-700 mb-1'>No attendance data yet</h2>
            <p className='text-sm text-slate-400'>Your attendance will appear here once your professor opens a session.</p>
          </div>
        ) : (
          <div className='mt-8 flex flex-col gap-4'>
            <h2 className='text-lg font-bold text-slate-800'>Your Attendance</h2>
            {attendanceData.map(subject => (
              <div key={subject.id} className='bg-white rounded-xl shadow-sm p-4 flex flex-col gap-2'>
                <div className='flex justify-between items-center'>
                  <h3 className='font-semibold text-slate-700'>{subject.name}</h3>
                  <span className={`font-bold text-lg ${subject.percentage >= 85 ? 'text-green-600' :
                    subject.percentage >= 75 ? 'text-yellow-500' :
                      'text-red-500'
                    }`}>
                    {subject.percentage}%
                  </span>
                </div>
                <p className='text-sm text-slate-500'>{subject.attendedSessions} / {subject.totalSessions} sessions attended</p>
                <div className='w-full bg-slate-100 rounded-full h-2'>
                  <div
                    className={`h-2 rounded-full ${subject.percentage >= 85 ? 'bg-green-500' :
                      subject.percentage >= 75 ? 'bg-yellow-400' :
                        'bg-red-500'
                      }`}
                    style={{ width: `${subject.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )
        }
      </div>
    </div>
  )
}

export default StudentDashboard
