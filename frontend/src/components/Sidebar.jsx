import React, { useEffect, useRef } from "react";
import {
  LayoutDashboard,
  Map,
  Route,
  BarChart2,
  History,
  Bell,
  User,
  Settings,
  LogOut,
  X,
  Leaf,
} from "lucide-react";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "map",       label: "Map",       icon: Map },
  { id: "routes",    label: "Routes",    icon: Route },
  { id: "forecast",  label: "Forecast",  icon: BarChart2 },
  { id: "history",   label: "History",   icon: History },
  { id: "alerts",    label: "Alerts",    icon: Bell },
  { id: "profile",   label: "Profile",   icon: User },
  { id: "settings",  label: "Settings",  icon: Settings },
];

export default function Sidebar({
  isOpen,
  onClose,
  activeNav,
  setActiveNav,
  user,
  onSignOut,
  onSignIn,
  alertCount = 0,
}) {
  const sidebarRef = useRef(null);

  // Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  // Outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target)) onClose();
    };
    const id = setTimeout(() => document.addEventListener("mousedown", handleClick), 100);
    return () => { clearTimeout(id); document.removeEventListener("mousedown", handleClick); };
  }, [isOpen, onClose]);

  const handleNav = (id) => {
    setActiveNav(id);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div className={`sidebar-backdrop ${isOpen ? "visible" : ""}`} aria-hidden="true" />

      {/* Sidebar panel */}
      <aside ref={sidebarRef} className={`sidebar-panel ${isOpen ? "open" : ""}`} aria-label="Navigation sidebar">
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="sidebar-brand-icon"><Leaf size={18} /></div>
            <div className="sidebar-brand-text">
              <div className="sidebar-brand-name">AQI Navigator</div>
              <div className="sidebar-brand-sub">Delhi Clean Air</div>
            </div>
          </div>
          <button className="sidebar-close-btn" onClick={onClose} aria-label="Close sidebar">
            <X size={20} />
          </button>
        </div>

        {/* User profile strip */}
        {user ? (
          <div className="sidebar-profile">
            <div className="sidebar-avatar">{user.avatar}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user.name}</div>
              <div className="sidebar-user-email">{user.email}</div>
            </div>
          </div>
        ) : (
          <div className="sidebar-profile sidebar-profile-guest">
            <div className="sidebar-avatar sidebar-avatar-guest">?</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">Guest User</div>
              <button className="sidebar-signin-link" onClick={() => { onClose(); onSignIn(); }}>
                Sign In / Register →
              </button>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="sidebar-nav">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`sidebar-nav-item ${activeNav === id ? "active" : ""}`}
              onClick={() => handleNav(id)}
            >
              <Icon size={18} className="sidebar-nav-icon" />
              <span className="sidebar-nav-label">{label}</span>
              {id === "alerts" && alertCount > 0 && (
                <span className="sidebar-badge">{alertCount}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Sign Out */}
        <div className="sidebar-footer">
          {user ? (
            <button className="sidebar-signout-btn" onClick={() => { onClose(); onSignOut(); }}>
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          ) : (
            <button className="sidebar-signout-btn sidebar-signin-btn" onClick={() => { onClose(); onSignIn(); }}>
              <User size={16} />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
