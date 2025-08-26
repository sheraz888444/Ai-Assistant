import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

function CustomizeName() {
    const navigate = useNavigate();
    const { user, updateUser } = useContext(AuthContext);
    const [assistantName, setAssistantName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleNameChange = (e) => {
        setAssistantName(e.target.value);
    };

    const handleConfirm = async () => {
        if (!assistantName.trim()) {
            setError('Assistant name is required');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/user/update-assistant`, 
                { assistantName },
                { withCredentials: true }
            );

            if (response.status === 200) {
                updateUser(response.data.user);
                navigate('/dashboard');
            } else {
                setError('Failed to update assistant name');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Update failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-4">
            <div className="max-w-md w-full mx-auto p-8 bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20">
                <h2 className="text-3xl font-bold mb-6 text-center text-white">Name Your Virtual Assistant</h2>
                <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
                    <div>
                        <label htmlFor="assistantName" className="block text-sm font-medium text-white">Assistant Name</label>
                        <input
                            type="text"
                            id="assistantName"
                            value={assistantName}
                            onChange={handleNameChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-black bg-white/50 p-3"
                            placeholder="Enter your assistant's name"
                            required
                        />
                    </div>
                    {error && (
                        <div className="p-3 bg-red-500/20 border border-red-400/30 rounded-md">
                            <p className="text-red-200 text-sm">{error}</p>
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={loading}
                        className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors duration-200"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Updating...
                            </span>
                        ) : (
                            'Confirm & Continue'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default CustomizeName;
