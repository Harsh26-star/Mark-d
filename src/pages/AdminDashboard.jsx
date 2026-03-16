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

      console.log('classes:' , data, error)
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



  return (
    <div>
      <form
        onSubmit={handleClassSubmit}
        className="flex flex-col gap-3 text-slate-800"
      >

        <div className='flex flex-col gap-1'>
          <label className="text-sm font-bold text-slate-700">Create a Class</label>
          <input
            type="text"
            placeholder="e.g. TYBCA"
            onChange={(e) => setClassName(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <button
          type="submit"
          className="bg-slate-900 text-white rounded-lg py-2 mt-2 cursor-pointer hover:bg-slate-800 transition-colors"
        >
          Create Class
        </button>

      </form>

      <form onSubmit={handleSubjectSubmit}>
        <div className='flex flex-col gap-1'>
          <label className="text-sm font-bold text-slate-700">Name of the Subject</label>
          <input
            type="text"
            placeholder="e.g. Database Management"
            onChange={(e) => setSubjectName(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <div className='flex flex-col gap-1'>
          <select onChange={(e) => setProfessorId(e.target.value)}>
            <option value="">Select a professor</option>
            {professors.map(p => (
              <option key={p.id} value={p.id}
              >{p.name}</option>
            ))}
          </select>
        </div>
        <div className='flex flex-col gap-1'>
          <select onChange={(e) => setClassId(e.target.value)}>
            <option value="">Select a Class</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}
              >{c.name}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="bg-slate-900 text-white rounded-lg py-2 mt-2 cursor-pointer hover:bg-slate-800 transition-colors"
        >
          Create Subject
        </button>
      </form>
    </div>
  )
}

export default AdminDashboard
