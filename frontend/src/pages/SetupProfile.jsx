import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function SetupProfile() {
  const { updateUser } = useContext(AuthContext);
  const [assistantName, setAssistantName] = useState('');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleNameChange = (e) => {
    setAssistantName(e.target.value);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!assistantName.trim()) {
      setError('Assistant name is required');
      return;
    }
    if (!image) {
      setError('Assistant image is required');
      return;
    }

    setLoading(true);
    try {
      const form = new FormData();
      form.append('assistantName', assistantName);
      form.append('image', image);

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/user/update-profile`,
        form,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          withCredentials: true
        }
      );

      if (res.status === 200) {
        updateUser(res.data.user);
        navigate('/dashboard');
      } else {
        setError('Unexpected server response. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Profile setup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-4">
      <div className="max-w-md w-full mx-auto p-8 bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Set Up Your Profile</h2>
          <p className="text-blue-100 opacity-80">Choose an assistant name and upload a profile image</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Assistant Name */}
          <div className="space-y-2">
            <label htmlFor="assistantName" className="block text-sm font-semibold text-white">
              Assistant Name
            </label>
            <input
              type="text"
              id="assistantName"
              value={assistantName}
              onChange={handleNameChange}
              className="w-full px-4 py-3 bg-white/20 border-2 border-white/30 rounded-xl text-white placeholder-white/70 focus:outline-none focus:border-indigo-300"
              placeholder="Enter your assistant's name"
              required
            />
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <label htmlFor="image" className="block text-sm font-semibold text-white">
              Upload Assistant Image
            </label>
            <div className="relative">
              <input
                type="file"
                id="image"
                onChange={handleImageChange}
                className="w-full px-4 py-3 bg-white/20 border-2 border-white/30 rounded-xl text-white placeholder-white/70 file:mr-4 file:py-2 file:px-6 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-white/20 file:text-white hover:file:bg-white/30 transition-all duration-200"
                accept="image/*"
                required
              />
            </div>
          </div>

          {/* Preview */}
          {preview && (
            <div className="flex flex-col items-center space-y-3">
              <p className="text-sm font-medium text-white">Preview:</p>
              <img
                src={preview}
                alt="Preview"
                className="w-32 h-32 object-cover rounded-full border-4 border-white/30 shadow-lg"
              />
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving your profile...
              </span>
            ) : (
              'Complete Setup →'
            )}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div className="mt-6 p-4 bg-red-500/20 border border-red-400/30 rounded-xl">
            <p className="text-red-200 text-center">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default SetupProfile;