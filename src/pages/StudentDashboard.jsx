import React, { useState } from 'react'
import QRScanner from '../components/QRScanner'
import { supabase } from '../lib/supabaseClient'

function StudentDashboard() {

  const [mode, setMode] = useState(null)
  const [otp, setOtp] = useState('')
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)


  async function handleOTPSubmit(e) {
    e.preventDefault()

    // Find session with this OTP
    const { data: session } = await supabase
      .from('sessions')
      .select('*')
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

    if (!error) setSuccess('Attendance marked sucessfully!')
  }

  return (
    <div>
      <button onClick={() => setMode("qr")}>Scan QR</button>
      <button onClick={() => setMode("otp")}>Enter OTP</button>

      {mode === "otp" && (
        <form onSubmit={handleOTPSubmit}>
          <input
            onChange={(e) => { setOtp(e.target.value) }}
            type="text" placeholder='Enter OTP' />
          <button type='submit'>Submit</button>
        </form>
      )}
      {mode === "qr" && (
        <QRScanner />
      )}
    </div>
  )
}

export default StudentDashboard
