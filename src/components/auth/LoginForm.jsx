import React, { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'

function LoginForm() {

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    async function handleLogin(e) {
        e.preventDefault()
        setError('')
        setLoading(true)

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        })

        if (error) {
            setError(error.message)
            setLoading(false)
            return
        }

        const role = data.user.app_metadata.role || data.user.user_metadata.role
        console.log('Role:', role)
        if (role === 'student') navigate('/student')
        if (role === 'professor') navigate('/professor')
        if (role === 'admin') navigate('/admin')
    }

    return (
        <form
            onSubmit={handleLogin}
            className="flex flex-col gap-3 text-slate-800"
        >

            <div className='flex flex-col gap-1'>
                <label className="text-sm font-bold text-slate-700">Your Email</label>
                <input
                    name='email'
                    type="email"
                    placeholder="Enter Your Email"
                    onChange={(e) => setEmail(e.target.value)}
                    className="border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 transition-colors"
                />
            </div>

            <div className='flex flex-col gap-1'>
                <label className="text-sm font-bold text-slate-700">Your Password</label>
                <input
                    type="password"
                    placeholder="Enter Your Password"
                    onChange={(e) => setPassword(e.target.value)}
                    className="border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 transition-colors"
                />
                {error && <p className='text-red-600 font-medium'>{error}</p>}
            </div>

            <button
                type="submit"
                className="bg-slate-900 text-white rounded-lg py-2 mt-2 cursor-pointer hover:bg-slate-800 transition-colors"
            >
                Login
            </button>

        </form>
    )
}

export default LoginForm
