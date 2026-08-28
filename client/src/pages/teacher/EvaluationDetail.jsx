import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import TeacherLayout from '../../components/teacher/TeacherLayout';
import StatusBadge from '../../components/teacher/StatusBadge';
import GradePill from '../../components/teacher/GradePill';
import RubricEditor from '../../components/teacher/RubricEditor';
import api from '../../utils/api';
import { numericToLetter, rubricTotalToGrade, DEFAULT_RUBRIC } from '../../utils/gradeHelpers';

const TAG_COLORS = [
  'bg-orange-100 text-orange-700','bg-purple-100 text-purple-700',
  'bg-teal-100 text-teal-700','bg-pink-100 text-pink-700',
  'bg-blue-100 text-blue-700','bg-green-100 text-green-700',
];
const tagColor = (tag) => {
  let h = 0;
  for (let c of tag) h = c.charCodeAt(0) + ((h << 5) - h);
  return TAG_COLORS[Math.abs(h) % TAG_COLORS.length];
};

import { getLocalProjectById, getProjectEvaluation, saveProjectEvaluation, getLocalProjects } from '../../utils/projectStorage';

export default function EvaluationDetail() {
  const { id }    = useParams();
  const navigate  = useNavigate();

  const [evaluation, setEvaluation] = useState(null);
  const [project, setProject]       = useState(null);
  const [student, setStudent]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [toast, setToast]           = useState('');
  const [error, setError]           = useState('');

  // Grading form state
  const [grade, setGrade]           = useState('');
  const [rubric, setRubric]         = useState(DEFAULT_RUBRIC);
  const [feedback, setFeedback]     = useState('');
  const [privateNotes, setPrivate]  = useState('');
  const [status, setStatus]         = useState('in_review');

  const letterGrade = numericToLetter(Number(grade));

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    // Preload from local project storage
    let localProj = getLocalProjectById(id);
    if (!localProj) {
      const all = getLocalProjects();
      localProj = all.find(p => p._id === id || p.title?.toLowerCase().includes(id.toLowerCase()));
    }
    const localEv = getProjectEvaluation(id) || {};

    if (localProj) {
      setProject(localProj);
      setStudent(localProj.owner || null);
      if (localEv.grade !== undefined) setGrade(localEv.grade.toString());
      if (localEv.rubric?.length) setRubric(localEv.rubric);
      if (localEv.feedback) setFeedback(localEv.feedback);
      if (localEv.privateNotes) setPrivate(localEv.privateNotes);
      if (localEv.status) setStatus(localEv.status);
      setEvaluation({
        _id: localEv._id || id,
        project: localProj,
        student: localProj.owner,
        status: localEv.status || 'in_review',
        grade: localEv.grade,
        letterGrade: localEv.letterGrade || (localEv.grade ? numericToLetter(localEv.grade) : ''),
        rubric: localEv.rubric || DEFAULT_RUBRIC,
        feedback: localEv.feedback || '',
        privateNotes: localEv.privateNotes || '',
      });
    }

    try {
      const { data } = await api.get(`/api/teacher/evaluations/${id}`);
      if (data) {
        setEvaluation(data);
        if (data.project) setProject(data.project);
        if (data.student) setStudent(data.student);
        if (data.grade !== null && data.grade !== undefined) setGrade(data.grade.toString());
        if (data.rubric?.length) setRubric(data.rubric);
        if (data.feedback) setFeedback(data.feedback);
        if (data.privateNotes) setPrivate(data.privateNotes);
        if (data.status) setStatus(data.status);
      }
    } catch (e) {
      console.warn('Backend evaluation note, using local project data:', e.message);
      if (!localProj) {
        setError('Project or submission not found.');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // Keyboard shortcuts: G = focus grade, S = save draft, N = next pending
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'g' || e.key === 'G') document.getElementById('grade-input')?.focus();
      if (e.key === 's' || e.key === 'S') handleSave('in_review');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Auto-compute grade from rubric
  const handleRubricChange = (newRubric) => {
    setRubric(newRubric);
    const computed = rubricTotalToGrade(newRubric);
    if (computed > 0) setGrade(computed.toString());
  };

  const handleSave = async (saveStatus = status) => {
    setSaving(true);
    const payload = {
      grade: grade !== '' ? Number(grade) : undefined,
      letterGrade: grade !== '' ? numericToLetter(Number(grade)) : '',
      rubric,
      feedback,
      privateNotes,
      status: saveStatus,
      evaluatorName: 'Faculty Reviewer',
      totalScore: grade !== '' ? Math.round(Number(grade) * 10) : 80,
    };

    // Save locally first for 100% offline & instant reliability
    saveProjectEvaluation(id, payload);
    setEvaluation(prev => ({ ...(prev || {}), ...payload, status: saveStatus }));
    setStatus(saveStatus);

    try {
      const { data } = await api.patch(`/api/teacher/evaluations/${id}`, payload);
      if (data) {
        setEvaluation(data);
        setStatus(data.status);
      }
      showToast(saveStatus === 'graded' ? '✅ Grade published to student!' : '💾 Draft saved!');
    } catch (e) {
      // If patch fails, try create endpoint
      try {
        await api.post('/api/teacher/evaluations', { projectId: id, ...payload });
        showToast(saveStatus === 'graded' ? '✅ Grade published to student!' : '💾 Draft saved!');
      } catch (err) {
        showToast('✅ Saved locally (will sync when online)');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <TeacherLayout>
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </TeacherLayout>
  );

  if (error || !evaluation) return (
    <TeacherLayout>
      <div className="text-center py-16">
        <div className="text-4xl mb-3">😕</div>
        <p className="font-bold text-gray-700 mb-4">{error || 'Evaluation not found'}</p>
        <Link to="/teacher/pending" className="btn-primary">← Back to Queue</Link>
      </div>
    </TeacherLayout>
  );

  const date = new Date(project?.createdAt).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });

  return (
    <TeacherLayout>
      {/* Toast */}
      {toast && (
        <div className="fixed top-20 right-4 z-50 bg-gray-900 text-white text-sm font-semibold
          px-4 py-2.5 rounded-xl shadow-xl transition-all animate-bounce-in">
          {toast}
        </div>
      )}

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link to="/teacher/pending" className="hover:text-orange-500">Pending Reviews</Link>
        <span>/</span>
        <span className="text-gray-600 font-medium line-clamp-1">{project?.title}</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── LEFT: Project View (60%) ─────────────────────────── */}
        <div className="lg:w-[60%] space-y-5">
          {/* Project header card */}
          <div className="card p-7">
            <div className="h-1.5 rounded-full bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400 mb-6" />
            <h1 className="text-2xl font-extrabold text-gray-900 mb-4 leading-tight">
              {project?.title}
            </h1>

            {/* Student profile snippet */}
            <div className="flex items-center gap-3 mb-5 bg-indigo-50/60 border border-indigo-100 rounded-xl p-3">
              {(student?.profileImage || project?.owner?.profileImage) ? (
                <img
                  src={student?.profileImage || project?.owner?.profileImage}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-400
                  flex items-center justify-center text-white font-bold">
                  {(student?.name || project?.owner?.name || 'S')[0].toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-bold text-gray-900 text-sm">
                  {student?.name || project?.owner?.name}
                </p>
                <p className="text-xs text-gray-500">{student?.email || project?.owner?.name}</p>
              </div>
              <div className="ml-auto">
                <StatusBadge status={evaluation.status} />
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-5">
              {project?.tags?.map(tag => (
                <span key={tag} className={`tag-pill text-sm px-3 py-1 ${tagColor(tag)}`}>{tag}</span>
              ))}
            </div>

            {/* Description */}
            <p className="text-gray-700 leading-relaxed text-[15px] whitespace-pre-line mb-6">
              {project?.description}
            </p>

            {/* Links */}
            <div className="flex gap-3">
              {project?.githubUrl && (
                <a href={project.githubUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 text-white
                    text-xs font-semibold hover:bg-gray-700 transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                  GitHub
                </a>
              )}
              {project?.liveDemoUrl && (
                <a href={project.liveDemoUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl
                    bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs font-semibold
                    hover:opacity-90 transition-opacity">
                  🚀 Live Demo
                </a>
              )}
            </div>
          </div>

          {/* Rubric display (read-only existing) */}
          {evaluation.status === 'graded' && evaluation.rubric?.length > 0 && (
            <div className="card p-6">
              <h3 className="font-extrabold text-gray-900 text-sm uppercase tracking-wide mb-4">
                Published Rubric Scores
              </h3>
              <RubricEditor rubric={evaluation.rubric} readOnly />
            </div>
          )}
        </div>

        {/* ── RIGHT: Grading Panel (40%) ─── sticky ─────────────── */}
        <div className="lg:w-[40%]">
          <div className="sticky top-20 bg-white rounded-2xl border border-gray-100 shadow-lg p-6 space-y-5">
            {/* Panel header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <p className="text-xs font-extrabold text-orange-500 uppercase tracking-wider">
                  Evaluation Panel
                </p>
                <h2 className="text-lg font-extrabold text-gray-900">Grade this Project</h2>
              </div>
              {evaluation.status === 'graded' && evaluation.grade !== null && (
                <GradePill grade={evaluation.grade} letterGrade={evaluation.letterGrade} />
              )}
            </div>

            {/* Keyboard hints */}
            <div className="flex gap-2 text-[10px] text-gray-400">
              <span className="bg-gray-100 px-2 py-0.5 rounded font-mono font-bold">G</span>
              <span>Focus Grade</span>
              <span className="bg-gray-100 px-2 py-0.5 rounded font-mono font-bold ml-2">S</span>
              <span>Save Draft</span>
            </div>

            {/* Status selector */}
            <div>
              <label className="form-label">Evaluation Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="form-input text-sm"
              >
                <option value="in_review">🔍 In Review</option>
                <option value="needs_revision">🔄 Needs Revision</option>
                <option value="graded">✅ Graded</option>
              </select>
            </div>

            {/* Numeric grade input */}
            <div>
              <label className="form-label">
                Numeric Grade (0–10)
                {grade && (
                  <span className="ml-2 text-xs font-bold text-orange-500">
                    → {letterGrade}
                  </span>
                )}
              </label>
              <input
                id="grade-input"
                type="number"
                min={0}
                max={10}
                step={0.1}
                value={grade}
                onChange={e => setGrade(e.target.value)}
                placeholder="e.g. 8.5"
                className="form-input text-sm"
              />
              {grade && (
                <div className="mt-2">
                  <GradePill grade={Number(grade)} letterGrade={letterGrade} />
                </div>
              )}
            </div>

            {/* Rubric editor */}
            <div>
              <label className="form-label">Rubric Scoring</label>
              <RubricEditor rubric={rubric} onChange={handleRubricChange} />
            </div>

            {/* Student Feedback */}
            <div>
              <label className="form-label">
                Feedback to Student
                <span className="ml-1 text-[10px] text-gray-400 font-normal">(visible to student)</span>
              </label>
              <textarea
                rows={4}
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                placeholder="Constructive feedback the student will see..."
                className="form-input resize-none text-sm"
              />
            </div>

            {/* Private Notes */}
            <div>
              <label className="form-label">
                Private Notes
                <span className="ml-1 text-[10px] text-rose-400 font-semibold">(teacher only)</span>
              </label>
              <textarea
                rows={3}
                value={privateNotes}
                onChange={e => setPrivate(e.target.value)}
                placeholder="Internal notes — never shown to students..."
                className="form-input resize-none text-sm border-rose-200 focus:ring-rose-200 bg-rose-50/30"
              />
            </div>

            {/* Action buttons */}
            <div className="space-y-2 pt-1">
              <button
                onClick={() => handleSave('graded')}
                disabled={saving || !grade}
                className="w-full btn-primary justify-center py-3 disabled:opacity-50"
              >
                {saving ? 'Publishing...' : '✅ Publish Grade to Student'}
              </button>
              <button
                onClick={() => handleSave('needs_revision')}
                disabled={saving}
                className="w-full py-2.5 rounded-xl text-sm font-bold border-2 border-rose-200
                  text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors"
              >
                🔄 Request Revision
              </button>
              <button
                onClick={() => handleSave('in_review')}
                disabled={saving}
                className="w-full btn-secondary justify-center py-2.5"
              >
                💾 Save Draft
              </button>
            </div>
          </div>
        </div>
      </div>
    </TeacherLayout>
  );
}
