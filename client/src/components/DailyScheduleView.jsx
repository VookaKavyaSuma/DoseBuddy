import React, { useState, useEffect } from 'react';
import { translations } from '../services/translations';
import './DailyScheduleView.css';

export default function DailyScheduleView({ 
    medications, 
    onTakeDose, 
    onSkipDose, 
    onTriggerTestReminder,
    onEditMedication,
    onDeleteMedication,
    isCaregiver = false,
    lang = 'en'
}) {
    const t = translations[lang] || translations.en;
    const [currentTimeStr, setCurrentTimeStr] = useState('');
    const [activeSlotFilter, setActiveSlotFilter] = useState('ALL'); // 'ALL' | 'MORNING' | 'AFTERNOON' | 'NIGHT'
    const [skippingMed, setSkippingMed] = useState(null);
    const [skipReason, setSkipReason] = useState('Felt unwell / nauseous');
    const [customSkipReason, setCustomSkipReason] = useState('');

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            setCurrentTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        };
        updateTime();
        const interval = setInterval(updateTime, 10000);
        return () => clearInterval(interval);
    }, []);

    // Filter active medications
    const activeMeds = medications.filter(m => m.category === 'current');

    // Categorize medications into morning, afternoon, night
    const morningMeds = activeMeds.filter(m => m.morningDose || m.frequency?.startsWith('1-'));
    const afternoonMeds = activeMeds.filter(m => m.afternoonDose || m.frequency?.includes('-1-'));
    const nightMeds = activeMeds.filter(m => m.nightDose || m.frequency?.endsWith('-1'));

    const handleSpeakInstruction = (med, slotName, slotTime) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const message = `Reminder for ${med.name}, ${med.dosage}. Scheduled for ${slotName} at ${slotTime}. ${med.mealInstruction || med.caregiverNote || 'Take with water.'}`;
            const utterance = new SpeechSynthesisUtterance(message);
            utterance.rate = 0.92;
            window.speechSynthesis.speak(utterance);
        }
    };

    const handleOpenSkipModal = (med, slotName, slotTime) => {
        setSkippingMed({ ...med, slotName, slotTime });
        setSkipReason('Felt unwell / nauseous');
        setCustomSkipReason('');
    };

    const handleConfirmSkip = () => {
        if (!skippingMed) return;
        const finalReason = skipReason === 'Other' && customSkipReason.trim()
            ? customSkipReason.trim()
            : skipReason;
        onSkipDose(skippingMed.id, finalReason, skippingMed.slotName, skippingMed.slotTime);
        setSkippingMed(null);
    };

    // Calculate 15 min prior reminder time for a given time string (e.g., "08:00")
    const get15MinPriorTime = (timeStr = "08:00") => {
        const [h, m] = timeStr.split(':').map(Number);
        let date = new Date();
        date.setHours(h, m, 0, 0);
        date.setMinutes(date.getMinutes() - 15);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const renderSlotSection = (slotKey, slotTitle, slotIcon, slotTime, slotMeds) => {
        if (activeSlotFilter !== 'ALL' && activeSlotFilter !== slotKey) return null;

        const reminderPriorTime = get15MinPriorTime(slotTime);

        return (
            <div className="schedule-slot-card" key={slotKey}>
                <div className="slot-card-header">
                    <div className="slot-header-left">
                        <span className="slot-icon-box">{slotIcon}</span>
                        <div>
                            <h3>{slotTitle}</h3>
                            <div className="slot-timing-chips">
                                <span className="time-chip">⏰ Dose Time: {slotTime}</span>
                                <span className="reminder-15m-chip">
                                    🔔 15m Prior Reminder: <strong>{reminderPriorTime}</strong>
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="slot-badge-count">
                        {slotMeds.length} {slotMeds.length === 1 ? 'Medicine' : 'Medicines'}
                    </div>
                </div>

                {slotMeds.length === 0 ? (
                    <div className="slot-empty-notice">
                        <span>✨ No medications scheduled for this time slot.</span>
                    </div>
                ) : (
                    <div className="slot-meds-grid">
                        {slotMeds.map(med => (
                            <div className="slot-med-item" key={`${slotKey}-${med.id}`}>
                                <div className="slot-med-main">
                                    <div className="med-photo">{med.photo || '💊'}</div>
                                    <div className="med-text-details">
                                        <div className="med-title-row">
                                            <h4>{med.name}</h4>
                                            <span className="freq-pill">{med.frequency || '1-0-1'}</span>
                                        </div>
                                        <div className="med-sub-dosage">{med.dosage}</div>

                                        <div className="med-meal-guide">
                                            🍽️ <strong>Meal Guide:</strong> {med.mealInstruction || med.caregiverNote || 'Take with water after meals.'}
                                        </div>

                                        {med.reason && (
                                            <div className="med-reason-tag">
                                                🩺 <em>For {med.reason}</em>
                                            </div>
                                        )}

                                        {med.interactionWarning && (
                                            <div className="interaction-caution-badge">
                                                ⚠️ {med.interactionWarning}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="slot-med-actions">
                                    <button 
                                        type="button"
                                        className="listen-tts-btn"
                                        onClick={() => handleSpeakInstruction(med, slotTitle, slotTime)}
                                        title="Listen to dosage instruction"
                                    >
                                        🔊 {t.listenBtn}
                                    </button>

                                    {onEditMedication && (
                                        <button 
                                            type="button"
                                            className="btn-edit-med"
                                            onClick={() => onEditMedication(med)}
                                            title="Edit medication regimen (Dispatches dual notifications)"
                                        >
                                            ✏️ Edit
                                        </button>
                                    )}

                                    {onDeleteMedication && (
                                        <button 
                                            type="button"
                                            className="btn-delete-med"
                                            onClick={() => onDeleteMedication(med.id, med.name)}
                                            title="Delete medication from daily schedule & database"
                                        >
                                            {t.deleteBtn || '🗑️ Delete'}
                                        </button>
                                    )}

                                    <button 
                                        type="button"
                                        className="btn-take-dose"
                                        onClick={() => onTakeDose(med.id, slotKey, slotTime)}
                                        title="Log dose as taken (-1 remaining)"
                                    >
                                        ✅ Taken
                                    </button>

                                    <button 
                                        type="button"
                                        className="btn-skip-dose"
                                        onClick={() => handleOpenSkipModal(med, slotKey, slotTime)}
                                        title="Skip dose and record reason"
                                    >
                                        ⏭️ Skip
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="daily-schedule-root">
            {/* Top Bar with Live Time & Fast 15-Min Test Trigger */}
            <div className="schedule-control-bar">
                <div className="schedule-time-meta">
                    <span className="current-clock-pill">
                        <span className="live-pulse-dot"></span> Current Time: <strong>{currentTimeStr || 'Loading...'}</strong>
                    </span>
                    <span className="reminder-rule-tag">
                        ⚡ 15-Minute Prior Alert Engine Active
                    </span>
                </div>

                <div className="schedule-filter-actions">
                    <div className="slot-filter-pills">
                        <button 
                            className={`filter-pill ${activeSlotFilter === 'ALL' ? 'active' : ''}`}
                            onClick={() => setActiveSlotFilter('ALL')}
                        >
                            All Slots
                        </button>
                        <button 
                            className={`filter-pill ${activeSlotFilter === 'MORNING' ? 'active' : ''}`}
                            onClick={() => setActiveSlotFilter('MORNING')}
                        >
                            🌅 Morning ({morningMeds.length})
                        </button>
                        <button 
                            className={`filter-pill ${activeSlotFilter === 'AFTERNOON' ? 'active' : ''}`}
                            onClick={() => setActiveSlotFilter('AFTERNOON')}
                        >
                            ☀️ Afternoon ({afternoonMeds.length})
                        </button>
                        <button 
                            className={`filter-pill ${activeSlotFilter === 'NIGHT' ? 'active' : ''}`}
                            onClick={() => setActiveSlotFilter('NIGHT')}
                        >
                            🌙 Night ({nightMeds.length})
                        </button>
                    </div>

                    {/* Demonstration Button: Trigger 15-Min Prior Reminder on Demand */}
                    {activeMeds.length > 0 && (
                        <button 
                            className="test-reminder-trigger-btn"
                            onClick={() => onTriggerTestReminder(activeMeds[0])}
                            title="Simulate what happens 15 minutes before medication time"
                        >
                            🧪 {t.test15MinAlert}
                        </button>
                    )}
                </div>
            </div>

            {/* Morning, Afternoon, Night Slots */}
            <div className="slots-container">
                {renderSlotSection('MORNING', t.morningSlot, '🌅', '08:00 AM', morningMeds)}
                {renderSlotSection('AFTERNOON', t.afternoonSlot, '☀️', '01:00 PM', afternoonMeds)}
                {renderSlotSection('NIGHT', t.nightSlot, '🌙', '08:00 PM', nightMeds)}
            </div>

            {/* Skip Reason Dialog */}
            {skippingMed && (
                <div className="skip-modal-overlay" onClick={() => setSkippingMed(null)}>
                    <div className="skip-modal-card" onClick={e => e.stopPropagation()}>
                        <div className="skip-modal-header">
                            <h3>⏭️ Skip Dose: {skippingMed.name}</h3>
                            <button className="skip-close-btn" onClick={() => setSkippingMed(null)}>✕</button>
                        </div>
                        <p className="skip-modal-desc">
                            Please select a reason for skipping this scheduled dose. Your caregiver will be updated.
                        </p>

                        <div className="skip-reasons-list">
                            {[
                                'Felt unwell / nauseous',
                                'Physician advised to pause',
                                'Missed the dose time window',
                                'Medicine currently out of stock',
                                'Experiencing mild side effects',
                                'Other'
                            ].map((reasonOption) => (
                                <label key={reasonOption} className={`reason-radio-label ${skipReason === reasonOption ? 'selected' : ''}`}>
                                    <input 
                                        type="radio" 
                                        name="skipReason"
                                        checked={skipReason === reasonOption}
                                        onChange={() => setSkipReason(reasonOption)}
                                    />
                                    <span>{reasonOption}</span>
                                </label>
                            ))}
                        </div>

                        {skipReason === 'Other' && (
                            <input 
                                type="text"
                                className="custom-reason-input"
                                placeholder="Specify custom reason..."
                                value={customSkipReason}
                                onChange={e => setCustomSkipReason(e.target.value)}
                            />
                        )}

                        <div className="skip-modal-footer">
                            <button className="cancel-skip-btn" onClick={() => setSkippingMed(null)}>Cancel</button>
                            <button className="confirm-skip-btn" onClick={handleConfirmSkip}>Record Skip & Alert Caregiver</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
