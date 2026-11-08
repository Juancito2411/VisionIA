# VISION AI Enterprise

Plataforma de visión computacional con frontend React + TypeScript + Vite y backend FastAPI. El Centro de análisis incluye captura de cámara web desde el navegador y transmisión de fotogramas al backend mediante WebSocket para inferencia YOLO con OpenCV.

## Estructura

- `frontend/`: interfaz y módulos de la plataforma.
- `backend/`: API REST, persistencia SQLite y endpoint WebSocket de visión.
- `docs/`: arquitectura y notas técnicas.

No utiliza archivos `.bat`. Frontend y backend se inician con comandos estándar en dos terminales.

## Requisitos

- Node.js 20+ y npm.
- Python 3.10+ (recomendado Python 3.11 o 3.12).
- Cámara web y navegador moderno. La cámara funciona en `localhost` o mediante HTTPS.
- Para inferencia YOLO: conexión a Internet en la primera ejecución si se usa el peso predeterminado, y recursos de CPU/GPU suficientes.

## Instalación y ejecución (Windows PowerShell)

Abre dos terminales en la carpeta `VISION_AI`.

### Terminal 1 — Backend

```powershell
cd backend
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
Copy-Item .env.example .env
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

La API estará en `http://127.0.0.1:8000` y su documentación en `http://127.0.0.1:8000/docs`.

### Terminal 2 — Frontend

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

Abre `http://localhost:5173`.

## Uso de la cámara

1. Inicia el backend y espera a que indique que está escuchando en el puerto 8000.
2. Inicia el frontend y entra con el acceso demostrativo que aparece precargado.
3. Abre **Centro de análisis** y pulsa **Iniciar cámara**.
4. Autoriza el acceso a la cámara en el navegador.
5. El frontend transmite fotogramas JPEG reducidos al WebSocket `/api/v1/vision/stream`.
6. YOLO devuelve clase, confianza y coordenadas normalizadas; React dibuja las cajas sobre el video.
7. Ajusta la confianza mínima y pulsa **Guardar sesión en historial** para registrar las detecciones visibles en el historial de la plataforma.

Para detener el dispositivo, pulsa **Detener** o abandona el módulo.

## Modelo YOLO y clases

Por defecto se utiliza `yolov8n.pt`, un modelo general preentrenado en COCO. Ultralytics descargará el peso al primer uso si no existe localmente. Puedes seleccionar otro archivo compatible mediante `YOLO_MODEL` en `backend/.env`, por ejemplo:

```env
YOLO_MODEL=./models/seguridad_industrial.pt
```

Crea `backend/models/` y coloca allí tu archivo `.pt`. Para chalecos reflectantes, cascos, guantes u otros elementos específicos de seguridad, necesitas pesos entrenados para esas clases. El modelo COCO genérico no garantiza reconocer EPP ni clases industriales personalizadas. El sistema no inventa esas detecciones.

La inferencia se ejecuta en el backend. En CPU la tasa de fotogramas puede ser baja según el equipo y el tamaño del modelo; para mayor rendimiento configura un modelo pequeño o una GPU compatible.

## Persistencia y módulos

La API conserva el estado de la plataforma en SQLite. El guardado de sesión de cámara agrega los objetos detectados al registro de análisis, por lo que aparecen en Historial y en el módulo Detección de objetos. Alertas y administración conservan sus flujos existentes; las alertas específicas de EPP requieren configurar reglas y un modelo que identifique dichas clases.


## Detección especializada de EPP (casco, guantes y chaleco)

La configuración ahora combina dos detectores: 

- **YOLO general** (`YOLO_MODEL=yolov8n.pt`): objetos comunes de COCO.
- **YOLO PPE** (`YOLO_PPE_MODEL=hf://Hexmon/vyra-yolo-ppe-detection/best.pt`): modelo especializado publicado en Hugging Face, con clases `Gloves`, `Goggles`, `Hardhat`, `Safety Vest`, `NO-Gloves`, `NO-Goggles`, `NO-Hardhat`, `NO-Safety Vest`, `Person`, `Safety Cone`, `Ladder`, `Mask` y `NO-Mask`, entre otras clases listadas por el modelo. El peso se descarga automáticamente al iniciar la primera inferencia; requiere Internet la primera vez.

El backend combina los resultados de ambos modelos y elimina cajas duplicadas de la misma clase cuando se solapan. El control de confianza inicia en 10% para no descartar prematuramente objetos pequeños como guantes. El backend usa internamente `YOLO_PPE_CONFIDENCE=0.08` y `YOLO_PPE_IMGSZ=960` para el detector especializado; puedes subir el umbral visual si aparecen falsos positivos o bajar el tamaño de inferencia a 640 si necesitas más FPS.

### Configuración

En `backend/.env` puedes cambiar: 

```env
YOLO_MODEL=yolov8n.pt
YOLO_PPE_MODEL=hf://Hexmon/vyra-yolo-ppe-detection/best.pt
YOLO_ENABLE_GENERAL=true
```

