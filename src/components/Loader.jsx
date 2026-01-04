export default function Loader({ 
  text = 'Loading...', 
  color = 'emerald', 
  size = 'md' 
}) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
    xl: 'h-20 w-20'
  }

  const colorClasses = {
    emerald: 'border-emerald-500',
    blue: 'border-blue-500',
    purple: 'border-purple-500',
    pink: 'border-pink-500',
    gray: 'border-gray-500'
  }

  return (
    <div className="text-center py-20">
      <div 
        className={`inline-block animate-spin rounded-full border-b-2 ${sizeClasses[size]} ${colorClasses[color]} mb-4`}
      ></div>
      {text && <p className="text-gray-600">{text}</p>}
    </div>
  )
}
