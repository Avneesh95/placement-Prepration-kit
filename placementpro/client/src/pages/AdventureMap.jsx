import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  MapPin,
  Sparkles,
  Lock,
  CheckCircle2,
  Play,
  FileText,
  Award,
  ChevronRight,
  Zap,
  Target,
  BookOpen,
} from 'lucide-react';
import { useGet } from '../lib/useApi';
import { PageTitle, Card, Badge, Btn, Spinner, ErrorBox } from '../components/ui';
import { label, SUBJECTS } from '../lib/format';

const MAP_NODES = [
  {
    id: 'node_aptitude',
    title: 'Quantitative Realm',
    subject: 'aptitude',
    icon: '⚡',
    coord: { x: 12, y: 70 },
    region: 'Aptitude Isle',
    desc: 'Percentages, Profit & Loss, Speed & Distance, SI & CI',
    formulaSlug: 'quant-formula-handbook',
  },
  {
    id: 'node_reasoning',
    title: 'Logic Highlands',
    subject: 'reasoning',
    icon: '🔮',
    coord: { x: 28, y: 40 },
    region: 'Valley of deduction',
    desc: 'Syllogisms, Blood Relations, Coding-Decoding & Puzzles',
    formulaSlug: 'reasoning-quick-notes',
  },
  {
    id: 'node_english',
    title: 'Verbal Citadel',
    subject: 'english',
    icon: '📜',
    coord: { x: 44, y: 65 },
    region: 'Grammar Sanctuaries',
    desc: 'Reading Comprehension, Error Detection & Vocabulary',
    formulaSlug: 'verbal-ability-notes',
  },
  {
    id: 'node_cs',
    title: 'Core Architecture',
    subject: 'cs',
    icon: '🏛️',
    coord: { x: 60, y: 35 },
    region: 'Engineering Fortress',
    desc: 'OOP Pillars, ACID Properties, Normalization, OS & TCP/IP',
    formulaSlug: 'cs-fundamentals-handbook',
  },
  {
    id: 'node_coding',
    title: 'Algorithm Caverns',
    subject: 'coding',
    icon: '⚔️',
    coord: { x: 74, y: 68 },
    region: 'Data Structure Dungeons',
    desc: 'Sorting, Two Pointers, Trees, Hash Maps & Big-O Optimization',
    formulaSlug: 'dsa-time-complexity-cheat-sheet',
  },
  {
    id: 'node_company',
    title: 'Company Colosseum',
    subject: 'general',
    icon: '🏰',
    coord: { x: 88, y: 38 },
    region: 'Grand Final Exam Peak',
    desc: 'Full-length Mock Tests for TCS NQT, Infosys, Accenture & Cognizant',
    formulaSlug: 'tcs-nqt-placement-guide',
  },
];

