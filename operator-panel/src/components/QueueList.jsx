import React, { useState } from 'react';
import './QueueList.css';

export default function QueueList({ queue, onComplete, onRefresh }) {
    const [fuelAmounts, setFuelAmounts] = useState({});

    const getDefaultFuelAmount = (vehicleType) => {
        const defaults = {
            'Car': 40,
            'Motorcycle': 15,
            'Truck': 150,
            'Bus': 200,
        };
        return defaults[vehicleType] || 40;
    };

    const handleFuelAmountChange = (queueId, value) => {
        setFuelAmounts(prev => ({
            ...prev,
            [queueId]: value
        }));
    };

    const handleComplete = (queueId, vehicleType) => {
        const fuelAmount = fuelAmounts[queueId] || getDefaultFuelAmount(vehicleType);
        onComplete(queueId, parseFloat(fuelAmount));
        // Clear the input after completion
        setFuelAmounts(prev => {
            const newAmounts = { ...prev };
            delete newAmounts[queueId];
            return newAmounts;
        });
    };

    return (
        <div className="queue-list">
            <div className="queue-header">
                <h2>📋 Current Queue</h2>
                <button className="btn-refresh" onClick={onRefresh}>
                    🔄 Refresh
                </button>
            </div>

            {queue.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">🎉</div>
                    <h3>No vehicles in queue</h3>
                    <p>All clear! Waiting for customers...</p>
                </div>
            ) : (
                <div className="queue-grid">
                    {queue.map((item, index) => (
                        <div key={item.id} className="queue-card">
                            <div className="queue-card-header">
                                <div className="position-badge">#{index + 1}</div>
                                <div className={`status-badge status-${item.status.toLowerCase()}`}>
                                    {item.status}
                                </div>
                            </div>

                            <div className="queue-card-body">
                                <div className="info-row">
                                    <span className="label">Customer:</span>
                                    <span className="value">{item.user?.name || 'N/A'}</span>
                                </div>
                                <div className="info-row">
                                    <span className="label">Vehicle:</span>
                                    <span className="value">{item.vehicle?.licensePlate || 'N/A'}</span>
                                </div>
                                <div className="info-row">
                                    <span className="label">Type:</span>
                                    <span className="value">{item.vehicle?.type || 'N/A'}</span>
                                </div>
                                <div className="info-row">
                                    <span className="label">Joined:</span>
                                    <span className="value">
                                        {new Date(item.joinedAt).toLocaleTimeString()}
                                    </span>
                                </div>
                            </div>

                            {item.status === 'SERVING' && (
                                <div className="completion-section">
                                    <div className="fuel-input-group">
                                        <label htmlFor={`fuel-${item.id}`}>Fuel Amount (Liters)</label>
                                        <input
                                            id={`fuel-${item.id}`}
                                            type="number"
                                            min="0"
                                            step="0.1"
                                            value={fuelAmounts[item.id] || getDefaultFuelAmount(item.vehicle?.type)}
                                            onChange={(e) => handleFuelAmountChange(item.id, e.target.value)}
                                            placeholder="Enter liters"
                                            className="fuel-input"
                                        />
                                    </div>
                                    <button
                                        className="btn-complete"
                                        onClick={() => handleComplete(item.id, item.vehicle?.type)}
                                    >
                                        ✅ Complete ({fuelAmounts[item.id] || getDefaultFuelAmount(item.vehicle?.type)}L)
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
