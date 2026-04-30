import { use, useEffect, useState } from "react"
import React from 'react'
import { supabase } from "../lib/supabaseClient"
import { useNavigate } from "react-router-dom"

function AdminDashboard() {

  const [className, setClassName] = useState('')
  const [classes, setClasses] = useState([])
  const [subjectName, setSubjectName] = useState('')
  const [professors, setProfessors] = useState([])
  const [professorId, setProfessorId] = useState('')
  const [classId, setClassId] = useState('');
  const [codeClassId, setCodeClassId] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [generatedCode, setGeneratedCode] = useState('')
  const [classSuccess, setClassSuccess] = useState(null)
  const [subjectSuccess, setSubjectSuccess] = useState(null)
  const [codeSuccess, setCodeSuccess] = useState(null)
  const [error, setError] = useState(null)
  const [professorCodeExpiry, setProfessorCodeExpiry] = useState('')
  const [generatedProfessorCode, setGeneratedProfessorCode] = useState('')

  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  function generateCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  useEffect(() => {
    async function fetchProfessors() {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'professor')

      console.log('professors:', data, error)
      if (data) setProfessors(data)
    }

    async function fetchClasses() {

      const { data, error } = await supabase
        .from('classes')
        .select('*')

      console.log('classes:', data, error)
      if (data) setClasses(data)
    }

    fetchProfessors()
    fetchClasses()
  }, [])

  async function handleClassSubmit(e) {
    e.preventDefault()

    setClassSuccess(null)
    if (!className.trim()) {
      setError('Class name cannot be empty')
      return
    }

    const { error: classError } = await supabase
      .from('classes')
      .insert({
        name: className
      })


    if (!classError) {
      const { data } = await supabase
        .from('classes')
        .select('*')

      if (data) setClasses(data)

      setClassSuccess('Class Added Successfully!')
    }

  }

  async function handleSubjectSubmit(e) {
    e.preventDefault()

    setSubjectSuccess(null)
    const { error: subjectError } = await supabase
      .from('subjects')
      .insert({
        name: subjectName,
        class_id: classId,
        professor_id: professorId
      })

    if (!subjectError) {
      setSubjectSuccess('Subject Added successfully!')
    }
  }

  async function handleGenerateCode(e) {
    e.preventDefault()

    setCodeSuccess(null)
    const code = generateCode()

    const { error } = await supabase
      .from('enrollment_codes')
      .insert({
        class_id: codeClassId,
        code: code,
        expires_at: expiresAt,
        is_active: true
      })

    if (!error) {
      setGeneratedCode(code)
      setCodeSuccess('Code Generated successfully!')
    }
  }

  async function handleGenerateProfessorCode(e) {
    e.preventDefault()    
    const code = generateCode()

    const { error } = await supabase
      .from('enrollment_codes')
      .insert({
        code: code,
        expires_at: professorCodeExpiry,
        is_active: true,
        type: 'professor'
      })

    console.log('Professor code error:', error)
    if (!error) setGeneratedProfessorCode(code)
  }


  return (
    <div className="min-h-screen bg-slate-100 flex justify-center px-4 py-10">

      <div className="w-full max-w-5xl">

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
            Admin Dashboard
          </h1>
          <button onClick={handleLogout} className="bg-slate-900 text-white rounded-lg font-medium py-1 px-2 hover:bg-slate-700 transition mt5">Logout</button>
        </div>

        {/* Responsive grid */}
        <div className="grid md:grid-cols-2 gap-8">

          {/* Create Class Card */}
          <form
            onSubmit={handleClassSubmit}
            className="bg-white shadow-sm rounded-xl p-6 flex flex-col gap-4"
          >

            <h2 className="text-lg font-semibold text-slate-700">
              Create a Class
            </h2>

            <input
              type="text"
              placeholder="e.g. TYBCA"
              onChange={(e) => setClassName(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
            />

            <button
              type="submit"
              className="bg-slate-900 text-white rounded-lg py-2 cursor-pointer hover:bg-slate-800 transition"
            >
              Create Class
            </button>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {classSuccess && <p className='text-green-600 font-semibold text-center'>{classSuccess}</p>}
          </form>


          {/* Create Subject Card */}
          <form
            onSubmit={handleSubjectSubmit}
            className="bg-white shadow-sm rounded-xl p-6 flex flex-col gap-4"
          >

            <h2 className="text-lg font-semibold text-slate-700">
              Create a Subject
            </h2>

            <input
              type="text"
              placeholder="e.g. Database Management"
              onChange={(e) => setSubjectName(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
            />

            <select
              onChange={(e) => setProfessorId(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
            >
              <option value="">Select a professor</option>
              {professors.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <select
              onChange={(e) => setClassId(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
            >
              <option value="">Select a class</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="bg-slate-900 text-white rounded-lg py-2 cursor-pointer hover:bg-slate-800 transition"
            >
              Create Subject
            </button>
            {subjectSuccess && <p className='text-green-600 font-semibold text-center'>{subjectSuccess}</p>}
          </form>

          <form
            onSubmit={handleGenerateCode}
            className="bg-white shadow-sm rounded-xl p-6 flex flex-col gap-4"
          >

            <h2 className="text-lg font-semibold text-slate-700">
              Generate Student code
            </h2>
            <select
              onChange={(e) => setCodeClassId(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
            >
              <option value="">Select a class</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <input
              type="date"
              placeholder="Set an Expiry date"
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
            />

            <button
              type="submit"
              className="bg-slate-900 text-white rounded-lg py-2 cursor-pointer hover:bg-slate-800 transition"
            >
              Generate Code
            </button>
            {generatedCode && (
              <div>
                <p>Share this code with your students:</p>
                <p>{generatedCode}</p>
              </div>

            )}
            {codeSuccess && <p className='text-green-600 font-semibold text-center'>{codeSuccess}</p>}
          </form>
          <form
            onSubmit={handleGenerateProfessorCode}
            className="bg-white shadow-sm rounded-xl p-6 flex flex-col gap-4"
          >
            <h2 className="text-lg font-semibold text-slate-700">
              Generate Professor Code
            </h2>
            <input
              type="date"
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setProfessorCodeExpiry(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="bg-slate-900 text-white rounded-lg py-2 cursor-pointer hover:bg-slate-800 transition"
            >
              Generate Code
            </button>
            {generatedProfessorCode && (
              <div>
                <p>Share this code with the professor:</p>
                <p className="font-bold tracking-widest">{generatedProfessorCode}</p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
