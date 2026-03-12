import React, { useState, useEffect } from 'react';
import { stationService, lookupService } from '../services/api';
import './StationsPage.css';

export default function StationsPage() {
    const [stations, setStations] = useState([]);
    const [fuelTypes, setFuelTypes] = useState([]);
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingStation, setEditingStation] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        latitude: '',
        longitude: '',
        country: '',
        region: '',
        totalPumps: 4,
        fuelTypes: [],
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [stationsData, fuelTypesData, locationsData] = await Promise.all([
                stationService.getAll(),
                lookupService.getFuelTypes(),
                lookupService.getLocations(),
            ]);
            setStations(stationsData);
            setFuelTypes(fuelTypesData);
            setLocations(locationsData);
        } catch (error) {
            console.error('Failed to load data:', error);
            setError('Failed to load data');
        } finally {
            setLoading(false);
        }
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
            ...(name === 'country' && { region: '' }), // Reset region when country changes
        }));
    };

    const handleFuelTypeToggle = (fuelTypeId) => {
        setFormData(prev => ({
            ...prev,
            fuelTypes: prev.fuelTypes.includes(fuelTypeId)
                ? prev.fuelTypes.filter(id => id !== fuelTypeId)
                : [...prev.fuelTypes, fuelTypeId],
        }));
    };

    const resetForm = () => {
        setFormData({
            name: '',
            location: '',
            latitude: '',
            longitude: '',
            country: '',
            region: '',
            totalPumps: 4,
            fuelTypes: [],
        });
        setEditingStation(null);
        setShowForm(false);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const payload = {
                ...formData,
                latitude: parseFloat(formData.latitude) || 0,
                longitude: parseFloat(formData.longitude) || 0,
                totalPumps: parseInt(formData.totalPumps) || 4,
            };

            if (editingStation) {
                await stationService.update(editingStation.id, payload);
                setSuccess('Station updated successfully!');
            } else {
                await stationService.create(payload);
                setSuccess('Station created successfully!');
            }

            resetForm();
            loadData();
        } catch (error) {
            setError(error.response?.data?.error || 'Failed to save station');
        }
    };

    const handleEdit = (station) => {
        setFormData({
            name: station.name,
            location: station.location,
            latitude: station.latitude?.toString() || '',
            longitude: station.longitude?.toString() || '',
            country: station.country || '',
            region: station.region || '',
            totalPumps: station.totalPumps || 4,
            fuelTypes: station.inventory?.map(inv => inv.fuelTypeId) || [],
        });
        setEditingStation(station);
        setShowForm(true);
    };

    const handleDelete = async (station) => {
        if (!window.confirm(`Are you sure you want to delete "${station.name}"? This will also delete all associated queue data.`)) {
            return;
        }

        try {
            await stationService.delete(station.id);
            setSuccess('Station deleted successfully!');
            loadData();
        } catch (error) {
            setError(error.response?.data?.error || 'Failed to delete station');
        }
    };

    const handleStatusChange = async (station, newStatus) => {
        try {
            await stationService.update(station.id, { status: newStatus });
            setSuccess(`Station status updated to ${newStatus}`);
            loadData();
        } catch (error) {
            setError('Failed to update station status');
        }
    };

    if (loading) {
        return <div className="loading">Loading stations...</div>;
    }

    return (
        <div className="stations-page">
            {/* Messages */}
            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            {/* Header */}
            <div className="page-header">
                <h2>⛽ Station Management</h2>
                <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
                    {showForm ? '✕ Cancel' : '+ Add Station'}
                </button>
            </div>

            {/* Add/Edit Form */}
            {showForm && (
                <div className="form-card">
                    <h3>{editingStation ? '✏️ Edit Station' : '➕ Add New Station'}</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Station Name *</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="e.g., Central Fuel Station"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Address/Location *</label>
                                <input
                                    type="text"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleInputChange}
                                    placeholder="e.g., 123 Main Street, Downtown"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Country *</label>
                                <select
                                    name="country"
                                    value={formData.country}
                                    onChange={handleInputChange}
                                    required
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
                                <label>Region *</label>
                                <select
                                    name="region"
                                    value={formData.region}
                                    onChange={handleInputChange}
                                    required
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

                            <div className="form-group">
                                <label>Latitude</label>
                                <input
                                    type="number"
                                    name="latitude"
                                    value={formData.latitude}
                                    onChange={handleInputChange}
                                    placeholder="e.g., 19.0760"
                                    step="any"
                                />
                            </div>

                            <div className="form-group">
                                <label>Longitude</label>
                                <input
                                    type="number"
                                    name="longitude"
                                    value={formData.longitude}
                                    onChange={handleInputChange}
                                    placeholder="e.g., 72.8777"
                                    step="any"
                                />
                            </div>

                            <div className="form-group">
                                <label>Number of Pumps</label>
                                <input
                                    type="number"
                                    name="totalPumps"
                                    value={formData.totalPumps}
                                    onChange={handleInputChange}
                                    min="1"
                                    max="50"
                                />
                            </div>
                        </div>

                        <div className="form-group fuel-types-group">
                            <label>Available Fuel Types</label>
                            <div className="fuel-types-grid">
                                {fuelTypes.map(fuelType => (
                                    <label key={fuelType.id} className="fuel-type-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={formData.fuelTypes.includes(fuelType.id)}
                                            onChange={() => handleFuelTypeToggle(fuelType.id)}
                                        />
                                        <span className={`fuel-badge fuel-${fuelType.name.toLowerCase()}`}>
                                            {fuelType.name}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="form-actions">
                            <button type="button" className="btn-secondary" onClick={resetForm}>
                                Cancel
                            </button>
                            <button type="submit" className="btn-primary">
                                {editingStation ? 'Update Station' : 'Create Station'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Stations List */}
            <div className="stations-grid">
                {stations.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">⛽</div>
                        <h3>No Stations Yet</h3>
                        <p>Click "Add Station" to create your first fuel station.</p>
                    </div>
                ) : (
                    stations.map(station => (
                        <div key={station.id} className="station-card">
                            <div className="station-header">
                                <h3>{station.name}</h3>
                                <div className={`status-badge status-${station.status?.toLowerCase()}`}>
                                    {station.status}
                                </div>
                            </div>
                            <div className="station-details">
                                <div className="detail-row">
                                    <span className="detail-icon">📍</span>
                                    <span>{station.location}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-icon">🌍</span>
                                    <span>{station.region}, {station.country}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-icon">⛽</span>
                                    <span>{station.totalPumps} Pumps</span>
                                </div>
                                {station.inventory && station.inventory.length > 0 && (
                                    <div className="fuel-badges">
                                        {station.inventory.map(inv => (
                                            <span
                                                key={inv.id}
                                                className={`fuel-badge fuel-${inv.fuelType?.name?.toLowerCase()}`}
                                            >
                                                {inv.fuelType?.name}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="station-actions">
                                <select
                                    value={station.status}
                                    onChange={(e) => handleStatusChange(station, e.target.value)}
                                    className="status-select"
                                >
                                    <option value="OPEN">Open</option>
                                    <option value="CLOSED">Closed</option>
                                    <option value="MAINTENANCE">Maintenance</option>
                                </select>
                                <button className="btn-icon btn-edit" onClick={() => handleEdit(station)}>
                                    ✏️
                                </button>
                                <button className="btn-icon btn-delete" onClick={() => handleDelete(station)}>
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
