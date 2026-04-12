import { useNavigate } from 'react-router-dom'
import './Sidebar.css'

const CUSTOMER_LINKS = [
  { id: 'book',     icon: '🔍', label: 'Book a Porter'  },
  { id: 'bookings', icon: '📋', label: 'My Bookings'    },
  { id: 'status',   icon: '🔔', label: 'Booking Status' },
]
const PORTER_LINKS = [
  { id: 'requests', icon: '🔔', label: 'Booking Requests' },
  { id: 'pricing',  icon: '💰', label: 'My Pricing'       },
  { id: 'earnings', icon: '📊', label: 'Earnings'         },
]

export default function Sidebar({ role = 'customer', activeTab, onTabChange }) {
  const navigate   = useNavigate()
  const links      = role === 'porter' ? PORTER_LINKS : CUSTOMER_LINKS
  const accent     = role === 'porter' ? 'var(--amber)' : 'var(--red)'
  const avatarBg   = role === 'porter'
    ? 'linear-gradient(135deg,#F5A623,#e67e22)'
    : 'linear-gradient(135deg,#E8341C,#F5A623)'

  // Read real user from localStorage
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
  const name       = storedUser.name  || (role === 'porter' ? 'Porter' : 'Customer')
  const initials   = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  const sub        = role === 'porter' ? 'Porter' : 'Customer'

  const handleSignOut = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="s-brand-icon" style={{ background: accent }}>🧳</div>
        <span className="brand-name" style={{ fontSize: 17 }}>
          Porter<span style={{ color: accent }}>Saathi</span>
        </span>
      </div>

      <nav className="sidebar-nav">
        {links.map(link => (
          <button
            key={link.id}
            className={`nav-item ${activeTab === link.id ? 'active' : ''}`}
            style={activeTab === link.id
              ? { color: accent, background: `rgba(255,255,255,0.05)` }
              : {}}
            onClick={() => onTabChange(link.id)}
          >
            <span>{link.icon}</span> {link.label}
          </button>
        ))}
        <button
          className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => navigate('/profile')}
        >
          <span>👤</span> Profile
        </button>
      </nav>

      <div className="sidebar-bottom">
        <div className="user-chip">
          <div className="user-avatar" style={{ background: avatarBg }}>{initials}</div>
          <div className="user-meta">
            <h4>{name}</h4>
            <p>{sub}</p>
          </div>
        </div>
        <button className="logout-btn" onClick={handleSignOut}>
          ↩ Sign out
        </button>
      </div>
    </aside>
  )
}





