import { numericToLetter, gradeColors } from '../../utils/gradeHelpers';

/**
 * GradePill — shows numeric + letter grade.
 * @param {number|null} grade - 0-10
 * @param {string} letterGrade - e.g. 'A+'
 * @param {string} size - 'sm' | 'md'
 */
export default function GradePill({ grade, letterGrade, size = 'md' }) {
  const num = (grade !== null && grade !== undefined && !isNaN(Number(grade))) ? Number(grade) : null;
  const letter = (letterGrade && letterGrade !== '—') ? letterGrade : (num !== null ? numericToLetter(num) : '—');
  const colors = gradeColors[letter] || gradeColors['—'];
  const sizeClass = size === 'sm' ? 'text-[10px] px-2.5 py-0.5' : 'text-xs px-3 py-1';

  return (
    <span className={`inline-flex items-center gap-1 font-bold rounded-full border ${sizeClass} ${colors}`}>
      <span>⭐</span>
      <span>{letter}</span>
      {num !== null && (
        <span className="opacity-75 font-semibold">({num.toFixed(1)}/10)</span>
      )}
    </span>
  );
}
