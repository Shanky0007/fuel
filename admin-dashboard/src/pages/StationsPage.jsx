import React, { useState, useEffect, useCallback } from 'react';
import { stationService, lookupService } from '../services/api';
import CustomSelect from '../components/CustomSelect';
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
        country: '',
        region: '',
        city: '',
        totalPumps: 4,
        fuelTypes: [],
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [geoStatus, setGeoStatus] = useState(''); // '', 'loading', 'success', 'error'

    const getMyLocation = useCallback(() => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            return;
        }
        setGeoStatus('loading');
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude.toFixed(6);
                const lng = position.coords.longitude.toFixed(6);
                setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
                setGeoStatus('success');

                // Reverse geocode to get address + auto-fill country/region/city
                try {
                    const res = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=18`,
                        { headers: { 'Accept-Language': 'en' } }
                    );
                    const geo = await res.json();
                    const addr = geo.address || {};

                    // Build short address for location field
                    const shortAddr = [addr.road, addr.suburb || addr.neighbourhood, addr.city || addr.town].filter(Boolean).join(', ')
                        || geo.display_name?.split(',').slice(0, 3).join(',') || '';

                    // Match country from reverse geocode against our DB locations
                    const geoCountry = addr.country || '';
                    const geoState = addr.state || '';
                    const geoCity = addr.city || addr.town || addr.village || addr.county || '';

                    const matchedCountry = locations.find(c =>
                        c.name.toLowerCase() === geoCountry.toLowerCase()
                    );

                    let matchedRegion = null;
                    let matchedCity = null;

                    if (matchedCountry) {
                        // Try exact match first, then partial
                        matchedRegion = matchedCountry.regions?.find(r =>
                            r.name.toLowerCase() === geoState.toLowerCase()
                        ) || matchedCountry.regions?.find(r =>
                            geoState.toLowerCase().includes(r.name.toLowerCase()) ||
                            r.name.toLowerCase().includes(geoState.toLowerCase())
                        );

                        // Load cities for matched region and try to match city
                        if (matchedRegion) {
                            try {
                                const citiesData = await lookupService.getCitiesForRegion(matchedRegion.id);
                                setCities(citiesData);
                                matchedCity = citiesData.find(c =>
                                    c.name.toLowerCase() === geoCity.toLowerCase()
                                ) || citiesData.find(c =>
                                    geoCity.toLowerCase().includes(c.name.toLowerCase()) ||
                                    c.name.toLowerCase().includes(geoCity.toLowerCase())
                                );
                            } catch (e) {
                                console.error('Failed to load cities for geo match:', e);
                            }
                        }
                    }

                    setFormData(prev => ({
                        ...prev,
                        location: prev.location || shortAddr,
                        country: matchedCountry ? matchedCountry.name : prev.country,
                        region: matchedRegion ? matchedRegion.name : prev.region,
                        city: matchedCity ? matchedCity.name : prev.city,
                    }));
                } catch (e) {
                    // Reverse geocoding is optional
                }

                setTimeout(() => setGeoStatus(''), 3000);
            },
            (err) => {
                setGeoStatus('error');
                setError(`Location error: ${err.message}`);
                setTimeout(() => setGeoStatus(''), 3000);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    }, [locations]);

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
            country: '',
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
                                <CustomSelect
                                    name="country"
                                    value={formData.country}
                                    onChange={handleInputChange}
                                    options={locations.map(c => ({ label: c.name, value: c.name }))}
                                    placeholder="Select Country"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>State / Region *</label>
                                <CustomSelect
                                    name="region"
                                    value={formData.region}
                                    onChange={handleInputChange}
                                    options={getRegionsForCountry(formData.country).map(r => ({ label: r.name, value: r.name }))}
                                    placeholder="Select State / Region"
                                    disabled={!formData.country}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>City *</label>
                                <CustomSelect
                                    name="city"
                                    value={formData.city}
                                    onChange={handleInputChange}
                                    options={cities.map(c => ({ label: c.name, value: c.name }))}
                                    placeholder={loadingCities ? 'Loading...' : 'Select City'}
                                    disabled={!formData.region || loadingCities}
                                    required
                                />
                            </div>

                            <div className="form-group full-width">
                                <div className="geo-row">
                                    <div className="geo-fields">
                                        <div className="geo-field">
                                            <label>Latitude</label>
                                            <input
                                                type="number"
                                                name="latitude"
                                                value={formData.latitude}
                                                onChange={handleInputChange}
                                                placeholder="e.g., 6.5244"
                                                step="any"
                                            />
                                        </div>
                                        <div className="geo-field">
                                            <label>Longitude</label>
                                            <input
                                                type="number"
                                                name="longitude"
                                                value={formData.longitude}
                                                onChange={handleInputChange}
                                                placeholder="e.g., 3.3792"
                                                step="any"
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        className={`geo-btn ${geoStatus}`}
                                        onClick={getMyLocation}
                                        disabled={geoStatus === 'loading'}
                                        title="Use your current GPS location"
                                    >
                                        {geoStatus === 'loading' ? (
                                            <span className="geo-spinner"></span>
                                        ) : geoStatus === 'success' ? (
                                            '✓'
                                        ) : (
                                            '📍'
                                        )}
                                        <span className="geo-btn-text">
                                            {geoStatus === 'loading' ? 'Getting location...' : geoStatus === 'success' ? 'Location set' : 'Use my location'}
                                        </span>
                                    </button>
                                </div>
                                {geoStatus === 'success' && formData.latitude && (
                                    <div className="geo-hint success">
                                        Coordinates captured — if you're at the station, these are accurate
                                    </div>
                                )}
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
                                <div className="status-select-wrap">
                                    <CustomSelect
                                        name={`status-${station.id}`}
                                        value={station.status}
                                        onChange={(e) => handleStatusChange(station, e.target.value)}
                                        options={[
                                            { label: 'Open', value: 'OPEN' },
                                            { label: 'Closed', value: 'CLOSED' },
                                            { label: 'Maintenance', value: 'MAINTENANCE' },
                                        ]}
                                        placeholder="Status"
                                    />
                                </div>
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
