import React from 'react';
import './AdherenceView.css';

export default function AdherenceView({ doseLogs = [], medications = [] }) {
    const todayLogs = doseLogs;
    const takenLogs = todayLogs.filter(l => l.status === 'TAKEN');
    const skippedLogs = todayLogs.filter(l => l.status === 'SKIPPED');

    // Count expected daily doses
    const activeMeds = medications.filter(m => m.category === 'current');
    let totalScheduledDaily = 0;
    activeMeds.forEach(m => {
        let count = 0;
        if (m.morningDose || m.frequency?.startsWith('1-')) count++;
        if (m.afternoonDose || m.frequency?.includes('-1-')) count++;
        if (m.nightDose || m.frequency?.endsWith('-1')) count++;
        totalScheduledDaily += (count || 1);
    });

    const totalLogged = takenLogs.length + skippedLogs.length;
    const denominator = Math.max(totalScheduledDaily, totalLogged || 1);
    const adherencePercent = Math.min(100, Math.round((takenLogs.length / denominator) * 100));

    return (
        <div className="adherence-root">
            {/* Adherence Overview Banner */}
            <div className="adherence-kpi-card">
                <div className="kpi-ring-col">
                    <div className="progress-ring-box">
                        <div className="progress-circle-outer">
                            <span className="percent-val">{adherencePercent}%</span>
                            <span className="percent-sub">Today's Score</span>
                        </div>
                    </div>
                </div>

                <div className="kpi-stats-col">
                    <div className="kpi-header-row">
                        <h3>Today's Medication Adherence</h3>
                        <span className="streak-badge">🔥 5-Day Streak Active</span>
                    </div>
                    <p className="kpi-tagline">
                        Consistency keeps your treatment effective and minimizes blood pressure & glucose spikes.
                    </p>

                    <div className="kpi-pills-row">
                        <div className="stat-pill taken">
                            <span className="pill-dot"></span>
                            <span className="pill-count">{takenLogs.length}</span>
                            <span className="pill-lbl">Taken Today</span>
                        </div>

                        <div className="stat-pill skipped">
                            <span className="pill-dot"></span>
                            <span className="pill-count">{skippedLogs.length}</span>
                            <span className="pill-lbl">Skipped</span>
                        </div>

                        <div className="stat-pill pending">
                            <span className="pill-dot"></span>
                            <span className="pill-count">{Math.max(0, totalScheduledDaily - takenLogs.length - skippedLogs.length)}</span>
                            <span className="pill-lbl">Remaining Doses</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chronological Action Timeline */}
            <div className="adherence-timeline-card">
                <div className="timeline-header">
                    <h4>📋 Today's Dose Log & Activity Record</h4>
                    <span className="live-sync-chip">🔄 Real-time Caregiver Sync Active</span>
                </div>

                {todayLogs.length === 0 ? (
                    <div className="timeline-empty">
                        <div className="empty-clock-icon">⏰</div>
                        <p>No doses have been logged yet today.</p>
                        <span>Click "✅ Taken" or "⏭️ Skip" in your Daily Schedule above to start tracking.</span>
                    </div>
                ) : (
                    <div className="timeline-list">
                        {todayLogs.map((log, idx) => {
                            const isTaken = log.status === 'TAKEN';
                            const formattedTime = log.loggedAt
                                ? new Date(log.loggedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                : 'Today';

                            return (
                                <div key={log.id || idx} className={`timeline-entry ${isTaken ? 'status-taken' : 'status-skipped'}`}>
                                    <div className="timeline-bullet">
                                        {isTaken ? '✓' : '✕'}
                                    </div>

                                    <div className="timeline-entry-content">
                                        <div className="entry-title-row">
                                            <strong>{log.medicationName}</strong>
                                            <span className="entry-time">{formattedTime}</span>
                                        </div>

                                        <div className="entry-sub">
                                            <span>Slot: <strong>{log.timeSlot || 'Scheduled'}</strong></span>
                                            {log.dosage && <span> • Dosage: {log.dosage}</span>}
                                        </div>

                                        <div className={`entry-status-tag ${isTaken ? 'taken' : 'skipped'}`}>
                                            {isTaken ? (
                                                <span>✅ Dose Taken Successfully</span>
                                            ) : (
                                                <span>⏭️ Skipped: "{log.reason || 'Patient skipped dose'}" (Caregiver Notified)</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
