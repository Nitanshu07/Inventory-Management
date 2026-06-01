export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="text-center py-12 px-4">
      {Icon && (
        <div className="mx-auto w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-3">
          <Icon size={24} className="text-gray-400 dark:text-gray-500" />
        </div>
      )}
      <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-sm mx-auto">{description}</p>
      )}
      {action}
    </div>
  )
}
