import React, { useState } from 'react'
import QRScanner from '../components/QRScanner'
import { supabase } from '../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'

function StudentDashboard() {

  const [mode, setMode] = useState(null)
  const [otp, setOtp] = useState('')
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  async function handleOTPSubmit(e) {
    e.preventDefault()

    setError(null)

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

    // Get current student
    const { data: { user } } = await supabase.auth.getUser()

    // Check if already marked
    const { data: existing } = await supabase
      .from('attendance')
      .select('*')
      .eq('session_id', session.id)
      .eq('student_id', user.id)
      .single()

    if (existing) {
      setError('Already marked present')
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
            className={`flex-1 py2 rounded-lg font-medium transition ${mode === "otp"
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
              className='border border-slate-200 rounded-lg px3 py-2 text-center text-2xl font-bold tracking-widest focus:outline-none focus:border-blue-500'
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
      </div>
    </div>
  )
}

export default StudentDashboard
