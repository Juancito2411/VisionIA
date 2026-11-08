# Arquitectura y responsabilidades

## Separación de responsabilidades

### Frontend

La carpeta `frontend/` contiene exclusivamente la aplicación cliente. `src/core/api.ts` centraliza las llamadas HTTP y no debe contener lógica de base de datos. `src/core/types.ts` define los contratos usados por la interfaz. `src/core/demoEngine.ts` genera datos ilustrativos y debe mantenerse separado del procesamiento real.

### Backend

La carpeta `backend/` contiene la API y la persistencia. `app/main.py` define las rutas y políticas CORS; `app/schemas.py` valida el cuerpo de las peticiones; `app/models.py` declara el modelo persistente; `app/database.py` configura SQLAlchemy y SQLite.

## Contrato HTTP actual

| Método | Ruta | Responsabilidad |
|---|---|---|
| GET | `/health` | Comprobar disponibilidad de la API |
| GET | `/api/v1` | Información de la API |
| GET | `/api/v1/state` | Recuperar el estado persistido |
| PUT | `/api/v1/state` | Guardar el estado de la plataforma |
| GET | `/api/v1/summary` | Obtener indicadores agregados |

## Decisiones y evolución

La persistencia actual usa un documento JSON para mantener compatibilidad con el estado del frontend existente. Es una solución de transición apropiada para la primera integración, no el diseño final de una plataforma empresarial. La siguiente evolución debe migrar análisis, detecciones, alertas, usuarios, reglas y escenarios a tablas y endpoints independientes, con autenticación, autorización por rol, auditoría y migraciones de esquema.

El módulo de visión debe exponer un servicio separado del ciclo HTTP: recepción/validación de archivo, preprocesamiento, inferencia del modelo, normalización de detecciones y persistencia del resultado. El modo DEMO debe quedar identificado en cada análisis para evitar confundir resultados ilustrativos con inferencia real.

## Inferencia combinada YOLO general + PPE

El WebSocket `/api/v1/vision/stream` puede ejecutar dos modelos en cada fotograma: un modelo general COCO (`YOLO_MODEL`) y un modelo PPE (`YOLO_PPE_MODEL`). Los resultados se normalizan al mismo contrato de detección y se deduplican cuando dos modelos identifican la misma clase en cajas solapadas. `GET /api/v1/vision/models` muestra la configuración declarada. Las clases efectivas se leen de los pesos cargados mediante `model.names`.

El modelo PPE predeterminado se obtiene de Hugging Face. Para entornos sin Internet, descarga previamente `best.pt` y configura `YOLO_PPE_MODEL=models/best.pt`. No se incluyen pesos binarios en el repositorio ZIP. La disponibilidad de las clases y su rendimiento dependen de los pesos seleccionados.
