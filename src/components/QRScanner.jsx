import { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import React from 'react'
import { supabase } from "../lib/supabaseClient";

function QRScanner() {

    const [scannedResult, setScannedResult] = useState('')
    const [error, setError] = useState(null)

    async function handleAttendance(token) {

        setError(null)

        const { data: session } = await supabase
            .from('sessions')
            .select('*')
            .eq('token', token)
            .gt('token_expires_at', new Date().toISOString())
            .gt('closes_at', new Date().toISOString())
            .single()

        if (!session) {
            setScannedResult('Invalid or expired token')
            return
        }

        const { data: { user } } = await supabase.auth.getUser()

        const { data: existing } = await supabase
            .from('attendance')
            .select('*')
            .eq('session_id', session.id)
            .eq('student_id', user.id)
            .maybeSingle()

        if (existing) {
            setScannedResult('Already marked present')
            return
        }

        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject)
        })

        const { latitude: studentLat, longitude: studentLon } = position.coords

        const distance = getDistanceInMeters(
            studentLat, studentLon,
            session.latitude, session.longitude
        )

        if (distance > 100) {
            setScannedResult('You must be physically present in the classroom to mark attendance')
            return
        }

        const { error } = await supabase
            .from('attendance')
            .insert({
                session_id: session.id,
                student_id: user.id,
                status: true
            })

        if (!error) setScannedResult('Attendance marked Successfully!')
    }

    useEffect(() => {
        const scanner = new Html5QrcodeScanner(
            "reader",
            {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                rememberLastUsedCamera: true,
                supportedScanTypes: [0]
            },
            false
        );

        scanner.render(
            (decodedText) => {
                scanner.pause()
                setScannedResult(decodedText)
                handleAttendance(decodedText)
            },
            (error) => {
                console.warn(error);
            }
        );

        return () => {
            scanner.clear().catch(() => { });
        };
    }, [])

    function getDistanceInMeters(lat1, lon1, lat2, lon2) {
        const R = 6371000
        const toRad = deg => (deg * Math.PI) / 180
        const dLat = toRad(lat2 - lat1)
        const dLon = toRad(lon2 - lon1)
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        return R * c
    }

    return (
        <div id="reader">
            {scannedResult && (
                <p className="text-green-600 font-bold mt-4">Scanned: {scannedResult}</p>
            )}
        </div>
    )
}

export default QRScanner


