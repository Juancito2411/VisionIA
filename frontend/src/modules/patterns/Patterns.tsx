import React from 'react';
import { BrainCircuit } from 'lucide-react';
import type { Store } from '../../core/storage';
import PageHead from '../../components/PageHead';
import Empty from '../../components/Empty';

export default function Patterns({ store }: { store: Store }) {
  const fmt = (d: string) => new Date(d).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });
  const pct = (v: number) => `${(v * 100).toFixed(1)}%`;
  const items = store.analyses.flatMap(a => a.patterns.map((p, i) => ({ p, a, i })));

  return (
    <>
      <PageHead eyebrow="INTELIGENCIA VISUAL / COMPORTAMIENTO" title="Reconocimiento de patrones" desc="Patrones visuales derivados de las reglas del motor demostrativo." />
      <div className="pattern-grid">
        {items.map(({ p, a, i }) => (
          <div className="panel pattern-card" key={a.id + p}>
            <div className="pattern-icon"><BrainCircuit size={21} /></div>
            <div className="pattern-top"><span className="state warning">DEMO</span><span>{fmt(a.date)}</span></div>
            <h3>{p}</h3>
            <p>Patrón asociado al escenario {a.scenario}. Evidencia generada por reglas reproducibles.</p>
            <div className="pattern-confidence"><span>Confianza</span><b>{pct(a.confidence - i * .02)}</b></div>
            <div className="bar-track"><i style={{ width: `${(a.confidence - i * .02) * 100}%` }} /></div>
            <small>Análisis relacionado: {a.id}</small>
          </div>
        ))}
      </div>
      {!items.length && <Empty text="No hay patrones registrados. Ejecuta un análisis combinado." />}
    </>
  );
}