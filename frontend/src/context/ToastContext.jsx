import { createContext, useContext, useMemo, useState } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const pushToast = (message, tone = 'info') => {
    const id = `${Date.now()}-${Math.random()}`
    setToasts((current) => [...current, { id, message, tone }])
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id))
    }, 3500)
  }

  const value = useMemo(() => ({ pushToast }), [])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 w-[min(360px,calc(100vw-2rem))] space-y-2">
        {toasts.map((toast) => (
          <div key={toast.id} className={`rounded-2xl border px-4 py-3 text-sm shadow-2xl backdrop-blur-xl ${toast.tone === 'success' ? 'border-emerald-400/30 bg-emerald-500/15 text-emerald-100' : toast.tone === 'danger' ? 'border-rose-400/30 bg-rose-500/15 text-rose-100' : 'border-cyan-400/30 bg-cyan-500/15 text-cyan-100'}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
