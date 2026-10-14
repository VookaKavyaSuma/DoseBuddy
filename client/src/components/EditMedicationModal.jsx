import React, { useState, useEffect } from 'react';
import { updateMedicationApi } from '../services/api';
import './EditMedicationModal.css';

export default function EditMedicationModal({ medication, isOpen, onClose, onSaved, onDelete }) {
    if (!isOpen || !medication) return null;

    const [name, setName] = useState('');
    const [dosage, setDosage] = useState('');
    const [frequency, setFrequency] = useState('1-0-1');
    const [morning, setMorning] = useState(true);
    const [afternoon, setAfternoon] = useState(false);
    const [night, setNight] = useState(true);
    const [morningTime, setMorningTime] = useState('08:00');
    const [afternoonTime, setAfternoonTime] = useState('13:00');
    const [nightTime, setNightTime] = useState('20:00');
    const [mealInstruction, setMealInstruction] = useState('');
    const [reason, setReason] = useState('');
    const [remainingDoses, setRemainingDoses] = useState(30);
    const [totalDays, setTotalDays] = useState(30);
    const [caregiverNote, setCaregiverNote] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleDelete = () => {
        if (!onDelete || !medication) return;
        if (window.confirm(`Are you sure you want to permanently delete "${medication.name}"?\n\nThis will remove it from all schedules (Morning, Afternoon, Night) and notify both Patient and Caregiver.`)) {
            onDelete(medication.id, medication.name);
            onClose();
        }
    };

    useEffect(() => {
        if (medication) {
            setName(medication.name || '');
            setDosage(medication.dosage || '');
            setFrequency(medication.frequency || '1-0-1');
            setMorning(Boolean(medication.morningDose || medication.frequency?.startsWith('1-')));
            setAfternoon(Boolean(medication.afternoonDose || medication.frequency?.includes('-1-')));
            setNight(Boolean(medication.nightDose || medication.frequency?.endsWith('-1')));
            setMorningTime(medication.morningTime || '08:00');
            setAfternoonTime(medication.afternoonTime || '13:00');
            setNightTime(medication.nightTime || '20:00');
            setMealInstruction(medication.mealInstruction || medication.caregiverNote || 'Take after meals with water');
            setReason(medication.reason || '');
            setRemainingDoses(medication.remainingDoses || 30);
            setTotalDays(medication.totalDays || 30);
            setCaregiverNote(medication.caregiverNote || '');
        }
    }, [medication]);

    const handleFrequencyPreset = (freqStr) => {
        const parts = freqStr.split('-');
        const m = parts[0] === '1';
        const a = parts[1] === '1';
        const n = parts[2] === '1';
        setFrequency(freqStr);
        setMorning(m);
        setAfternoon(a);
        setNight(n);
    };

    const handleSlotToggle = (slot, checked) => {
        let m = slot === 'morning' ? checked : morning;
        let a = slot === 'afternoon' ? checked : afternoon;
        let n = slot === 'night' ? checked : night;

        if (slot === 'morning') setMorning(checked);
        if (slot === 'afternoon') setAfternoon(checked);
        if (slot === 'night') setNight(checked);

        setFrequency(`${m ? '1' : '0'}-${a ? '1' : '0'}-${n ? '1' : '0'}`);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) {
            setErrorMsg('Medicine name is required.');
            return;
        }

        setIsSaving(true);
        setErrorMsg('');

        const payload = {
            name: name.trim(),
            dosage: dosage.trim() || '1 Tablet Daily',
            frequency,
            morningDose: morning,
            afternoonDose: afternoon,
            nightDose: night,
            morningTime,
            afternoonTime,
            nightTime,
            mealInstruction: mealInstruction.trim(),
            reason: reason.trim(),
            remainingDoses: parseInt(remainingDoses) || 30,
            totalDays: parseInt(totalDays) || 30,
            caregiverNote: caregiverNote.trim(),
            nextDose: morning ? `Morning (${morningTime})` : `Night (${nightTime})`
        };

        try {
            const response = await updateMedicationApi(medication.id, payload);
            if (onSaved) {
                onSaved(response);
            }
            onClose();
        } catch (err) {
            setErrorMsg(err.message || 'Failed to save medication changes.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="edit-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
            <div className="edit-modal-card" onClick={e => e.stopPropagation()}>
                <div className="edit-modal-header">
                    <div className="edit-header-title">
                        <span className="edit-badge">✏️ CAREGIVER EDIT</span>
                        <h2>Edit Medication Schedule & Regimen</h2>
                    </div>
                    <button className="edit-close-btn" onClick={onClose} title="Close">✕</button>
                </div>

                {/* Dual Notification Mandatory Notice */}
                <div className="dual-notification-notice">
                    <div className="dual-notice-icon">📲🔔</div>
                    <div className="dual-notice-text">
                        <strong>Dual Notification Delivery Guarantee:</strong> Saving changes will immediately dispatch synchronized update alerts to <strong>BOTH Caregiver (Sarah Jenkins)</strong> and <strong>Patient (Robert Jenkins)</strong> with an exact summary of modifications.
                    </div>
                </div>

                {errorMsg && (
                    <div className="edit-error-banner">⚠️ {errorMsg}</div>
                )}

                <form onSubmit={handleSubmit} className="edit-form-body">
                    <div className="edit-grid-2col">
                        <div className="edit-form-group">
                            <label>Medicine Name & Brand *</label>
                            <input 
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="e.g. Metformin HCl 500mg"
                                required
                            />
                        </div>

                        <div className="edit-form-group">
                            <label>Dosage & Strength</label>
                            <input 
                                type="text"
                                value={dosage}
                                onChange={e => setDosage(e.target.value)}
                                placeholder="e.g. 500mg - 1 Tablet"
                            />
                        </div>
                    </div>

                    <div className="edit-form-group">
                        <label>Frequency Shorthand</label>
                        <div className="freq-selector-row">
                            <input 
                                type="text"
                                className="freq-input-short"
                                value={frequency}
                                onChange={e => setFrequency(e.target.value)}
                            />
                            <div className="freq-pills-row">
                                {['1-0-1', '1-0-0', '0-0-1', '1-1-1'].map(fp => (
                                    <button 
                                        type="button"
                                        key={fp}
                                        className={`freq-chip ${frequency === fp ? 'active' : ''}`}
                                        onClick={() => handleFrequencyPreset(fp)}
                                    >
                                        {fp}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="edit-form-group">
                        <label>Daily Slots & Exact Reminder Times</label>
                        <div className="slots-timing-row">
                            <div className={`slot-time-box ${morning ? 'active' : ''}`}>
                                <label className="slot-check-lbl">
                                    <input 
                                        type="checkbox" 
                                        checked={morning}
                                        onChange={e => handleSlotToggle('morning', e.target.checked)}
                                    />
                                    🌅 Morning Slot
                                </label>
                                <input 
                                    type="time" 
                                    className="slot-time-input"
                                    value={morningTime}
                                    onChange={e => setMorningTime(e.target.value)}
                                    disabled={!morning}
                                />
                            </div>

                            <div className={`slot-time-box ${afternoon ? 'active' : ''}`}>
                                <label className="slot-check-lbl">
                                    <input 
                                        type="checkbox" 
                                        checked={afternoon}
                                        onChange={e => handleSlotToggle('afternoon', e.target.checked)}
                                    />
                                    ☀️ Afternoon Slot
                                </label>
                                <input 
                                    type="time" 
                                    className="slot-time-input"
                                    value={afternoonTime}
                                    onChange={e => setAfternoonTime(e.target.value)}
                                    disabled={!afternoon}
                                />
                            </div>

                            <div className={`slot-time-box ${night ? 'active' : ''}`}>
                                <label className="slot-check-lbl">
                                    <input 
                                        type="checkbox" 
                                        checked={night}
                                        onChange={e => handleSlotToggle('night', e.target.checked)}
                                    />
                                    🌙 Night Slot
                                </label>
                                <input 
                                    type="time" 
                                    className="slot-time-input"
                                    value={nightTime}
                                    onChange={e => setNightTime(e.target.value)}
                                    disabled={!night}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="edit-form-group">
                        <label>Meal & Food Ingestion Instructions</label>
                        <input 
                            type="text"
                            value={mealInstruction}
                            onChange={e => setMealInstruction(e.target.value)}
                            placeholder="e.g. Take with water after breakfast"
                        />
                    </div>

                    <div className="edit-grid-2col">
                        <div className="edit-form-group">
                            <label>Medical Indication / Purpose</label>
                            <input 
                                type="text"
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                                placeholder="e.g. Type 2 Diabetes Blood Sugar"
                            />
                        </div>

                        <div className="edit-form-group">
                            <label>Remaining Doses in Pillbox</label>
                            <input 
                                type="number"
                                min="0"
                                value={remainingDoses}
                                onChange={e => setRemainingDoses(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="edit-form-group">
                        <label>Caregiver Notes (Visible to Patient)</label>
                        <input 
                            type="text"
                            value={caregiverNote}
                            onChange={e => setCaregiverNote(e.target.value)}
                            placeholder="e.g. Doctor said to take with plenty of fluids."
                        />
                    </div>

                    <div className="edit-modal-footer">
                        {onDelete ? (
                            <button 
                                type="button" 
                                className="delete-modal-btn" 
                                onClick={handleDelete}
                                disabled={isSaving}
                                title="Permanently delete this medication"
                            >
                                🗑️ Delete Medication
                            </button>
                        ) : <div />}

                        <div className="edit-modal-actions-right">
                            <button type="button" className="cancel-edit-btn" onClick={onClose} disabled={isSaving}>
                                Cancel
                            </button>

                            <button type="submit" className="save-edit-btn" disabled={isSaving}>
                                {isSaving ? 'Updating & Sending Alerts...' : '💾 Save & Dispatch Notifications'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
