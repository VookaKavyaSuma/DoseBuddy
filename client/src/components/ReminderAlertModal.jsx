import React, { useEffect } from 'react';
import './ReminderAlertModal.css';

export default function ReminderAlertModal({ reminder, onTake, onSkip, onClose }) {
    if (!reminder) return null;

    // Optional voice announcement when 15-min reminder triggers
    useEffect(() => {
        if ('speechSynthesis' in window && reminder) {
            try {
                window.speechSynthesis.cancel();
                const textToSpeak = `Hello. 15 minute reminder for your medication: ${reminder.name}, ${reminder.dosage || ''}. Scheduled at ${reminder.timeSlotTime || 'soon'}. ${reminder.mealInstruction || ''}`;
                const utterance = new SpeechSynthesisUtterance(textToSpeak);
                utterance.rate = 0.9;
                window.speechSynthesis.speak(utterance);
            } catch (err) {
                console.warn('Speech synthesis error:', err);
            }
        }
    }, [reminder]);

    const playChime = () => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
            osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.6);
        } catch (e) {
            // Audio context disabled
        }
    };

    return (
        <div className="reminder-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
            <div className="reminder-modal-card" onClick={e => e.stopPropagation()}>
                <div className="reminder-top-pill">
                    <span className="bell-pulse">⏰</span>
                    <span>15-MINUTE PRIOR MEDICATION ALERT</span>
                </div>

                <div className="reminder-header">
                    <div className="reminder-icon-box">{reminder.photo || '💊'}</div>
                    <div className="reminder-title-area">
                        <h2>Time to Prepare Your Dose</h2>
                        <p className="scheduled-tag">
                            Scheduled at <strong>{reminder.timeSlotTime || '08:00 AM'}</strong> (15 minutes from now)
                        </p>
                    </div>
                </div>

                <div className="reminder-body">
                    <div className="reminder-med-info">
                        <div className="med-primary-name">{reminder.name}</div>
                        <div className="med-primary-dose">{reminder.dosage} • Frequency: {reminder.frequency || '1-0-1'}</div>
                    </div>

                    <div className="reminder-instructions-box">
                        <div className="instr-label">🍽️ MEAL & INGESTION INSTRUCTION:</div>
                        <div className="instr-value">
                            {reminder.mealInstruction || reminder.caregiverNote || 'Take with a full glass of water.'}
                        </div>
                    </div>

                    <div className="gentle-tip">
                        💡 <em>Tip for seniors: Have your water and pillbox ready now so you are relaxed when dose time arrives.</em>
                    </div>
                </div>

                <div className="reminder-actions-row">
                    <button 
                        className="reminder-take-btn"
                        onClick={() => {
                            playChime();
                            onTake(reminder);
                        }}
                    >
                        <span>✅ Mark as Taken Now</span>
                    </button>

                    <button 
                        className="reminder-skip-btn"
                        onClick={() => onSkip(reminder)}
                    >
                        <span>⏭️ Skip This Dose</span>
                    </button>
                </div>

                <div className="reminder-footer-notes">
                    <button className="chime-replay-btn" onClick={playChime}>🔔 Replay Chime</button>
                    <button className="dismiss-link" onClick={onClose}>Dismiss Alarm</button>
                </div>
            </div>
        </div>
    );
}
