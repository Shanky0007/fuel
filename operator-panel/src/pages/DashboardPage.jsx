import React, { useState, useEffect } from 'react';
import QRScanner from '../components/QRScanner';
import QueueList from '../components/QueueList';
import { ticketService, operatorService } from '../services/api';
import './DashboardPage.css';

export default function DashboardPage({ user, onLogout }) {
    const [activeTab, setActiveTab] = useState('scan');
    const [queue, setQueue] = useState([]);
    const [scanResult, setScanResult] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Load queue on mount and when switching to queue tab
        loadQueue();
    }, [activeTab]);

    const loadQueue = async () => {
        try {
            const data = await operatorService.getRegionalQueues();
            // Filter to only show WAITING and SERVING status
            const activeQueues = (data || []).filter(q =>
                q.status === 'WAITING' || q.status === 'SERVING'
            );
            setQueue(activeQueues);
        } catch (error) {
            console.error('Failed to load queue:', error);
        }
    };

    const handleScan = async (qrData) => {
        setLoading(true);
        try {
            const result = await ticketService.verify(qrData);
            setScanResult({ success: true, data: result });
            setTimeout(() => setScanResult(null), 5000);
            loadQueue(); // Refresh queue after successful scan
        } catch (error) {
            const errorData = error.response?.data;
            setScanResult({
                success: false,
                message: errorData?.error || 'Verification failed',
                code: errorData?.code,
                position: errorData?.position,
                details: errorData?.message
            });
            setTimeout(() => setScanResult(null), 8000); // Longer timeout for detailed errors
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCode = async (code) => {
        setLoading(true);
        try {
            const result = await ticketService.verifyByCode(code);
            setScanResult({ success: true, data: result });
            setTimeout(() => setScanResult(null), 5000);
            loadQueue(); // Refresh queue after successful verification
        } catch (error) {
            const errorData = error.response?.data;
            setScanResult({
                success: false,
                message: errorData?.error || 'Invalid verification code',
                code: errorData?.code,
                position: errorData?.position,
                details: errorData?.message
            });
            setTimeout(() => setScanResult(null), 8000); // Longer timeout for detailed errors
        } finally {
            setLoading(false);
        }
    };

    const handleComplete = async (queueId, fuelAmount) => {
        try {
            await ticketService.complete(queueId, fuelAmount);
            loadQueue();
            alert(`Service completed! ${fuelAmount}L fuel dispensed.`);
        } catch (error) {
            alert('Failed to complete service');
        }
    };

    return (
        <div className="dashboard-page">
            {/* Header */}
            <header className="dashboard-header">
                <div className="header-content">
                    <div className="header-left">
                        <div className="logo-small">⛽</div>
                        <div>
                            <h1>Operator Dashboard</h1>
                            <p>Welcome, {user.name}</p>
                        </div>
                    </div>
                    <button className="btn-logout" onClick={onLogout}>
                        Logout
                    </button>
                </div>
            </header>

            {/* Tabs */}
            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'scan' ? 'active' : ''}`}
                    onClick={() => setActiveTab('scan')}
                >
                    📷 Scan QR
                </button>
                <button
                    className={`tab ${activeTab === 'queue' ? 'active' : ''}`}
                    onClick={() => setActiveTab('queue')}
                >
                    📋 Queue ({queue.length})
                </button>
            </div>

            {/* Content */}
            <div className="dashboard-content">
                {activeTab === 'scan' ? (
                    <div className="scan-section">
                        <QRScanner onScan={handleScan} onVerifyCode={handleVerifyCode} loading={loading} />

                        {scanResult && (
                            <div className={`scan-result ${scanResult.success ? 'success' : 'error'}`}>
                                {scanResult.success ? (
                                    <div>
                                        <h3>✅ Ticket Verified!</h3>
                                        <p>Customer: {scanResult.data.queue?.user?.name}</p>
                                        <p>Vehicle: {scanResult.data.queue?.vehicle?.licensePlate}</p>
                                    </div>
                                ) : (
                                    <div>
                                        <h3>❌ Verification Failed</h3>
                                        <p className="error-message">{scanResult.message}</p>
                                        {scanResult.code === 'NOT_FIRST_IN_LINE' && scanResult.position && (
                                            <div className="queue-position-warning">
                                                <p className="position-info">🚦 Current Queue Position: <strong>#{scanResult.position}</strong></p>
                                                <p className="wait-message">{scanResult.details}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <QueueList queue={queue} onComplete={handleComplete} onRefresh={loadQueue} />
                )}
            </div>
        </div>
    );
}
