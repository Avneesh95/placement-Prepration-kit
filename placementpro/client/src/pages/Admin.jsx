import { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit,
  Eye,
  Upload,
  Copy,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  X,
  FileCode,
  Layers,
} from 'lucide-react';
import { api, qs } from '../lib/api';
import { Card, Badge, Btn, Spinner, ErrorBox, PageTitle, Empty } from '../components/ui';
import { SUBJECTS, label, PROVENANCE } from '../lib/format';

const DIFFS = ['easy', 'medium', 'hard'];
const COMPS = [
  'tcs',
  'infosys',
  'accenture',
  'wipro',
  'capgemini',
  'cognizant',
  'tech-mahindra',
  'hcltech',
  'ltimindtree',
  'general-sde',
];

export default function Admin() {
  const [activeTab, setActiveTab] = useState('questions'); // 'questions' | 'bulk' | 'duplicates'
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Questions list state
  const [questions, setQuestions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [company, setCompany] = useState('');

  // Modals
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [previewQuestion, setPreviewQuestion] = useState(null);

  // Form State
  const [form, setForm] = useState({
    uid: '',
    text: '',
    subject: 'aptitude',
    topic: 'percentages',
    difficulty: 'easy',
    type: 'mcq_single',
    options: ['', '', '', ''],
    correct: [0],
    numericAnswer: '',
    explanation: '',
    companies: ['tcs', 'infosys'],
    provenance: 'practice',
    sourceTitle: '',
    sourceUrl: '',
    assessmentYear: 2026,
    verificationStatus: 'original',
  });
  const [formBusy, setFormBusy] = useState(false);
  const [formError, setFormError] = useState(null);

  // Bulk Import State
  const [bulkJson, setBulkJson] = useState('');
  const [bulkResult, setBulkResult] = useState(null);
  const [bulkBusy, setBulkBusy] = useState(false);

  // Duplicates State
  const [duplicates, setDuplicates] = useState([]);
  const [loadingDuplicates, setLoadingDuplicates] = useState(false);

  // Load Admin Stats
  const loadStats = async () => {
    try {
      setLoadingStats(true);
      const res = await api.get('/admin/stats');
      setStats(res);
    } catch (e) {
      // ignore
    } finally {
      setLoadingStats(false);
    }
  };

  // Load Questions
  const loadQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      const query = qs({
        page,
        limit: 15,
        q: search || undefined,
        subject: subject || undefined,
        topic: topic || undefined,
        difficulty: difficulty || undefined,
        company: company || undefined,
      });
      const res = await api.get(`/admin/questions${query}`);
      setQuestions(res.items || []);
      setTotal(res.total || 0);
      setPages(res.pages || 1);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'questions') {
      loadQuestions();
    }
  }, [page, subject, topic, difficulty, company, activeTab]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadQuestions();
  };

  // Open Form for Add
  const handleAddNew = () => {
    setEditingQuestion(null);
    setForm({
      uid: `admin-${subject || 'aptitude'}-${Date.now().toString(36)}`,
      text: '',
      subject: subject || 'aptitude',
      topic: topic || 'percentages',
      difficulty: 'easy',
      type: 'mcq_single',
      options: ['', '', '', ''],
      correct: [0],
      numericAnswer: '',
      explanation: '',
      companies: ['tcs', 'infosys'],
      provenance: 'practice',
      sourceTitle: '',
      sourceUrl: '',
      assessmentYear: 2026,
      verificationStatus: 'original',
    });
    setFormError(null);
    setEditorOpen(true);
  };

  // Open Form for Edit
  const handleEdit = (q) => {
    setEditingQuestion(q);
    setForm({
      uid: q.uid,
      text: q.text,
      subject: q.subject,
      topic: q.topic,
      difficulty: q.difficulty,
      type: q.type,
      options: q.options || ['', '', '', ''],
      correct: q.correct || [0],
      numericAnswer: q.numericAnswer ?? '',
      explanation: q.explanation || '',
      companies: q.companies || ['tcs'],
      provenance: q.provenance || 'practice',
      sourceTitle: q.sourceTitle || '',
      sourceUrl: q.sourceUrl || '',
      assessmentYear: q.assessmentYear || 2026,
      verificationStatus: q.verificationStatus || 'original',
    });
    setFormError(null);
    setEditorOpen(true);
  };

  // Save (Create or Update)
  const handleSave = async (e) => {
    e.preventDefault();
    setFormBusy(true);
    setFormError(null);
    try {
      const payload = {
        ...form,
        numericAnswer: form.type === 'numeric' ? Number(form.numericAnswer) : undefined,
      };
      if (editingQuestion) {
        await api.put(`/admin/questions/${editingQuestion._id}`, payload);
      } else {
        await api.post('/admin/questions', payload);
      }
      setEditorOpen(false);
      loadQuestions();
      loadStats();
    } catch (err) {
      setFormError(err);
    } finally {
      setFormBusy(false);
    }
  };

  // Delete Question
  const handleDelete = async (id, uid) => {
    if (!window.confirm(`Are you sure you want to delete question '${uid}'?`)) return;
    try {
      await api.del(`/admin/questions/${id}`);
      setQuestions((prev) => prev.filter((q) => q._id !== id));
      setTotal((t) => Math.max(0, t - 1));
      loadStats();
    } catch (e) {
      alert(`Failed to delete: ${e.message}`);
    }
  };

  // Load Duplicates
  const loadDuplicates = async () => {
    try {
      setLoadingDuplicates(true);
      const res = await api.get('/admin/duplicates');
      setDuplicates(res.duplicates || []);
    } catch (e) {
      // ignore
    } finally {
      setLoadingDuplicates(false);
    }
  };

  // Bulk Import Submit
  const handleBulkImport = async () => {
    setBulkBusy(true);
    setBulkResult(null);
    try {
      const parsed = JSON.parse(bulkJson);
      if (!Array.isArray(parsed)) throw new Error('Input must be a JSON array of question objects.');
      const res = await api.post('/admin/questions/bulk', { questions: parsed });
      setBulkResult(res);
      loadStats();
    } catch (e) {
      setBulkResult({ error: e.message || 'Invalid JSON format' });
    } finally {
      setBulkBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageTitle
        breadcrumb="Administration"
        title="Question Bank Admin Console"
        sub="Manage, audit, create, bulk import, and validate questions across all categories and companies."
        right={
          <div className="flex items-center gap-2">
            <Btn size="sm" onClick={handleAddNew}>
              <Plus className="h-4 w-4" />
              <span>Add Question</span>
            </Btn>
          </div>
        }
      />

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card className="p-4">
            <div className="text-xs font-semibold text-slate-500 dark:text-gray-400">Total Questions</div>
            <div className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{stats.total}</div>
            <div className="mt-1 text-[11px] text-emerald-600 font-bold">{stats.active} Active in Bank</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs font-semibold text-slate-500 dark:text-gray-400">Original Practice</div>
            <div className="mt-1 text-2xl font-black text-sky-600 dark:text-sky-400">{stats.practiceCount}</div>
            <div className="mt-1 text-[11px] text-slate-400">Curated & Generated</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs font-semibold text-slate-500 dark:text-gray-400">Verified PYQ Items</div>
            <div className="mt-1 text-2xl font-black text-amber-600 dark:text-amber-400">{stats.verifiedPyqCount}</div>
            <div className="mt-1 text-[11px] text-slate-400">Evidence Backed</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs font-semibold text-slate-500 dark:text-gray-400">Subjects</div>
            <div className="mt-1 text-2xl font-black text-purple-600 dark:text-purple-400">
              {Object.keys(stats.bySubject || {}).length}
            </div>
            <div className="mt-1 text-[11px] text-slate-400">Apt, Reas, CS, Eng, Code, SQL</div>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-gray-800">
        <button
          type="button"
          onClick={() => setActiveTab('questions')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition ${
            activeTab === 'questions'
              ? 'border-sky-500 text-sky-600 dark:border-sky-400 dark:text-sky-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-gray-400'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>All Questions ({total})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('bulk')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition ${
            activeTab === 'bulk'
              ? 'border-sky-500 text-sky-600 dark:border-sky-400 dark:text-sky-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-gray-400'
          }`}
        >
          <Upload className="h-4 w-4" />
          <span>Bulk JSON Import</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('duplicates');
            loadDuplicates();
          }}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition ${
            activeTab === 'duplicates'
              ? 'border-sky-500 text-sky-600 dark:border-sky-400 dark:text-sky-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-gray-400'
          }`}
        >
          <Copy className="h-4 w-4" />
          <span>Duplicate Detection</span>
        </button>
      </div>

      {/* TAB 1: ALL QUESTIONS LIST */}
      {activeTab === 'questions' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="card grid gap-2.5 sm:grid-cols-2 lg:grid-cols-5 p-3">
            <form onSubmit={handleSearchSubmit} className="relative lg:col-span-2">
              <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                className="input pl-9 text-xs"
                placeholder="Search text or UID…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </form>

            <select
              className="input text-xs"
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Subjects</option>
              {SUBJECTS.map(([k, n]) => (
                <option key={k} value={k}>
                  {n}
                </option>
              ))}
            </select>

            <select
              className="input text-xs"
              value={difficulty}
              onChange={(e) => {
                setDifficulty(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Any Difficulty</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>

            <select
              className="input text-xs"
              value={company}
              onChange={(e) => {
                setCompany(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Companies</option>
              {COMPS.map((c) => (
                <option key={c} value={c}>
                  {c.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Table */}
          {loading ? (
            <Spinner label="Loading questions…" />
          ) : error ? (
            <ErrorBox error={error} onRetry={loadQuestions} />
          ) : questions.length === 0 ? (
            <Empty title="No questions found">Try relaxing your search query or filters.</Empty>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-gray-800 dark:bg-gray-900">
              <table className="w-full text-left text-xs text-slate-700 dark:text-gray-300">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-gray-800 dark:bg-gray-800/60 dark:text-gray-400">
                  <tr>
                    <th className="px-4 py-3">UID</th>
                    <th className="px-4 py-3">Subject / Topic</th>
                    <th className="px-4 py-3">Question Text</th>
                    <th className="px-4 py-3">Diff</th>
                    <th className="px-4 py-3">Provenance</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-gray-800/80">
                  {questions.map((q) => (
                    <tr key={q._id} className="hover:bg-slate-50/50 dark:hover:bg-gray-800/40 transition">
                      <td className="px-4 py-3 font-mono font-bold text-[11px] text-slate-900 dark:text-gray-100">
                        {q.uid}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-900 dark:text-gray-200">{q.subject}</span>
                        <div className="text-[10px] text-slate-400">{label(q.topic)}</div>
                      </td>
                      <td className="px-4 py-3 max-w-xs truncate" title={q.text}>
                        {q.text}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          tone={q.difficulty === 'hard' ? 'red' : q.difficulty === 'medium' ? 'amber' : 'green'}
                        >
                          {q.difficulty}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={q.provenance === 'verified_pyq' ? 'green' : 'blue'}>
                          {q.provenance}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPreviewQuestion(q)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-gray-800 transition"
                            title="Preview question"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEdit(q)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-sky-600 dark:hover:bg-gray-800 transition"
                            title="Edit question"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(q._id, q.uid)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 transition"
                            title="Delete question"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="flex items-center justify-between border-t border-slate-200 p-3 text-xs dark:border-gray-800">
                <span className="text-slate-500 dark:text-gray-400">
                  Showing <b>{questions.length}</b> of <b>{total}</b>
                </span>
                <div className="flex items-center gap-2">
                  <Btn
                    variant="ghost"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Btn>
                  <span className="font-semibold text-slate-700 dark:text-gray-300">
                    Page {page} of {pages}
                  </span>
                  <Btn
                    variant="ghost"
                    size="sm"
                    disabled={page >= pages}
                    onClick={() => setPage((p) => Math.min(pages, p + 1))}
                  >
                    Next
                  </Btn>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BULK JSON IMPORT */}
      {activeTab === 'bulk' && (
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Bulk Question Import</h2>
              <p className="text-xs text-slate-500">
                Paste an array of question JSON objects. Records are strictly schema-validated before inserting.
              </p>
            </div>
          </div>

          <textarea
            className="input min-h-[300px] font-mono text-xs leading-relaxed"
            placeholder={`[\n  {\n    "uid": "practice-percentages-101",\n    "subject": "aptitude",\n    "topic": "percentages",\n    "type": "mcq_single",\n    "difficulty": "medium",\n    "text": "What is 25% of 640?",\n    "options": ["140", "150", "160", "180"],\n    "correct": [2],\n    "explanation": "25% of 640 = 640 / 4 = 160.",\n    "companies": ["tcs", "infosys"],\n    "provenance": "practice"\n  }\n]`}
            value={bulkJson}
            onChange={(e) => setBulkJson(e.target.value)}
          />

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Supports up to 500 records per batch</span>
            <Btn onClick={handleBulkImport} disabled={!bulkJson.trim() || bulkBusy}>
              {bulkBusy ? 'Importing…' : 'Validate & Import'}
            </Btn>
          </div>

          {bulkResult && (
            <div
              className={`rounded-2xl border p-4 text-xs ${
                bulkResult.ok
                  ? 'border-emerald-200 bg-emerald-50/80 dark:border-emerald-900/60 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-100'
                  : 'border-rose-200 bg-rose-50/80 dark:border-rose-900/60 dark:bg-rose-950/30 text-rose-950 dark:text-rose-100'
              }`}
            >
              {bulkResult.ok ? (
                <div className="space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Import Successful!</span>
                  </div>
                  <div>
                    Inserted: <b>{bulkResult.inserted}</b>, Updated: <b>{bulkResult.updated}</b>
                  </div>
                  {bulkResult.validationErrors?.length > 0 && (
                    <div className="mt-2 text-rose-600 dark:text-rose-400 font-mono text-[11px]">
                      Skipped with errors:
                      <ul className="list-disc pl-4 mt-1 space-y-0.5">
                        {bulkResult.validationErrors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-rose-600" />
                    <span>Import Failed</span>
                  </div>
                  <div>{bulkResult.error || bulkResult.message}</div>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* TAB 3: DUPLICATE DETECTION */}
      {activeTab === 'duplicates' && (
        <div className="space-y-4">
          <Card className="flex items-center justify-between p-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Duplicate Question Scanner</h2>
              <p className="text-xs text-slate-500">
                Scans the question bank for text similarity and duplicate problem statements.
              </p>
            </div>
            <Btn size="sm" variant="ghost" onClick={loadDuplicates} disabled={loadingDuplicates}>
              <RefreshCw className={`h-4 w-4 ${loadingDuplicates ? 'animate-spin' : ''}`} />
              <span>Rescan</span>
            </Btn>
          </Card>

          {loadingDuplicates ? (
            <Spinner label="Scanning for duplicate statements…" />
          ) : duplicates.length === 0 ? (
            <div className="card text-center p-8 text-emerald-600 dark:text-emerald-400 font-semibold text-xs flex flex-col items-center gap-2">
              <CheckCircle2 className="h-6 w-6" />
              <span>Zero duplicate question statements detected! The database is clean.</span>
            </div>
          ) : (
            <div className="space-y-3">
              {duplicates.map((g, i) => (
                <Card key={i} className="border-amber-200 dark:border-amber-900/60 p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-amber-700 dark:text-amber-400">
                      Duplicate Cluster #{i + 1} ({g.count} occurrences)
                    </span>
                  </div>
                  <div className="space-y-1.5 divide-y divide-slate-100 dark:divide-gray-800">
                    {g.questions.map((q) => (
                      <div key={q._id} className="pt-2 flex items-center justify-between gap-3 text-xs">
                        <div>
                          <span className="font-mono font-bold text-slate-900 dark:text-gray-100">{q.uid}</span>
                          <span className="ml-2 text-slate-400">({q.subject} / {q.topic})</span>
                          <p className="text-slate-600 dark:text-gray-300 mt-0.5">{q.text}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDelete(q._id, q.uid)}
                          className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                          title="Delete duplicate"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: ADD / EDIT QUESTION */}
      {editorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-gray-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {editingQuestion ? 'Edit Question' : 'Add New Question'}
              </h2>
              <button
                type="button"
                onClick={() => setEditorOpen(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-gray-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-4 text-xs">
              <ErrorBox error={formError} />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">UID</label>
                  <input
                    className="input text-xs font-mono"
                    value={form.uid}
                    onChange={(e) => setForm({ ...form, uid: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Type</label>
                  <select
                    className="input text-xs"
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                  >
                    <option value="mcq_single">Single Select MCQ</option>
                    <option value="mcq_multi">Multi Select MCQ</option>
                    <option value="numeric">Numeric Answer</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Subject</label>
                  <select
                    className="input text-xs"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  >
                    {SUBJECTS.map(([k, n]) => (
                      <option key={k} value={k}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold block mb-1">Topic Slug</label>
                  <input
                    className="input text-xs"
                    value={form.topic}
                    onChange={(e) => setForm({ ...form, topic: e.target.value })}
                    placeholder="e.g. percentages"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Difficulty</label>
                  <select
                    className="input text-xs"
                    value={form.difficulty}
                    onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Question Statement</label>
                <textarea
                  className="input min-h-[90px] text-xs leading-relaxed"
                  value={form.text}
                  onChange={(e) => setForm({ ...form, text: e.target.value })}
                  required
                />
              </div>

              {form.type !== 'numeric' ? (
                <div className="space-y-2">
                  <label className="font-semibold block">Options (Check the correct answer)</label>
                  {form.options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type={form.type === 'mcq_multi' ? 'checkbox' : 'radio'}
                        name="correctOpt"
                        checked={form.correct.includes(i)}
                        onChange={() => {
                          if (form.type === 'mcq_multi') {
                            setForm({
                              ...form,
                              correct: form.correct.includes(i)
                                ? form.correct.filter((x) => x !== i)
                                : [...form.correct, i],
                            });
                          } else {
                            setForm({ ...form, correct: [i] });
                          }
                        }}
                      />
                      <span className="font-bold text-slate-400 w-4">{String.fromCharCode(65 + i)}</span>
                      <input
                        className="input text-xs flex-1"
                        value={opt}
                        placeholder={`Option ${String.fromCharCode(65 + i)}`}
                        onChange={(e) => {
                          const n = [...form.options];
                          n[i] = e.target.value;
                          setForm({ ...form, options: n });
                        }}
                        required
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  <label className="font-semibold block mb-1">Numeric Answer</label>
                  <input
                    type="number"
                    step="any"
                    className="input text-xs font-mono max-w-xs"
                    value={form.numericAnswer}
                    onChange={(e) => setForm({ ...form, numericAnswer: e.target.value })}
                    required
                  />
                </div>
              )}

              <div>
                <label className="font-semibold block mb-1">Detailed Explanation</label>
                <textarea
                  className="input min-h-[80px] text-xs leading-relaxed"
                  value={form.explanation}
                  onChange={(e) => setForm({ ...form, explanation: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Provenance</label>
                  <select
                    className="input text-xs"
                    value={form.provenance}
                    onChange={(e) => setForm({ ...form, provenance: e.target.value })}
                  >
                    <option value="practice">Practice (Original)</option>
                    <option value="high_priority_practice">High Priority Practice</option>
                    <option value="verified_pyq">Verified PYQ</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold block mb-1">Target Companies</label>
                  <input
                    className="input text-xs"
                    value={form.companies.join(', ')}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        companies: e.target.value.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean),
                      })
                    }
                    placeholder="tcs, infosys, accenture"
                  />
                </div>
              </div>

              {form.provenance === 'verified_pyq' && (
                <div className="grid grid-cols-3 gap-2 rounded-xl bg-amber-50 p-3 dark:bg-amber-950/30">
                  <div>
                    <label className="font-semibold block mb-1">Source URL</label>
                    <input
                      className="input text-xs"
                      value={form.sourceUrl}
                      onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Assessment Year</label>
                    <input
                      type="number"
                      className="input text-xs"
                      value={form.assessmentYear}
                      onChange={(e) => setForm({ ...form, assessmentYear: Number(e.target.value) })}
                      required
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Status</label>
                    <input className="input text-xs" value="verified" readOnly />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-gray-800">
                <Btn variant="ghost" type="button" onClick={() => setEditorOpen(false)}>
                  Cancel
                </Btn>
                <Btn type="submit" disabled={formBusy}>
                  {formBusy ? 'Saving…' : 'Save Question'}
                </Btn>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PREVIEW QUESTION */}
      {previewQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-gray-800">
              <span className="font-mono text-xs font-bold text-slate-500">{previewQuestion.uid}</span>
              <button
                type="button"
                onClick={() => setPreviewQuestion(null)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-gray-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex gap-2">
                <Badge tone="blue">{previewQuestion.subject}</Badge>
                <Badge tone="amber">{previewQuestion.difficulty}</Badge>
                <Badge tone="purple">{previewQuestion.provenance}</Badge>
              </div>
              <p className="text-sm font-medium text-slate-900 dark:text-gray-100">{previewQuestion.text}</p>
              {previewQuestion.options?.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  {previewQuestion.options.map((opt, i) => (
                    <div
                      key={i}
                      className={`p-2 rounded-xl text-xs flex items-center gap-2 border ${
                        previewQuestion.correct?.includes(i)
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200 font-semibold'
                          : 'border-slate-200 dark:border-gray-800'
                      }`}
                    >
                      <span className="font-bold">{String.fromCharCode(65 + i)}.</span>
                      <span>{opt}</span>
                      {previewQuestion.correct?.includes(i) && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 ml-auto" />
                      )}
                    </div>
                  ))}
                </div>
              )}
              {previewQuestion.explanation && (
                <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs dark:bg-gray-800/50">
                  <span className="font-bold block text-slate-700 dark:text-gray-300">Explanation:</span>
                  <p className="mt-1 text-slate-600 dark:text-gray-400">{previewQuestion.explanation}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
