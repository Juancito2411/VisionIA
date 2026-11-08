import type { Store } from './storage';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

// Obtener el estado remoto cargado desde el backend
export async function getRemoteState(): Promise<Store | null> {
  const response = await fetch(`${API_BASE}/state`, {
    headers: { Accept: 'application/json' }
  });
  if (!response.ok) throw new Error(`API ${response.status}`);
  
  const payload = await response.json();
  return payload.data as Store;
}

// Sincronizar el estado actual con el backend
export async function saveRemoteState(data: Store): Promise<void> {
  const response = await fetch(`${API_BASE}/state`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data }),
  });
  if (!response.ok) throw new Error(`No se pudo guardar en API (${response.status})`);
}

// Verificar si el servidor Backend está en línea
export async function checkApi(): Promise<boolean> {
  try {
    const r = await fetch(`${API_BASE.replace('/api/v1', '')}/health`);
    return r.ok;
  } catch {
    return false;
  }
}