export default function AdventureMap() {
  const nav = useNavigate();
  const [selectedNode, setSelectedNode] = useState(MAP_NODES[0]);

  const profile = useGet('/profile');
  const stats = profile.data?.stats;
  const subjects = stats?.subjects || {};

  return (
    <div className="space-y-6">
      <PageTitle
        breadcrumb="Adventure Map"
        title="Placement Odyssey & Skill Map"
        sub="Embark on the interactive placement learning journey. Progress through skill islands, conquer company milestones, and unlock exam mastery."
      />

      {/* Gamification Level Status Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-sky-200/80 bg-gradient-to-r from-sky-500/10 via-purple-500/10 to-amber-500/10 p-4 dark:border-[#263b55] dark:from-sky-950/40 dark:via-purple-950/30 dark:to-amber-950/20">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-tr from-purple-600 to-sky-500 text-2xl shadow-md">
            🗺️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                Explorer Tier {stats?.gamification?.level || 1}
              </span>
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-300">
                ⭐ {stats?.gamification?.xp || 0} XP
              </span>
            </div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              {stats?.gamification?.title || 'Beginner Explorer'}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-36 sm:w-48">
            <div className="flex justify-between text-[11px] font-bold text-slate-600 dark:text-slate-300">
              <span>Next Rank</span>
              <span>{stats?.gamification?.progressPct || 0}%</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-sky-500 transition-all duration-500"
                style={{ width: `${stats?.gamification?.progressPct || 5}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive Illustrated Canvas */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-[#e8f2fe] p-6 shadow-xl dark:border-[#263b55] dark:bg-[#0b172a]">
        {/* Decorative Topographic Background Layers */}
        <div className="pointer-events-none absolute inset-0 opacity-40 dark:opacity-20">
          <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-sky-400 dark:text-sky-600" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-pattern)" />
          </svg>
        </div>

        {/* Winding Adventure Path (SVG Vector) */}
        <div className="relative h-[360px] sm:h-[420px] w-full">
          <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
            {/* Ambient River / Road Track */}
            <path
              d="M 12 70 Q 20 45 28 40 T 44 65 T 60 35 T 74 68 T 88 38"
              fill="none"
              stroke="rgba(14, 165, 233, 0.25)"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <path
              d="M 12 70 Q 20 45 28 40 T 44 65 T 60 35 T 74 68 T 88 38"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2.5"
              strokeDasharray="4 4"
              strokeLinecap="round"
              className="animate-pulse"
            />
          </svg>

          {/* Interactive Skill Island Nodes */}
          {MAP_NODES.map((node) => {
            const isSelected = selectedNode.id === node.id;
            const sub = subjects[node.subject] || {};
            const isCompleted = sub.progress >= 80;
            const isStarted = sub.attempted > 0;

            return (
              <div
                key={node.id}
                style={{ left: `${node.coord.x}%`, top: `${node.coord.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-110"
                onClick={() => setSelectedNode(node)}
              >
                <div className="relative flex flex-col items-center">
                  {/* Floating Pulsing Avatar Ring */}
                  <div
                    className={`relative grid h-14 w-14 sm:h-16 sm:w-16 place-items-center rounded-2xl border-2 text-2xl shadow-xl transition-all ${
                      isSelected
                        ? 'border-purple-500 bg-white ring-4 ring-purple-500/30 dark:bg-[#172d49]'
                        : isCompleted
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/60'
                        : 'border-sky-400 bg-white text-slate-800 dark:border-sky-600 dark:bg-[#11243b] dark:text-white'
                    }`}
                  >
                    <span>{node.icon}</span>
                    {isCompleted && (
                      <span className="absolute -top-1.5 -right-1.5 grid h-5 w-5 place-items-center rounded-full bg-emerald-500 text-white">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </div>

                  {/* Node Label Pill */}
                  <div className="mt-2 rounded-xl bg-slate-900/85 px-2.5 py-1 text-center backdrop-blur-md shadow-md">
                    <p className="text-[10px] font-bold text-white whitespace-nowrap">
                      {node.title}
                    </p>
                    <p className="text-[9px] font-medium text-sky-300">
                      {sub.progress ? `${sub.progress}% Mastery` : 'Ready to start'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Skill Realm Detail & Action Panel */}
      {selectedNode && (
        <Card className="border-t-4 border-t-purple-500 p-6">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{selectedNode.icon}</span>
                <Badge tone="purple">{selectedNode.region}</Badge>
                <Badge tone="blue">{label(selectedNode.subject)}</Badge>
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                {selectedNode.title}
              </h3>
              <p className="max-w-2xl text-xs leading-relaxed text-slate-600 dark:text-gray-300">
                {selectedNode.desc}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Btn
                onClick={() =>
                  nav(
                    selectedNode.subject === 'general'
                      ? '/mocks'
                      : `/practice?subject=${selectedNode.subject}`
                  )
                }
                className="gap-2"
              >
                <Play className="h-4 w-4 fill-white" />
                <span>Start Practice Drill</span>
              </Btn>

              <button
                type="button"
                onClick={() => nav(`/materials?q=${selectedNode.subject}`)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-gray-700 dark:bg-[#11243b] dark:text-gray-200 dark:hover:bg-gray-800"
              >
                <FileText className="h-4 w-4 text-sky-500" />
                <span>Study Notes & Formulas</span>
              </button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
