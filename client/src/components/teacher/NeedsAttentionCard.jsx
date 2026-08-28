import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import { formatWaitTime } from '../../utils/gradeHelpers';

/**
 * NeedsAttentionCard — compact card for Dashboard queue showing urgent items.
 */
export default function NeedsAttentionCard({ evaluation, onGrade }) {
  const { project, student, status, waitDays, waitHours, submittedAt } = evaluation;

  const studentName = student?.name || project?.owner?.name || 'Student';
  const studentImg  = student?.profileImage || project?.owner?.profileImage || '';
  const waitLabel   = formatWaitTime(submittedAt);
  const isUrgent    = waitDays >= 3;

  return (
    <div className={`bg-white rounded-2xl border shadow-sm p-4 flex flex-col gap-3 transition-all hover:shadow-md hover:-translate-y-0.5
      ${isUrgent ? 'border-rose-200 bg-rose-50/30' : 'border-gray-100'}`}>

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          {studentImg ? (
            <img src={studentImg} alt={studentName}
              className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-400
              flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {studentName[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-xs font-bold text-gray-900 leading-tight">{studentName}</p>
            <p className={`text-[10px] font-semibold ${isUrgent ? 'text-rose-600' : 'text-gray-400'}`}>
              {waitLabel}
            </p>
          </div>
        </div>
        <StatusBadge status={status} size="sm" />
      </div>

      {/* Project title */}
      <p className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug">
        {project?.title || 'Untitled Project'}
      </p>

      {/* Tags */}
      {project?.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {project.tags.slice(0, 3).map(t => (
            <span key={t} className="bg-gray-100 text-gray-600 text-[9px] font-semibold px-2 py-0.5 rounded-full">
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Link
          to={`/teacher/evaluations/${evaluation._id}`}
          className="flex-1 text-center text-xs font-bold py-1.5 rounded-xl
            bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:opacity-90 transition-opacity"
        >
          Grade →
        </Link>
        <Link
          to={`/project/${project?._id}`}
          className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50"
        >
          View
        </Link>
      </div>
    </div>
  );
}
