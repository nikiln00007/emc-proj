import { useState, useEffect } from 'react';
import { numericToLetter, DEFAULT_RUBRIC, rubricTotalToGrade } from '../../utils/gradeHelpers';

/**
 * RubricEditor — interactive criteria scoring panel with sliders + comment inputs.
 * @param {Array}    rubric     - current rubric array
 * @param {Function} onChange   - callback(updatedRubric)
 * @param {boolean}  readOnly   - display-only mode
 */
export default function RubricEditor({ rubric, onChange, readOnly = false }) {
  const [rows, setRows] = useState(rubric?.length ? rubric : DEFAULT_RUBRIC);

  useEffect(() => {
    if (rubric?.length) setRows(rubric);
  }, [rubric]);

  const update = (idx, field, val) => {
    const next = rows.map((r, i) => i === idx ? { ...r, [field]: val } : r);
    setRows(next);
    onChange?.(next);
  };

  const total = rows.reduce((acc, r) => acc + Number(r.score || 0), 0);
  const max   = rows.reduce((acc, r) => acc + Number(r.maxScore || 0), 0);
  const grade = rubricTotalToGrade(rows);

  const addCriterion = () => {
    const next = [...rows, { criterion: 'New Criterion', maxScore: 10, score: 0, comment: '' }];
    setRows(next);
    onChange?.(next);
  };

  const removeCriterion = (idx) => {
    const next = rows.filter((_, i) => i !== idx);
    setRows(next);
    onChange?.(next);
  };

  return (
    <div className="space-y-3">
      {rows.map((row, idx) => (
        <div key={idx} className="bg-gray-50 rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-2">
            {readOnly ? (
              <p className="font-semibold text-sm text-gray-800">{row.criterion}</p>
            ) : (
              <input
                type="text"
                value={row.criterion}
                onChange={e => update(idx, 'criterion', e.target.value)}
                className="flex-1 text-sm font-semibold bg-transparent outline-none text-gray-800
                  border-b border-dashed border-gray-300 focus:border-orange-500 pb-0.5 mr-2"
              />
            )}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {readOnly ? (
                <span className="font-black text-lg text-gray-900">
                  {row.score}
                  <span className="text-xs text-gray-400 font-medium"> /{row.maxScore}</span>
                </span>
              ) : (
                <>
                  <input
                    type="number"
                    min={0}
                    max={row.maxScore}
                    value={row.score}
                    onChange={e => update(idx, 'score', Math.min(Number(row.maxScore), Math.max(0, Number(e.target.value))))}
                    className="w-14 text-center font-bold text-sm bg-white border border-gray-300
                      rounded-lg py-1 px-1 focus:border-orange-500 outline-none"
                  />
                  <span className="text-xs text-gray-400 font-medium">/{row.maxScore}</span>
                  <button
                    type="button"
                    onClick={() => removeCriterion(idx)}
                    className="text-gray-300 hover:text-red-400 transition-colors ml-1 text-base"
                    title="Remove criterion"
                  >✕</button>
                </>
              )}
            </div>
          </div>

          {/* Progress bar / Slider */}
          <div className="mb-2">
            {readOnly ? (
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-orange-400 to-pink-500 transition-all"
                  style={{ width: `${Math.round((Number(row.score) / Number(row.maxScore)) * 100)}%` }}
                />
              </div>
            ) : (
              <input
                type="range"
                min={0}
                max={row.maxScore}
                step={0.5}
                value={row.score}
                onChange={e => update(idx, 'score', Number(e.target.value))}
                className="w-full accent-orange-500 cursor-pointer"
              />
            )}
          </div>

          {/* Comment */}
          {readOnly ? (
            row.comment && (
              <p className="text-xs text-gray-500 italic">"{row.comment}"</p>
            )
          ) : (
            <input
              type="text"
              placeholder="Comment on this criterion (optional)..."
              value={row.comment || ''}
              onChange={e => update(idx, 'comment', e.target.value)}
              className="w-full text-xs bg-white border border-gray-200 rounded-lg px-3 py-1.5
                focus:border-orange-500 outline-none text-gray-700"
            />
          )}
        </div>
      ))}

      {/* Totals */}
      <div className="flex items-center justify-between bg-gradient-to-r from-orange-50 via-pink-50 to-purple-50
        border border-orange-100 rounded-2xl p-4">
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Rubric Total</p>
          <p className="text-2xl font-black text-gray-900">
            {total}
            <span className="text-sm text-gray-400 font-medium"> / {max}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Numeric Grade</p>
          <p className="text-2xl font-black text-orange-600">
            {grade}
            <span className="text-sm text-gray-400 font-medium"> / 10</span>
          </p>
        </div>
      </div>

      {!readOnly && (
        <button
          type="button"
          onClick={addCriterion}
          className="w-full py-2 rounded-xl text-xs font-bold text-gray-500 border-2 border-dashed
            border-gray-200 hover:border-orange-400 hover:text-orange-500 transition-all"
        >
          + Add Criterion
        </button>
      )}
    </div>
  );
}