Para usar tus propios pesos PPE, colócalos dentro de `backend/models/` y configura, por ejemplo, `YOLO_PPE_MODEL=models/mi_modelo_epp.pt`. Los nombres de clases que se muestran provienen directamente del archivo de pesos, no de etiquetas inventadas. Si desactivas el modelo PPE (`YOLO_PPE_MODEL=off`), casco/guantes/chaleco dejarán de detectarse salvo que el modelo general o el modelo personalizado incluya esas clases.

**Alcance y límites:** este modelo público es una base de detección, no un sistema certificado de seguridad laboral. El rendimiento real depende de iluminación, distancia, oclusión, ángulo y similitud entre las cámaras de uso y las imágenes de entrenamiento. Valida los resultados con imágenes y videos de tu entorno antes de usar alertas para decisiones operativas. No interpretes la ausencia de una detección como prueba de que una persona no lleva EPP.

**Modelo y licencia:** [Hexmon/vyra-yolo-ppe-detection en Hugging Face](https://huggingface.co/Hexmon/vyra-yolo-ppe-detection), declarado CC BY 4.0 en su ficha; revisa la ficha y condiciones antes de distribuir el peso en un producto. El código descarga el archivo `best.pt` desde ese repositorio mediante `huggingface_hub`.

### Comprobar las clases que cargó el backend

Con el backend iniciado, abre `http://127.0.0.1:8000/api/v1/vision/diagnostics` para forzar la carga de los pesos y ver las clases reales disponibles. También puedes consultar `http://127.0.0.1:8000/api/v1/vision/models` para ver la configuración declarada. Si el peso PPE no se descarga o no se puede cargar, diagnostics responde HTTP 503 con el motivo.

## Verificación

Backend:

```powershell
python -m compileall app
```

Frontend:

```powershell
npm run build
```

El build del frontend requiere instalar las dependencias con `npm install`.

## Cámara en tiempo real y detección YOLO

El módulo **Centro de análisis** usa la cámara del navegador y envía un fotograma JPEG por vez al WebSocket ` /api/v1/vision/stream `. El backend procesa cada fotograma con Ultralytics YOLO y devuelve detecciones reales (`label`, `confidence` y coordenadas normalizadas). La interfaz dibuja los cuadros sobre el video. El envío se limita a una solicitud pendiente para evitar acumular fotogramas si la inferencia tarda más que el intervalo de captura.

### Modelo inicial

Por defecto `backend/.env.example` configura `YOLO_MODEL=yolov8n.pt`. Ultralytics descarga ese peso la primera vez que se ejecuta el modelo si hay conexión a Internet. Es un modelo general entrenado con COCO (80 categorías). Reconoce clases como `person`, `bicycle`, `car`, `motorcycle`, `airplane`, `bus`, `train`, `truck`, `boat`, `traffic light`, `fire hydrant`, `stop sign`, `bench`, `bird`, `cat`, `dog`, `backpack`, `umbrella`, `handbag`, `suitcase`, `bottle`, `cup`, `chair`, `couch`, `potted plant`, `bed`, `dining table`, `tv`, `laptop`, `mouse`, `keyboard`, `cell phone`, `book`, `clock`, `vase`, `scissors`, `teddy bear`, `hair drier` y `toothbrush`, entre otras clases COCO.

**Limitación importante:** COCO no tiene clases específicas para casco de seguridad, chaleco reflectante, guantes, pallet ni montacargas. Para identificarlos se debe entrenar o conseguir un modelo YOLO con esas clases y configurar `YOLO_MODEL=ruta/al/modelo.pt` en `backend/.env`. La aplicación muestra exclusivamente las clases devueltas por el peso configurado; no inventa detecciones de EPP.

### Controles del visor

- **Encender cámara:** solicita permiso al navegador, abre el stream y conecta al WebSocket de inferencia.
- **Capturar:** descarga un PNG del fotograma actual con las cajas, nombres y porcentajes que se ven en pantalla.
- **Apagar cámara:** cierra el WebSocket, detiene todas las pistas de `MediaStream` y detiene el envío de fotogramas.
- **Guardar en historial:** almacena el conjunto de detecciones visibles como un análisis de cámara.

El acceso a cámara funciona en `localhost` o en un sitio servido por HTTPS. El rendimiento depende del equipo, resolución, modelo y hardware disponible.


### Ajustes para cascos y EPP pequeños

El detector PPE se ejecuta con una resolución de inferencia mayor (960 px) y umbral interno de 8% para mejorar la recuperación de cascos, guantes y gafas pequeños. El control de confianza de la interfaz filtra después las detecciones que se muestran. Empieza en 10%; si hay falsos positivos, aumenta gradualmente a 20–35%. Para equipos lentos, establece `YOLO_PPE_IMGSZ=640`. El modelo público documenta 14 clases, incluidas `Hardhat`, `Gloves` y `Safety Vest`; el resultado depende de iluminación, ángulo, distancia y oclusión.
