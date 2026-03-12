import React, { useState, useEffect } from 'react';
import { operatorService, lookupService } from '../services/api';
import './OperatorsPage.css';

export default function OperatorsPage() {
    const [operators, setOperators] = useState([]);
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        country: '',
        region: '',
        assignedRegion: '',
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [operatorsData, locationsData] = await Promise.all([
                operatorService.getAll(),
                lookupService.getLocations(),
            ]);
            setOperators(operatorsData);
            setLocations(locationsData);
        } catch (error) {
            console.error('Failed to load data:', error);
            setError('Failed to load operators');
        } finally {
            setLoading(false);
        }
    };

    const getAllRegions = () => {
        const regions = [];
        locations.forEach(country => {
            country.regions?.forEach(region => {
                regions.push({
                    ...region,
                    countryName: country.name,
                    displayName: `${region.name}, ${country.name}`,
                });
            });
        });
        return regions;
    };

    const getRegionsForCountry = (countryName) => {
        const country = locations.find(c => c.name === countryName);
        return country?.regions || [];
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
            ...(name === 'country' && { region: '' }),
        }));
    };

    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            password: '',
            phone: '',
            country: '',
            region: '',
            assignedRegion: '',
        });
        setShowForm(false);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        try {
            await operatorService.create(formData);
            setSuccess('Operator created successfully!');
            resetForm();
            loadData();
        } catch (error) {
            setError(error.response?.data?.error || 'Failed to create operator');
        }
    };

    const handleAssignRegion = async (operatorId, region) => {
        try {
            await operatorService.assignRegion(operatorId, region);
            setSuccess('Region assigned successfully!');
            loadData();
        } catch (error) {
            setError('Failed to assign region');
        }
    };

    const handleDelete = async (operator) => {
        if (!window.confirm(`Are you sure you want to delete operator "${operator.name}"?`)) {
            return;
        }

        try {
            await operatorService.delete(operator.id);
            setSuccess('Operator deleted successfully!');
            loadData();
        } catch (error) {
            setError(error.response?.data?.error || 'Failed to delete operator');
        }
    };

    if (loading) {
        return <div className="loading">Loading operators...</div>;
    }

    return (
        <div className="operators-page">
            {/* Messages */}
            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            {/* Header */}
            <div className="page-header">
                <h2>👷 Operator Management</h2>
                <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
                    {showForm ? '✕ Cancel' : '+ Add Operator'}
                </button>
            </div>

            {/* Add Form */}
            {showForm && (
                <div className="form-card">
                    <h3>➕ Create New Operator</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Full Name *</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="e.g., John Smith"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Email *</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder="operator@example.com"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Password *</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    placeholder="Minimum 6 characters"
                                    required
                                    minLength={6}
                                />
                            </div>

                            <div className="form-group">
                                <label>Phone</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    placeholder="+1 234 567 8900"
                                />
                            </div>

                            <div className="form-group">
                                <label>Country</label>
                                <select
                                    name="country"
                                    value={formData.country}
                                    onChange={handleInputChange}
                                >
                                    <option value="">Select Country</option>
                                    {locations.map(country => (
                                        <option key={country.id} value={country.name}>
                                            {country.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Region</label>
                                <select
                                    name="region"
                                    value={formData.region}
                                    onChange={handleInputChange}
                                    disabled={!formData.country}
                                >
                                    <option value="">Select Region</option>
                                    {getRegionsForCountry(formData.country).map(region => (
                                        <option key={region.id} value={region.name}>
                                            {region.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group full-width">
                                <label>Assigned Region (Work Area)</label>
                                <select
                                    name="assignedRegion"
                                    value={formData.assignedRegion}
                                    onChange={handleInputChange}
                                >
                                    <option value="">Select Assigned Region</option>
                                    {getAllRegions().map(region => (
                                        <option key={region.id} value={region.name}>
                                            {region.displayName}
                                        </option>
                                    ))}
                                </select>
                                <span className="form-hint">
                                    This is the region where the operator will manage stations.
                                </span>
                            </div>
                        </div>

                        <div className="form-actions">
                            <button type="button" className="btn-secondary" onClick={resetForm}>
                                Cancel
                            </button>
                            <button type="submit" className="btn-primary">
                                Create Operator
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Operators List */}
            <div className="operators-grid">
                {operators.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">👷</div>
                        <h3>No Operators Yet</h3>
                        <p>Click "Add Operator" to create operator accounts for your station staff.</p>
                    </div>
                ) : (
                    operators.map(operator => (
                        <div key={operator.id} className="operator-card">
                            <div className="operator-avatar">
                                {operator.name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div className="operator-info">
                                <h3>{operator.name}</h3>
                                <p className="operator-email">{operator.email}</p>
                                {operator.phone && (
                                    <p className="operator-phone">📞 {operator.phone}</p>
                                )}
                                <div className="operator-location">
                                    {operator.region && operator.country && (
                                        <span className="location-tag">
                                            📍 {operator.region}, {operator.country}
                                        </span>
                                    )}
                                </div>
                                <div className="assigned-region">
                                    <label>Assigned Region:</label>
                                    <select
                                        value={operator.assignedRegion || ''}
                                        onChange={(e) => handleAssignRegion(operator.id, e.target.value)}
                                        className="region-select"
                                    >
                                        <option value="">Not Assigned</option>
                                        {getAllRegions().map(region => (
                                            <option key={region.id} value={region.name}>
                                                {region.displayName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="operator-actions">
                                <button
                                    className="btn-icon btn-delete"
                                    onClick={() => handleDelete(operator)}
                                    title="Delete Operator"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Credentials Info */}
            <div className="info-card">
                <div className="info-icon">💡</div>
                <div className="info-content">
                    <h4>Operator Login Information</h4>
                    <p>
                        Operators can log in to the <strong>Operator Panel</strong> at{' '}
                        <code>http://localhost:5173</code> using their email and password.
                        They will be able to scan customer QR codes and manage queues for stations in their assigned region.
                    </p>
                </div>
            </div>
        </div>
    );
}
