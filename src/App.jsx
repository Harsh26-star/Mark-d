import { useState } from 'react'
import { supabase } from './lib/supabaseClient'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/auth/ProtectedRoute'
import Signup from './pages/Signup'
import Login from './pages/Login'
import AdminDashboard from './pages/AdminDashboard'
import StudentDashboard from './pages/StudentDashboard'
import ProfessorDashboard from './pages/ProfessorDashboard'

function App() {
  return (
    <BrowserRouter>
      <Routes>
          <Route path='/' element={<Navigate to={'/signup'} />} />
          <Route path='/login' element={<Login />} />
          <Route path='/signup' element={<Signup />} />
          <Route path='/admin' element={
            <ProtectedRoute role='admin'>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path='/student' element={
            <ProtectedRoute role='student'>
              <StudentDashboard />
            </ProtectedRoute>
          } />
          <Route path='/professor' element={
            <ProtectedRoute role='professor'>
              <ProfessorDashboard />
            </ProtectedRoute>
          } />
      </Routes>
    </BrowserRouter>
  )
}

export default App
