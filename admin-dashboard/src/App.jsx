import { useState, useEffect } from 'react';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import StationsPage from './pages/StationsPage';
import OperatorsPage from './pages/OperatorsPage';
import FuelQuotasPage from './pages/FuelQuotasPage';
import './styles/global.css';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [activePage, setActivePage] = useState('dashboard');

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
      case 'operators':
        return <OperatorsPage />;
      case 'fuel-quotas':
        return <FuelQuotasPage />;
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

  return (
    <div className="App">
      {/* Top Navigation Header */}
      <header className="app-header">
        <div className="header-left">
          <div className="logo">📊</div>
          <div className="header-title">
            <h1>Admin Dashboard</h1>
            <p>Welcome, {user.name}</p>
          </div>
        </div>

        <nav className="main-nav">
          <button
            className={`nav-btn ${activePage === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActivePage('dashboard')}
          >
            📈 Overview
          </button>
          <button
            className={`nav-btn ${activePage === 'stations' ? 'active' : ''}`}
            onClick={() => setActivePage('stations')}
          >
            ⛽ Stations
          </button>
          <button
            className={`nav-btn ${activePage === 'operators' ? 'active' : ''}`}
            onClick={() => setActivePage('operators')}
          >
            👷 Operators
          </button>
          <button
            className={`nav-btn ${activePage === 'fuel-quotas' ? 'active' : ''}`}
            onClick={() => setActivePage('fuel-quotas')}
          >
            ⛽ Fuel Quotas
          </button>
        </nav>

        <button className="btn-logout" onClick={handleLogout}>
          Logout
        </button>
      </header>

      {/* Main Content */}
      <main className="app-content">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;

