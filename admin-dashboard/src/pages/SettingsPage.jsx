import React from 'react';
import './DashboardPage.css';

export default function SettingsPage({ user, onLogout }) {
    return (
        <div style={{ padding: '2rem', maxWidth: '600px' }}>
            <h2 style={{ color: 'var(--text)', marginBottom: '2rem', fontSize: '1.5rem', fontWeight: 700 }}>
                Settings
            </h2>

            <div style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                padding: '1.5rem',
                marginBottom: '1rem',
            }}>
                <div style={{ color: 'var(--muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>
                    Account
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                        width: 48, height: 48, borderRadius: '12px',
                        background: 'var(--accent)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: '1rem', color: '#fff',
                        flexShrink: 0,
                    }}>
                        {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div>
                        <div style={{ color: 'var(--text)', fontWeight: 600 }}>{user?.name}</div>
                        <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{user?.email}</div>
                        <div style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: '2px', textTransform: 'capitalize' }}>{user?.role}</div>
                    </div>
                </div>
            </div>

            <div style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                padding: '1.5rem',
            }}>
                <div style={{ color: 'var(--muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>
                    Session
                </div>
                <button
                    onClick={onLogout}
                    style={{
                        background: 'rgba(239,68,68,0.1)',
                        border: '1px solid rgba(239,68,68,0.3)',
                        borderRadius: '10px',
                        color: '#ef4444',
                        padding: '0.65rem 1.25rem',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                    }}
                >
                    Sign out
                </button>
            </div>
        </div>
    );
}
