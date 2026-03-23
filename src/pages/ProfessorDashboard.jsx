import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

function ProfessorDashboard() {

  const [loading, setLoading] = useState(true)
  const [professor, setProfessor] = useState(null)
  const [selectedMode, setSelectedMode] = useState('QR')
  const [subjects, setSubjects] = useState([])
  const [subjectId, setSubjectId] = useState()

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

  async function handleOpenSession(subjectId) {

    const token = crypto.randomUUID()
    const tokenExpiresAt = new Date(Date.now() + 60 * 1000).toISOString()
    const closesAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    const { error } = await supabase
      .from('sessions')
      .insert({
        subject_id: subjectId,
        closes_at: closesAt,
        mode: selectedMode,
        token: token,
        token_expires_at: tokenExpiresAt
      })

    const { data: {session} } = await supabase.auth.getSession()
    console.log('current user id :', session.user.id)
    console.log('subject id being used:', subjectId)

    console.log(error)
  }


  return (
    <>
      <div className="min-h-screen bg-slate-100 p-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Professor Dashboard</h1>

        <div className="grid md:grid-cols-2 gap-6">
          {subjects.map(subject => (
            <div key={subject.id} className="bg-white shadow-sm rounded-xl p-6 flex flex-col gap-4">
              <h2 className="text-lg font-semibold text-slate-700">{subject.name}</h2>
              <select onChange={(e) => setSelectedMode(e.target.value)}>
                <option value="QR">QR code</option>
                <option value="OTP">OTP</option>
              </select>
              <button
                onClick={() => handleOpenSession(subject.id)}
                className="bg-slate-900 text-white rounded-lg py-2 cursor-pointer hover:bg-slate-800 transition"
              >
                Open Session
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

export default ProfessorDashboard
