import { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

import React from 'react'
import { supabase } from "../lib/supabaseClient";

function QRScanner() {

    const [scannedResult, setScannedResult] = useState('')

    async function handleAttendance(token) {
        
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
            .single()

        if (existing) {
            setScannedResult('Already marked present')
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
                qrbox: 250,
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

  return (
    <div id="reader">
      {scannedResult && (
        <p className="text-green-600 font-bold mt-4">Scanned: {scannedResult}</p>
      )}
    </div>
  )
}

export default QRScanner


