import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { stationService, analyticsService } from '../services/api';
import './DashboardPage.css';

const COLORS = ['#6366F1', '#EC4899', '#10B981', '#F59E0B'];

export default function DashboardPage({ user, onLogout }) {
    const [overview, setOverview] = useState({
        totalStations: 0,
        activeQueues: 0,
        todayServiced: 0,
        avgWaitTime: 0
    });
    const [stations, setStations] = useState([]);
    const [trafficData, setTrafficData] = useState([]);
    const [fuelData, setFuelData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [overviewData, stationsData, traffic, fuel] = await Promise.all([
                analyticsService.getOverview(),
                stationService.getAll(),
                analyticsService.getTrafficData(),
                analyticsService.getFuelDistribution(),
            ]);

            setOverview(overviewData);
            setStations(stationsData);
            setTrafficData(traffic);
            setFuelData(fuel);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <div className="dashboard-page">
            <div className="dashboard-content">
                {/* Overview Stats */}
                <div className="stats-grid">
                    <div className="stat-card stat-primary">
                        <div className="stat-icon">⛽</div>
                        <div className="stat-content">
                            <div className="stat-value">{overview.totalStations}</div>
                            <div className="stat-label">Total Stations</div>
                        </div>
                    </div>

                    <div className="stat-card stat-accent">
                        <div className="stat-icon">🚗</div>
                        <div className="stat-content">
                            <div className="stat-value">{overview.activeQueues}</div>
                            <div className="stat-label">Active Queues</div>
                        </div>
                    </div>

                    <div className="stat-card stat-success">
                        <div className="stat-icon">✅</div>
                        <div className="stat-content">
                            <div className="stat-value">{overview.todayServiced}</div>
                            <div className="stat-label">Serviced Today</div>
                        </div>
                    </div>

                    <div className="stat-card stat-warning">
                        <div className="stat-icon">⏱️</div>
                        <div className="stat-content">
                            <div className="stat-value">{overview.avgWaitTime} min</div>
                            <div className="stat-label">Avg Wait Time</div>
                        </div>
                    </div>
                </div>

                {/* Charts */}
                <div className="charts-grid">
                    <div className="chart-card">
                        <h3>📈 Traffic Flow (Today)</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={trafficData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="hour" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="vehicles" stroke="#6366F1" strokeWidth={3} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="chart-card">
                        <h3>⛽ Fuel Distribution</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={fuelData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={(entry) => `${entry.name}: ${entry.value}%`}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {fuelData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Stations List */}
                <div className="stations-section">
                    <h2>🏢 All Stations</h2>
                    <div className="stations-grid">
                        {stations.map((station) => (
                            <div key={station.id} className="station-card">
                                <div className="station-header">
                                    <h3>{station.name}</h3>
                                    <div className={`status-badge status-${station.status.toLowerCase()}`}>
                                        {station.status}
                                    </div>
                                </div>
                                <div className="station-details">
                                    <div className="detail-row">
                                        <span>📍 {station.location}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span>⛽ {station.totalPumps} Pumps</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
