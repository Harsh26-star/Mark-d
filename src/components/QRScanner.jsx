import { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

import React from 'react'

function QRScanner() {

    const [scannedResult, setScannedResult] = useState('')

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
                console.log("Scanned:", decodedText);
                setScannedResult(decodedText)
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
        <div>
            <div id="reader"></div>
            {scannedResult && (
                <p className="text-green-600 font-bold mt-4">Scanned: {scannedResult}</p>
            )}
        </div>
    )
}

export default QRScanner
