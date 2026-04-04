import React, { useState } from 'react';
import { authService } from '../services/api';
import './LoginPage.css';

export default function LoginPage({ onLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const data = await authService.login(email, password);

            if (data.user.role !== 'ADMIN') {
                if (data.user.role === 'OPERATOR') {
                    setError('Operator access is only available through the mobile app. Please use the Smart Fuel mobile app to log in as an operator.');
                } else {
                    setError('Access denied. Admin privileges required.');
                }
                return;
            }

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            onLogin(data.user);
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-bg-grid"></div>

            {/* Left branding panel */}
            <div className="login-brand">
                <div className="brand-content">
                    <div className="brand-badge">ADMIN OS</div>
                    <div className="brand-icon">⛽</div>
                    <h1 className="brand-title">FuelQueue</h1>
                    <p className="brand-subtitle">Smart Queue Management System</p>

                    <div className="brand-stats">
                        <div className="brand-stat">
                            <span className="brand-stat-val">24/7</span>
                            <span className="brand-stat-lbl">Monitoring</span>
                        </div>
                        <div className="brand-stat-divider"></div>
                        <div className="brand-stat">
                            <span className="brand-stat-val">Live</span>
                            <span className="brand-stat-lbl">Analytics</span>
                        </div>
                        <div className="brand-stat-divider"></div>
                        <div className="brand-stat">
                            <span className="brand-stat-val">9</span>
                            <span className="brand-stat-lbl">Provinces</span>
                        </div>
                    </div>
                </div>
                <div className="brand-footer">South Africa Fuel Infrastructure</div>
            </div>

            {/* Right form panel */}
            <div className="login-form-panel">
                <div className="login-container">
                    <div className="login-header">
                        <h2>Welcome back</h2>
                        <p>Sign in to access the admin dashboard</p>
                    </div>

                    <form className="login-form" onSubmit={handleSubmit}>
                        {error && <div className="login-error">{error}</div>}

                        <div className="login-field">
                            <label>EMAIL</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@smartfuel.com"
                                required
                                autoComplete="email"
                            />
                        </div>

                        <div className="login-field">
                            <label>PASSWORD</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                required
                                autoComplete="current-password"
                            />
                        </div>

                        <button type="submit" className="login-btn" disabled={loading}>
                            {loading ? (
                                <span className="login-spinner"></span>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    <div className="login-footer-note">
                        Restricted to authorized administrators only
                    </div>
                </div>
            </div>
        </div>
    );
}
