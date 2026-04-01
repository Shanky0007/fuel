import React, { useState, useEffect } from 'react';
import { stationService, analyticsService } from '../services/api';
import './DashboardPage.css';

export default function DashboardPage({ user, onLogout }) {
  const [overview, setOverview] = useState({
    totalStations: 0,
    activeQueues: 0,
    todayServiced: 0,
    avgWaitTime: 0
  });
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [overviewData, stationsData] = await Promise.all([
        analyticsService.getOverview(),
        stationService.getAll(),
      ]);

      setOverview(overviewData);
      setStations(stationsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  const openStations = stations.filter(s => s.status === 'OPEN').length;
  const closedStations = stations.filter(s => s.status === 'CLOSED').length;
  const totalPumps = stations.reduce((sum, s) => sum + (s.totalPumps || 0), 0);

  return (
    <div className="dashboard-panel">
      {/* KPIs */}
      <div className="kpi-grid">
        <div className="kpi-card yellow">
          <div className="kpi-label">Active Stations</div>
          <div className="kpi-value">{openStations}</div>
          <div className="kpi-delta">of {stations.length} total</div>
        </div>
        <div className="kpi-card orange">
          <div className="kpi-label">Active Queues</div>
          <div className="kpi-value">{overview.activeQueues}</div>
          <div className="kpi-delta">
            <span className="live-dot"></span>real-time
          </div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-label">Serviced Today</div>
          <div className="kpi-value">{overview.todayServiced}</div>
          <div className="kpi-delta up">↑ today</div>
        </div>
        <div className="kpi-card blue">
          <div className="kpi-label">Total Pumps</div>
          <div className="kpi-value">{totalPumps}</div>
          <div className="kpi-delta">across all stations</div>
        </div>
      </div>

      {/* Middle Row */}
      <div className="grid-3">
        {/* Stations Mini Map */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <span className="live-dot"></span>Stations Map
            </div>
            <div className="card-tag">LIVE</div>
          </div>
          <div className="stations-map">
            <div className="map-grid"></div>
            {stations.slice(0, 7).map((station, idx) => {
              const positions = [
                { left: '25%', top: '40%' },
                { left: '55%', top: '55%' },
                { left: '75%', top: '30%' },
                { left: '40%', top: '70%' },
                { left: '15%', top: '65%' },
                { left: '85%', top: '65%' },
                { left: '60%', top: '80%' }
              ];
              const pos = positions[idx] || { left: '50%', top: '50%' };
              return (
                <div
                  key={station.id}
                  className="map-pin"
                  style={{ left: pos.left, top: pos.top }}
                  title={station.name}
                >
                  <div className={`pin-dot ${station.status === 'OPEN' ? 'open-pin' : 'closed-pin'}`}></div>
                  <div className="pin-label">{station.name}</div>
                </div>
              );
            })}
          </div>
          <div className="stats-row">
            <div className="stat-cell">
              <div className="stat-val" style={{ color: 'var(--green)' }}>{openStations}</div>
              <div className="stat-lbl">Open</div>
            </div>
            <div className="stat-cell">
              <div className="stat-val" style={{ color: 'var(--red)' }}>{closedStations}</div>
              <div className="stat-lbl">Closed</div>
            </div>
            <div className="stat-cell">
              <div className="stat-val" style={{ color: 'var(--accent)' }}>{totalPumps}</div>
              <div className="stat-lbl">Total Pumps</div>
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Recent Activity</div>
            <div className="card-tag">AUDIT</div>
          </div>
          <div className="activity-feed">
            <div className="activity-item">
              <div className="activity-dot" style={{ background: 'var(--green)' }}></div>
              <div>
                <div className="activity-text">
                  <strong>{stations.length}</strong> stations registered
                </div>
                <div className="activity-time">System status</div>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-dot" style={{ background: 'var(--blue)' }}></div>
              <div>
                <div className="activity-text">
                  <strong>{overview.activeQueues}</strong> active queues
                </div>
                <div className="activity-time">Real-time</div>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-dot" style={{ background: 'var(--accent)' }}></div>
              <div>
                <div className="activity-text">
                  Admin <strong>{user.name}</strong> logged in
                </div>
                <div className="activity-time">Current session</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stations Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">All Stations</div>
          <div className="card-tag">{stations.length} TOTAL</div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Station</th>
              <th>Location</th>
              <th>City</th>
              <th>Pumps</th>
              <th>Status</th>
              <th>Fuel Types</th>
            </tr>
          </thead>
          <tbody>
            {stations.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
                  No stations registered yet
                </td>
              </tr>
            ) : (
              stations.map(station => (
                <tr key={station.id}>
                  <td><strong>{station.name}</strong></td>
                  <td style={{ color: 'var(--muted)', fontSize: '12px' }}>{station.location}</td>
                  <td style={{ color: 'var(--muted)', fontSize: '12px' }}>
                    {station.city ? `${station.city}, ${station.region}` : station.region}
                  </td>
                  <td><span style={{ fontFamily: 'var(--font-mono)' }}>{station.totalPumps}</span></td>
                  <td>
                    <span className={`pill ${station.status}`}>{station.status}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {station.inventory?.map(inv => (
                        <span
                          key={inv.id}
                          className="fuel-badge"
                          style={{
                            fontSize: '10px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: 'rgba(255,255,255,0.05)',
                            fontFamily: 'var(--font-mono)'
                          }}
                        >
                          {inv.fuelType?.name}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
