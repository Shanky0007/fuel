import React, { useState, useEffect } from 'react';
import { stationService, lookupService } from '../services/api';
import './StationsPage.css';

export default function StationsPage() {
    const [stations, setStations] = useState([]);
    const [filteredStations, setFilteredStations] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [fuelTypes, setFuelTypes] = useState([]);
    const [locations, setLocations] = useState([]);
    const [cities, setCities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingCities, setLoadingCities] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingStation, setEditingStation] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        latitude: '',
        longitude: '',
        country: 'South Africa',
        region: '',
        city: '',
        totalPumps: 4,
        fuelTypes: [],
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        // Filter stations based on search query
        if (searchQuery.trim() === '') {
            setFilteredStations(stations);
        } else {
            const query = searchQuery.toLowerCase();
            const filtered = stations.filter(station => 
                station.name.toLowerCase().includes(query) ||
                station.location?.toLowerCase().includes(query) ||
                station.city?.toLowerCase().includes(query) ||
                station.region?.toLowerCase().includes(query) ||
                station.country?.toLowerCase().includes(query)
            );
            setFilteredStations(filtered);
        }
    }, [searchQuery, stations]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [stationsData, fuelTypesData, locationsData] = await Promise.all([
                stationService.getAll(),
                lookupService.getFuelTypes(),
                lookupService.getLocations(),
            ]);
            setStations(stationsData);
            setFilteredStations(stationsData);
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

    const getCitiesForRegion = async (regionName) => {
        const country = locations.find(c => c.name === formData.country);
        if (!country) return [];

        const region = country.regions?.find(r => r.name === regionName);
        if (!region) return [];

        setLoadingCities(true);
        try {
            const data = await lookupService.getCitiesForRegion(region.id);
            setCities(data);
            return data;
        } catch (error) {
            console.error('Failed to load cities:', error);
            return [];
        } finally {
            setLoadingCities(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'country') {
            // Reset region and city when country changes
            setFormData(prev => ({
                ...prev,
                country: value,
                region: '',
                city: ''
            }));
            setCities([]);
        } else if (name === 'region') {
            // Reset city and load cities when region changes
            setFormData(prev => ({
                ...prev,
                region: value,
                city: ''
            }));
            if (value) {
                getCitiesForRegion(value);
            } else {
                setCities([]);
            }
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
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
            country: 'South Africa',
            region: '',
            city: '',
            totalPumps: 4,
            fuelTypes: [],
        });
        setCities([]);
        setEditingStation(null);
        setShowForm(false);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validate required fields
        if (!formData.name || !formData.location) {
            setError('Station name and address/location are required');
            return;
        }

        if (!formData.country || !formData.region) {
            setError('Country and region are required');
            return;
        }

        if (!formData.city) {
            setError('City is required');
            return;
        }

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

    const handleEdit = async (station) => {
        // First, find the country and region IDs
        const country = locations.find(c => c.name === station.country);
        const region = country?.regions?.find(r => r.name === station.region);

        setFormData({
            name: station.name,
            location: station.location,
            latitude: station.latitude?.toString() || '',
            longitude: station.longitude?.toString() || '',
            country: station.country || '',
            region: station.region || '',
            city: station.city || '',
            totalPumps: station.totalPumps || 4,
            fuelTypes: station.inventory?.map(inv => inv.fuelTypeId) || [],
        });
        
        // Load cities for the selected region
        if (region) {
            setLoadingCities(true);
            try {
                const data = await lookupService.getCitiesForRegion(region.id);
                setCities(data);
            } catch (error) {
                console.error('Failed to load cities:', error);
            } finally {
                setLoadingCities(false);
            }
        }
        
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
                <div className="header-actions">
                    <input
                        type="text"
                        className="search-input"
                        placeholder="🔍 Search stations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
                        {showForm ? '✕ Cancel' : '+ Add Station'}
                    </button>
                </div>
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
                                <input
                                    type="text"
                                    value="South Africa"
                                    readOnly
                                    style={{ opacity: 0.5, cursor: 'default' }}
                                />
                            </div>

                            <div className="form-group">
                                <label>Region *</label>
                                <select
                                    name="region"
                                    value={formData.region}
                                    onChange={handleInputChange}
                                    required
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
                                <label>City *</label>
                                <select
                                    name="city"
                                    value={formData.city}
                                    onChange={handleInputChange}
                                    required
                                    disabled={!formData.region || loadingCities}
                                >
                                    <option value="">{loadingCities ? 'Loading...' : 'Select City'}</option>
                                    {cities.map(city => (
                                        <option key={city.id} value={city.name}>
                                            {city.name}
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
                                    placeholder="e.g., -26.2041"
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
                                    placeholder="e.g., 28.0473"
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
                {filteredStations.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">⛽</div>
                        <h3>{searchQuery ? 'No Stations Found' : 'No Stations Yet'}</h3>
                        <p>{searchQuery ? 'Try a different search term.' : 'Click "Add Station" to create your first fuel station.'}</p>
                    </div>
                ) : (
                    filteredStations.map(station => (
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
                                    <span>
                                        {station.city && `${station.city}, `}
                                        {station.region}, {station.country}
                                    </span>
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
