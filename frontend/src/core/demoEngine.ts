import type { Analysis, AnalysisType, Detection, Scenario } from './types';

const palette = ['#13b8d5', '#8b72ed', '#ef9b4b', '#28a879', '#e16b83', '#5b8def'];

// Función hash pseudoaleatoria determinista basada en texto
const seed = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  }
  return h >>> 0;
};

// Simula la ejecución de un análisis sobre una imagen/escenario
export function runDemo(
  image: string,
  scenario: Scenario,
  type: AnalysisType,
  user: string,
  threshold: number
): Analysis {
  const n = seed(scenario.id + type);
  const labels = scenario.objects;

  // Generación de detecciones simuladas
  const detections: Detection[] = labels.map((label, i) => ({
    id: `D-${i + 1}`,
    label,
    confidence: Math.max(threshold, Math.min(99, 83 + ((n + i * 17) % 16))) / 100,
    x: 0.08 + ((n + i * 23) % 45) / 100,
    y: 0.10 + ((n + i * 13) % 42) / 100,
    w: 0.18 + ((n + i * 7) % 18) / 100,
    h: 0.22 + ((n + i * 11) % 24) / 100,
    color: palette[i % palette.length]
  }));

  // Mapeo de patrones según el tipo de escenario
  const patterns = 
    scenario.id === 'safety' ? ['Uso de casco', 'Uso de chaleco', 'EPP incompleto'] :
    scenario.id === 'warehouse' ? ['Objeto fuera de zona', 'Congestión'] :
    scenario.id === 'quality' ? ['Producto defectuoso', 'Anomalía visual'] :
    ['Ocupación', 'Reconocimiento de patrones'];

  return {
    id: `VIS-${Date.now().toString(36).toUpperCase()}`,
    date: new Date().toISOString(),
    user,
    scenario: scenario.name,
    type,
    image,
    detections,
    confidence: detections.reduce((a, d) => a + d.confidence, 0) / Math.max(1, detections.length),
    duration: 780 + (n % 950),
    status: 'Completado · DEMO',
    patterns: type === 'Detección de objetos' ? [] : patterns
  };
}