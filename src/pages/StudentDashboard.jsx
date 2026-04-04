import React, { useState } from 'react'
import QRScanner from '../components/QRScanner'

function StudentDashboard() {

  const [selectedMode, setSelectedMode] = useState('')

  function handleSelectMode() {
    
  }

  return (
    <div>
      <form onSubmit={handleSelectMode}>
        <label>Select Mode</label>
        <select id="mode"
          onChange={(e) => setSelectedMode(e.target.value)}
        >
          <option value="QR">Qr</option>
          <option value="OTP">OTP</option>
        </select>
        <button type='submit'>Confirm Mode</button>
      </form>
      
    </div>
  )
}

export default StudentDashboard
