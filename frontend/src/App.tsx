import { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import WebhooksPage from './pages/WebhooksPage';
import DashboardPage from './pages/DashboardPage';

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <BrowserRouter>
      <div className="app">
        <header className="topbar">
          <div className="topbar-brand">
            <div className="topbar-brand-icon">O</div>
            <div>
              <div className="topbar-brand-text">OrderFlow</div>
              <div className="topbar-brand-sub">Management</div>
            </div>
          </div>

          <button
            type="button"
            className="topbar-toggle"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-expanded={isMenuOpen}
            aria-controls="topbar-nav"
            aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {isMenuOpen ? '\u00d7' : '\u2630'}
          </button>

          <nav id="topbar-nav" className={`topbar-nav${isMenuOpen ? ' open' : ''}`}>
            <NavLink to="/dashboard" onClick={closeMenu} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <span className="nav-link-icon">&#9633;</span>
              Dashboard
            </NavLink>
            <NavLink to="/orders" onClick={closeMenu} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <span className="nav-link-icon">&#9776;</span>
              Orders
            </NavLink>
            <NavLink to="/webhooks" onClick={closeMenu} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <span className="nav-link-icon">&#9889;</span>
              Webhooks
            </NavLink>
          </nav>
        </header>

        <main className="main">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/orders/:id" element={<OrderDetailPage />} />
            <Route path="/webhooks" element={<WebhooksPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
