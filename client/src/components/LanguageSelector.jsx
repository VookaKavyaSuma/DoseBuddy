import React from 'react';
import './LanguageSelector.css';

export default function LanguageSelector({ currentLang, onLanguageChange }) {
    const languages = [
        { code: 'en', label: 'English', flag: '🇬🇧' },
        { code: 'es', label: 'Español', flag: '🇪🇸' },
        { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
        { code: 'fr', label: 'Français', flag: '🇫🇷' }
    ];

    return (
        <div className="language-selector-wrap" title="Change App Language">
            <span className="lang-icon">🌐</span>
            <select 
                className="lang-dropdown"
                value={currentLang} 
                onChange={(e) => onLanguageChange(e.target.value)}
                aria-label="Select Language"
            >
                {languages.map(l => (
                    <option key={l.code} value={l.code}>
                        {l.flag} {l.label}
                    </option>
                ))}
            </select>
        </div>
    );
}
