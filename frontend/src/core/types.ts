// Roles de usuario del sistema
export type Role = 'Administrador' | 'Operador' | 'Supervisor' | 'Auditor';

// Tipos de análisis soportados por el motor
export type AnalysisType = 
  | 'Detección de objetos'
  | 'Segmentación'
  | 'Reconocimiento de patrones'
  | 'Análisis combinado';

// Estructura de un objeto detectado (Bounding Box)
export type Detection = {
  id: string;
  label: string;
  confidence: number;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
};

// Estructura de una alerta del sistema
export type AlertItem = {
  id: string;
  title: string;
  description: string;
  severity: 'Alta' | 'Media' | 'Baja';
  status: 'Nueva' | 'Revisada' | 'Cerrada';
  date: string;
  analysisId: string;
};

// Registro completo de un análisis guardado
export type Analysis = {
  id: string;
  date: string;
  user: string;
  scenario: string;
  type: AnalysisType;
  image: string;
  detections: Detection[];
  confidence: number;
  duration: number;
  status: string;
  patterns: string[];
};

// Definición de escenario demostrativo
export type Scenario = {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  image: string;
  objects: string[];
};