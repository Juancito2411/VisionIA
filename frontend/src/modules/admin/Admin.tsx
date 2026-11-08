import React, { useState } from 'react';
import { SlidersHorizontal, Plus, X, MoreHorizontal, ChevronRight } from 'lucide-react';
import type { Role } from '../../core/types';
import type { Store } from '../../core/storage';
import PageHead from '../../components/PageHead';

export default function Admin({ store, setStore, notify, role }: { store: Store; setStore: React.Dispatch<React.SetStateAction<Store>>; notify: (s: string) => void; role: Role }) {
  const [tab, setTab] = useState('Clases');
  const [newClass, setNewClass] = useState('');
  const [newRule, setNewRule] = useState('');
  const [newUser, setNewUser] = useState('');
  const allowed = role === 'Administrador';

  const add = (kind: string) => {
    if (!allowed) {
      notify('Tu perfil no tiene permisos de administración');
      return;
    }
    if (kind === 'class' && newClass.trim()) {
      setStore(s => ({ ...s, classes: [...s.classes, newClass.trim()] }));
      setNewClass('');
    }
    if (kind === 'rule' && newRule.trim()) {
      setStore(s => ({ ...s, rules: [...s.rules, { name: newRule.trim(), threshold: .8, severity: 'Media', active: true }] }));
      setNewRule('');
    }
    if (kind === 'user' && newUser.trim()) {
      setStore(s => ({ ...s, users: [...s.users, { name: newUser.trim(), role: 'Operador', active: true }] }));
      setNewUser('');
    }
    notify('Configuración actualizada');
  };

  return (
    <>
      <PageHead eyebrow="SISTEMA / GOBIERNO" title="Administración" desc="Gestiona clases, reglas, usuarios y parámetros del entorno." />
      <div className="admin-layout">
        <div className="panel admin-nav">
          {['Clases', 'Reglas', 'Usuarios', 'Configuración'].map(t => (
            <button className={tab === t ? 'selected' : ''} onClick={() => setTab(t)} key={t}>
              <SlidersHorizontal size={16} />{t}<ChevronRight size={15} />
            </button>
          ))}
        </div>
        <div className="panel admin-content">
          <div className="panel-head">
            <div><h3>Gestión de {tab.toLowerCase()}</h3><p>{allowed ? 'Cambios persistidos localmente en este navegador.' : 'Vista de solo lectura para tu perfil.'}</p></div>
            <span className="panel-tag">{role.toUpperCase()}</span>
          </div>
          {tab === 'Clases' && <>
            <div className="admin-add">
              <input placeholder="Nombre de nueva clase..." value={newClass} onChange={e => setNewClass(e.target.value)} />
              <button className="btn primary" onClick={() => add('class')}><Plus size={15} /> Añadir</button>
            </div>
            {store.classes.map((c, i) => (
              <div className="admin-row" key={c}>
                <span className="legend-dot" style={{ background: ['#11a9c5', '#8b72ed', '#efa14e', '#28a879'][i % 4] }} />
                <b>{c}</b><span className="state success">Activa</span>
                <button className="icon-btn" disabled={!allowed} onClick={() => setStore(s => ({ ...s, classes: s.classes.filter(x => x !== c) }))}><X size={16} /></button>
              </div>
            ))}
          </>}
          {tab === 'Reglas' && <>
            <div className="admin-add">
              <input placeholder="Nombre de regla..." value={newRule} onChange={e => setNewRule(e.target.value)} />
              <button className="btn primary" onClick={() => add('rule')}><Plus size={15} /> Añadir</button>
            </div>
            {store.rules.map(r => (
              <div className="admin-row rule-row" key={r.name}>
                <div><b>{r.name}</b><small>Umbral {Math.round(r.threshold * 100)}% · Severidad {r.severity}</small></div>
                <label className="switch">
                  <input type="checkbox" checked={r.active} onChange={e => setStore(s => ({ ...s, rules: s.rules.map(x => x.name === r.name ? { ...x, active: e.target.checked } : x) }))} />
                  <i />
                </label>
              </div>
            ))}
          </>}
          {tab === 'Usuarios' && <>
            <div className="admin-add">
              <input placeholder="Nombre de usuario DEMO..." value={newUser} onChange={e => setNewUser(e.target.value)} />
              <button className="btn primary" onClick={() => add('user')}><Plus size={15} /> Añadir</button>
            </div>
            {store.users.map(u => (
              <div className="admin-row" key={u.name}>
                <div className="avatar small-avatar">{u.name.slice(0, 1).toUpperCase()}</div>
                <div><b>{u.name}</b><small>{u.role}</small></div>
                <span className={`state ${u.active ? 'success' : 'danger'}`}>{u.active ? 'Activo' : 'Inactivo'}</span>
                <button className="icon-btn" disabled={!allowed} onClick={() => setStore(s => ({ ...s, users: s.users.map(x => x.name === u.name ? { ...x, active: !x.active } : x) }))}><MoreHorizontal size={17} /></button>
              </div>
            ))}
          </>}
          {tab === 'Configuración' && <>
            <div className="settings-row"><div><b>Umbral de confianza global</b><small>Valor predeterminado para nuevas ejecuciones.</small></div><strong>70%</strong></div>
            <div className="settings-row"><div><b>Persistencia local</b><small>Los datos se almacenan en LocalStorage.</small></div><span className="state success">Activa</span></div>
            <div className="settings-row"><div><b>Motor de procesamiento</b><small>Adaptador local determinista para demostración.</small></div><span className="state warning">DEMO</span></div>
            <div className="settings-row"><div><b>API externa</b><small>Preparada para futura conexión con FastAPI.</small></div><span className="state neutral">No conectada</span></div>
          </>}
        </div>
      </div>
    </>
  );
}