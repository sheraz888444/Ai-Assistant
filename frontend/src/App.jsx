import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ProtectedRoute from './components/ProtectedRoute';
import Homepage from './pages/Homepage';
import SetupProfile from './pages/SetupProfile';
import Dashboard from './pages/Dashboard';
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';

function App() {
  const { user } = useContext(AuthContext);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/" element={<ProtectedRoute><Homepage /></ProtectedRoute>} />
      <Route path="/setup" element={<ProtectedRoute><SetupProfile /></ProtectedRoute>} />
      <Route path="/customize-name" element={<ProtectedRoute><SetupProfile /></ProtectedRoute>} />

      {/* Backward compatibility for old links/bookmarks */}
      <Route path="/customize" element={<Navigate to="/setup" replace />} />
      <Route path="/customise" element={<Navigate to="/setup" replace />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            {user?.hasCompletedSetup ? <Dashboard /> : <SetupProfile />}
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
