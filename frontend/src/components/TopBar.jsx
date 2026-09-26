import React from "react";
import { Menu, Sun, Moon, Leaf } from "lucide-react";

export default function TopBar({
  onHamburger,
  user,
  onSignIn,
  onSignOut,
  isDark,
  onToggleTheme,
}) {
  return (
    <header className="topbar">
      {/* Left: Hamburger + Brand */}
      <div className="topbar-left">
        <button
          className="hamburger-btn"
          onClick={onHamburger}
          aria-label="Open navigation menu"
        >
          <span className="hamburger-line" />
          <span className="hamburger-line" />
          <span className="hamburger-line" />
        </button>

        <div className="topbar-brand">
          <div className="topbar-logo">
            <Leaf size={16} />
          </div>
          <div className="topbar-brand-text">
            <span className="topbar-brand-name">AQI Route</span>
            <span className="topbar-brand-sub">Delhi Navigator</span>
          </div>
        </div>
      </div>

      {/* Right: Theme + Profile */}
      <div className="topbar-right">
        {/* Dark / Light toggle */}
        <button
          className="theme-toggle-btn"
          onClick={onToggleTheme}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          title={isDark ? "Light Mode" : "Dark Mode"}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {user ? (
          <div className="topbar-user">
            <span className="topbar-user-email">{user.email}</span>
            <button
              className="topbar-avatar"
              onClick={onSignOut}
              title={`Signed in as ${user.email} — click to sign out`}
              aria-label="Sign out"
            >
              {user.avatar}
            </button>
          </div>
        ) : (
          <button className="topbar-signin-btn" onClick={onSignIn}>
            Sign In
          </button>
        )}
      </div>
    </header>
  );
}
