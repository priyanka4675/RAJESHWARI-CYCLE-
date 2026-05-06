import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Package, ShoppingCart, Users,
  CreditCard, BarChart3, LogOut, Truck, Menu, X, Bike
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Inventory', path: '/inventory', icon: Package },
  { label: 'Sales', path: '/sales', icon: ShoppingCart },
  { label: 'Purchases', path: '/purchases', icon: Truck },
  { label: 'Dealers', path: '/dealers', icon: Users },
  { label: 'Payments', path: '/payments', icon: CreditCard },
  { label: 'Reports', path: '/reports', icon: BarChart3 },
];

const pageTitles = {
  '/': 'Dashboard',
  '/inventory': 'Inventory',
  '/inventory/add': 'Add Product',
  '/sales': 'Sales',
  '/sales/create': 'Create Invoice',
  '/dealers': 'Dealers',
  '/payments': 'Payments',
  '/purchases': 'Purchases',
  '/reports': 'Reports',
};

export default function Layout() {
  const { signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const title = pageTitles[location.pathname] || 'Rajeshwari Cycles';

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <span className="logo-icon">🚲</span>
          <h2>Rajeshwari Cycles</h2>
          <p>Ramachandrapuram</p>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Main Menu</div>
          {navItems.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="signout-btn" onClick={signOut}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="main-content">
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer' }}
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu size={22} />
            </button>
            <div>
              <div className="topbar-title">{title}</div>
            </div>
          </div>
          <div className="topbar-right">
            <span className="topbar-badge">Admin</span>
          </div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
