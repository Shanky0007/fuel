import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import './QRScanner.css';

export default function QRScanner({ onScan, onVerifyCode, loading }) {
    const scannerRef = useRef(null);
    const [scanning, setScanning] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');
    const html5QrCodeRef = useRef(null);

    useEffect(() => {
        return () => {
            if (html5QrCodeRef.current) {
                html5QrCodeRef.current.stop().catch(console.error);
            }
        };
    }, []);

    const startScanning = async () => {
        try {
            const html5QrCode = new Html5Qrcode("qr-reader");
            html5QrCodeRef.current = html5QrCode;

            await html5QrCode.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 }
                },
                (decodedText) => {
                    onScan(decodedText);
                    stopScanning();
                },
                (errorMessage) => {
                    // Ignore errors during scanning
                }
            );
            setScanning(true);
        } catch (err) {
            console.error("Failed to start scanning:", err);
            alert("Failed to access camera. Please check permissions.");
        }
    };

    const stopScanning = () => {
        if (html5QrCodeRef.current) {
            html5QrCodeRef.current.stop()
                .then(() => {
                    setScanning(false);
                    html5QrCodeRef.current = null;
                })
                .catch(console.error);
        }
    };

    const handleCodeSubmit = (e) => {
        e.preventDefault();
        if (verificationCode.trim() && verificationCode.trim().length === 6) {
            onVerifyCode(verificationCode.trim().toUpperCase());
            setVerificationCode('');
        }
    };

    return (
        <div className="qr-scanner">
            <div className="scanner-card">
                <h2>📷 Scan Customer QR Code</h2>

                <div id="qr-reader" className={scanning ? 'active' : 'hidden'}></div>

                {!scanning && (
                    <div className="scanner-placeholder">
                        <div className="scanner-icon">📱</div>
                        <p>Click below to start camera</p>
                    </div>
                )}

                <div className="scanner-controls">
                    {!scanning ? (
                        <button className="btn-scan" onClick={startScanning} disabled={loading}>
                            Start Camera
                        </button>
                    ) : (
                        <button className="btn-stop" onClick={stopScanning}>
                            Stop Camera
                        </button>
                    )}
                </div>
            </div>

            <div className="manual-input-card">
                <h3>🔢 Enter Verification Code</h3>
                <p className="code-hint">If QR scanning doesn't work, ask the customer for their 6-digit verification code</p>
                <form onSubmit={handleCodeSubmit}>
                    <input
                        type="text"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.toUpperCase().slice(0, 6))}
                        placeholder="Enter 6-digit code (e.g., ABC123)"
                        disabled={loading}
                        className="verification-code-input"
                        maxLength={6}
                    />
                    <button type="submit" className="btn-verify" disabled={loading || verificationCode.trim().length !== 6}>
                        {loading ? 'Verifying...' : 'Verify Code'}
                    </button>
                </form>
            </div>
        </div>
    );
}
