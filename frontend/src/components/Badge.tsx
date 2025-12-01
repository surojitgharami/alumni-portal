interface BadgeProps {
  children: React.ReactNode
  variant?: 'primary' | 'accent' | 'success' | 'danger' | 'neutral'
  size?: 'sm' | 'md'
}

function Badge({ children, variant = 'neutral', size = 'md' }: BadgeProps) {
  const variantClasses = {
    primary: 'bg-primary-100 text-primary-700',
    accent: 'bg-accent-100 text-accent-700',
    success: 'bg-green-100 text-green-700',
    danger: 'bg-red-100 text-red-700',
    neutral: 'bg-gray-100 text-gray-700'
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm'
  }

  return (
    <span className={`inline-flex items-center font-medium rounded-full ${variantClasses[variant]} ${sizeClasses[size]}`}>
      {children}
    </span>
  )
}

export default Badge
