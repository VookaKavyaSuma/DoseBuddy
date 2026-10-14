import { useAuth } from '../context/AuthContext';
import LanguageSelector from './LanguageSelector';
import './Navbar.css';

export default function Navbar({ 
    lang = 'en', 
    onLanguageChange = () => {},
    notificationsCount = 0,
    onOpenNotifications = () => {}
}) {
    const { user, logout } = useAuth();

    if (!user) return null;

    const initial = user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U';
    const isCaregiver = user.role === 'CAREGIVER';

    return (
        <nav className="navbar">
            <div className="navbar-container">
                {/* Brand Logo */}
                <div className="nav-brand">
                    <div className="nav-logo-icon">💊</div>
                    <div className="nav-brand-text">
                        <span className="nav-title">DoseBuddy</span>
                        <span className="nav-subtitle">Smart Prescription Reminder</span>
                    </div>
                </div>

                {/* Right controls: Language Selector + Notifications + User Info & Logout */}
                <div className="nav-user-section">
                    <LanguageSelector currentLang={lang} onLanguageChange={onLanguageChange} />

                    {/* Dual Notification Bell */}
                    <button 
                        type="button" 
                        className="notif-bell-nav-btn"
                        onClick={onOpenNotifications}
                        title="View Medication Update Alerts"
                        aria-label="View notifications"
                    >
                        <span className="bell-emoji">🔔</span>
                        {notificationsCount > 0 && (
                            <span className="notif-count-badge">{notificationsCount}</span>
                        )}
                    </button>

                    <div className="user-card">
                        <div className="user-avatar">{initial}</div>
                        <div className="user-details">
                            <span className="user-name">{user.fullName || user.username}</span>
                            <div className="user-badge-row">
                                <span className={`role-badge ${isCaregiver ? 'caregiver' : 'patient'}`}>
                                    {isCaregiver ? '🩺 Caregiver' : '💊 Patient'}
                                </span>
                                <span className="user-email">{user.email}</span>
                            </div>
                        </div>
                    </div>

                    <button type="button" className="logout-btn" onClick={logout} title="Sign Out">
                        <span className="logout-icon">🚪</span>
                        <span className="logout-text">Sign Out</span>
                    </button>
                </div>
            </div>
        </nav>
    );
}
