import { X } from 'lucide-react'

export default function Modal({ title, onClose, children, size = 'md' }) {
  const sizeClass = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }[size] || 'max-w-lg'
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 no-print">
      <div className={`bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full ${sizeClass} max-h-[90vh] flex flex-col border dark:border-gray-800`}>
        <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-800">
          <h2 className="text-lg font-semibold dark:text-gray-100">{title}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="px-6 py-4 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  )
}
