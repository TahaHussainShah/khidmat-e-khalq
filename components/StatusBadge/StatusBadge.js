// components/StatusBadge/StatusBadge.js
import { getStatusMeta } from '@/lib/utils'

export default function StatusBadge({ status }) {
  const meta = getStatusMeta(status)
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${meta.bg} ${meta.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  )
}
