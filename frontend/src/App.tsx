import React, { useEffect, useState } from 'react';
import { NavLink, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { 
  BrainCircuit, ChevronLeft, ChevronDown, ChevronRight, Menu, 
  LogOut, Search, Bell, Check, LayoutDashboard, ScanSearch, 
  Eye, Layers3, AlertTriangle, ClipboardList, Boxes, Settings, ShieldCheck 
} from 'lucide-react';

import type { Analysis, Role } from './core/types';
import { loadStore, saveStore } from './core/storage';
import type { Store } from './core/storage';
import { getRemoteState, saveRemoteState } from './core/api';

// Importación de módulos organizados
import Login from './modules/auth/Login';
import Dashboard from './modules/dashboard/Dashboard';
import AnalysisPage from './modules/analysis/AnalysisPage';
import Detections from './modules/detections/Detections';
import Segmentation from './modules/segmentation/Segmentation';
import Patterns from './modules/patterns/Patterns';
import Alerts from './modules/alerts/Alerts';
import History from './modules/history/History';
import Scenarios from './modules/scenarios/Scenarios';
import Admin from './modules/admin/Admin';

const nav = [
  { label: 'GENERAL', items: [['/dashboard', 'Dashboard', LayoutDashboard], ['/analysis', 'Centro de análisis', ScanSearch]] },
  { label: 'INTELIGENCIA VISUAL', items: [['/detections', 'Detección de objetos', Eye], ['/segmentation', 'Segmentación', Layers3], ['/patterns', 'Reconocimiento de patrones', BrainCircuit]] },
  { label: 'OPERACIONES', items: [['/alerts', 'Alertas', AlertTriangle], ['/history', 'Historial', ClipboardList], ['/scenarios', 'Escenarios DEMO', Boxes]] },
  { label: 'SISTEMA', items: [['/admin', 'Administración', Settings]] }
] as const;

export default function App() {
  const [store, setStore] = useState<Store>(() => loadStore());
  const [apiReady, setApiReady] = useState(false);
  const [apiStatus, setApiStatus] = useState<'connecting' | 'online' | 'offline'>('connecting');
  const [user, setUser] = useState<{ name: string; role: Role } | null>(() => {
    try {
      return JSON.parse(localStorage.getItem('vision-ai-user') || 'null');
    } catch {
      return null;
    }
  });
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [toast, setToast] = useState('');
  const [query, setQuery] = useState('');
  const loc = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    getRemoteState().then(remote => {
      if (active && remote) {
        setStore(remote);
        setApiStatus('online');
      } else if (active) {
        setApiStatus('offline');
      }
    }).catch(() => {
      if (active) setApiStatus('offline');
    }).finally(() => {
      if (active) setApiReady(true);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    saveStore(store);
    if (apiReady) {
      saveRemoteState(store).then(() => setApiStatus('online')).catch(() => setApiStatus('offline'));
    }
  }, [store, apiReady]);

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(''), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const notify = (s: string) => setToast(s);
  
  const login = (name: string, role: Role) => {
    const u = { name, role };
    setUser(u);
    localStorage.setItem('vision-ai-user', JSON.stringify(u));
    navigate('/dashboard');
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('vision-ai-user');
    navigate('/login');
  };

  const addAnalysis = (a: Analysis) => {
    setStore(s => ({
      ...s,
      analyses: [a, ...s.analyses],
      alerts: [
        ...s.alerts,
        ...(a.patterns.length ? [{
          id: `ALT-${Date.now()}`,
          title: a.patterns[0],
          description: `Patrón identificado en ${a.scenario}. Resultado generado por motor DEMO.`,
          severity: 'Media' as const,
          status: 'Nueva' as const,
          date: new Date().toISOString(),
          analysisId: a.id
        }] : [])
      ]
    }));
    notify('Análisis DEMO guardado correctamente');
    navigate('/history');
  };

  const page = loc.pathname.split('/')[1] || 'dashboard';
  const titles: Record<string, string> = {
    dashboard: 'Dashboard',
    analysis: 'Centro de análisis',
    detections: 'Detección de objetos',
    segmentation: 'Segmentación',
    patterns: 'Reconocimiento de patrones',
    alerts: 'Centro de alertas',
    history: 'Historial de análisis',
    scenarios: 'Escenarios de demostración',
    admin: 'Administración'
  };

  if (loc.pathname === '/login' || !user) return <Login onLogin={login} />;

  return (
    <div className="shell">
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobile ? 'mobile-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark"><BrainCircuit size={23} /></div>
          {!collapsed && <div><b>VISION<span>AI</span></b><small>VISUAL INTELLIGENCE</small></div>}
          <button className="icon-btn sidebar-toggle" onClick={() => setCollapsed(!collapsed)}>
            <ChevronLeft size={17} />
          </button>
        </div>
        <div className="workspace">
          <span className="workspace-dot" /> 
          {!collapsed && <>
            <span>{apiStatus === 'online' ? 'BACKEND CONECTADO' : apiStatus === 'connecting' ? 'CONECTANDO API' : 'MODO LOCAL · API OFFLINE'}</span>
            <ChevronDown size={13} />
          </>}
        </div>
        <nav>
          {nav.map(group => (
            <div className="nav-group" key={group.label}>
              <div className="nav-label">{!collapsed ? group.label : '···'}</div>
              {group.items.map(([to, label, Icon]) => (
                <NavLink 
                  title={label} 
                  key={to} 
                  to={to} 
                  onClick={() => setMobile(false)} 
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                  <Icon size={18} />
                  {!collapsed && <span>{label}</span>}
                  {!collapsed && to === '/alerts' && store.alerts.filter(a => a.status === 'Nueva').length > 0 && (
                    <em>{store.alerts.filter(a => a.status === 'Nueva').length}</em>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card">
            {!collapsed && <>
              <div className="help-icon"><ShieldCheck size={17} /></div>
              <b>Visión artificial</b>
              <p>Cámara en directo con inferencia YOLO desde el backend.</p>
            </>}
          </div>
          <button className="nav-link" onClick={logout}>
            <LogOut size={18} />
            {!collapsed && <span>Cerrar sesión</span>}
          </button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="top-left">
            <button className="icon-btn mobile-menu" onClick={() => setMobile(!mobile)}><Menu /></button>
            <div className="crumb">Plataforma <ChevronRight size={13} /><b>{titles[page] || 'Dashboard'}</b></div>
          </div>
          <div className="top-actions">
            <div className="global-search">
              <Search size={16} />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar en el módulo..." />
              <kbd>⌘ K</kbd>
            </div>
            <button className="icon-btn notification" onClick={() => navigate('/alerts')}>
              <Bell size={18} />
              <i />
            </button>
            <div className="user-chip">
              <div className="avatar">{user.name.slice(0, 1).toUpperCase()}</div>
              <div><b>{user.name}</b><small>{user.role}</small></div>
              <ChevronDown size={14} />
            </div>
          </div>
        </header>

        <div className="page-wrap">
          <Routes>
            <Route path="/dashboard" element={<Dashboard store={store} navigate={navigate} />} />
            <Route path="/analysis" element={<AnalysisPage store={store} user={user} onRun={addAnalysis} notify={notify} />} />
            <Route path="/detections" element={<Detections store={store} />} />
            <Route path="/segmentation" element={<Segmentation store={store} />} />
            <Route path="/patterns" element={<Patterns store={store} />} />
            <Route path="/alerts" element={<Alerts store={store} setStore={setStore} notify={notify} />} />
            <Route path="/history" element={<History store={store} query={query} notify={notify} />} />
            <Route path="/scenarios" element={<Scenarios store={store} onRun={sc => { navigate('/analysis', { state: { scenario: sc.id } }); }} />} />
            <Route path="/admin" element={<Admin store={store} setStore={setStore} notify={notify} role={user.role} />} />
            <Route path="*" element={<Dashboard store={store} navigate={navigate} />} />
          </Routes>
        </div>

        <footer className="footer">
          <span>VISION AI <b>v1.0.0</b></span>
          <span><i className="live-dot" /> Motor visual · YOLO bajo demanda</span>
          <span>© 2026 Visual Intelligence Platform</span>
        </footer>
      </main>

      {toast && (
        <div className="toast"><Check size={17} />{toast}</div>
      )}
    </div>
  );
}