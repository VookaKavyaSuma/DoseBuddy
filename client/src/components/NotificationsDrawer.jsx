import React from 'react';
import './NotificationsDrawer.css';

export default function NotificationsDrawer({ 
    isOpen, 
    onClose, 
    notifications = [], 
    onMarkRead,
    userRole = 'CAREGIVER' 
}) {
    if (!isOpen) return null;

    return (
        <div className="notif-drawer-overlay" onClick={onClose} role="dialog" aria-modal="true">
            <div className="notif-drawer-card" onClick={e => e.stopPropagation()}>
                <div className="notif-drawer-header">
                    <div className="notif-header-title">
                        <span className="notif-bell-icon">🔔</span>
                        <div>
                            <h3>Medication Update Notifications</h3>
                            <span className="notif-header-sub">
                                Live dispatch log for {userRole === 'CAREGIVER' ? 'Caregiver (Sarah Jenkins)' : 'Patient (Robert Jenkins)'}
                            </span>
                        </div>
                    </div>
                    <button className="notif-close-btn" onClick={onClose}>✕</button>
                </div>

                <div className="notif-drawer-body">
                    {notifications.length === 0 ? (
                        <div className="notif-empty-state">
                            <span className="empty-bell">🔕</span>
                            <p>No notifications yet.</p>
                            <span>When a caregiver edits a prescription, update notices appear here instantly.</span>
                        </div>
                    ) : (
                        <div className="notif-list">
                            {notifications.map((n) => (
                                <div key={n.id} className={`notif-item ${n.isRead ? 'read' : 'unread'}`}>
                                    <div className="notif-item-top">
                                        <div className="notif-role-tag">
                                            {n.recipientRole === 'PATIENT' ? '👤 For Patient' : '🩺 For Caregiver'}
                                        </div>
                                        <span className="notif-time">
                                            {n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                                        </span>
                                    </div>

                                    <h4 className="notif-item-title">{n.title}</h4>
                                    <p className="notif-item-message">{n.message}</p>

                                    {n.changeSummary && (
                                        <div className="notif-summary-pill">
                                            ✏️ <strong>Changes:</strong> {n.changeSummary}
                                        </div>
                                    )}

                                    {!n.isRead && (
                                        <div className="notif-actions">
                                            <button 
                                                className="mark-read-btn"
                                                onClick={() => onMarkRead(n.id)}
                                            >
                                                Mark as Read ✓
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
