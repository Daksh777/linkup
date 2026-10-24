import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

type Toast = { id: number; message: string; action?: { label: string; onClick: () => void }; duration?: number }

const ToastContext = createContext<(toast: Omit<Toast, 'id'>) => void>(() => {})

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null)

  const show = useCallback((next: Omit<Toast, 'id'>) => setToast({ ...next, id: Date.now() }), [])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), toast.duration ?? 3000)
    return () => clearTimeout(timer)
  }, [toast])

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {toast && (
          <div key={toast.id} className="toast">
            <span className="t-body-s">{toast.message}</span>
            {toast.action && (
              <button
                type="button"
                className="toast__action"
                onClick={() => {
                  toast.action?.onClick()
                  setToast(null)
                }}
              >
                {toast.action.label}
              </button>
            )}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
