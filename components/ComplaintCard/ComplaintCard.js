// components/ComplaintCard/ComplaintCard.js
import Link from 'next/link'
import StatusBadge from '@/components/StatusBadge/StatusBadge'
import SeverityBadge from '@/components/SeverityBadge/SeverityBadge'
import CategoryIcon from '@/components/CategoryIcon/CategoryIcon'
import { formatDate, truncate } from '@/lib/utils'

export default function ComplaintCard({ complaint, showActions, onDelete }) {
  const {
    id, category, severity, description,
    status, location, createdAt, userName, imageUrl,
  } = complaint

  return (
    <article className="card hover:shadow-md transition-shadow duration-200 animate-slide-up group">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center border border-green-100">
            <CategoryIcon category={category} size="md" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">{category}</p>
            <p className="text-xs text-gray-400">{formatDate(createdAt)}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <StatusBadge status={status} />
          <SeverityBadge severity={severity} />
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 leading-relaxed mb-3">
        {truncate(description, 120)}
      </p>

      {/* Optional image link */}
      {imageUrl && (
        <a
          href={imageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-brand-green underline underline-offset-2 block mb-3 hover:text-green-800"
        >
          📎 View attached photo
        </a>
      )}

      {/* Location */}
      {location?.lat && (
        <p className="text-xs text-gray-400 mb-3">
          📍 {location.address || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`}
        </p>
      )}

      {/* Submitted by */}
      {userName && (
        <p className="text-xs text-gray-400 mb-4">Reported by: {userName}</p>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
        <Link
          href={`/complaints/${id}`}
          className="text-xs font-medium text-brand-green hover:underline"
        >
          View Details →
        </Link>

        {showActions && status === 'Pending' && (
          <>
            <Link
              href={`/report-issue/edit/${id}`}
              className="ml-auto text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 hover:border-brand-green hover:text-brand-green transition-colors"
            >
              Edit
            </Link>
            {onDelete && (
              <button
                onClick={() => onDelete(id)}
                className="text-xs border border-red-200 rounded-lg px-3 py-1.5 text-red-500 hover:bg-red-50 transition-colors"
              >
                Delete
              </button>
            )}
          </>
        )}
      </div>
    </article>
  )
}
