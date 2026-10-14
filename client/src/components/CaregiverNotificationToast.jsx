import React from 'react';
import './CaregiverNotificationToast.css';

export default function CaregiverNotificationToast({ alert, onClose }) {
    if (!alert) return null;

    return (
        <div className={`caregiver-toast-card ${alert.type || 'info'}`} role="alert">
            <div className="toast-icon-wrap">
                {alert.type === 'skip' ? '🚨' : alert.type === 'refill' ? '⚠️' : '📲'}
            </div>
            <div className="toast-text-wrap">
                <div className="toast-title">
                    <span>Caregiver Notification Dispatched</span>
                    <span className="toast-timestamp">{alert.time || 'Just now'}</span>
                </div>
                <div className="toast-msg">{alert.message}</div>
                <div className="toast-recipient">
                    <span>Recipient: <strong>Sarah Jenkins (Caregiver)</strong> • Status: <strong>Delivered ✓</strong></span>
                </div>
            </div>
            <button className="toast-dismiss-btn" onClick={onClose} title="Dismiss notification">✕</button>
        </div>
    );
}
