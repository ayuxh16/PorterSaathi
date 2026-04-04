import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ToastProvider } from './components/Toast'
import LandingPage  from './pages/LandingPage'
import LoginPage    from './pages/LoginPage'
import SignupPage   from './pages/SignupPage'
import BookingPage  from './pages/BookingPage'
import ProfilePage  from './pages/ProfilePage'
import AdminPage    from './pages/AdminPage'

// Redirect to login if not logged in
function PrivateRoute({ children }) {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/login" replace />
}

// Admin only — redirect others away
function AdminRoute({ children }) {
  const token = localStorage.getItem('token')
  const user  = JSON.parse(localStorage.getItem('user') || '{}')
  if (!token)               return <Navigate to="/login"   replace />
  if (user.role !== 'admin') return <Navigate to="/booking" replace />
  return children
}

// Porter/customer only — redirect admins away
function UserRoute({ children }) {
  const token = localStorage.getItem('token')
  const user  = JSON.parse(localStorage.getItem('user') || '{}')
  if (!token)              return <Navigate to="/login" replace />
  if (user.role === 'admin') return <Navigate to="/admin"  replace />
  return children
}

function App() {
  return (
    <ToastProvider>
      <Router>
        <Routes>
          <Route path="/"        element={<LandingPage />} />
          <Route path="/login"   element={<LoginPage />}   />
          <Route path="/signup"  element={<SignupPage />}  />

          {/* Admin dashboard */}
          <Route path="/admin"   element={<AdminRoute><AdminPage /></AdminRoute>} />

          {/* Porter dashboard (/portal) */}
          <Route path="/portal"  element={<UserRoute><BookingPage /></UserRoute>} />

          {/* Customer booking (/booking) */}
          <Route path="/booking" element={<UserRoute><BookingPage /></UserRoute>} />

          {/* Profile — both porter and customer */}
          <Route path="/profile" element={<UserRoute><ProfilePage /></UserRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ToastProvider>
  )
}

export default App