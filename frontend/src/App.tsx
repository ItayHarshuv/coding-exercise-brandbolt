import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import WebhooksPage from './pages/WebhooksPage';
import DashboardPage from './pages/DashboardPage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <aside className="sidebar">
          <div className="sidebar-brand">
            <div className="sidebar-brand-icon">O</div>
            <div>
              <div className="sidebar-brand-text">OrderFlow</div>
              <div className="sidebar-brand-sub">Management</div>
            </div>
          </div>

          <nav className="sidebar-nav">
            <div className="sidebar-section-label">Main</div>
            <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <span className="nav-link-icon">&#9633;</span>
              Dashboard
            </NavLink>
            <NavLink to="/orders" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <span className="nav-link-icon">&#9776;</span>
              Orders
            </NavLink>

            <div className="sidebar-section-label">System</div>
            <NavLink to="/webhooks" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <span className="nav-link-icon">&#9889;</span>
              Webhooks
            </NavLink>
          </nav>

          <div className="sidebar-footer">
            OrderFlow v1.0
          </div>
        </aside>

        <div className="main-wrapper">
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
      </div>
    </BrowserRouter>
  );
}
