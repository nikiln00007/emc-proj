import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import TeacherLayout from '../../components/teacher/TeacherLayout';
import GradePill from '../../components/teacher/GradePill';
import StatusBadge from '../../components/teacher/StatusBadge';
import api from '../../utils/api';
import { gradeCellColor, exportGradebookCSV } from '../../utils/gradeHelpers';

export default function Gradebook() {
  const [students, setStudents] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [search, setSearch]     = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/api/teacher/gradebook');
        setStudents(data.students || []);
        setProjects(data.projects || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = students.filter(row =>
    !search.trim() ||
    row.student?.name?.toLowerCase().includes(search.toLowerCase()) ||
    row.student?.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleExport = () => exportGradebookCSV(students, projects);

  return (
    <TeacherLayout>
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 bg-emerald-100 border border-emerald-200
          text-emerald-800 text-xs font-extrabold px-3 py-1 rounded-full mb-3">
          📗 Gradebook
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Student Gradebook</h1>
            <p className="text-gray-500 text-sm mt-1">
              {students.length} students · {projects.length} submitted projects
            </p>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white
              text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm flex-shrink-0"
          >
            ⬇️ Export CSV
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
        <input
          type="search"
          placeholder="Search students..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="form-input text-sm max-w-sm"
        />
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-4 mb-4 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mb-4 text-xs text-gray-500 font-semibold">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-emerald-200 inline-block" /> High (≥8.5)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-blue-200 inline-block" /> Good (7–8.4)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-amber-200 inline-block" /> Pass (5–6.9)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-red-200 inline-block" /> Low (&lt;5)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-gray-100 inline-block" /> Not graded
        </span>
      </div>

      {/* Gradebook matrix */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider w-48 sticky left-0 bg-gray-50 z-10">
                  Student
                </th>
                <th className="px-4 py-3 text-center text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                  Avg Grade
                </th>
                {projects.map(p => (
                  <th key={p._id}
                    className="px-3 py-3 text-left text-xs font-extrabold text-gray-400 uppercase tracking-wider max-w-[140px] min-w-[120px]">
                    <span className="line-clamp-2">{p.title}</span>
                    <div className="mt-1">
                      <StatusBadge status={p.evaluationStatus} size="sm" showIcon={false} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-gray-50 animate-pulse">
                  {[...Array(projects.length + 2)].map((_, j) => (
                    <td key={j} className="px-4 py-4">
                      <div className="skeleton h-4 w-full rounded" />
                    </td>
                  ))}
                </tr>
              ))}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={projects.length + 2} className="py-12 text-center">
                    <p className="text-gray-400 font-semibold">No students found</p>
                  </td>
                </tr>
              )}

              {!loading && filtered.map(row => (
                <tr key={row.student?.firebaseUid || row.student?._id}
                  className="border-b border-gray-50 hover:bg-gray-50/40 transition-colors">
                  {/* Student */}
                  <td className="px-4 py-3 sticky left-0 bg-white z-10 border-r border-gray-50">
                    <div className="flex items-center gap-2.5">
                      {row.student?.profileImage ? (
                        <img src={row.student.profileImage} alt=""
                          className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-pink-400
                          flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {(row.student?.name || 'S')[0].toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-800">{row.student?.name}</p>
                        <p className="text-[10px] text-gray-400 truncate max-w-[110px]">
                          {row.student?.email}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Avg grade */}
                  <td className="px-4 py-3 text-center">
                    {row.averageGrade !== null ? (
                      <GradePill grade={row.averageGrade} letterGrade={row.letterGrade} size="sm" />
                    ) : (
                      <span className="text-gray-300 font-medium">—</span>
                    )}
                  </td>

                  {/* Per-project cells */}
                  {projects.map(p => {
                    const ev = row.evaluations?.[p._id] || row.evaluations?.[String(p._id)];
                    const grade = ev?.grade;
                    const letter = ev?.letterGrade;

                    return (
                      <td key={p._id} className="px-3 py-3 text-center">
                        {ev ? (
                          <Link to={`/teacher/evaluations/${ev._id}`}>
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg font-bold cursor-pointer
                              hover:opacity-80 transition-opacity text-[10px] ${gradeCellColor(grade)}`}>
                              {grade !== null && grade !== undefined ? (
                                <>{Number(grade).toFixed(1)} · {letter}</>
                              ) : (
                                <StatusBadge status={ev.status} size="sm" showIcon={false} />
                              )}
                            </span>
                          </Link>
                        ) : (
                          <span className="text-gray-200 font-bold text-base">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </TeacherLayout>
  );
}
