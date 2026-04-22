// components/CategoryIcon/CategoryIcon.js
import { getCategoryMeta } from '@/lib/utils'

export default function CategoryIcon({ category, size = 'md' }) {
  const meta = getCategoryMeta(category)
  const sizes = { sm: 'text-lg', md: 'text-2xl', lg: 'text-4xl' }

  return (
    <span
      title={meta.label}
      className={`${sizes[size]} leading-none`}
      role="img"
      aria-label={meta.label}
    >
      {meta.icon}
    </span>
  )
}
