import React, { useEffect, useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import VoiceAssistant from '../components/VoiceAssistant';

const Dashboard = () => {
    const { user } = useContext(AuthContext);
    const [browserLanguage, setBrowserLanguage] = useState('en-US');

    useEffect(() => {
        // Detect browser language
        const lang = navigator.language || 'en-US';
        setBrowserLanguage(lang);

        // Greet the user
        const greetUser = () => {
            if (user?.assistantName && 'speechSynthesis' in window) {
                const greeting = getGreeting(lang);
                const msg = new SpeechSynthesisUtterance(`${greeting} ${user.assistantName}, I am ready to assist you. How may I help you today?`);
                msg.lang = lang;
                msg.rate = 0.9;
                window.speechSynthesis.speak(msg);
            }
        };

        greetUser();
    }, [user?.assistantName]);

    const getGreeting = (lang) => {
        switch (lang.split('-')[0]) {
            case 'ur': // Urdu
                return 'ہیلو';
            case 'es': // Spanish
                return 'Hola';
            case 'fr': // French
                return 'Bonjour';
            case 'de': // German
                return 'Hallo';
            case 'ar': // Arabic
                return 'مرحبا';
            default: // English and others
                return 'Hello';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-4">
            {/* Compact Header */}
            <div className="max-w-5xl mx-auto flex items-center justify-between p-4 mb-4">
                <div className="flex items-center gap-4">
                    {user?.imagePath && (
                        <img
                            src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${user.imagePath}`}
                            alt="Assistant"
                            className="w-12 h-12 md:w-14 md:h-14 object-cover rounded-full border-2 border-white/30 shadow-lg"
                        />
                    )}
                    <div>
                        <h2 className="text-white font-semibold text-lg md:text-xl">{user?.assistantName}</h2>
                        <p className="text-blue-200 text-xs md:text-sm">Your AI Assistant</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-blue-200 text-xs md:text-sm">Language: {browserLanguage}</p>
                </div>
            </div>

            {/* Minimal stage: only the voice assistant button floats */}
            <VoiceAssistant />
        </div>
    );
};

export default Dashboard;
