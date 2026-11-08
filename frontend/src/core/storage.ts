import type { Analysis, AlertItem, Scenario } from './types';

const KEY = 'vision-ai-enterprise-v1';

// Estructura del estado global de la aplicación
export type Store = {
  analyses: Analysis[];
  alerts: AlertItem[];
  scenarios: Scenario[];
  classes: string[];
  rules: {
    name: string;
    threshold: number;
    severity: string;
    active: boolean;
  }[];
  users: {
    name: string;
    role: string;
    active: boolean;
  }[];
};

// Escenarios preconfigurados para la demostración
const scenarios: Scenario[] = [
  {
    id: 'safety',
    name: 'Seguridad industrial',
    description: 'Supervisión de equipos de protección personal en zona operativa.',
    category: 'Seguridad',
    tags: ['EPP', 'Personas', 'Prevención'],
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1200',
    objects: ['Persona', 'Casco', 'Chaleco', 'Herramienta']
  },
  {
    id: 'warehouse',
    name: 'Almacén inteligente',
    description: 'Control visual de pallets, cajas y circulación de montacargas.',
    category: 'Logística',
    tags: ['Pallet', 'Montacargas', 'Inventario'],
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200',
    objects: ['Caja', 'Pallet', 'Montacargas', 'Persona']
  },
  {
    id: 'quality',
    name: 'Control de calidad',
    description: 'Inspección visual demostrativa de productos y defectos.',
    category: 'Calidad',
    tags: ['Producto', 'Defectos', 'Inspección'],
    image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1200',
    objects: ['Producto', 'Etiqueta', 'Defecto superficial']
  },
  {
    id: 'retail',
    name: 'Retail',
    description: 'Análisis de ocupación, estantes y productos en tienda.',
    category: 'Comercio',
    tags: ['Ocupación', 'Estantes', 'Personas'],
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200',
    objects: ['Persona', 'Estante', 'Producto']
  }
];

// Generador de datos de prueba iniciales
function initial(): Store {
  const now = Date.now();

  const demo: Analysis[] = [0, 1, 2, 3, 4].map((v) => {
    const sc = scenarios[v % 4];
    return {
      id: `VIS-DEMO-${100 + v}`,
      date: new Date(now - (v + 1) * 3600_000).toISOString(),
      user: 'demo.admin',
      scenario: sc.name,
      type: (['Análisis combinado', 'Detección de objetos', 'Segmentación', 'Reconocimiento de patrones', 'Análisis combinado'] as const)[v],
      image: sc.image,
      detections: sc.objects.slice(0, 3).map((label, i) => ({
        id: `D${i}`,
        label,
        confidence: 0.91 - i * 0.04,
        x: 0.12 + i * 0.2,
        y: 0.18 + i * 0.12,
        w: 0.2,
        h: 0.24,
        color: ['#13b8d5', '#8b72ed', '#ef9b4b'][i]
      })),
      confidence: 0.91 - v * 0.025,
      duration: 820 + v * 110,
      status: 'Completado · DEMO',
      patterns: v % 2 ? ['Uso de casco'] : ['Anomalía visual']
    };
  });

  return {
    analyses: demo,
    alerts: [
      {
        id: 'ALT-001',
        title: 'EPP incompleto detectado',
        description: 'El escenario de seguridad muestra un patrón demostrativo de equipo incompleto.',
        severity: 'Alta',
        status: 'Nueva',
        date: new Date(now - 1800000).toISOString(),
        analysisId: demo[0].id
      },
      {
        id: 'ALT-002',
        title: 'Objeto fuera de zona',
        description: 'Elemento detectado cerca de una zona restringida.',
        severity: 'Media',
        status: 'Revisada',
        date: new Date(now - 7200000).toISOString(),
        analysisId: demo[1].id
      },
      {
        id: 'ALT-003',
        title: 'Variación de calidad',
        description: 'Señal visual de defecto superficial en escenario de inspección.',
        severity: 'Baja',
        status: 'Nueva',
        date: new Date(now - 86400000).toISOString(),
        analysisId: demo[2].id
      }
    ],
    scenarios,
    classes: ['Persona', 'Vehículo', 'Casco', 'Chaleco', 'Producto', 'Caja', 'Pallet', 'Montacargas'],
    rules: [
      { name: 'EPP incompleto', threshold: 0.8, severity: 'Alta', active: true },
      { name: 'Objeto fuera de zona', threshold: 0.75, severity: 'Media', active: true },
      { name: 'Defecto superficial', threshold: 0.85, severity: 'Alta', active: true }
    ],
    users: [
      { name: 'demo.admin', role: 'Administrador', active: true },
      { name: 'operador.demo', role: 'Operador', active: true },
      { name: 'supervisor.demo', role: 'Supervisor', active: true },
      { name: 'auditor.demo', role: 'Auditor', active: true }
    ]
  };
}

// Cargar el estado desde localStorage
export function loadStore(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Store;
  } catch {}

  const s = initial();
  localStorage.setItem(KEY, JSON.stringify(s));
  return s;
}

// Guardar el estado actual en localStorage
export function saveStore(s: Store) {
  localStorage.setItem(KEY, JSON.stringify(s));
}