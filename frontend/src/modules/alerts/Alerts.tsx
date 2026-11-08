import React, { useState } from 'react';
import { AlertTriangle, Eye, Check, Search } from 'lucide-react';
import type { AlertItem } from '../../core/types';
import type { Store } from '../../core/storage';
import PageHead from '../../components/PageHead';
import KPI from '../../components/KPI';

export default function Alerts({ store, setStore, notify }: { store: Store; setStore: React.Dispatch<React.SetStateAction<Store>>; notify: (s: string) => void }) {
  const [filter, setFilter] = useState('Todas');
  const [search, setSearch] = useState('');
  
  const fmt = (d: string) => new Date(d).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });
  const update = (id: string, status: AlertItem['status']) => {
    setStore(s => ({ ...s, alerts: s.alerts.map(a => a.id === id ? { ...a, status } : a) }));
    notify('Estado de alerta actualizado');
  };

  return (
    <>
      <PageHead eyebrow="OPERACIONES / EVENTOS" title="Centro de alertas" desc="Revisa eventos, prioriza incidencias y actualiza su estado." />
      <div className="kpi-grid compact">
        <KPI label="Nuevas" value={String(store.alerts.filter(a => a.status === 'Nueva').length)} sub="Pendientes de revisión" icon={AlertTriangle} />
        <KPI label="Revisadas" value={String(store.alerts.filter(a => a.status === 'Revisada').length)} sub="En seguimiento" icon={Eye} />
        <KPI label="Cerradas" value={String(store.alerts.filter(a => a.status === 'Cerrada').length)} sub="Resueltas" icon={Check} />
      </div>
      <div className="panel table-panel">
        <div className="panel-head">
          <div><h3>Listado de alertas</h3><p>Alertas creadas a partir de reglas DEMO</p></div>
          <div className="table-tools">
            <div className="inline-search"><Search size={15} /><input placeholder="Buscar alerta..." value={search} onChange={e => setSearch(e.target.value)} /></div>
            <select className="small-select" value={filter} onChange={e => setFilter(e.target.value)}>{['Todas', 'Alta', 'Media', 'Baja'].map(x => <option key={x}>{x}</option>)}</select>
          </div>
        </div>
        <div className="alert-cards">
          {store.alerts.filter(a => (filter === 'Todas' || a.severity === filter) && `${a.title} ${a.description}`.toLowerCase().includes(search.toLowerCase())).map(a => (
            <div className="alert-card" key={a.id}>
              <div className={`alert-symbol ${a.severity.toLowerCase()}`}><AlertTriangle size={18} /></div>
              <div className="alert-card-main">
                <div className="alert-title-line"><b>{a.title}</b><span className={`severity-label ${a.severity.toLowerCase()}`}>{a.severity}</span></div>
                <p>{a.description}</p>
                <small>{a.id} · {fmt(a.date)} · Análisis {a.analysisId}</small>
              </div>
              <div className="alert-actions">
                <span className={`state ${a.status === 'Nueva' ? 'danger' : a.status === 'Revisada' ? 'warning' : 'success'}`}>{a.status}</span>
                <select value={a.status} onChange={e => update(a.id, e.target.value as AlertItem['status'])}>
                  <option>Nueva</option><option>Revisada</option><option>Cerrada</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}