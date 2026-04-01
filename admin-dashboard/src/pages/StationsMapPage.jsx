import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { stationService } from '../services/api';
import './StationsMapPage.css';

// Fix for default marker icon in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom red marker icon
const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function StationsMapPage() {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState([-28.4793, 24.6727]);
  const [mapZoom, setMapZoom] = useState(6);
  const [mapKey, setMapKey] = useState(0);

  useEffect(() => {
    fetchStations();
  }, []);

  const fetchStations = async () => {
    try {
      const data = await stationService.getAll();
      console.log('Fetched stations:', data);
      
      // Filter stations with valid coordinates
      const validStations = data.filter(s => {
        const lat = parseFloat(s.latitude);
        const lng = parseFloat(s.longitude);
        return !isNaN(lat) && !isNaN(lng);
      });
      
      console.log('Stations with coordinates:', validStations);
      
      // Calculate center and zoom to fit all stations
      if (validStations.length > 0) {
        const lats = validStations.map(s => parseFloat(s.latitude));
        const lngs = validStations.map(s => parseFloat(s.longitude));
        
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);
        
        const centerLat = (minLat + maxLat) / 2;
        const centerLng = (minLng + maxLng) / 2;
        
        setMapCenter([centerLat, centerLng]);
        
        // Calculate zoom level based on bounds
        const latDiff = maxLat - minLat;
        const lngDiff = maxLng - minLng;
        const maxDiff = Math.max(latDiff, lngDiff);
        
        // Adjust zoom based on spread of stations
        let zoom = 6;
        if (maxDiff > 30) zoom = 4;
        else if (maxDiff > 15) zoom = 5;
        else if (maxDiff > 5) zoom = 6;
        else if (maxDiff > 2) zoom = 7;
        else zoom = 8;
        
        setMapZoom(zoom);
        setMapKey(prev => prev + 1); // Force map to re-render with new center/zoom
      }
      
      setStations(data);
    } catch (error) {
      console.error('Error fetching stations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="map-page">
        <div className="map-header">
          <h1>🗺️ Stations Map</h1>
          <p>Loading stations...</p>
        </div>
      </div>
    );
  }

  const validStations = stations.filter(s => {
    const lat = parseFloat(s.latitude);
    const lng = parseFloat(s.longitude);
    return !isNaN(lat) && !isNaN(lng);
  });

  return (
    <div className="map-page">
      <div className="map-header">
        <h1>🗺️ Stations Map</h1>
        <p className="station-count">
          Showing {validStations.length} station{validStations.length !== 1 ? 's' : ''} with coordinates
          {stations.length > validStations.length && ` (${stations.length - validStations.length} without coordinates)`}
        </p>
      </div>

      <div className="map-container">
        <MapContainer
          key={mapKey}
          center={mapCenter}
          zoom={mapZoom}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {validStations.map((station) => {
            const lat = parseFloat(station.latitude);
            const lng = parseFloat(station.longitude);
            
            return (
              <Marker
                key={station.id}
                position={[lat, lng]}
                icon={redIcon}
              >
                <Popup>
                  <div className="popup-content">
                    <h3>{station.name}</h3>
                    <p><strong>Location:</strong> {station.location}</p>
                    <p><strong>City:</strong> {station.city || 'N/A'}</p>
                    <p><strong>Region:</strong> {station.region || 'N/A'}</p>
                    <p><strong>Country:</strong> {station.country || 'N/A'}</p>
                    <p><strong>Status:</strong> <span className={`status-${station.status.toLowerCase()}`}>{station.status}</span></p>
                    <p><strong>Pumps:</strong> {station.totalPumps}</p>
                    <p><strong>Coordinates:</strong> {lat.toFixed(6)}, {lng.toFixed(6)}</p>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {stations.filter(s => !s.latitude || !s.longitude).length > 0 && (
        <div className="warning-banner">
          ⚠️ {stations.filter(s => !s.latitude || !s.longitude).length} station(s) missing coordinates
        </div>
      )}
    </div>
  );
}
