import React, { useState, useRef } from 'react';
import { scanPrescriptionApi, createBatchMedicationsApi } from '../services/api';
import './PrescriptionScanModal.css';

export default function PrescriptionScanModal({ isOpen, onClose, onMedicationsAdded }) {
    if (!isOpen) return null;

    const [step, setStep] = useState('upload'); // 'upload' | 'scanning' | 'confirm'
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [selectedPresetId, setSelectedPresetId] = useState('sample_messy_rx_1');
    const [scanProgress, setScanProgress] = useState(0);
    const [scanStageText, setScanStageText] = useState('');
    const [scanResult, setScanResult] = useState(null);
    const [editableMeds, setEditableMeds] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null);

    const presets = [
        {
            id: 'sample_messy_rx_1',
            title: 'Messy Rx #1: Senior Cardiac & Diabetes Regimen',
            doctor: 'Dr. Arvind Sharma, MD (Internal Medicine)',
            summary: 'Metformin 500mg (1-0-1), Amlodipine 5mg (0-0-1), Atorvastatin 20mg (0-0-1)',
            clarity: 'Heavy Cursive Handwriting • Slanted Ink',
            badge: 'Senior Care'
        },
        {
            id: 'sample_messy_rx_2',
            title: 'Messy Rx #2: Post-Op Antibiotic & Pain Course',
            doctor: 'Dr. Eleanor Vance, MS (Orthopedics)',
            summary: 'Amoxicillin 500mg (1-1-1), Pantoprazole 40mg (1-0-0 AC), Paracetamol 650mg (1-0-1 SOS)',
            clarity: 'Rapid Surgical Script • Latin Abbreviations',
            badge: 'Post-Surgery'
        },
        {
            id: 'sample_messy_rx_3',
            title: 'Messy Rx #3: Respiratory & Allergy Regimen',
            doctor: 'Dr. Marcus Brody, MD (Pulmonology)',
            summary: 'Montelukast + Levocetirizine (0-0-1), Vitamin D3 (1-0-0 Weekly)',
            clarity: 'Clinic Doctor Note • Shorthand Instructions',
            badge: 'Respiratory'
        }
    ];

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setSelectedPresetId('');
            if (file.type.startsWith('image/')) {
                setPreviewUrl(URL.createObjectURL(file));
            } else {
                setPreviewUrl(null);
            }
        }
    };

    const handleStartScan = async (presetIdToUse = null) => {
        const preset = presetIdToUse || selectedPresetId;
        setStep('scanning');
        setErrorMessage('');
        setScanProgress(10);
        setScanStageText('Preprocessing prescription slip & filtering handwriting noise...');

        const p1 = setTimeout(() => {
            setScanProgress(40);
            setScanStageText('Deciphering doctor cursive handwriting & clinical abbreviations (1-0-1, PC, AC)...');
        }, 600);

        const p2 = setTimeout(() => {
            setScanProgress(75);
            setScanStageText('Cross-referencing medication database & extracting dosages...');
        }, 1200);

        try {
            const result = await scanPrescriptionApi(selectedFile, preset);
            clearTimeout(p1);
            clearTimeout(p2);
            setScanProgress(100);
            setScanStageText('Analysis complete! Preparing review sheet...');

            setTimeout(() => {
                setScanResult(result);
                setEditableMeds(result.medications.map(m => ({
                    ...m,
                    photo: '💊',
                    category: 'current',
                    totalDays: m.durationDays || 30,
                    remainingDoses: m.durationDays || 30,
                    nextDose: m.morning ? `Today at ${m.morningTime || '08:00 AM'}` : `Today at ${m.nightTime || '08:00 PM'}`,
                    caregiverNote: m.notes || m.mealInstruction || 'Take as directed.'
                })));
                setStep('confirm');
            }, 600);
        } catch (err) {
            clearTimeout(p1);
            clearTimeout(p2);
            setStep('upload');
            setErrorMessage(err.message || 'Prescription scan failed. Please try again.');
        }
    };

    const handleMedChange = (index, field, value) => {
        setEditableMeds(prev => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };
            
            // Auto update frequency if toggles change
            if (field === 'morning' || field === 'afternoon' || field === 'night') {
                const m = field === 'morning' ? value : next[index].morning;
                const a = field === 'afternoon' ? value : next[index].afternoon;
                const n = field === 'night' ? value : next[index].night;
                next[index].frequency = `${m ? '1' : '0'}-${a ? '1' : '0'}-${n ? '1' : '0'}`;
            }

            return next;
        });
    };

    const handleFrequencyPreset = (index, freqStr) => {
        const parts = freqStr.split('-');
        const m = parts[0] === '1';
        const a = parts[1] === '1';
        const n = parts[2] === '1';
        setEditableMeds(prev => {
            const next = [...prev];
            next[index] = {
                ...next[index],
                frequency: freqStr,
                morning: m,
                afternoon: a,
                night: n
            };
            return next;
        });
    };

    const handleDeleteMed = (index) => {
        setEditableMeds(prev => prev.filter((_, i) => i !== index));
    };

    const handleAddEmptyMed = () => {
        setEditableMeds(prev => [
            ...prev,
            {
                name: 'New Medicine',
                dosage: '1 Tablet Daily',
                frequency: '1-0-1',
                morning: true,
                afternoon: false,
                night: true,
                morningTime: '08:00',
                afternoonTime: '13:00',
                nightTime: '20:00',
                mealInstruction: 'Take after meals with water',
                reason: 'Prescribed condition',
                totalDays: 30,
                remainingDoses: 30,
                photo: '💊',
                category: 'current',
                nextDose: 'Today at 08:00 AM',
                caregiverNote: 'Take with water.'
            }
        ]);
    };

    const handleConfirmAndSchedule = async () => {
        if (editableMeds.length === 0) {
            alert('Please keep at least one medication in the schedule.');
            return;
        }

        setIsSaving(true);
        try {
            // Convert to backend medication entities
            const payload = editableMeds.map(m => ({
                name: m.name,
                dosage: m.dosage,
                reason: m.reason || 'Prescription',
                photo: m.photo || '💊',
                category: 'current',
                totalDays: parseInt(m.totalDays) || 30,
                remainingDoses: parseInt(m.remainingDoses) || 30,
                nextDose: m.morning ? `Morning (${m.morningTime || '08:00 AM'})` : `Night (${m.nightTime || '08:00 PM'})`,
                caregiverNote: m.caregiverNote || m.mealInstruction || '',
                frequency: m.frequency || '1-0-1',
                morningDose: Boolean(m.morning),
                afternoonDose: Boolean(m.afternoon),
                nightDose: Boolean(m.night),
                morningTime: m.morningTime || '08:00',
                afternoonTime: m.afternoonTime || '13:00',
                nightTime: m.nightTime || '20:00',
                mealInstruction: m.mealInstruction || 'After food with water',
                interactionWarning: m.interactionWarning || ''
            }));

            const saved = await createBatchMedicationsApi(payload);
            if (onMedicationsAdded) {
                onMedicationsAdded(saved);
            }
            onClose();
        } catch (err) {
            alert('Error saving confirmed medications: ' + (err.message || 'Please check connection.'));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="scan-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
            <div className="scan-modal-card" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="scan-modal-header">
                    <div className="modal-header-left">
                        <span className="scan-icon-badge">📸 AI OCR</span>
                        <div>
                            <h2>Prescription Scanner & Handwritten OCR</h2>
                            <p className="scan-subtitle">
                                Decodes messy doctor handwriting, parses "1-0-1" timings, and auto-schedules gentle reminders.
                            </p>
                        </div>
                    </div>
                    <button className="scan-close-btn" onClick={onClose} title="Close scanner">✕</button>
                </div>

                {errorMessage && (
                    <div className="scan-error-alert">
                        <span>⚠️ {errorMessage}</span>
                    </div>
                )}

                {/* STEP 1: UPLOAD / PRESET SELECTION */}
                {step === 'upload' && (
                    <div className="scan-step-upload">
                        {/* Dummy Prescription Sample Selector */}
                        <div className="sample-presets-section">
                            <div className="section-title-row">
                                <span className="step-number">1</span>
                                <h3>Select a Sample Messy Prescription (Instant 1-Click Test)</h3>
                            </div>
                            <p className="section-desc">
                                As required for patient safety, you can test with these realistic messy handwritten prescription presets without uploading real patient data:
                            </p>

                            <div className="presets-grid">
                                {presets.map(p => (
                                    <div 
                                        key={p.id}
                                        className={`preset-card ${selectedPresetId === p.id ? 'selected' : ''}`}
                                        onClick={() => {
                                            setSelectedPresetId(p.id);
                                            setSelectedFile(null);
                                            setPreviewUrl(null);
                                        }}
                                    >
                                        <div className="preset-card-top">
                                            <span className="preset-badge">{p.badge}</span>
                                            <span className="preset-radio">{selectedPresetId === p.id ? '🔘' : '⚪'}</span>
                                        </div>
                                        <h4>{p.title}</h4>
                                        <div className="preset-doc">{p.doctor}</div>
                                        <div className="preset-summary"><strong>Medicines:</strong> {p.summary}</div>
                                        <div className="preset-clarity">✍️ {p.clarity}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* File Upload / Camera Option */}
                        <div className="custom-upload-section">
                            <div className="section-title-row">
                                <span className="step-number">2</span>
                                <h3>Or Upload Your Own Prescription Image / PDF</h3>
                            </div>

                            <div className="dropzone-box" onClick={() => fileInputRef.current?.click()}>
                                <input 
                                    ref={fileInputRef} 
                                    type="file" 
                                    accept="image/*,application/pdf" 
                                    style={{ display: 'none' }}
                                    onChange={handleFileSelect}
                                />
                                <input 
                                    ref={cameraInputRef} 
                                    type="file" 
                                    accept="image/*" 
                                    capture="environment"
                                    style={{ display: 'none' }}
                                    onChange={handleFileSelect}
                                />

                                <div className="dropzone-content">
                                    <span className="upload-icon">📄</span>
                                    {selectedFile ? (
                                        <div className="selected-file-info">
                                            <strong>Selected File:</strong> {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                                            {previewUrl && (
                                                <div className="file-img-preview">
                                                    <img src={previewUrl} alt="Prescription preview" />
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            <p className="drop-main-text">Drag & drop prescription photo, or click to browse</p>
                                            <p className="drop-sub-text">Supports JPG, PNG, WEBP images and PDF slips</p>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="scan-actions-bar">
                                <button 
                                    type="button" 
                                    className="camera-snap-btn"
                                    onClick={() => cameraInputRef.current?.click()}
                                >
                                    📷 Camera Snapshot
                                </button>

                                <button 
                                    type="button" 
                                    className="start-scan-btn"
                                    onClick={() => handleStartScan()}
                                >
                                    ✨ Analyze & Decode Handwritten Prescription
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 2: SCANNING PROGRESS */}
                {step === 'scanning' && (
                    <div className="scan-step-processing">
                        <div className="scanner-animation-container">
                            <div className="simulated-rx-slip">
                                <div className="slip-header">
                                    <div className="slip-doc-name">METRO CARE CLINIC • DR. A. SHARMA MD</div>
                                    <div className="slip-date">DATE: 12-OCT-2026</div>
                                </div>
                                <div className="slip-rx-symbol">℞</div>
                                <div className="slip-handwriting-lines">
                                    <div className="handwriting-line">Tab. Metformin 500mg — 1-0-1 PC (c. water)</div>
                                    <div className="handwriting-line">Tab. Amlodipine 5mg — 0-0-1 HS</div>
                                    <div className="handwriting-line">Tab. Atorva 20mg — 0-0-1 Bedtime</div>
                                </div>
                                <div className="slip-signature">✍️ Arvind Sharma (Reg. #49281)</div>

                                {/* Laser Scanning Beam */}
                                <div className="laser-beam"></div>
                            </div>
                        </div>

                        <div className="scan-progress-box">
                            <div className="progress-bar-track">
                                <div className="progress-bar-fill" style={{ width: `${scanProgress}%` }}></div>
                            </div>
                            <div className="stage-text-row">
                                <span className="stage-text">{scanStageText}</span>
                                <span className="stage-percent">{scanProgress}%</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 3: REVIEW & CONFIRMATION (HUMAN IN THE LOOP) */}
                {step === 'confirm' && scanResult && (
                    <div className="scan-step-confirm">
                        {/* Compliance Warning */}
                        <div className="review-compliance-banner">
                            <div className="banner-badge">⚕️ HUMAN VERIFICATION REQUIRED</div>
                            <div className="banner-text">
                                Please review and confirm the AI-extracted medications against your written doctor slip before scheduling. DoseBuddy is an adherence companion and not medical advice.
                            </div>
                        </div>

                        {/* Prescription Metadata Summary */}
                        <div className="scan-summary-bar">
                            <div className="summary-item">
                                <span className="sum-label">Detected Doctor:</span>
                                <span className="sum-val">{scanResult.doctorName}</span>
                            </div>
                            <div className="summary-item">
                                <span className="sum-label">Clinic:</span>
                                <span className="sum-val">{scanResult.clinicName}</span>
                            </div>
                            <div className="summary-item">
                                <span className="sum-label">OCR Quality:</span>
                                <span className="sum-val highlight">⭐ {scanResult.confidenceScore}% ({scanResult.handwritingClarity})</span>
                            </div>
                        </div>

                        {/* Drug Interaction Warning if present */}
                        {scanResult.drugInteractionWarnings?.length > 0 && (
                            <div className="interaction-warning-banner">
                                <strong>⚠️ Informational Interaction Notice:</strong>
                                <ul>
                                    {scanResult.drugInteractionWarnings.map((w, idx) => (
                                        <li key={idx}>{w}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Editable Medication Cards */}
                        <div className="meds-review-list">
                            <div className="review-list-header">
                                <h3>Extracted Medications ({editableMeds.length})</h3>
                                <button className="add-more-med-btn" onClick={handleAddEmptyMed}>
                                    ➕ Add Another Medicine
                                </button>
                            </div>

                            {editableMeds.map((med, index) => (
                                <div className="review-med-card" key={index}>
                                    <div className="review-card-top">
                                        <div className="med-num-badge">#{index + 1}</div>
                                        <input 
                                            type="text" 
                                            className="med-name-input"
                                            value={med.name} 
                                            onChange={e => handleMedChange(index, 'name', e.target.value)}
                                            placeholder="Medicine Name & Strength"
                                        />
                                        <button 
                                            className="delete-item-btn" 
                                            onClick={() => handleDeleteMed(index)}
                                            title="Remove medicine"
                                        >
                                            🗑️
                                        </button>
                                    </div>

                                    <div className="review-card-grid">
                                        <div className="field-group">
                                            <label>Dosage</label>
                                            <input 
                                                type="text" 
                                                value={med.dosage} 
                                                onChange={e => handleMedChange(index, 'dosage', e.target.value)}
                                                placeholder="e.g. 500mg - 1 Tab"
                                            />
                                        </div>

                                        <div className="field-group">
                                            <label>Frequency Notation</label>
                                            <div className="freq-selector-row">
                                                <input 
                                                    type="text" 
                                                    className="freq-text"
                                                    value={med.frequency} 
                                                    onChange={e => handleMedChange(index, 'frequency', e.target.value)}
                                                />
                                                <div className="freq-quick-pills">
                                                    {['1-0-1', '1-0-0', '0-0-1', '1-1-1'].map(fp => (
                                                        <button 
                                                            key={fp}
                                                            type="button"
                                                            className={`freq-chip ${med.frequency === fp ? 'active' : ''}`}
                                                            onClick={() => handleFrequencyPreset(index, fp)}
                                                        >
                                                            {fp}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="field-group slots-group">
                                            <label>Daily Slots (Morning / Afternoon / Night)</label>
                                            <div className="slots-toggle-row">
                                                <label className={`slot-checkbox ${med.morning ? 'checked' : ''}`}>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={med.morning} 
                                                        onChange={e => handleMedChange(index, 'morning', e.target.checked)}
                                                    />
                                                    🌅 Morning (08:00 AM)
                                                </label>

                                                <label className={`slot-checkbox ${med.afternoon ? 'checked' : ''}`}>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={med.afternoon} 
                                                        onChange={e => handleMedChange(index, 'afternoon', e.target.checked)}
                                                    />
                                                    ☀️ Afternoon (01:00 PM)
                                                </label>

                                                <label className={`slot-checkbox ${med.night ? 'checked' : ''}`}>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={med.night} 
                                                        onChange={e => handleMedChange(index, 'night', e.target.checked)}
                                                    />
                                                    🌙 Night (08:00 PM)
                                                </label>
                                            </div>
                                        </div>

                                        <div className="field-group">
                                            <label>Meal / Food Instruction</label>
                                            <input 
                                                type="text" 
                                                value={med.mealInstruction} 
                                                onChange={e => handleMedChange(index, 'mealInstruction', e.target.value)}
                                                placeholder="e.g. Take after food with water"
                                            />
                                        </div>

                                        <div className="field-group">
                                            <label>Medical Indication / Purpose</label>
                                            <input 
                                                type="text" 
                                                value={med.reason} 
                                                onChange={e => handleMedChange(index, 'reason', e.target.value)}
                                                placeholder="e.g. Blood pressure control"
                                            />
                                        </div>

                                        <div className="field-group">
                                            <label>Duration (Days)</label>
                                            <input 
                                                type="number" 
                                                min="1"
                                                value={med.totalDays} 
                                                onChange={e => {
                                                    handleMedChange(index, 'totalDays', e.target.value);
                                                    handleMedChange(index, 'remainingDoses', e.target.value);
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Confirmation Footer */}
                        <div className="review-footer-bar">
                            <button 
                                className="back-upload-btn" 
                                onClick={() => setStep('upload')}
                                disabled={isSaving}
                            >
                                ← Rescan / Change File
                            </button>

                            <button 
                                className="confirm-schedule-btn"
                                onClick={handleConfirmAndSchedule}
                                disabled={isSaving}
                            >
                                {isSaving ? 'Saving to Database...' : `✅ Confirm & Add ${editableMeds.length} Medications to Schedule`}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
