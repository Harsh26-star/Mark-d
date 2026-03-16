import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { Navigate } from 'react-router-dom'

function ProtectedRoute({ children, role }) {

    const [loading, setLoading] = useState(true)
    const [profile, setProfile] = useState(null)

    useEffect(() => {
        async function checkUser() {

            const { data: { session } } = await supabase.auth.getSession()

            if (!session) {
                setLoading(false)
                return
            }

            const role = session.user.app_metadata.role
            setProfile({ role })
            setLoading(false)
        }

        checkUser()

    }, [])

    if (loading) return <p>Loading...</p>

    if (!profile) return <Navigate to="/login" />

    if (role && profile.role !== role) {
        return <Navigate to="/" />
    }

    return children
}

export default ProtectedRoute
