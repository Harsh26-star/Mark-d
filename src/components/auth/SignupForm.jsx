import React, { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

function SignupForm() {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [enrollmentCode, setEnrollmentCode] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleSignup(e) {
        e.preventDefault()
        setError('')
        setLoading(true)

        // Validate enrollment code
        const { data: codeData, error: codeError } = await supabase
            .from('enrollment_codes')
            .select('*')
            .eq('code', enrollmentCode)
            .eq('is_active', true)
            .single()

        if (codeError || !codeData) {
            setError('Invalid or expired enrollment code.')
            setLoading(false)
            return
        }

        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password
        })

        await supabase.auth.updateUser({
            data: { role: 'student' }
        })

        if (authError) {
            setError(authError.message)
            setLoading(false)
            return
        }

        // Create profile
        const { error: profileError } = await supabase
            .from('profiles')
            .insert({
                id: authData.user.id,
                name,
                email,
                role: 'student',
                class_id: codeData.class_id
            })

        if (profileError) {
            setError(profileError.message)
            setLoading(false)
            return
        }

        setLoading(false)
        alert('Account created! Please check your email to confirm.')
    }

    return (
        <form
            onSubmit={handleSignup}
            className="flex flex-col gap-3 text-slate-800"
        >

            <div className='flex flex-col gap-1'>
                <label className="text-sm font-bold text-slate-700">Your Full Name</label>
                <input
                    type="text"
                    placeholder="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 transition-colors"
                />
            </div>

            <div className='flex flex-col gap-1'>
                <label className="text-sm font-bold text-slate-700">Your Email</label>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 transition-colors"
                />
            </div>

            <div className='flex flex-col gap-1'>
                <label className="text-sm font-bold text-slate-700">Your Password</label>
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 transition-colors"
                />
            </div>

            <div className="flex flex-col gap-1">
                <label className="text-sm font-bold text-slate-700">Enrollment Code</label>
                <input
                    type="text"
                    placeholder="Enter code from your institution"
                    value={enrollmentCode}
                    onChange={(e) => setEnrollmentCode(e.target.value)}
                    className="border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <span className="text-xs text-slate-400">Get this code from your institution</span>
            </div>

            {error && (
                <p className='text-red-500 text-sm'>{error}</p>
            )}

            <button
                type="submit"
                disabled={loading}
                className="bg-slate-900 text-white rounded-lg py-2 mt-2 cursor-pointer hover:bg-slate-800 transition-colors"
            >
                {loading ? 'Creating account...' : 'Sign Up'}
            </button>

        </form>
    )
}

export default SignupForm

