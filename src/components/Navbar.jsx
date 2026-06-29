import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, isAdmin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = isAdmin
    ? [{ path: '/admin', label: 'Admin', icon: ShieldIcon }]
    : [];

  return (
    <>
      {/* Top Header */}
      <header className="app-header py-2">
        <div className="max-w-md mx-auto px-4 flex items-center justify-between">
          {/* Hamburger Menu Button on Left */}
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-10 h-10 flex items-center justify-center hover:opacity-80 active:scale-95 transition-all"
            id="nav-menu-btn"
          >
            <svg className="w-5 h-5 text-brand-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Centered Nyati Logo */}
          <div className="flex flex-col items-center justify-center">
            <img
              src="https://nyatigroup.com/_next/image?url=%2Fimages%2Flogo%2Flogo.png&w=640&q=80"
              alt="Nyati Group Logo"
              className="h-9 object-contain"
            />
          </div>

          {/* Spacer to keep logo centered */}
          <div className="w-10 h-10" />
        </div>

        {/* Dropdown Menu */}
        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowMenu(false)}
            />
            <div className="absolute right-4 top-16 z-50 bg-white rounded-2xl shadow-card-hover border border-gray-100 w-56 animate-scale-in overflow-hidden">
              <div className="px-4 py-3 bg-gradient-brand">
                <p className="text-white font-semibold text-sm truncate">{user?.name}</p>
                <p className="text-blue-200 text-xs truncate">{user?.email}</p>
              </div>
              <div className="p-2">
                {!isAdmin && (
                  <>
                    <Link
                      to="/"
                      onClick={() => setShowMenu(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 text-sm text-gray-700 font-medium transition-colors"
                    >
                      <HomeIcon className="w-4 h-4 text-brand-orange" /> Home
                    </Link>
                    <Link
                      to="/reports"
                      onClick={() => setShowMenu(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 text-sm text-gray-700 font-medium transition-colors"
                    >
                      <ListIcon className="w-4 h-4 text-brand-orange" /> Reports
                    </Link>
                  </>
                )}
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setShowMenu(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 text-sm text-gray-700 font-medium transition-colors"
                  >
                    <ShieldIcon className="w-4 h-4 text-brand-orange" /> Admin Panel
                  </Link>
                )}
                <div className="divider" />
                <button
                  onClick={handleLogout}
                  id="logout-btn"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 text-sm text-red-500 font-medium w-full transition-colors"
                >
                  <LogoutIcon className="w-4 h-4" /> Logout
                </button>
              </div>
            </div>
          </>
        )}
      </header>

      {/* Bottom Navigation */}
      {navItems.length > 0 && (
        <nav className="bottom-nav">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 px-4 py-1 rounded-xl transition-all duration-200 ${isActive
                  ? 'text-brand-orange'
                  : 'text-gray-400 hover:text-gray-600'
                  }`}
                id={`nav-${item.label.toLowerCase()}`}
              >
                <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
                <span className="text-[10px] font-semibold">{item.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 w-1 h-1 bg-brand-orange rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>
      )}
    </>
  );
};

// Inline SVG Icons
const HomeIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const ListIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
);

const ShieldIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const LogoutIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

export default Navbar;
