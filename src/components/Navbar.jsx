import { useNavigate } from 'react-router-dom'
import './Navbar.css'

export default function Navbar() {
  const navigate = useNavigate()

  return (
    <nav className="navbar">
      <div className="navbar-brand" onClick={() => navigate('/')}>
        <div className="brand-icon">🧳</div>
        <span className="brand-name">Porter<span>Saathi</span></span>
      </div>
      <div className="nav-links">
        <a href="#how">How it works</a>
        <a href="#features">Features</a>
        <a href="#join">For Porters</a>
      </div>
      <div className="nav-right">
        <button className="btn-outline" onClick={() => navigate('/login')}>Sign In</button>
        <button className="btn-primary" onClick={() => navigate('/login')}>Get Started</button>
      </div>
    </nav>
  )
}






