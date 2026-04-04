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

const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

const orangeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

function getStationIcon(station) {
  if (station.status === 'OPEN') return greenIcon;
  if (station.status === 'MAINTENANCE') return orangeIcon;
  return redIcon;
}

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
      const validStations = data.filter(s => {
        const lat = parseFloat(s.latitude);
        const lng = parseFloat(s.longitude);
        return !isNaN(lat) && !isNaN(lng);
      });

      if (validStations.length > 0) {
        const lats = validStations.map(s => parseFloat(s.latitude));
        const lngs = validStations.map(s => parseFloat(s.longitude));
        const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
        const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
        setMapCenter([centerLat, centerLng]);

        const maxDiff = Math.max(Math.max(...lats) - Math.min(...lats), Math.max(...lngs) - Math.min(...lngs));
        let zoom = 8;
        if (maxDiff > 30) zoom = 4;
        else if (maxDiff > 15) zoom = 5;
        else if (maxDiff > 5) zoom = 6;
        else if (maxDiff > 2) zoom = 7;
        setMapZoom(zoom);
        setMapKey(prev => prev + 1);
      }

      setStations(data);
    } catch (error) {
      console.error('Error fetching stations:', error);
    } finally {
      setLoading(false);
    }
  };

  const validStations = stations.filter(s => !isNaN(parseFloat(s.latitude)) && !isNaN(parseFloat(s.longitude)));
  const missingCoords = stations.length - validStations.length;
  const openCount = stations.filter(s => s.status === 'OPEN').length;
  const closedCount = stations.filter(s => s.status === 'CLOSED').length;

  return (
    <div className="map-page">
      {/* Stats bar */}
      <div className="map-stats">
        <div className="map-stat">
          <span className="map-stat-dot open"></span>
          <span className="map-stat-text">{openCount} Open</span>
        </div>
        <div className="map-stat">
          <span className="map-stat-dot closed"></span>
          <span className="map-stat-text">{closedCount} Closed</span>
        </div>
        <div className="map-stat">
          <span className="map-stat-text muted">{validStations.length} on map</span>
        </div>
        {missingCoords > 0 && (
          <div className="map-stat">
            <span className="map-stat-text warning">{missingCoords} missing coords</span>
          </div>
        )}
      </div>

      {/* Map */}
      <div className="map-wrapper">
        {loading ? (
          <div className="map-loading">Loading map...</div>
        ) : (
          <MapContainer
            key={mapKey}
            center={mapCenter}
            zoom={mapZoom}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            {validStations.map((station) => {
              const lat = parseFloat(station.latitude);
              const lng = parseFloat(station.longitude);
              return (
                <Marker key={station.id} position={[lat, lng]} icon={getStationIcon(station)}>
                  <Popup>
                    <div className="popup-content">
                      <h3>{station.name}</h3>
                      <p><strong>Status:</strong> <span className={`status-${station.status.toLowerCase()}`}>{station.status}</span></p>
                      {station.city && <p><strong>City:</strong> {station.city}</p>}
                      {station.region && <p><strong>Region:</strong> {station.region}</p>}
                      <p><strong>Pumps:</strong> {station.totalPumps}</p>
                      {station.inventory?.length > 0 && (
                        <p><strong>Fuel:</strong> {station.inventory.map(i => i.fuelType?.name).filter(Boolean).join(', ')}</p>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        )}
      </div>

      {/* Station list sidebar */}
      <div className="map-sidebar">
        <div className="map-sidebar-header">
          <span className="map-sidebar-title">Stations</span>
          <span className="map-sidebar-count">{stations.length}</span>
        </div>
        <div className="map-sidebar-list">
          {stations.map(station => (
            <div key={station.id} className="map-station-item">
              <span className={`map-station-dot ${station.status === 'OPEN' ? 'open' : 'closed'}`}></span>
              <div className="map-station-info">
                <div className="map-station-name">{station.name}</div>
                <div className="map-station-loc">
                  {[station.city, station.region].filter(Boolean).join(', ') || 'No location'}
                </div>
              </div>
              <span className="map-station-pumps">{station.totalPumps}p</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
