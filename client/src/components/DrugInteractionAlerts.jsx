import React from 'react';
import './DrugInteractionAlerts.css';

export default function DrugInteractionAlerts({ medications = [] }) {
    const activeMeds = medications.filter(m => m.category === 'current');
    const names = activeMeds.map(m => m.name.toLowerCase());

    const detectedWarnings = [];

    // Check Metformin & Amlodipine or ACE inhibitors
    const hasMetformin = names.some(n => n.includes('metformin'));
    const hasAmlodipine = names.some(n => n.includes('amlodipine'));
    const hasStatin = names.some(n => n.includes('atorvastatin') || n.includes('statin'));
    const hasAmox = names.some(n => n.includes('amox') || n.includes('antibiotic'));
    const hasPanto = names.some(n => n.includes('panto') || n.includes('antacid'));
    const hasPainMed = names.some(n => n.includes('paracetamol') || n.includes('dolo') || n.includes('nsaid'));

    if (hasAmlodipine && hasStatin) {
        detectedWarnings.push({
            pair: 'Amlodipine + Atorvastatin',
            severity: 'Mild-Moderate Co-Administration Monitoring',
            info: 'Amlodipine may slightly increase plasma concentration of Atorvastatin. Your prescribing physician will normally select standard moderate statin dosages.'
        });
    }

    if (hasAmox && hasPanto) {
        detectedWarnings.push({
            pair: 'Amoxicillin + Pantoprazole',
            severity: 'Timing Separation Advised',
            info: 'Take Pantoprazole 30 minutes before food on an empty stomach, and Amoxicillin after meals to optimize antibiotic absorption and stomach comfort.'
        });
    }

    if (hasMetformin && hasAmlodipine) {
        detectedWarnings.push({
            pair: 'Metformin + Blood Pressure Medications',
            severity: 'Routine Glucose & Hydration Tracking',
            info: 'Ensure regular hydration. Both drugs are commonly co-prescribed for metabolic & cardiovascular health with routine physician checkups.'
        });
    }

    if (hasPainMed && hasAmox) {
        detectedWarnings.push({
            pair: 'Antibiotic + Fever/Pain Management',
            severity: 'Hydration & Liver Precaution',
            info: 'Ensure total daily paracetamol does not exceed 3000mg. Drink ample water while completing your antibiotic cycle.'
        });
    }

    // Also collect any explicit interaction warnings saved on individual medicines
    activeMeds.forEach(m => {
        if (m.interactionWarning && !detectedWarnings.some(w => w.info.includes(m.interactionWarning))) {
            detectedWarnings.push({
                pair: m.name,
                severity: 'Patient Medication Safety Note',
                info: m.interactionWarning
            });
        }
    });

    if (detectedWarnings.length === 0) return null;

    return (
        <div className="drug-interactions-card">
            <div className="interactions-header">
                <div className="interactions-title-wrap">
                    <span className="interactions-badge">⚠️ INFORMATIONAL</span>
                    <h3>Potential Drug Interaction & Regimen Guidance</h3>
                </div>
                <span className="disclaimer-chip">Informational Only • Not Medical Advice</span>
            </div>

            <p className="interactions-desc">
                DoseBuddy analyzed your current active prescription combination. Always consult your doctor or pharmacist before making any changes.
            </p>

            <div className="interactions-list">
                {detectedWarnings.map((item, index) => (
                    <div className="interaction-item" key={index}>
                        <div className="interaction-left">
                            <span className="interaction-pair-name">{item.pair}</span>
                            <span className="interaction-severity-tag">{item.severity}</span>
                        </div>
                        <div className="interaction-body">
                            {item.info}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
