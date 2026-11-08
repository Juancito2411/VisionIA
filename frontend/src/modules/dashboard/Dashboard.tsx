import React from 'react';
import { Activity, ScanSearch, Eye, AlertTriangle, Gauge, MoreHorizontal, ChevronRight, FileImage, Plus } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { Store } from '../../core/storage';
import PageHead from '../../components/PageHead';
import KPI from '../../components/KPI';
import Empty from '../../components/Empty';

interface DashboardProps {
  store: Store;
  navigate: (p: string) => void;
}

export default function Dashboard({ store, navigate }: DashboardProps) {
  const total = store.analyses.length;
  const objects = store.analyses.reduce((n, a) => n + a.detections.length, 0);
  const alerts = store.alerts.filter(a => a.status === 'Nueva').length;
  const confidence = total ? store.analyses.reduce((n, a) => n + a.confidence, 0) / total : 0;

  const pct = (v: number) => `${(v * 100).toFixed(1)}%`;
  const fmt = (d: string) => new Date(d).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 6 + i);
    return {
      day: d.toLocaleDateString('es-PE', { weekday: 'short' }),
      count: store.analyses.filter(a => new Date(a.date).toDateString() === d.toDateString()).length
    };
  });

  const classes = store.classes.map(c => ({
    name: c,
    count: store.analyses.flatMap(a => a.detections).filter(d => d.label === c).length
  })).filter(x => x.count);

  const colors = ['#11a9c5', '#8b72ed', '#efa14e', '#28a879', '#e16b83'];

  return (
    <>
      <PageHead 
        eyebrow="VISTA GENERAL / OPERACIONES" 
        title="Panel de control" 
        desc="Supervisa el rendimiento de análisis visual y la actividad de tu entorno." 
        action={<button className="btn primary" onClick={() => navigate('/analysis')}><Plus size={17} /> Nuevo análisis</button>} 
      />
      <div className="demo-banner">
        <div className="demo-banner-icon"><Activity size={18} /></div>
        <div><b>Entorno de demostración activo</b><span>Los datos y resultados mostrados son generados localmente por el motor DEMO determinista.</span></div>
        <span className="demo-pill">DEMO MODE</span>
      </div>
      <div className="kpi-grid">
        <KPI label="Análisis ejecutados" value={String(total)} sub="Registros almacenados" icon={ScanSearch} trend="+12.5%" />
        <KPI label="Objetos detectados" value={String(objects)} sub="En todos los análisis" icon={Eye} />
        <KPI label="Alertas nuevas" value={String(alerts)} sub="Pendientes de revisión" icon={AlertTriangle} />
        <KPI label="Confianza promedio" value={pct(confidence)} sub="Promedio del motor DEMO" icon={Gauge} />
      </div>
      <div className="dashboard-grid">
        <div className="panel chart-panel">
          <div className="panel-head">
            <div><h3>Actividad de análisis</h3><p>Ejecuciones registradas durante los últimos 7 días</p></div>
            <span className="panel-tag">ÚLTIMA SEMANA</span>
          </div>
          <div className="chart-area">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={days}>
                <defs>
                  <linearGradient id="fillCyan" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#12b4d0" stopOpacity={.22} />
                    <stop offset="95%" stopColor="#12b4d0" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf1f5" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#8a97a6', fontSize: 11 }} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#8a97a6', fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="count" name="Análisis" stroke="#12a9c5" strokeWidth={2.5} fill="url(#fillCyan)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="panel">
          <div className="panel-head">
            <div><h3>Clases identificadas</h3><p>Distribución por clase</p></div>
            <button className="icon-btn"><MoreHorizontal size={18} /></button>
          </div>
          {classes.length ? (
            <div className="class-bars">
              {classes.map((c, i) => (
                <div className="class-row" key={c.name}>
                  <div><span>{c.name}</span><b>{c.count}</b></div>
                  <div className="bar-track"><i style={{ width: `${Math.max(8, c.count / objects * 100)}%`, background: colors[i % colors.length] }} /></div>
                </div>
              ))}
            </div>
          ) : <Empty text="Aún no hay clases detectadas." />}
        </div>
        <div className="panel recent-panel">
          <div className="panel-head">
            <div><h3>Análisis recientes</h3><p>Últimas ejecuciones guardadas</p></div>
            <button className="text-btn" onClick={() => navigate('/history')}>Ver historial <ChevronRight size={14} /></button>
          </div>
          <div className="recent-list">
            {store.analyses.slice(0, 4).map(a => (
              <div className="recent-item" key={a.id}>
                <div className="recent-thumb">
                  <img src={a.image} onError={e => (e.currentTarget.style.display = 'none')} alt="" />
                  <FileImage size={17} />
                </div>
                <div className="recent-info"><b>{a.scenario}</b><span>{a.type} · {a.id}</span></div>
                <div className="recent-meta"><b>{pct(a.confidence)}</b><small>{fmt(a.date)}</small></div>
                <span className="status-dot" />
              </div>
            ))}
          </div>
        </div>
        <div className="panel alert-panel">
          <div className="panel-head">
            <div><h3>Alertas recientes</h3><p>Eventos que requieren atención</p></div>
            <button className="text-btn" onClick={() => navigate('/alerts')}>Ver todas <ChevronRight size={14} /></button>
          </div>
          {store.alerts.slice(0, 3).map(a => (
            <div className="alert-mini" key={a.id}>
              <span className={`severity-dot ${a.severity.toLowerCase()}`} />
              <div><b>{a.title}</b><small>{fmt(a.date)}</small></div>
              <span className={`severity-label ${a.severity.toLowerCase()}`}>{a.severity}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}