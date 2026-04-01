import { useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

import React from 'react'

function QRScanner() {

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
            },
            (error) => {
                console.warn(error);
            }
        );

        return () => {
            scanner.clear().catch(() => {});
        };
    }, [])

  return (
    <div id="reader">
      
    </div>
  )
}

export default QRScanner
