import React from 'react';
import './MedicalDisclaimerBanner.css';

export default function MedicalDisclaimerBanner({ lang = 'en' }) {
    const texts = {
        en: {
            title: "Important Medical Disclaimer",
            body: "DoseBuddy is an adherence assistant and scheduling tool, NOT a licensed medical provider. Extracted details from prescriptions must be verified with your physician or pharmacist before taking medications. In case of an emergency, call 911 or your local emergency service immediately."
        },
        es: {
            title: "Aviso Médico Importante",
            body: "DoseBuddy es un asistente de recordatorios, NO un proveedor médico autorizado. Los detalles extraídos de las recetas deben verificarse con su médico o farmacéutico antes de tomar medicamentos."
        },
        hi: {
            title: "महत्वपूर्ण चिकित्सा अस्वीकरण",
            body: "DoseBuddy केवल दवा समय पर लेने में मदद करने वाला उपकरण है, यह कोई चिकित्सा सलाह नहीं है। दवा लेने से पहले डॉक्टर या फार्मासिस्ट से पर्चे के विवरण की पुष्टि अवश्य करें।"
        },
        fr: {
            title: "Avis Médical Important",
            body: "DoseBuddy est un outil d'aide à l'observance et non un fournisseur médical agréé. Vérifiez toujours les détails avec votre médecin ou pharmacien avant de prendre vos médicaments."
        }
    };

    const current = texts[lang] || texts.en;

    return (
        <aside className="medical-disclaimer-banner" role="complementary" aria-label="Medical Disclaimer">
            <div className="disclaimer-icon-col">
                <span className="disclaimer-badge">⚕️ DISCLAIMER</span>
            </div>
            <div className="disclaimer-content">
                <strong>{current.title}:</strong> {current.body}
            </div>
        </aside>
    );
}
