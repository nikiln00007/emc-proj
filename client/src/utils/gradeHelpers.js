/**
 * gradeHelpers.js
 * Utility functions for grade computation, status colors, and formatting.
 */

/** Convert numeric 0-10 grade to letter grade */
export const numericToLetter = (grade) => {
  if (grade === null || grade === undefined || isNaN(grade)) return '—';
  const num = Number(grade);
  if (num >= 9.5) return 'A+';
  if (num >= 9.0) return 'A';
  if (num >= 8.5) return 'A-';
  if (num >= 8.0) return 'B+';
  if (num >= 7.5) return 'B';
  if (num >= 7.0) return 'B-';
  if (num >= 6.0) return 'C';
  if (num >= 5.0) return 'D';
  return 'F';
};

/** Color classes for letter grades */
export const gradeColors = {
  'A+': 'bg-emerald-100 text-emerald-800 border-emerald-300',
  'A':  'bg-green-100 text-green-800 border-green-300',
  'A-': 'bg-teal-100 text-teal-800 border-teal-300',
  'B+': 'bg-blue-100 text-blue-800 border-blue-300',
  'B':  'bg-indigo-100 text-indigo-800 border-indigo-300',
  'B-': 'bg-sky-100 text-sky-800 border-sky-300',
  'C':  'bg-amber-100 text-amber-800 border-amber-300',
  'D':  'bg-orange-100 text-orange-800 border-orange-300',
  'F':  'bg-red-100 text-red-800 border-red-300',
  '—':  'bg-gray-100 text-gray-600 border-gray-200',
};

/** Cell color for gradebook grid */
export const gradeCellColor = (grade) => {
  if (grade === null || grade === undefined) return 'bg-gray-50 text-gray-400';
  const num = Number(grade);
  if (num >= 8.5) return 'bg-emerald-100 text-emerald-800';
  if (num >= 7.0) return 'bg-blue-100 text-blue-800';
  if (num >= 5.0) return 'bg-amber-100 text-amber-800';
  return 'bg-red-100 text-red-800';
};

/** Status color classes */
export const statusStyles = {
  pending:        { bg: 'bg-amber-100',  text: 'text-amber-800',  border: 'border-amber-300',  dot: 'bg-amber-500',  label: 'Pending',         icon: '⏳' },
  in_review:      { bg: 'bg-blue-100',   text: 'text-blue-800',   border: 'border-blue-300',   dot: 'bg-blue-500',   label: 'In Review',       icon: '🔍' },
  needs_revision: { bg: 'bg-rose-100',   text: 'text-rose-800',   border: 'border-rose-300',   dot: 'bg-rose-500',   label: 'Needs Revision',  icon: '🔄' },
  graded:         { bg: 'bg-emerald-100',text: 'text-emerald-800',border: 'border-emerald-300',dot: 'bg-emerald-500',label: 'Graded',           icon: '✅' },
  not_submitted:  { bg: 'bg-gray-100',   text: 'text-gray-600',   border: 'border-gray-200',   dot: 'bg-gray-400',   label: 'Not Submitted',   icon: '📝' },
};

/** Format wait time from a date string */
export const formatWaitTime = (submittedAt) => {
  if (!submittedAt) return '';
  const ms = Date.now() - new Date(submittedAt).getTime();
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor(ms / (1000 * 60 * 60));
  if (days > 0) return `${days}d waiting`;
  if (hours > 0) return `${hours}h waiting`;
  return 'Just submitted';
};

/** Default rubric template for new evaluations */
export const DEFAULT_RUBRIC = [
  { criterion: 'Code Quality & Architecture', maxScore: 25, score: 20, comment: '' },
  { criterion: 'UI/UX & Responsiveness',       maxScore: 25, score: 20, comment: '' },
  { criterion: 'Innovation & Features',         maxScore: 25, score: 20, comment: '' },
  { criterion: 'Documentation & Git',           maxScore: 25, score: 20, comment: '' },
];

/** Convert rubric score (0-100) to 0-10 numeric grade */
export const rubricTotalToGrade = (rubric) => {
  const total = rubric.reduce((acc, r) => acc + Number(r.score || 0), 0);
  const max   = rubric.reduce((acc, r) => acc + Number(r.maxScore || 0), 0);
  if (!max) return 0;
  return Number(((total / max) * 10).toFixed(1));
};

/** Export gradebook matrix to CSV */
export const exportGradebookCSV = (students, projects) => {
  const headers = ['Student', 'Email', 'Avg Grade', 'Letter', ...projects.map(p => p.title)];
  const rows = students.map(row => [
    row.student?.name || '—',
    row.student?.email || '—',
    row.averageGrade ?? '—',
    row.letterGrade ?? '—',
    ...projects.map(p => {
      const ev = row.evaluations?.[p._id];
      return ev?.grade ?? '—';
    }),
  ]);

  const csv = [headers, ...rows]
    .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `peerhub-gradebook-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};
