import React from 'react';
import { ChevronRight } from 'lucide-react';
import type { Scenario } from '../../core/types';
import type { Store } from '../../core/storage';
import PageHead from '../../components/PageHead';

export default function Scenarios({ store, onRun }: { store: Store; onRun: (s: Scenario) => void }) {
  return (
    <>
      <PageHead eyebrow="ENTORNO DE PRUEBAS / DATASETS" title="Escenarios de demostración" desc="Explora entornos visuales preconfigurados y ejecuta pruebas reproducibles." />
      <div className="scenario-grid">
        {store.scenarios.map((s, i) => (
          <div className="scenario-card" key={s.id}>
            <div className="scenario-image">
              <img src={s.image} onError={e => { e.currentTarget.style.opacity = '.25'; }} />
              <span>{s.category}</span>
              <div className="scenario-index">0{i + 1}</div>
            </div>
            <div className="scenario-body">
              <h3>{s.name}</h3>
              <p>{s.description}</p>
              <div className="tag-list">{s.tags.map(t => <span key={t}>{t}</span>)}</div>
              <div className="scenario-objects"><small>CLASES ESPERADAS</small><b>{s.objects.join(' · ')}</b></div>
              <button className="btn secondary full" onClick={() => onRun(s)}>Usar escenario <ChevronRight size={16} /></button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}