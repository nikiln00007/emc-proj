import { statusStyles } from '../../utils/gradeHelpers';

/**
 * StatusBadge — displays evaluation status with correct pastel color pill.
 * @param {string} status - one of pending, in_review, needs_revision, graded, not_submitted
 * @param {boolean} showIcon - show emoji icon
 * @param {string} size - 'sm' | 'md'
 */
export default function StatusBadge({ status, showIcon = true, size = 'md' }) {
  const style = statusStyles[status] || statusStyles.not_submitted;
  const sizeClass = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold rounded-full border
        ${sizeClass} ${style.bg} ${style.text} ${style.border}`}
    >
      {showIcon && <span>{style.icon}</span>}
      {style.label}
    </span>
  );
}
