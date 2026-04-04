import { useState, useEffect } from 'react';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import StationsPage from './pages/StationsPage';
import OperatorsPage from './pages/OperatorsPage';
import FuelQuotasPage from './pages/FuelQuotasPage';
import StationsMapPage from './pages/StationsMapPage';
import SettingsPage from './pages/SettingsPage';
import './styles/theme.css';
import './styles/global.css';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const renderPage = () => {
    switch (activePage) {
      case 'stations':
        return <StationsPage />;
      case 'stations-map':
        return <StationsMapPage />;
      case 'operators':
        return <OperatorsPage />;
      case 'fuel-quotas':
        return <FuelQuotasPage />;
      case 'settings':
        return <SettingsPage user={user} onLogout={handleLogout} />;
      case 'dashboard':
      default:
        return <DashboardPage user={user} onLogout={handleLogout} />;
    }
  };

  if (!user) {
    return (
      <div className="App">
        <LoginPage onLogin={handleLogin} />
      </div>
    );
  }

  const getPageTitle = () => {
    const titles = {
      dashboard: 'Vue d\'ensemble · Dashboard',
      stations: 'Stations · Gestion',
      'stations-map': 'Carte · Stations',
      operators: 'Opérateurs · Gestion',
      'fuel-quotas': 'Quotas · Carburant',
      'settings': 'Settings · Account'
    };
    return titles[activePage] || 'Dashboard';
  };

  return (
    <div className="app">
      {/* SIDEBAR OVERLAY */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* SIDEBAR */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="logo">
          <div className="logo-mark">
            <div className="logo-icon">⛽</div>
            <div>
              FuelQueue
              <br /><span>Admin OS</span>
            </div>
          </div>
        </div>

        <nav>
          <div className="nav-section">Dashboard</div>
          <div
            className={`nav-item ${activePage === 'dashboard' ? 'active' : ''}`}
            onClick={() => { setActivePage('dashboard'); setSidebarOpen(false); }}
          >
            <span className="nav-icon">◈</span> Overview
          </div>
          <div
            className={`nav-item ${activePage === 'stations' ? 'active' : ''}`}
            onClick={() => { setActivePage('stations'); setSidebarOpen(false); }}
          >
            <span className="nav-icon">⚡</span> Stations
          </div>
          <div
            className={`nav-item ${activePage === 'stations-map' ? 'active' : ''}`}
            onClick={() => { setActivePage('stations-map'); setSidebarOpen(false); }}
          >
            <span className="nav-icon">🗺</span> Map
          </div>

          <div className="nav-section" style={{ marginTop: '10px' }}>Operations</div>
          <div
            className={`nav-item ${activePage === 'operators' ? 'active' : ''}`}
            onClick={() => { setActivePage('operators'); setSidebarOpen(false); }}
          >
            <span className="nav-icon">👷</span> Operators
          </div>
          <div
            className={`nav-item ${activePage === 'fuel-quotas' ? 'active' : ''}`}
            onClick={() => { setActivePage('fuel-quotas'); setSidebarOpen(false); }}
          >
            <span className="nav-icon">◉</span> Fuel Quotas
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="user-card">
            <div className="avatar">
              {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <div className="user-info">
              <div className="user-name">{user.name}</div>
              <div className="user-role">{user.role.toLowerCase()}</div>
            </div>
            <span
              style={{ cursor: 'pointer', color: 'var(--muted)', fontSize: '14px', marginRight: '6px' }}
              onClick={() => setActivePage('settings')}
              title="Settings"
            >
              ⚙
            </span>
            <span
              style={{ cursor: 'pointer', color: 'var(--muted)', fontSize: '14px' }}
              onClick={handleLogout}
              title="Logout"
            >
              ⏻
            </span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="main">
        {/* TOPBAR */}
        <div className="topbar">
          <button className="hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <span></span><span></span><span></span>
          </button>
          <div className="page-title">
            {getPageTitle().split('·').map((part, i) => (
              <span key={i}>
                {i > 0 && <span style={{ color: 'var(--accent)' }}> · </span>}
                {part.trim()}
              </span>
            ))}
          </div>
          <div className="topbar-right">
            <div className="search-box">
              <span>🔍</span> Search...
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="content">
          {renderPage()}
        </div>
      </div>
    </div>
  );
}

export default App;
