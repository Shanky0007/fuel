import React, { useState, useEffect } from 'react';
import { fuelQuotaService } from '../services/api';
import './FuelQuotasPage.css';

export default function FuelQuotasPage() {
    const [quotas, setQuotas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingQuota, setEditingQuota] = useState(null);
    const [newLimit, setNewLimit] = useState('');
    const [notification, setNotification] = useState(null);
    const [checkingConsumption, setCheckingConsumption] = useState(false);
    const [registrationNumber, setRegistrationNumber] = useState('');
    const [consumptionData, setConsumptionData] = useState(null);

    useEffect(() => {
        fetchQuotas();
    }, []);

    const fetchQuotas = async () => {
        try {
            const data = await fuelQuotaService.getAll();
            setQuotas(data);
        } catch (error) {
            console.error('Error fetching quotas:', error);
            alert('Failed to load fuel quotas');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (quota) => {
        setEditingQuota(quota.vehicleType);
        setNewLimit(quota.weeklyLimit.toString());
    };

    const handleSave = async (vehicleType) => {
        if (!newLimit || parseFloat(newLimit) < 0) {
            showNotification('Please enter a valid positive number', 'error');
            return;
        }

        setSaving(true);
        try {
            await fuelQuotaService.update(vehicleType, parseFloat(newLimit));
            await fetchQuotas();
            setEditingQuota(null);
            setNewLimit('');
            showNotification(`${vehicleType} quota updated successfully!`, 'success');
        } catch (error) {
            console.error('Error updating quota:', error);
            showNotification('Failed to update fuel quota', 'error');
        } finally {
            setSaving(false);
        }
    };

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleCheckConsumption = async () => {
        if (!registrationNumber.trim()) {
            showNotification('Please enter a registration number', 'error');
            return;
        }

        setCheckingConsumption(true);
        setConsumptionData(null);
        try {
            const data = await fuelQuotaService.getVehicleConsumption(registrationNumber);
            setConsumptionData(data);
        } catch (error) {
            console.error('Error checking consumption:', error);
            if (error.response?.status === 404) {
                showNotification('Vehicle not found', 'error');
            } else {
                showNotification('Failed to fetch consumption data', 'error');
            }
        } finally {
            setCheckingConsumption(false);
        }
    };

    const handleCancel = () => {
        setEditingQuota(null);
        setNewLimit('');
    };

    const getVehicleIcon = (type) => {
        switch (type) {
            case 'Car':
                return '🚗';
            case 'Motorcycle':
                return '🏍️';
            case 'Truck':
                return '🚚';
            case 'Bus':
                return '🚌';
            default:
                return '🚙';
        }
    };

    const getVehicleColor = (type) => {
        switch (type) {
            case 'Car':
                return 'vehicle-car';
            case 'Motorcycle':
                return 'vehicle-motorcycle';
            case 'Truck':
                return 'vehicle-truck';
            case 'Bus':
                return 'vehicle-bus';
            default:
                return 'vehicle-car';
        }
    };

    if (loading) {
        return (
            <div className="fuel-quotas-page">
                <div className="loading">Loading fuel quotas...</div>
            </div>
        );
    }

    return (
        <div className="fuel-quotas-page">
            {notification && (
                <div className={`notification notification-${notification.type}`}>
                    {notification.message}
                </div>
            )}
            
            <div className="page-header">
                <h2>⛽ Fuel Quota Management</h2>
                <p className="page-subtitle">Configure weekly fuel limits for each vehicle type</p>
            </div>

            <div className="quotas-grid">
                {quotas.map((quota) => (
                    <div key={quota.id} className={`quota-card ${getVehicleColor(quota.vehicleType)}`}>
                        <div className="quota-header">
                            <div className="vehicle-info">
                                <span className="vehicle-icon">{getVehicleIcon(quota.vehicleType)}</span>
                                <h3>{quota.vehicleType}</h3>
                            </div>
                        </div>

                        <div className="quota-body">
                            {editingQuota === quota.vehicleType ? (
                                <div className="edit-mode">
                                    <div className="form-group">
                                        <label>Weekly Limit (Liters)</label>
                                        <input
                                            type="number"
                                            value={newLimit}
                                            onChange={(e) => setNewLimit(e.target.value)}
                                            placeholder="Enter limit in liters"
                                            min="0"
                                            step="0.1"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="form-actions">
                                        <button
                                            className="btn-secondary"
                                            onClick={handleCancel}
                                            disabled={saving}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            className="btn-primary"
                                            onClick={() => handleSave(quota.vehicleType)}
                                            disabled={saving}
                                        >
                                            {saving ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="view-mode">
                                    <div className="limit-display">
                                        <span className="limit-value">{quota.weeklyLimit}</span>
                                        <span className="limit-unit">Liters / Week</span>
                                    </div>
                                    <button
                                        className="btn-edit-quota"
                                        onClick={() => handleEdit(quota)}
                                    >
                                        ✏️ Edit Limit
                                    </button>
                                    <div className="quota-meta">
                                        <span className="meta-label">Last updated:</span>
                                        <span className="meta-value">
                                            {new Date(quota.updatedAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="info-section">
                <div className="info-card">
                    <h3>🔍 Check Vehicle Fuel Consumption</h3>
                    <div className="consumption-checker">
                        <input
                            type="text"
                            placeholder="Enter vehicle registration number"
                            value={registrationNumber}
                            onChange={(e) => setRegistrationNumber(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleCheckConsumption()}
                        />
                        <button
                            className="btn-primary"
                            onClick={handleCheckConsumption}
                            disabled={checkingConsumption}
                        >
                            {checkingConsumption ? 'Checking...' : 'Check Consumption'}
                        </button>
                    </div>
                    
                    {consumptionData && (
                        <div className="consumption-result">
                            <h4>📊 Consumption Data</h4>
                            <p><strong>Vehicle Type:</strong> {consumptionData.vehicleType}</p>
                            <p><strong>This Week:</strong> {consumptionData.weeklyConsumption} L</p>
                            <p><strong>Weekly Limit:</strong> {consumptionData.weeklyLimit} L</p>
                            <p><strong>Remaining:</strong> {consumptionData.remaining} L</p>
                            <p><strong>Status:</strong> {consumptionData.canRefuel ? '✅ Can refuel' : '❌ Limit exceeded'}</p>
                        </div>
                    )}
                </div>
                
                <div className="info-card">
                    <h3>📋 How Fuel Quotas Work</h3>
                    <ul className="info-list">
                        <li>Weekly limits reset every Monday at 00:00</li>
                        <li>Limits are tracked by vehicle registration number</li>
                        <li>Users cannot join queue if weekly limit is exceeded</li>
                        <li>Fuel consumption is recorded when operator completes service</li>
                        <li>Changes to limits apply immediately to all users</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
