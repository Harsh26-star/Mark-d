import { useState } from 'react'
import { supabase } from './lib/supabaseClient'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Signup from './pages/Signup'
import Login from './pages/Login'
import AdminDashboard from './pages/AdminDashboard'
import StudentDashboard from './pages/StudentDashboard'
import ProfessorDashboard from './pages/ProfessorDashboard'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Navigate to={'/login'}/>}/>
        <Route path='/login' element={<Login />} />
        <Route path='/signup' element={<Signup />} />
        <Route path='/admin' element={<AdminDashboard />}/>
        <Route path='/student' element={<StudentDashboard />}/>
        <Route path='/professor' element={<ProfessorDashboard />}/>
      </Routes>
    </BrowserRouter>
  )
}

export default App
