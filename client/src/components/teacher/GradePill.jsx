import { numericToLetter, gradeColors } from '../../utils/gradeHelpers';

/**
 * GradePill — shows numeric + letter grade.
 * @param {number|null} grade - 0-10
 * @param {string} letterGrade - e.g. 'A+'
 * @param {string} size - 'sm' | 'md'
 */
export default function GradePill({ grade, letterGrade, size = 'md' }) {
  const letter = letterGrade || numericToLetter(grade);
  const colors = gradeColors[letter] || gradeColors['—'];
  const sizeClass = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-3 py-1';

  return (
    <span className={`inline-flex items-center gap-1 font-bold rounded-full border ${sizeClass} ${colors}`}>
      <span>⭐</span>
      <span>{letter}</span>
      {grade !== null && grade !== undefined && (
        <span className="opacity-70">({Number(grade).toFixed(1)}/10)</span>
      )}
    </span>
  );
}
