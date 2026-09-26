import React from "react";
import { User, Mail, Shield, LogOut, LogIn } from "lucide-react";

export default function ProfilePage({ user, onSignIn, onSignOut }) {
  return (
    <div className="page-container">
      <div className="page-hero">
        <div className="page-hero-icon" style={{ background: "linear-gradient(135deg,#8b5cf6,#7c3aed)" }}>
          <User size={28} color="#fff" />
        </div>
        <div>
          <h1 className="page-title">Profile</h1>
          <p className="page-subtitle">Account information</p>
        </div>
      </div>

      {user ? (
        <div className="profile-content">
          <div className="profile-avatar-section">
            <div className="profile-big-avatar">{user.avatar}</div>
            <div className="profile-name-block">
              <h2 className="profile-name">{user.name}</h2>
              <span className="profile-badge">Verified Account</span>
            </div>
          </div>

          <div className="profile-info-cards">
            <div className="profile-info-card">
              <Mail size={18} className="profile-info-icon" />
              <div>
                <div className="profile-info-label">Email Address</div>
                <div className="profile-info-value">{user.email}</div>
              </div>
            </div>
            <div className="profile-info-card">
              <User size={18} className="profile-info-icon" />
              <div>
                <div className="profile-info-label">Display Name</div>
                <div className="profile-info-value">{user.name}</div>
              </div>
            </div>
            <div className="profile-info-card">
              <Shield size={18} className="profile-info-icon" style={{ color: "#10b981" }} />
              <div>
                <div className="profile-info-label">Account Status</div>
                <div className="profile-info-value" style={{ color: "#10b981" }}>Active · Authenticated</div>
              </div>
            </div>
          </div>

          <button className="profile-signout-btn" onClick={onSignOut}>
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      ) : (
        <div className="page-empty">
          <User size={48} className="page-empty-icon" />
          <h3>Not signed in</h3>
          <p>Sign in to view your account information and access personalized features.</p>
          <button className="page-action-btn" onClick={onSignIn}>
            <LogIn size={16} /> Sign In / Register
          </button>
        </div>
      )}
    </div>
  );
}
