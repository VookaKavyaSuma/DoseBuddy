import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
    fetchMedicationsApi, 
    createMedicationApi, 
    takeMedicationDoseApi, 
    skipMedicationDoseApi,
    fetchDoseLogsApi,
    fetchNotificationsApi,
    markNotificationReadApi,
    deleteMedicationApi 
} from '../services/api';
import { translations } from '../services/translations';
import Navbar from './Navbar';
import MedicalDisclaimerBanner from './MedicalDisclaimerBanner';
import PrescriptionScanModal from './PrescriptionScanModal';
import EditMedicationModal from './EditMedicationModal';
import NotificationsDrawer from './NotificationsDrawer';
import DailyScheduleView from './DailyScheduleView';
import AdherenceView from './AdherenceView';
import DrugInteractionAlerts from './DrugInteractionAlerts';
import ReminderAlertModal from './ReminderAlertModal';
import CaregiverNotificationToast from './CaregiverNotificationToast';
import './DashboardView.css';

export default function DashboardView() {
    const { user, token } = useAuth();
    const isCaregiver = user?.role === 'CAREGIVER';

    // Language state: 'en', 'es', 'hi', 'fr'
    const [lang, setLang] = useState('en');
    const t = translations[lang] || translations.en;

    // Active Dashboard Tab: 'schedule' | 'adherence' | 'inventory'
    const [activeTab, setActiveTab] = useState('schedule');
    const [inventoryCategory, setInventoryCategory] = useState('current');

    // Modals & alerts
    const [showScanModal, setShowScanModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingMedication, setEditingMedication] = useState(null);
    const [showNotificationsDrawer, setShowNotificationsDrawer] = useState(false);
    const [activeReminderAlert, setActiveReminderAlert] = useState(null);
    const [caregiverAlert, setCaregiverAlert] = useState(null);

    // Data states
    const [medications, setMedications] = useState([]);
    const [doseLogs, setDoseLogs] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    // Manual add form fields
    const [newName, setNewName] = useState('');
    const [newDosage, setNewDosage] = useState('');
    const [newReason, setNewReason] = useState('');
    const [newDays, setNewDays] = useState(30);
    const [newFrequency, setNewFrequency] = useState('1-0-1');
    const [newMorning, setNewMorning] = useState(true);
    const [newAfternoon, setNewAfternoon] = useState(false);
    const [newNight, setNewNight] = useState(true);
    const [newMealNote, setNewMealNote] = useState('Take after food with water');

    // Load notifications
    const loadNotifications = useCallback(async () => {
        try {
            const data = await fetchNotificationsApi();
            if (Array.isArray(data)) {
                setNotifications(data);
            }
        } catch (e) {
            console.warn('Could not load notifications:', e);
        }
    }, []);

    // Load medications & dose logs
    const loadData = useCallback(async () => {
        try {
            setIsLoading(true);
            setLoadError(null);
            const [medsData, logsData, notifsData] = await Promise.all([
                fetchMedicationsApi(),
                fetchDoseLogsApi(),
                fetchNotificationsApi()
            ]);
            if (Array.isArray(medsData)) setMedications(medsData);
            if (Array.isArray(logsData)) setDoseLogs(logsData);
            if (Array.isArray(notifsData)) setNotifications(notifsData);
        } catch (err) {
            console.error('Failed to load data:', err);
            setLoadError('Unable to connect to DoseBuddy server. Please check your backend connection.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData, token]);

    // Request browser notification permissions on mount
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    // 15-Minute Prior Reminder Background Engine
    useEffect(() => {
        const check15MinReminders = () => {
            const now = new Date();
            const currentHours = now.getHours();
            const currentMins = now.getMinutes();
            const nowTotalMins = currentHours * 60 + currentMins;

            const activeMeds = medications.filter(m => m.category === 'current');

            activeMeds.forEach(med => {
                const checkSlot = (slotFlag, timeStr = "08:00", slotName) => {
                    if (!slotFlag) return;
                    const [h, m] = timeStr.split(':').map(Number);
                    const slotTotalMins = h * 60 + m;
                    const diff = slotTotalMins - nowTotalMins;

                    // If 15 mins prior (or within 1 min window), trigger alert
                    if (diff === 15) {
                        dispatchReminderAlert(med, slotName, timeStr);
                    }
                };

                checkSlot(med.morningDose || med.frequency?.startsWith('1-'), med.morningTime || '08:00', 'Morning');
                checkSlot(med.afternoonDose || med.frequency?.includes('-1-'), med.afternoonTime || '13:00', 'Afternoon');
                checkSlot(med.nightDose || med.frequency?.endsWith('-1'), med.nightTime || '20:00', 'Night');
            });
        };

        const interval = setInterval(check15MinReminders, 60000);
        return () => clearInterval(interval);
    }, [medications]);

    const dispatchReminderAlert = (med, slotName, slotTime) => {
        const reminderPayload = {
            ...med,
            timeSlotName: slotName,
            timeSlotTime: slotTime
        };
        setActiveReminderAlert(reminderPayload);

        // Browser push notification
        if ('Notification' in window && Notification.permission === 'granted') {
            try {
                new Notification('⏰ DoseBuddy: 15-Minute Medication Reminder', {
                    body: `${med.name} (${med.dosage}) is scheduled for ${slotName} at ${slotTime}. Time to prepare water & food!`,
                    icon: '/favicon.svg'
                });
            } catch (e) {
                console.warn('Browser notification error:', e);
            }
        }
    };

    // Trigger test reminder on demand (for instant testing by the user)
    const handleTriggerTestReminder = (med) => {
        if (!med) {
            alert('No active medication available to simulate. Please add or scan a prescription first.');
            return;
        }
        dispatchReminderAlert(med, 'Morning', '08:00 AM');
    };

    // Handle Log Taken
    const handleTakeDose = async (id, timeSlot = 'TODAY', scheduledTime = '') => {
        try {
            const result = await takeMedicationDoseApi(id, timeSlot, scheduledTime);
            const updatedMed = result.medication || result;
            setMedications(prev => prev.map(m => m.id === id ? updatedMed : m));
            if (result.doseLog) {
                setDoseLogs(prev => [result.doseLog, ...prev]);
            }
            if (activeReminderAlert?.id === id) {
                setActiveReminderAlert(null);
            }

            // Simulate caregiver notification
            setCaregiverAlert({
                type: 'take',
                message: `${user?.fullName || 'Robert Jenkins'} logged dose taken: ${updatedMed.name} (${timeSlot})`,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });

            // Check if stock is low
            if (updatedMed.remainingDoses <= 5) {
                setTimeout(() => {
                    setCaregiverAlert({
                        type: 'refill',
                        message: `Low stock alert dispatched to caregiver: ${updatedMed.name} has only ${updatedMed.remainingDoses} doses left.`,
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    });
                }, 3000);
            }
        } catch (err) {
            console.error('Error logging dose taken:', err);
            alert('Failed to log dose. Please check connection.');
        }
    };

    // Handle Skip Dose with Reason
    const handleSkipDose = async (id, reason = 'Patient skipped dose', timeSlot = 'TODAY', scheduledTime = '') => {
        try {
            const result = await skipMedicationDoseApi(id, reason, timeSlot, scheduledTime);
            if (result.doseLog) {
                setDoseLogs(prev => [result.doseLog, ...prev]);
            }
            if (activeReminderAlert?.id === id) {
                setActiveReminderAlert(null);
            }

            const medName = result.medication?.name || 'Medication';
            setCaregiverAlert({
                type: 'skip',
                message: `Dose Skipped by ${user?.fullName || 'Robert Jenkins'}: ${medName} (${timeSlot}). Reason: "${reason}"`,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
            loadNotifications();
        } catch (err) {
            console.error('Error logging skipped dose:', err);
            alert('Failed to record skipped dose.');
        }
    };

    // Handle Medication Edited by Caregiver
    const handleMedicationUpdated = (response) => {
        const updated = response.medication || response;
        setMedications(prev => prev.map(m => m.id === updated.id ? updated : m));
        loadNotifications();

        // Dual notification toast
        setCaregiverAlert({
            type: 'info',
            message: `Changes to ${updated.name} saved! Dispatched notifications to both Caregiver (Sarah) and Patient (Robert).`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });

        // Browser desktop notification
        if ('Notification' in window && Notification.permission === 'granted') {
            try {
                new Notification('🔔 DoseBuddy: Medication Updated', {
                    body: `Caregiver updated ${updated.name} (${updated.dosage}, ${updated.frequency}). Daily schedule synced.`,
                    icon: '/favicon.svg'
                });
            } catch (e) {
                console.warn('Notification error:', e);
            }
        }

        // Voice announcement for patient if not caregiver
        if ('speechSynthesis' in window && !isCaregiver) {
            window.speechSynthesis.cancel();
            const ut = new SpeechSynthesisUtterance(`Notice: Your caregiver has updated your medication schedule for ${updated.name}.`);
            window.speechSynthesis.speak(ut);
        }
    };

    const handleMarkNotificationRead = async (notifId) => {
        await markNotificationReadApi(notifId);
        setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, isRead: true } : n));
    };

    // Handle Manual Medication Creation
    const handleCreateMedication = async (e) => {
        e.preventDefault();
        if (!newName.trim()) {
            alert('Please enter a medication name.');
            return;
        }

        setIsSaving(true);
        const medPayload = {
            name: newName.trim(),
            dosage: newDosage.trim() || '1 Tablet Daily',
            reason: newReason.trim() || 'General health prescription',
            photo: '💊',
            category: 'current',
            totalDays: parseInt(newDays) || 30,
            remainingDoses: parseInt(newDays) || 30,
            nextDose: newMorning ? 'Morning (08:00 AM)' : 'Night (08:00 PM)',
            caregiverNote: newMealNote.trim() || 'Take as instructed.',
            userId: user?.id || 'usr_caregiver_1',
            frequency: newFrequency,
            morningDose: Boolean(newMorning),
            afternoonDose: Boolean(newAfternoon),
            nightDose: Boolean(newNight),
            morningTime: '08:00',
            afternoonTime: '13:00',
            nightTime: '20:00',
            mealInstruction: newMealNote.trim()
        };

        try {
            const saved = await createMedicationApi(medPayload);
            setMedications(prev => [saved, ...prev]);
            setShowAddModal(false);
            // Reset form
            setNewName('');
            setNewDosage('');
            setNewReason('');
            setNewDays(30);
            setNewMealNote('Take after food with water');
        } catch (err) {
            console.error('Error saving medication:', err);
            alert('Failed to save medication: ' + (err.message || 'Please check connection.'));
        } finally {
            setIsSaving(false);
        }
    };

    // Callback when prescriptions are scanned & confirmed
    const handleMedicationsAdded = (newMeds) => {
        if (Array.isArray(newMeds)) {
            setMedications(prev => [...newMeds, ...prev]);
        }
        setActiveTab('schedule');
        setCaregiverAlert({
            type: 'info',
            message: `Scanned prescription successfully confirmed! ${newMeds.length} medications added to daily schedule.`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
    };

    const handleDeleteMedication = async (id, name) => {
        if (!window.confirm(`Are you sure you want to delete "${name}" from your active prescriptions?\n\nThis will remove it from all daily schedules (Morning, Afternoon, Night) and notify both Patient and Caregiver.`)) {
            return;
        }
        try {
            await deleteMedicationApi(id);
            setMedications(prev => prev.filter(m => m.id !== id));
            if (editingMedication && editingMedication.id === id) {
                setEditingMedication(null);
            }
            await loadNotifications();

            setCaregiverAlert({
                id: Date.now(),
                type: 'warning',
                message: `Medication "${name}" removed. Dispatched update alerts to both Caregiver (Sarah) and Patient (Robert).`,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });

            if ('Notification' in window && Notification.permission === 'granted') {
                try {
                    new Notification('🗑️ DoseBuddy: Medication Removed', {
                        body: `${name} has been removed from the schedule. Both Caregiver and Patient notified.`,
                        icon: '/favicon.svg'
                    });
                } catch (e) {
                    console.warn('Notification error:', e);
                }
            }
        } catch (err) {
            console.error('Failed to delete medication:', err);
            alert('Failed to delete medication. Please try again.');
        }
    };

    const activeMeds = medications.filter(m => m.category === 'current');
    const pastMeds = medications.filter(m => m.category === 'past');
    const displayedInventory = inventoryCategory === 'current' ? activeMeds : pastMeds;
    const unreadNotificationsCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="dashboard-page">
            <Navbar 
                lang={lang} 
                onLanguageChange={setLang}
                notificationsCount={unreadNotificationsCount}
                onOpenNotifications={() => setShowNotificationsDrawer(true)}
            />

            <main className="dashboard-content">
                {/* 1. VISIBLE MEDICAL DISCLAIMER BANNER */}
                <MedicalDisclaimerBanner lang={lang} />

                {/* 2. WELCOME BANNER & SCAN ACTION */}
                <div className="welcome-banner">
                    <div className="banner-left">
                        <div className="banner-chips-row">
                            <span className="auth-status-chip">
                                <span className="pulse-dot"></span> JWT Session Active
                            </span>
                            <span className="engine-chip">
                                ⚡ 15-Minute Prior Reminder Engine Active
                            </span>
                            <span className="sync-chip">
                                📲 Dual Caregiver-Patient Sync Active
                            </span>
                        </div>
                        <h1>
                            {isCaregiver ? t.welcomeCaregiver : t.welcomePatient} {user?.fullName ? `(${user.fullName})` : ''}
                        </h1>
                        <p>
                            {isCaregiver ? t.caregiverSub : t.patientSub}
                        </p>
                    </div>

                    <div className="banner-cta-group">
                        <button 
                            className="scan-hero-btn" 
                            onClick={() => setShowScanModal(true)}
                            title="Scan handwritten doctor prescription with AI OCR"
                        >
                            <span className="btn-sparkle">✨</span>
                            <span>{t.scanPrescriptionBtn}</span>
                        </button>

                        {isCaregiver && (
                            <button 
                                className="add-manual-btn" 
                                onClick={() => setShowAddModal(true)}
                                title="Add medication manually"
                            >
                                <span>{t.manualAddBtn}</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* 3. MAIN TAB NAVIGATION */}
                <div className="dashboard-tabs-bar">
                    <button 
                        className={`dash-tab ${activeTab === 'schedule' ? 'active' : ''}`}
                        onClick={() => setActiveTab('schedule')}
                    >
                        {t.tabSchedule}
                    </button>

                    <button 
                        className={`dash-tab ${activeTab === 'adherence' ? 'active' : ''}`}
                        onClick={() => setActiveTab('adherence')}
                    >
                        {t.tabAdherence} ({doseLogs.length})
                    </button>

                    <button 
                        className={`dash-tab ${activeTab === 'inventory' ? 'active' : ''}`}
                        onClick={() => setActiveTab('inventory')}
                    >
                        {t.tabInventory} ({activeMeds.length})
                    </button>
                </div>

                {/* ERROR BANNER */}
                {loadError && (
                    <div className="meds-error-banner">
                        <span>⚠️ {loadError}</span>
                        <button onClick={loadData} className="retry-btn">Retry Connection</button>
                    </div>
                )}

                {/* TAB 1: DAILY SCHEDULE VIEW (SPLIT BY MORNING, AFTERNOON, NIGHT) */}
                {activeTab === 'schedule' && (
                    <div className="tab-pane-schedule">
                        {/* Drug Interaction Alerts Banner */}
                        <DrugInteractionAlerts medications={medications} />

                        {isLoading ? (
                            <div className="meds-empty-state">
                                <div className="meds-spinner"></div>
                                <p>Loading schedule from database...</p>
                            </div>
                        ) : activeMeds.length === 0 ? (
                            <div className="meds-empty-state">
                                <div className="empty-icon">📸</div>
                                <h3>No Medications Scheduled Yet</h3>
                                <p>
                                    Scan your doctor's written prescription slip or click below to test with sample presets!
                                </p>
                                <button className="empty-cta-btn" onClick={() => setShowScanModal(true)}>
                                    📸 Scan Prescription Slip Now
                                </button>
                            </div>
                        ) : (
                            <DailyScheduleView 
                                medications={medications}
                                onTakeDose={handleTakeDose}
                                onSkipDose={handleSkipDose}
                                onTriggerTestReminder={handleTriggerTestReminder}
                                onEditMedication={(med) => setEditingMedication(med)}
                                onDeleteMedication={handleDeleteMedication}
                                isCaregiver={isCaregiver}
                                lang={lang}
                            />
                        )}
                    </div>
                )}

                {/* TAB 2: TODAY'S ADHERENCE VIEW */}
                {activeTab === 'adherence' && (
                    <div className="tab-pane-adherence">
                        <AdherenceView 
                            doseLogs={doseLogs} 
                            medications={medications} 
                        />
                    </div>
                )}

                {/* TAB 3: PRESCRIPTION INVENTORY */}
                {activeTab === 'inventory' && (
                    <div className="tab-pane-inventory">
                        <div className="inventory-header">
                            <div className="folder-tabs">
                                <button
                                    className={`folder-tab ${inventoryCategory === 'current' ? 'active' : ''}`}
                                    onClick={() => setInventoryCategory('current')}
                                >
                                    🟢 Current Active Prescriptions ({activeMeds.length})
                                </button>
                                <button
                                    className={`folder-tab ${inventoryCategory === 'past' ? 'active' : ''}`}
                                    onClick={() => setInventoryCategory('past')}
                                >
                                    📁 Past Completed Prescriptions ({pastMeds.length})
                                </button>
                            </div>
                        </div>

                        {displayedInventory.length === 0 ? (
                            <div className="meds-empty-state">
                                <div className="empty-icon">{inventoryCategory === 'current' ? '💊' : '📁'}</div>
                                <h3>{inventoryCategory === 'current' ? 'No Active Prescriptions in Inventory' : 'No Completed Prescriptions'}</h3>
                                <p>
                                    {inventoryCategory === 'current'
                                        ? 'No active medications stored. Click "📸 Scan Prescription" above to populate.'
                                        : 'No archived prescriptions found.'}
                                </p>
                            </div>
                        ) : (
                            <div className="meds-grid">
                                {displayedInventory.map(med => (
                                    <div className="med-card" key={med.id}>
                                        <div className="med-card-header">
                                            <div className="med-icon-box">{med.photo || '💊'}</div>
                                            <div className="med-title-group">
                                                <h3>{med.name}</h3>
                                                <span className="med-reason">{med.reason}</span>
                                            </div>
                                            <div className="inventory-card-actions">
                                                <button 
                                                    className="edit-med-icon-btn" 
                                                    title="Edit medication regimen (Dispatches dual notifications)"
                                                    onClick={() => setEditingMedication(med)}
                                                >
                                                    ✏️
                                                </button>
                                                <button 
                                                    className="delete-med-btn" 
                                                    title="Delete medication from database"
                                                    onClick={() => handleDeleteMedication(med.id, med.name)}
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>

                                        <div className="med-details">
                                            <div className="detail-row">
                                                <span className="detail-label">Exact Dosage:</span>
                                                <span className="detail-value">{med.dosage}</span>
                                            </div>
                                            <div className="detail-row">
                                                <span className="detail-label">Frequency:</span>
                                                <span className="detail-value frequency-tag">{med.frequency || '1-0-1'}</span>
                                            </div>
                                            <div className="detail-row">
                                                <span className="detail-label">Meal Timing:</span>
                                                <span className="detail-value">{med.mealInstruction || med.caregiverNote || 'Take with water'}</span>
                                            </div>
                                        </div>

                                        <div className="med-inventory-bar">
                                            <div className="inventory-info">
                                                <span>Inventory Remaining</span>
                                                <span className={`inventory-count ${med.remainingDoses <= 5 ? 'low' : ''}`}>
                                                    {med.remainingDoses} doses left
                                                </span>
                                            </div>
                                            <div className="progress-track">
                                                <div
                                                    className={`progress-fill ${med.remainingDoses <= 5 ? 'low' : ''}`}
                                                    style={{ width: `${Math.min(100, (med.remainingDoses / (med.totalDays || 30)) * 100)}%` }}
                                                ></div>
                                            </div>

                                            {/* REFILL ALERT */}
                                            {med.remainingDoses <= 5 && med.category === 'current' && (
                                                <div className="refill-warning">
                                                    {t.refillWarning}
                                                </div>
                                            )}

                                            {med.category === 'current' && (
                                                <button
                                                    className="take-dose-btn"
                                                    onClick={() => handleTakeDose(med.id, 'Inventory Quick Log')}
                                                >
                                                    ✅ Log Dose Taken (-1)
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* EDIT MEDICATION MODAL (CAREGIVER) */}
            <EditMedicationModal 
                isOpen={Boolean(editingMedication)}
                medication={editingMedication}
                onClose={() => setEditingMedication(null)}
                onSaved={handleMedicationUpdated}
                onDelete={handleDeleteMedication}
            />

            {/* NOTIFICATIONS DRAWER (DUAL PATIENT & CAREGIVER) */}
            <NotificationsDrawer 
                isOpen={showNotificationsDrawer}
                onClose={() => setShowNotificationsDrawer(false)}
                notifications={notifications}
                onMarkRead={handleMarkNotificationRead}
                userRole={user?.role || 'CAREGIVER'}
            />

            {/* PRESCRIPTION SCANNER MODAL */}
            <PrescriptionScanModal 
                isOpen={showScanModal}
                onClose={() => setShowScanModal(false)}
                onMedicationsAdded={handleMedicationsAdded}
            />

            {/* 15-MINUTE PRIOR REMINDER ALERT MODAL */}
            <ReminderAlertModal 
                reminder={activeReminderAlert}
                onTake={(rem) => handleTakeDose(rem.id, rem.timeSlotName, rem.timeSlotTime)}
                onSkip={(rem) => handleSkipDose(rem.id, 'Skipped from alert modal', rem.timeSlotName, rem.timeSlotTime)}
                onClose={() => setActiveReminderAlert(null)}
            />

            {/* CAREGIVER NOTIFICATION TOAST */}
            <CaregiverNotificationToast 
                alert={caregiverAlert}
                onClose={() => setCaregiverAlert(null)}
            />

            {/* MANUAL ADD MEDICATION MODAL */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal-card" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>📸 Add New Medication (Caregiver Manual Entry)</h2>
                            <button className="close-btn" onClick={() => setShowAddModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleCreateMedication} className="modal-body">
                            <p>Manual Caregiver Pill Entry for 100% Accuracy & MySQL Inventory Tracking.</p>
                            <div className="modal-form-group">
                                <label>Medicine Name *</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Lisinopril 10mg"
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="modal-form-group">
                                <label>Dosage Instructions</label>
                                <input
                                    type="text"
                                    placeholder="e.g. 10mg - 1 Tablet Daily"
                                    value={newDosage}
                                    onChange={e => setNewDosage(e.target.value)}
                                />
                            </div>
                            <div className="modal-form-group">
                                <label>Frequency Notation</label>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <input
                                        type="text"
                                        placeholder="1-0-1"
                                        value={newFrequency}
                                        onChange={e => setNewFrequency(e.target.value)}
                                        style={{ width: '100px' }}
                                    />
                                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                        (Morning - Afternoon - Night)
                                    </span>
                                </div>
                            </div>
                            <div className="modal-form-group">
                                <label>Daily Slots</label>
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.35rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={newMorning} onChange={e => setNewMorning(e.target.checked)} />
                                        🌅 Morning (08:00 AM)
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={newAfternoon} onChange={e => setNewAfternoon(e.target.checked)} />
                                        ☀️ Afternoon (01:00 PM)
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={newNight} onChange={e => setNewNight(e.target.checked)} />
                                        🌙 Night (08:00 PM)
                                    </label>
                                </div>
                            </div>
                            <div className="modal-form-group">
                                <label>Meal & Food Instruction</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Take after breakfast with water"
                                    value={newMealNote}
                                    onChange={e => setNewMealNote(e.target.value)}
                                />
                            </div>
                            <div className="modal-form-group">
                                <label>Simple Reason (e.g. "for blood pressure")</label>
                                <input
                                    type="text"
                                    placeholder="e.g. For Blood Pressure Control"
                                    value={newReason}
                                    onChange={e => setNewReason(e.target.value)}
                                />
                            </div>
                            <div className="modal-form-group">
                                <label>Total Days Duration</label>
                                <input
                                    type="number"
                                    min="1"
                                    placeholder="30"
                                    value={newDays}
                                    onChange={e => setNewDays(e.target.value)}
                                />
                            </div>
                            <button
                                type="submit"
                                className="modal-submit-btn"
                                disabled={isSaving}
                            >
                                {isSaving ? 'Saving to Database...' : 'Save Medication to MySQL'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
