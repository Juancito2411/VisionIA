import React, { useState } from 'react';
import { Eye, Boxes, Gauge } from 'lucide-react';
import type { Store } from '../../core/storage';
import PageHead from '../../components/PageHead';
import KPI from '../../components/KPI';
import Empty from '../../components/Empty';

export default function Detections({ store }: { store: Store }) {
  const all = store.analyses.flatMap(a => a.detections.map(d => ({ ...d, analysis: a })));
  const [filter, setFilter] = useState('Todas');
  
  const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

  return (
    <>
      <PageHead eyebrow="INTELIGENCIA VISUAL / OBJETOS" title="Detección de objetos" desc="Consulta las detecciones registradas, sus clases y niveles de confianza." />
      <div className="kpi-grid compact">
        <KPI label="Detecciones totales" value={String(all.length)} sub="En análisis guardados" icon={Eye} />
        <KPI label="Clases activas" value={String(new Set(all.map(d => d.label)).size)} sub="Clases identificadas" icon={Boxes} />
        <KPI label="Confianza media" value={pct(all.reduce((s, d) => s + d.confidence, 0) / Math.max(1, all.length))} sub="Promedio de detecciones" icon={Gauge} />
      </div>
      <div className="panel table-panel">
        <div className="panel-head">
          <div><h3>Registro de detecciones</h3><p>Bounding boxes y metadatos de las inferencias registradas</p></div>
          <select className="small-select" value={filter} onChange={e => setFilter(e.target.value)}>
            <option>Todas</option>
            {store.classes.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr><th>CLASE</th><th>ID DETECCIÓN</th><th>ANÁLISIS</th><th>CONFIANZA</th><th>COORDENADAS NORMALIZADAS</th><th>ESTADO</th></tr>
            </thead>
            <tbody>
              {all.filter(d => filter === 'Todas' || d.label === filter).map(d => (
                <tr key={d.analysis.id + d.id}>
                  <td><span className="class-cell"><i style={{ background: d.color }} />{d.label}</span></td>
                  <td className="mono">{d.id}</td>
                  <td>{d.analysis.id}</td>
                  <td><b>{pct(d.confidence)}</b></td>
                  <td className="mono">x:{d.x.toFixed(2)} y:{d.y.toFixed(2)} w:{d.w.toFixed(2)} h:{d.h.toFixed(2)}</td>
                  <td><span className="state success">REGISTRADO</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!all.length && <Empty text="Ejecuta un análisis para registrar detecciones." />}
      </div>
    </>
  );
}