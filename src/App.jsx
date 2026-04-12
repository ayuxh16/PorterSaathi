import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ToastProvider } from './components/Toast'
import Chatbot          from './components/Chatbot'
import LandingPage      from './pages/LandingPage'
import LoginPage        from './pages/LoginPage'
import SignupPage       from './pages/SignupPage'
import BookingPage      from './pages/BookingPage'
import ProfilePage      from './pages/ProfilePage'
import AdminPage        from './pages/AdminPage'
import PorterDashboard  from './pages/PorterDashboard'
import MapPage          from './components/map'

function App() {
  return (
    <ToastProvider>
      <Router>
        <Routes>
          <Route path="/"        element={<LandingPage />}     />
          <Route path="/login"   element={<LoginPage />}       />
          <Route path="/signup"  element={<SignupPage />}       />
          <Route path="/booking" element={<BookingPage />}     />
          <Route path="/profile" element={<ProfilePage />}     />
          <Route path="/portal"  element={<PorterDashboard />} />
          <Route path="/admin"   element={<AdminPage />}       />
          <Route path="/map" element={<MapPage />}          />
        </Routes>
        <Chatbot />
      </Router>
    </ToastProvider>
  )
}

export default App



