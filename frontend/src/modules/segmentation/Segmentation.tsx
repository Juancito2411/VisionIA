import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import type { Store } from '../../core/storage';
import PageHead from '../../components/PageHead';

export default function Segmentation({ store }: { store: Store }) {
  const [opacity, setOpacity] = useState(45);
  const [active, setActive] = useState(true);
  const a = store.analyses.find(x => x.detections.length);

  return (
    <>
      <PageHead eyebrow="INTELIGENCIA VISUAL / MÁSCARAS" title="Segmentación" desc="Explora las regiones y máscaras demostrativas asociadas a los análisis." />
      <div className="seg-grid">
        <div className="panel">
          <div className="panel-head"><div><h3>Visor de segmentación</h3><p>Máscaras superpuestas sobre imagen de origen</p></div><span className="panel-tag">INSTANCE DEMO</span></div>
          <div className="segment-view">
            {a && <img src={a.image} />}
            <svg viewBox="0 0 600 360" preserveAspectRatio="none">
              <path d="M70 70 L210 55 L250 240 L95 275 Z" fill={`rgba(17,169,197,${active ? opacity / 100 : 0})`} />
              <path d="M270 85 L420 75 L485 285 L310 260 Z" fill={`rgba(139,114,237,${active ? opacity / 100 : 0})`} />
              <ellipse cx="495" cy="95" rx="42" ry="35" fill={`rgba(239,161,78,${active ? opacity / 100 : 0})`} />
            </svg>
          </div>
          <div className="seg-controls">
            <label><input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} /> Mostrar máscaras</label>
            <div><span>Transparencia</span><b>{opacity}%</b></div>
            <input className="range" type="range" min="0" max="100" value={opacity} onChange={e => setOpacity(+e.target.value)} />
          </div>
        </div>
        <div className="panel">
          <div className="panel-head"><div><h3>Capas identificadas</h3><p>Regiones ilustrativas del escenario DEMO</p></div></div>
          {[['Persona', '#11a9c5', '42.8%'], ['Estructura', '#8b72ed', '31.4%'], ['Objeto', '#efa14e', '12.6%']].map(([n, c, v]) => (
            <div className="mask-row" key={n}>
              <span className="legend-dot" style={{ background: c }} />
              <div><b>{n}</b><small>Confianza demostrativa: 94.2%</small></div>
              <strong>{v}</strong>
            </div>
          ))}
          <div className="seg-type"><b>Tipo de segmentación</b><span>Semántica <i /> Instancia <i /> Panóptica</span></div>
          <div className="demo-note"><ShieldCheck size={15} /> Las máscaras son representaciones ilustrativas, no inferencias de un modelo.</div>
        </div>
      </div>
    </>
  );
}