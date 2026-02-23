import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  Gauge,
  FolderUp,
  GitBranch,
  MessageSquare,
  Database,
  BarChart3,
  Bug,
  Settings,
  Zap,
  ChevronDown,
} from 'lucide-react';
import { useSystem } from '../lib/SystemContext';

/* Core — always visible */
const CORE_ITEMS = [
  { path: '/app', icon: Gauge, label: 'Overview' },
  { path: '/app/documents', icon: FolderUp, label: 'Documents' },
  { path: '/app/query', icon: MessageSquare, label: 'Query' },
];

/* Advanced — collapsed by default */
const ADVANCED_ITEMS = [
  { path: '/app/pipeline', icon: GitBranch, label: 'Pipeline' },
  { path: '/app/vectors', icon: Database, label: 'Vectors' },
  { path: '/app/metrics', icon: BarChart3, label: 'Metrics' },
  { path: '/app/settings', icon: Settings, label: 'Settings' },
];

function NavItem({ path, icon: Icon, label }) {
  return (
    <NavLink
      to={path}
      end={path === '/app'}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 text-xs font-medium transition-all duration-150 border-l-2 ${
          isActive
            ? 'border-accent text-accent bg-accent/5'
            : 'border-transparent text-text-muted hover:text-text-dim hover:bg-surface/50'
        }`
      }
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="truncate">{label}</span>
    </NavLink>
  );
}

export default function Sidebar() {
  const { health, stats } = useSystem();
  const [advancedOpen, setAdvancedOpen] = useState(false);

  return (
    <aside className="w-52 bg-panel border-r border-border flex flex-col flex-shrink-0 select-none">
      {/* Logo — links to front page */}
      <Link to="/" className="h-10 flex items-center gap-2 px-4 border-b border-border hover:bg-surface/50 transition-colors">
        <div className="w-6 h-6 rounded bg-accent/15 flex items-center justify-center">
          <Zap className="w-3.5 h-3.5 text-accent" />
        </div>
        <span className="font-display font-bold text-sm tracking-tight text-text">
          DOC<span className="text-accent">SEEK</span>
        </span>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3">
        {/* Core section */}
        <div className="mb-2">
          <div className="px-4 py-1.5 text-[9px] font-bold tracking-[0.2em] text-text-muted/50 uppercase">
            Core
          </div>
          {CORE_ITEMS.map((item) => (
            <NavItem key={item.path} {...item} />
          ))}
        </div>

        {/* Advanced section — collapsible */}
        <div className="mb-2">
          <button
            onClick={() => setAdvancedOpen(!advancedOpen)}
            className="w-full flex items-center justify-between px-4 py-1.5 text-[9px] font-bold tracking-[0.2em] text-text-muted/50 uppercase hover:text-text-muted transition-colors"
          >
            Advanced
            <ChevronDown
              className={`w-3 h-3 transition-transform duration-200 ${
                advancedOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
          <div
            className={`overflow-hidden transition-all duration-250 ease-in-out ${
              advancedOpen ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            {ADVANCED_ITEMS.map((item) => (
              <NavItem key={item.path} {...item} />
            ))}
          </div>
        </div>
      </nav>

      {/* Footer stats */}
      <div className="px-4 py-3 border-t border-border text-[10px] font-mono text-text-muted space-y-1">
        <div className="flex justify-between">
          <span>DOCS</span>
          <span className="text-text-dim">{stats?.total_documents ?? '—'}</span>
        </div>
        <div className="flex justify-between">
          <span>VECTORS</span>
          <span className="text-text-dim">{stats?.total_vectors ?? '—'}</span>
        </div>
        <div className="flex justify-between">
          <span>STATUS</span>
          <span className={health === 'READY' ? 'text-success' : health === 'ERROR' ? 'text-caution' : 'text-accent'}>
            {health}
          </span>
        </div>
      </div>
    </aside>
  );
}
