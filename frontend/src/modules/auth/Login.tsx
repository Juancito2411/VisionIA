import React, { useState } from 'react';
import { BrainCircuit, Eye, ChevronRight, Sparkles } from 'lucide-react';
import type { Role } from '../../core/types';

interface LoginProps {
  onLogin: (name: string, role: Role) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [name, setName] = useState('demo.admin');
  const [pass, setPass] = useState('vision123');
  const [role, setRole] = useState<Role>('Administrador');
  const [show, setShow] = useState(false);

  return (
    <div className="login-screen">
      <div className="login-visual">
        <div className="login-brand">
          <div className="brand-mark"><BrainCircuit /></div>
          <b>VISION<span>AI</span></b>
        </div>
        <div className="visual-content">
          <div className="eyebrow"><span /> PLATAFORMA DE VISIÓN COMPUTACIONAL</div>
          <h1>Convierte imágenes<br />en <span>inteligencia visual.</span></h1>
          <p>Una plataforma integrada para analizar, interpretar y supervisar entornos visuales con herramientas de nueva generación.</p>
          <div className="visual-stats">
            <div><b>04</b><small>Escenarios DEMO</small></div>
            <div><b>08</b><small>Clases visuales</small></div>
            <div><b>10</b><small>Módulos integrados</small></div>
          </div>
        </div>
        <div className="login-visual-foot">VISUAL INTELLIGENCE PLATFORM <span>·</span> ENTERPRISE EDITION</div>
      </div>
      <div className="login-panel">
        <div className="login-form">
          <div className="mobile-login-brand">
            <div className="brand-mark"><BrainCircuit /></div>
            <b>VISION<span>AI</span></b>
          </div>
          <div className="eyebrow dark">ACCESO A LA PLATAFORMA</div>
          <h2>Bienvenido de nuevo</h2>
          <p className="muted">Ingresa tus credenciales para acceder al entorno de análisis.</p>
          <form onSubmit={e => { e.preventDefault(); if (name.trim() && pass.trim()) onLogin(name, role); }}>
            <label>Usuario</label>
            <input value={name} onChange={e => setName(e.target.value)} required placeholder="Tu usuario" />
            <label>Contraseña</label>
            <div className="password">
              <input type={show ? 'text' : 'password'} value={pass} onChange={e => setPass(e.target.value)} required />
              <button type="button" className="icon-btn" onClick={() => setShow(!show)}><Eye size={17} /></button>
            </div>
            <label>Perfil de acceso</label>
            <select value={role} onChange={e => setRole(e.target.value as Role)}>
              {['Administrador', 'Operador', 'Supervisor', 'Auditor'].map(r => <option key={r}>{r}</option>)}
            </select>
            <div className="remember">
              <label><input type="checkbox" defaultChecked /> Recordar sesión</label>
              <button type="button" onClick={() => alert('Acceso DEMO: utiliza cualquier usuario y contraseña no vacíos.')}>¿Olvidaste tu acceso?</button>
            </div>
            <button className="btn primary full" type="submit">Ingresar a VISION AI <ChevronRight size={17} /></button>
          </form>
          <div className="demo-hint">
            <Sparkles size={16} />
            <div><b>Acceso demostrativo</b><small>Usuario y contraseña precargados. Selecciona el perfil que deseas probar.</small></div>
          </div>
          <small className="login-legal">Al ingresar aceptas las condiciones de uso del entorno de demostración.</small>
        </div>
      </div>
    </div>
  );
}