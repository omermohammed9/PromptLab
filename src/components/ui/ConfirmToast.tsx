import { toast } from 'react-hot-toast'

interface ConfirmToastProps {
  t: { id: string; visible: boolean }
  title: string
  message: string
  confirmLabel: string
  onConfirm: () => void
  isDestructive?: boolean
}

export const ConfirmToast = ({ t, title, message, confirmLabel, onConfirm, isDestructive = false }: ConfirmToastProps) => (
  <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white dark:bg-slate-900 shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 dark:ring-white/10`}>
    <div className="flex-1 p-4">
      <div className="flex items-start">
        <div className="ms-3 flex-1">
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{message}</p>
          <div className="mt-3 flex gap-3">
             <button
              onClick={() => { toast.dismiss(t.id); onConfirm(); }}
              className={`px-4 py-2 text-xs font-bold text-white rounded-lg transition-all shadow-md active:scale-95 ${
                isDestructive ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
              }`}
            >
              {confirmLabel}
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
)