import React, { useState, useEffect } from 'react';
import { fuelQuotaService } from '../services/api';
import './FuelQuotasPage.css';

export default function FuelQuotasPage() {
    const [quotas, setQuotas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingQuota, setEditingQuota] = useState(null);
    const [newLimit, setNewLimit] = useState('');

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
            alert('Please enter a valid positive number');
            return;
        }

        setSaving(true);
        try {
            await fuelQuotaService.update(vehicleType, parseFloat(newLimit));
            await fetchQuotas();
            setEditingQuota(null);
            setNewLimit('');
        } catch (error) {
            console.error('Error updating quota:', error);
            alert('Failed to update fuel quota');
        } finally {
            setSaving(false);
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
