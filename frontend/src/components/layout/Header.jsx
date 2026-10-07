import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, X, Calendar as CalendarIcon, Clock as ClockIcon, Activity, Globe, User, LogOut, ChevronDown, Sun, Moon } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import { useTheme } from '../../context/ThemeContext';
import './Header.css';
import API_BASE from '../../config/api';

const Header = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const { notifications, unreadCount, markAllAsRead, addNotification } = useNotification();
  const { theme, toggleTheme } = useTheme();
  const dropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const user = JSON.parse(localStorage.getItem('user'));
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Let's actually add a state for user so header updates dynamically too
  const [userState, setUserState] = useState(user);

  useEffect(() => {
    const handleUserUpdate = () => {
      setUserState(JSON.parse(localStorage.getItem('user')));
    };
    window.addEventListener('userUpdated', handleUserUpdate);
    return () => window.removeEventListener('userUpdated', handleUserUpdate);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getUSTime = () => {
    return currentTime.toLocaleString('en-US', {
      timeZone: 'America/New_York',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const getLocalDate = () => {
    return currentTime.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setIsLoggingOut(true);
    document.body.classList.add('fade-out-exit');
    setTimeout(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('tokenExpiry');
      localStorage.removeItem('user');
      document.body.classList.remove('fade-out-exit');
      window.location.href = '/login';
    }, 2000);
  };




  return (
    <>
      {isLoggingOut && (
        <div className="fullscreen-loader">
          <div className="loader-logo-container">
            <img src="/img/logo.jpg" alt="WorkTrack Logo" className="loader-logo" />
            <div className="loader-spinner"></div>
          </div>
          <div className="loader-text">Logging out...</div>
        </div>
      )}
      <header className="global-header">
      <div className="header-left-widget">
        <div className="header-logo-section">
          <div className="logo-icon-wrapper" style={{ background: 'transparent', padding: 0 }}>
            <img src="/img/logo.jpg" alt="WorkTrack Logo" style={{ width: '28px', height: '28px', borderRadius: '8px', objectFit: 'cover', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
          </div>
          <span className="logo-text" style={{ fontSize: '1.2rem', fontWeight: '700' }}>WorkTrack</span>
        </div>

        <div className="header-divider"></div>

        <div className="header-date-section">
          <CalendarIcon size={16} />
          <span>{getLocalDate()}</span>
        </div>

        <div className="header-divider"></div>

        <div className="us-time-badge">
          <Globe size={14} className="globe-icon" />
          <span className="time-label">US (ET)</span>
          <span className="time-value">{getUSTime()}</span>
        </div>
      </div>

      <div className="header-actions">
        <button
          className="icon-btn theme-toggle-btn"
          title="Toggle Theme"
          onClick={toggleTheme}
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
        <div className="notification-container" ref={dropdownRef}>
          <button
            className="icon-btn notification-btn"
            title="Notifications"
            onClick={() => {
              setShowDropdown(!showDropdown);
            }}
          >
            <Bell size={20} />
            {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
          </button>

          {showDropdown && (
            <div className="notification-dropdown glass">
              <div className="notification-header">
                <h4>Notifications</h4>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {unreadCount > 0 && (
                    <button className="clear-unread-btn" onClick={markAllAsRead} style={{
                      background: 'rgba(59, 130, 246, 0.1)', border: 'none', color: 'var(--primary)', 
                      fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', display: 'flex', 
                      alignItems: 'center', gap: '4px', padding: '4px 8px',
                      borderRadius: '6px', transition: 'background 0.2s'
                    }}>
                      <Check size={14} /> Clear all unread
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button className="clear-btn" onClick={() => setShowDropdown(false)}>
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
              <div className="notification-list">
                {notifications.length === 0 ? (
                  <div className="empty-state">No notifications</div>
                ) : (
                  notifications.map((notif) => (
                    <div key={notif.id} className={`notification-item ${parseInt(notif.is_read) === 0 ? 'unread' : ''}`}>
                      <div className="notification-icon">
                        <Check size={16} />
                      </div>
                      <div className="notification-content">
                        <p>{notif.message}</p>
                        <span className="time">
                          {new Date(notif.timestamp || notif.created_at).toLocaleString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric',
                            hour: 'numeric', minute: '2-digit', hour12: true
                          })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="profile-container" ref={profileDropdownRef} style={{ position: 'relative', marginLeft: '16px' }}>
          <div
            className="profile-trigger"
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
          >
            <div className="avatar-circle enhanced-avatar">
              {userState?.profile_picture ? (
                <img src={userState.profile_picture.startsWith('http') || userState.profile_picture.startsWith('data:image') ? userState.profile_picture : (userState.profile_picture.startsWith('img/') ? `/${userState.profile_picture}` : `${API_BASE.replace('/api', '')}/${userState.profile_picture}`)} alt="avatar" />
              ) : (
                userState?.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U'
              )}
            </div>
            <div className="profile-info-trigger">
              <span className="profile-name-trigger">{userState?.full_name || 'User'}</span>
              <span className="profile-role-trigger">{userState?.role || 'Employee'}</span>
            </div>
            <ChevronDown size={16} className={`profile-chevron ${showProfileDropdown ? 'open' : ''}`} />
          </div>

          {showProfileDropdown && (
            <div className="profile-dropdown glass">
              <div className="profile-dropdown-body">
                <button className="profile-dropdown-item" onClick={() => window.location.href = '/profile'}>
                  <User size={16} /> My Profile
                </button>
                <div className="dropdown-divider"></div>
                <button className="profile-dropdown-item text-danger" onClick={handleLogout}>
                  <LogOut size={16} /> Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
    </>
  );
};

export default Header;
