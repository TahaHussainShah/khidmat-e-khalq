// components/SeverityBadge/SeverityBadge.js
import { getSeverityMeta } from '@/lib/utils'

export default function SeverityBadge({ severity }) {
  const meta = getSeverityMeta(severity)
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${meta.bg} ${meta.text}`}>
      {meta.label}
    </span>
  )
}
