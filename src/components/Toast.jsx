import { useState, createContext, useContext, useCallback } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)

  const showToast = useCallback((title, sub = '', icon = '✅') => {
    setToast({ title, sub, icon })
    setTimeout(() => setToast(null), 3500)
  }, [])

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {toast && (
        <div className="toast">
          <span className="toast-icon">{toast.icon}</span>
          <div className="toast-text">
            <h4>{toast.title}</h4>
            {toast.sub && <p>{toast.sub}</p>}
          </div>
        </div>
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}