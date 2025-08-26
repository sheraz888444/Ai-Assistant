import React, { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import signupBg from '../assets/signup.png'
import Alert from '../components/Alert'

function Signup() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [alert, setAlert] = useState({ show: false, type: '', message: '' })
  const { signup, loading, error } = useContext(AuthContext)
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      return 'Name is required'
    }
    
    if (!formData.email.trim()) {
      return 'Email is required'
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      return 'Please enter a valid email address'
    }
    
    if (!formData.password) {
      return 'Password is required'
    }
    
    if (formData.password.length < 6) {
      return 'Password must be at least 6 characters'
    }
    
    if (formData.password !== formData.confirmPassword) {
      return 'Passwords do not match'
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
    e.preventDefault()
    
    const validationError = validateForm()
    if (validationError) {
      showAlert('error', validationError)
      return
    }
    
    const userData = {
      name: formData.name,
      email: formData.email,
      password: formData.password
    }
    
    const result = await signup(userData)
    
    if (result.success) {
      // Show success message and redirect to login
      showAlert('success', 'Account created successfully! Redirecting to login...')
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } else {
      // Error will be handled by context and displayed in UI
      showAlert('error', result.error)
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: `url(${signupBg})`
        }}
      ></div>
      <div className="relative z-10 glass-form p-8 rounded-2xl shadow-2xl w-full max-w-md backdrop-blur-lg bg-white/10 border border-white/20">
        <h2 className="text-3xl font-bold text-center mb-6 text-white">Sign Up</h2>
        
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
        
        {/* Error alert */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/80 text-white">
            {error}
          </div>
        )}
        
        {/* Success message could be added here if needed */}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-white mb-2">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 text-white placeholder-white/70 transition duration-300"
              placeholder="Enter your name"
              required
            />
          </div>
          
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
          
          <div className="mb-4">
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
          
          <div className="mb-6">
            <label htmlFor="confirmPassword" className="block text-white mb-2">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 text-white placeholder-white/70 transition duration-300"
              placeholder="Confirm your password"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 px-4 rounded-lg transition duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-semibold text-lg shadow-lg disabled:opacity-50"
          >
            {loading ? 'Signing Up...' : 'Sign Up'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-white/80">
            Already have an account?{' '}
            <a href="/login" className="text-white font-semibold hover:underline">
              Login
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Signup
