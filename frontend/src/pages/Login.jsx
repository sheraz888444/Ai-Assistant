import React, { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import signupBg from '../assets/signup.png'
import Alert from '../components/Alert'

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [alert, setAlert] = useState({ show: false, type: '', message: '' })
  const { login, loading } = useContext(AuthContext)
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const validateForm = () => {
    if (!formData.email.trim()) {
      return 'Email is required'
    }
    
    if (!formData.password) {
      return 'Password is required'
    }
    
    if (formData.password.length < 6) {
      return 'Password must be at least 6 characters'
    }
    
    return null
  }

  const showAlert = (type, message) => {
    setAlert({ show: true, type, message })
  }

  const hideAlert = () => {
    setAlert({ show: false, type: '', message: '' })
  }

  const handleSubmit = async (e) => {
      e.preventDefault();
      hideAlert();
  
      const validationError = validateForm();
      if (validationError) {
          showAlert('error', validationError);
          return;
      }
  
      try {
          const result = await login(formData);
          if (result.success) {
              showAlert('success', 'Login successful!');
              setTimeout(() => {
                  navigate('/dashboard');
              }, 2000);
          } else {
              showAlert('error', result.error || 'Login failed');
          }
      } catch (err) {
          showAlert('error', 'An unexpected error occurred');
      }
  };
  
  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: `url(${signupBg})`
        }}
      ></div>
      <div className="relative z-10 glass-form p-8 rounded-2xl shadow-2xl w-full max-w-md backdrop-blur-lg bg-white/10 border border-white/20">
        <h2 className="text-3xl font-bold text-center mb-6 text-white">Login</h2>
        
        {/* Custom alert */}
        {alert.show && (
          <div className="mb-4">
            <Alert
              type={alert.type}
              message={alert.message}
              onClose={hideAlert}
            />
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-white mb-2">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 text-white placeholder-white/70 transition duration-300"
              placeholder="Enter your email"
              required
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="password" className="block text-white mb-2">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 text-white placeholder-white/70 transition duration-300"
              placeholder="Enter your password"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 px-4 rounded-lg transition duration-300 focus:outline-none focus:ring-2 focus:ring-green-500/50 font-semibold text-lg shadow-lg disabled:opacity-50"
          >
            {loading ? 'Logging In...' : 'Login'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-white/80">
            Don't have an account?{' '}
            <a href="/signup" className="text-white font-semibold hover:underline">
              Sign Up
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
