import React, { useState, useEffect, useRef } from 'react';
import { queueAdminService } from '../services/api';
import './LiveQueuePage.css';

export default function LiveQueuePage() {
  const [queues, setQueues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stationFilter, setStationFilter] = useState('all');
  const [groupByStation, setGroupByStation] = useState(false);
  const timerRef = useRef(null);

  const loadQueues = async () => {
    try {
      const data = await queueAdminService.getLiveQueues();
      setQueues(data);
    } catch (error) {
      console.error('Failed to load queues:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueues();
    timerRef.current = setInterval(loadQueues, 10000);
    return () => clearInterval(timerRef.current);
  }, []);

  // Derived data
  const waitingCount = queues.filter(q => q.status === 'WAITING').length;
  const servingCount = queues.filter(q => q.status === 'SERVING').length;
  const stations = [...new Set(queues.map(q => q.station?.name))].filter(Boolean).sort();

  // Filter
  let filtered = queues;
  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(item =>
      item.vehicle?.registrationNumber?.toLowerCase().includes(q) ||
      item.vehicle?.licensePlate?.toLowerCase().includes(q) ||
      item.user?.name?.toLowerCase().includes(q) ||
      item.station?.name?.toLowerCase().includes(q) ||
      item.ticket?.verificationCode?.toLowerCase().includes(q)
    );
  }
  if (stationFilter !== 'all') {
    filtered = filtered.filter(q => q.station?.name === stationFilter);
  }

  const getWaitTime = (joinedAt) => {
    const mins = Math.round((Date.now() - new Date(joinedAt).getTime()) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  const getVehicleIcon = (type) => {
    switch (type) {
      case 'Car': return '🚗';
      case 'Motorcycle': return '🏍';
      case 'Truck': return '🚛';
      case 'Bus': return '🚌';
      default: return '🚗';
    }
  };

  // Group by station
  const grouped = {};
  if (groupByStation) {
    filtered.forEach(q => {
      const key = q.station?.name || 'Unknown';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(q);
    });
  }

  if (loading) {
    return <div className="loading">Loading live queue...</div>;
  }

  return (
    <div className="lq-page">
      {/* KPIs */}
      <div className="lq-kpis">
        <div className="lq-kpi">
          <div className="lq-kpi-val amber">{queues.length}</div>
          <div className="lq-kpi-label">Total Active</div>
        </div>
        <div className="lq-kpi">
          <div className="lq-kpi-val">{waitingCount}</div>
          <div className="lq-kpi-label">Waiting</div>
        </div>
        <div className="lq-kpi">
          <div className="lq-kpi-val green">{servingCount}</div>
          <div className="lq-kpi-label">Being Served</div>
        </div>
        <div className="lq-kpi">
          <div className="lq-kpi-val blue">{stations.length}</div>
          <div className="lq-kpi-label">Active Stations</div>
        </div>
      </div>

      {/* Controls */}
      <div className="lq-controls">
        <div className="lq-search">
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search plate, name, code..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <span className="lq-clear" onClick={() => setSearch('')}>✕</span>}
        </div>

        <div className="lq-filters">
          <select value={stationFilter} onChange={e => setStationFilter(e.target.value)}>
            <option value="all">All Stations</option>
            {stations.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <button
            className={`lq-toggle ${groupByStation ? 'active' : ''}`}
            onClick={() => setGroupByStation(!groupByStation)}
          >
            Group by Station
          </button>

          <button className="lq-refresh" onClick={loadQueues}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Queue List */}
      {filtered.length === 0 ? (
        <div className="lq-empty">
          <div className="lq-empty-icon">🎉</div>
          <div className="lq-empty-title">No vehicles in queue</div>
          <div className="lq-empty-text">All clear — no active queue entries right now</div>
        </div>
      ) : groupByStation ? (
        // Grouped view
        Object.entries(grouped).map(([stationName, items]) => (
          <div key={stationName} className="lq-group">
            <div className="lq-group-header">
              <span className="lq-group-name">⛽ {stationName}</span>
              <span className="lq-group-count">{items.length} vehicle{items.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="lq-table-wrap">
              <table className="lq-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Plate</th>
                    <th>Vehicle</th>
                    <th>Customer</th>
                    <th>Fuel</th>
                    <th>Status</th>
                    <th>Wait</th>
                    <th>Code</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((q, i) => (
                    <tr key={q.id}>
                      <td><span className="lq-pos">{i + 1}</span></td>
                      <td><span className="lq-plate">{q.vehicle?.registrationNumber || q.vehicle?.licensePlate || '—'}</span></td>
                      <td><span className="lq-vehicle">{getVehicleIcon(q.vehicle?.type)} {q.vehicle?.type}</span></td>
                      <td>{q.user?.name || '—'}</td>
                      <td>{q.vehicle?.fuelType?.name || '—'}</td>
                      <td><span className={`pill ${q.status}`}>{q.status}</span></td>
                      <td><span className="lq-wait">{getWaitTime(q.joinedAt)}</span></td>
                      <td><span className="lq-code">{q.ticket?.verificationCode || '—'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      ) : (
        // Flat view
        <div className="lq-table-wrap">
          <table className="lq-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Plate</th>
                <th>Vehicle</th>
                <th>Customer</th>
                <th>Station</th>
                <th>Fuel</th>
                <th>Status</th>
                <th>Wait</th>
                <th>Code</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((q, i) => (
                <tr key={q.id}>
                  <td><span className="lq-pos">{i + 1}</span></td>
                  <td><span className="lq-plate">{q.vehicle?.registrationNumber || q.vehicle?.licensePlate || '—'}</span></td>
                  <td><span className="lq-vehicle">{getVehicleIcon(q.vehicle?.type)} {q.vehicle?.type}</span></td>
                  <td>{q.user?.name || '—'}</td>
                  <td>
                    <div className="lq-station-cell">
                      <span>{q.station?.name}</span>
                      <span className="lq-station-loc">{q.station?.city}</span>
                    </div>
                  </td>
                  <td>{q.vehicle?.fuelType?.name || '—'}</td>
                  <td><span className={`pill ${q.status}`}>{q.status}</span></td>
                  <td><span className="lq-wait">{getWaitTime(q.joinedAt)}</span></td>
                  <td><span className="lq-code">{q.ticket?.verificationCode || '—'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="lq-footer">
        <span className="live-dot"></span> Auto-refreshing every 10 seconds
      </div>
    </div>
  );
}
