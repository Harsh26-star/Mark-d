import { use, useEffect, useState } from "react"
import React from 'react'
import { supabase } from "../lib/supabaseClient"

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

    async function fetchClasses(params) {

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

    const { error: classError } = await supabase
      .from('classes')
      .insert({
        name: className
      })
      
    if (!className.trim()) {
      setError('Class name cannot be empty')
      return
    }
    console.log(className)
  }

  async function handleSubjectSubmit(e) {
    e.preventDefault()

    const { error: subjectError } = await supabase
      .from('subjects')
      .insert({
        name: subjectName,
        class_id: classId,
        professor_id: professorId
      })

    console.log('subject error:', subjectError)
    console.log('classId:', classId)
    console.log('professorId:', professorId)
    console.log('subjectName:', subjectName)
  }

  async function handleGenerateCode(e) {
    e.preventDefault()
    const code = generateCode()

    const { error } = await supabase
      .from('enrollment_codes')
      .insert({
        class_id: codeClassId,
        code: code,
        expires_at: expiresAt,
        is_active: true
      })

    if (!error) setGeneratedCode(code)

  }



  return (
    <div className="min-h-screen bg-slate-100 flex justify-center px-4 py-10">

      <div className="w-full max-w-5xl">

        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-8 text-center">
          Admin Dashboard
        </h1>

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

          </form>
          <form
            onSubmit={handleGenerateCode}
            className="bg-white shadow-sm rounded-xl p-6 flex flex-col gap-4"
          >

            <h2 className="text-lg font-semibold text-slate-700">
              Generate a code
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
          </form>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
