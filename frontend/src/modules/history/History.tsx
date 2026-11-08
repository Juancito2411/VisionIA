import React, { useState } from 'react';
import { Download, ChevronLeft, ChevronRight } from 'lucide-react';
import type { AnalysisType } from '../../core/types';
import type { Store } from '../../core/storage';
import PageHead from '../../components/PageHead';
import Empty from '../../components/Empty';

export default function History({ store, query, notify }: { store: Store; query: string; notify: (s: string) => void }) {
  const [type, setType] = useState('Todos');
  const [page, setPage] = useState(1);
  const types: AnalysisType[] = ['Detección de objetos', 'Segmentación', 'Reconocimiento de patrones', 'Análisis combinado'];

  const fmt = (d: string) => new Date(d).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });
  const pct = (v: number) => `${(v * 100).toFixed(1)}%`;
  
  const filtered = store.analyses.filter(a => (type === 'Todos' || a.type === type) && `${a.id} ${a.scenario} ${a.user}`.toLowerCase().includes(query.toLowerCase()));
  
  const exportCsv = () => {
    const rows = [['ID', 'Fecha', 'Usuario', 'Escenario', 'Tipo', 'Objetos', 'Confianza', 'Duración', 'Estado'], ...filtered.map(a => [a.id, a.date, a.user, a.scenario, a.type, String(a.detections.length), pct(a.confidence), `${a.duration} ms`, a.status])];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'vision-ai-historial.csv';
    link.click();
    URL.revokeObjectURL(url);
    notify('CSV exportado correctamente');
  };

  return (
    <>
      <PageHead eyebrow="OPERACIONES / TRAZABILIDAD" title="Historial de análisis" desc="Consulta ejecuciones anteriores y exporta los registros del sistema." action={<button className="btn secondary" onClick={exportCsv}><Download size={16} /> Exportar CSV</button>} />
      <div className="panel table-panel">
        <div className="panel-head">
          <div><h3>Todos los análisis</h3><p>{filtered.length} registros encontrados · Persistencia de la plataforma</p></div>
          <select className="small-select" value={type} onChange={e => setType(e.target.value)}>
            <option>Todos</option>
            {types.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr><th>ID ANÁLISIS</th><th>ESCENARIO</th><th>FECHA</th><th>USUARIO</th><th>TIPO DE ANÁLISIS</th><th>OBJETOS</th><th>CONFIANZA</th><th>DURACIÓN</th><th>ESTADO</th></tr>
            </thead>
            <tbody>
              {filtered.slice((page - 1) * 8, page * 8).map(a => (
                <tr key={a.id}>
                  <td className="mono">{a.id}</td>
                  <td><b>{a.scenario}</b></td>
                  <td>{fmt(a.date)}</td>
                  <td>{a.user}</td>
                  <td>{a.type}</td>
                  <td>{a.detections.length}</td>
                  <td><b>{pct(a.confidence)}</b></td>
                  <td>{a.duration} ms</td>
                  <td><span className="state success">Completado</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!filtered.length && <Empty text="No se encontraron análisis." />}
        <div className="pagination">
          <span>Mostrando {Math.min(filtered.length, (page - 1) * 8 + 1)}–{Math.min(filtered.length, page * 8)} de {filtered.length}</span>
          <div>
            <button className="icon-btn" disabled={page === 1} onClick={() => setPage(page - 1)}><ChevronLeft size={16} /></button>
            <b>{page}</b>
            <button className="icon-btn" disabled={page * 8 >= filtered.length} onClick={() => setPage(page + 1)}><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>
    </>
  );
}