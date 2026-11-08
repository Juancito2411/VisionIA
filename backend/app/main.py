from pathlib import Path
from dotenv import load_dotenv
load_dotenv(Path(__file__).resolve().parents[1] / '.env')

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from .database import Base, engine, SessionLocal
from .models import PlatformState
from .schemas import StateWrite

Base.metadata.create_all(bind=engine)
app = FastAPI(title='VISION AI API', version='1.0.0', description='API de persistencia y gestión de VISION AI')
app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://127.0.0.1:5174', 'http://localhost:4173', 'http://127.0.0.1:4173'],
    allow_credentials=True, allow_methods=['*'], allow_headers=['*'],
)

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

@app.get('/health')
def health():
    return {'status': 'ok', 'service': 'VISION AI API'}

@app.get('/api/v1')
def root():
    return {'name': 'VISION AI API', 'version': '1.0.0', 'docs': '/docs'}

@app.get('/api/v1/state')
def read_state(db: Session = Depends(get_db)):
    record = db.query(PlatformState).order_by(PlatformState.id.asc()).first()
    return {'data': record.data if record else None, 'updated_at': record.updated_at if record else None}

@app.put('/api/v1/state')
def write_state(payload: StateWrite, db: Session = Depends(get_db)):
    record = db.query(PlatformState).order_by(PlatformState.id.asc()).first()
    if record is None:
        record = PlatformState(data=payload.data)
        db.add(record)
    else:
        record.data = payload.data
    db.commit()
    db.refresh(record)
    return {'message': 'Estado guardado correctamente', 'updated_at': record.updated_at}

@app.get('/api/v1/summary')
def summary(db: Session = Depends(get_db)):
    record = db.query(PlatformState).order_by(PlatformState.id.asc()).first()
    data = record.data if record else {}
    return {
        'analyses': len(data.get('analyses', [])),
        'alerts': len(data.get('alerts', [])),
        'new_alerts': sum(1 for item in data.get('alerts', []) if item.get('status') == 'Nueva'),
        'users': len(data.get('users', [])),
        'updated_at': record.updated_at if record else None,
    }

# Streaming de cámara: cada fotograma JPEG se procesa con YOLO y devuelve
# cajas normalizadas para que React las dibuje sobre el video local.
import base64
import os
import time
import asyncio
from fastapi import WebSocket, WebSocketDisconnect

_yolo_models = None
_yolo_lock = asyncio.Lock()


def _load_model_spec(spec: str, default_repo: str, default_file: str):
    """Load a local .pt model or resolve hf://owner/repo/file through HF Hub."""
    from ultralytics import YOLO
    spec = (spec or '').strip()
    if not spec:
        raise RuntimeError('La ruta del modelo está vacía.')
    if spec.startswith('hf://'):
        from huggingface_hub import hf_hub_download
        target = spec[5:]
        parts = target.split('/', 2)
        if len(parts) != 3:
            raise RuntimeError('Formato Hugging Face inválido. Usa hf://usuario/repositorio/archivo.pt')
        repo_id = f'{parts[0]}/{parts[1]}'
        filename = parts[2]
        weights_path = hf_hub_download(repo_id=repo_id, filename=filename)
    else:
        model_path = Path(spec)
        if not model_path.is_absolute():
            model_path = (Path(__file__).resolve().parents[1] / model_path).resolve()
        weights_path = str(model_path) if model_path.exists() else spec
    model = YOLO(weights_path)
    names = model.names
    if isinstance(names, list):
        names = {i: name for i, name in enumerate(names)}
    return model, {int(k): str(v) for k, v in names.items()}


async def get_yolo_models():
    global _yolo_models
    if _yolo_models is None:
        async with _yolo_lock:
            if _yolo_models is None:
                try:
                    general_spec = os.getenv('YOLO_MODEL', 'yolov8n.pt')
                    ppe_spec = os.getenv(
                        'YOLO_PPE_MODEL',
                        'hf://Hexmon/vyra-yolo-ppe-detection/best.pt'
                    )
                    models = []
                    if os.getenv('YOLO_ENABLE_GENERAL', 'true').lower() in ('1', 'true', 'yes', 'on'):
                        general_model, general_names = await asyncio.to_thread(
                            _load_model_spec, general_spec, '', ''
                        )
                        models.append({'key': 'general', 'model': general_model, 'names': general_names, 'source': general_spec})
                    if ppe_spec.lower() not in ('', 'off', 'none', 'false'):
                        ppe_model, ppe_names = await asyncio.to_thread(
                            _load_model_spec, ppe_spec, '', ''
                        )
                        models.append({'key': 'ppe', 'model': ppe_model, 'names': ppe_names, 'source': ppe_spec})
                    if not models:
                        raise RuntimeError('No hay modelos habilitados. Configura YOLO_MODEL o YOLO_PPE_MODEL.')
                    _yolo_models = models
                except Exception as exc:
                    raise RuntimeError(
                        'No se pudieron cargar los modelos YOLO. Verifica conexión a Internet para la primera descarga, '
                        'las rutas y las dependencias. Detalle: ' + str(exc)
                    ) from exc
    return _yolo_models


def _iou(a, b):
    ax1, ay1, ax2, ay2 = a
    bx1, by1, bx2, by2 = b
    ix1, iy1, ix2, iy2 = max(ax1, bx1), max(ay1, by1), min(ax2, bx2), min(ay2, by2)
    iw, ih = max(0.0, ix2 - ix1), max(0.0, iy2 - iy1)
    inter = iw * ih
    area_a = max(0.0, ax2-ax1) * max(0.0, ay2-ay1)
    area_b = max(0.0, bx2-bx1) * max(0.0, by2-by1)
    return inter / max(area_a + area_b - inter, 1e-9)


@app.get('/api/v1/vision/models')
async def vision_models():
    """Return configured model names/classes without forcing weight download."""
    general = os.getenv('YOLO_MODEL', 'yolov8n.pt')
    ppe = os.getenv('YOLO_PPE_MODEL', 'hf://Hexmon/vyra-yolo-ppe-detection/best.pt')
    return {
        'general_model': general,
        'ppe_model': ppe,
        'general_enabled': os.getenv('YOLO_ENABLE_GENERAL', 'true').lower() in ('1', 'true', 'yes', 'on'),
        'ppe_enabled': ppe.lower() not in ('', 'off', 'none', 'false'),
        'ppe_expected_classes': [
            'Fall-Detected', 'Gloves', 'Goggles', 'Hardhat', 'Ladder', 'Mask',
            'NO-Gloves', 'NO-Goggles', 'NO-Hardhat', 'NO-Mask',
            'NO-Safety Vest', 'Person', 'Safety Cone', 'Safety Vest'
        ],
        'note': 'Las clases efectivas se obtienen de los nombres incluidos en los pesos cargados.'
    }


@app.websocket('/api/v1/vision/stream')
async def vision_stream(websocket: WebSocket):
    await websocket.accept()
    previous = time.perf_counter()
    try:
        while True:
            try:
                payload = await websocket.receive_json()
            except (WebSocketDisconnect, RuntimeError):
                break
            
            # Capturamos el escenario enviado desde el frontend de forma segura
            current_scenario = payload.get('scenario', 'general')
            
            encoded = payload.get('frame')
            if not encoded:
                try:
                    await websocket.send_json({'error': 'Fotograma vacío'})
                except:
                    break
                continue
                
            try:
                import cv2
                import numpy as np
                raw = base64.b64decode(encoded, validate=True)
                if len(raw) > 2_500_000:
                    await websocket.send_json({'error': 'Fotograma demasiado grande'})
                    continue
                frame = cv2.imdecode(np.frombuffer(raw, dtype=np.uint8), cv2.IMREAD_COLOR)
                if frame is None:
                    await websocket.send_json({'error': 'No se pudo decodificar el fotograma'})
                    continue
                    
                models = await get_yolo_models()
                conf = max(0.05, min(0.95, float(payload.get('confidence', 0.30))))
                height, width = frame.shape[:2]
                candidates = []
                model_errors = []
                
                for entry in models:
                    try:
                        if entry['key'] == 'ppe':
                            model_conf = float(os.getenv('YOLO_PPE_CONFIDENCE', '0.08'))
                            model_imgsz = int(os.getenv('YOLO_PPE_IMGSZ', '960'))
                        else:
                            model_conf = max(0.05, min(0.95, conf))
                            model_imgsz = int(os.getenv('YOLO_GENERAL_IMGSZ', '640'))
                            
                        results = await asyncio.to_thread(
                            entry['model'].predict,
                            frame,
                            conf=max(0.03, min(0.95, model_conf)),
                            imgsz=model_imgsz,
                            iou=float(os.getenv('YOLO_NMS_IOU', '0.45')),
                            max_det=int(os.getenv('YOLO_MAX_DETECTIONS', '100')),
                            augment=(entry['key'] == 'ppe' and os.getenv('YOLO_PPE_AUGMENT', 'false').lower() in ('1', 'true', 'yes', 'on')),
                            verbose=False,
                        )
                        result = results[0]
                        ppe_labels = {
                            'hardhat': 'Casco', 'helmet': 'Casco',
                            'gloves': 'Guantes', 'goggles': 'Gafas',
                            'safety vest': 'Chaleco reflectante', 'safety-vest': 'Chaleco reflectante',
                            'mask': 'Mascarilla', 'safety cone': 'Cono de seguridad',
                            'ladder': 'Escalera', 'person': 'person',
                            'no-hardhat': 'Sin casco', 'no-helmet': 'Sin casco',
                            'no-gloves': 'Sin guantes', 'no-goggles': 'Sin gafas',
                            'no-safety vest': 'Sin chaleco', 'no-mask': 'Sin mascarilla',
                            'fall-detected': 'Caída detectada',
                        }
                        for box in result.boxes:
                            x1, y1, x2, y2 = [float(v) for v in box.xyxy[0].tolist()]
                            class_id = int(box.cls[0].item())
                            raw_label = str(entry['names'].get(class_id, class_id)).strip()
                            label = ppe_labels.get(raw_label.casefold(), raw_label)
                            score = float(box.conf[0].item())
                            candidates.append({
                                'class_id': class_id,
                                'label': label,
                                'raw_label': raw_label,
                                'confidence': score,
                                'x': max(0.0, min(1.0, x1 / width)),
                                'y': max(0.0, min(1.0, y1 / height)),
                                'w': max(0.0, min(1.0, (x2 - x1) / width)),
                                'h': max(0.0, min(1.0, (y2 - y1) / height)),
                                'model': entry['key'],
                            })
                    except Exception as exc:
                        model_errors.append(f"{entry['key']}: {exc}")
                        
                candidates.sort(key=lambda item: item['confidence'], reverse=True)
                detections = []
                for item in candidates:
                    box_a = (item['x'], item['y'], item['x'] + item['w'], item['y'] + item['h'])
                    duplicate = False
                    for kept in detections:
                        if item['label'].strip().casefold() != kept['label'].strip().casefold():
                            continue
                        box_b = (kept['x'], kept['y'], kept['x'] + kept['w'], kept['y'] + kept['h'])
                        if _iou(box_a, box_b) >= 0.55:
                            duplicate = True
                            break
                    if not duplicate:
                        detections.append(item)
                
                # --- APLICACIÓN DE LA LÓGICA DINÁMICA POR ESCENARIO ---
                for item in detections:
                    raw_label = item['label'].lower()
                    
                    if current_scenario == 'retail':
                        if raw_label in ['bottle', 'cup', 'cell phone', 'book', 'backpack', 'handbag']:
                            item['label'] = 'Producto en estante'
                        elif raw_label in ['chair', 'couch', 'table']:
                            item['label'] = 'Mobiliario comercial'
                            
                    elif current_scenario == 'calidad':
                        if raw_label == 'person':
                            item['label'] = 'Operario de inspección'
                        else:
                            item['label'] = 'Componente analizado'
                            if item['confidence'] < 0.40:
                                item['label'] = 'Defecto superficial detectado'
                # -----------------------------------------------------
                        
                now = time.perf_counter()
                fps = 1.0 / max(now - previous, 0.001)
                previous = now
                
                try:
                    await websocket.send_json({
                        'detections': detections,
                        'fps': round(fps, 1),
                        'width': width,
                        'height': height,
                        'models': [entry['key'] for entry in models],
                        'model_classes': {entry['key']: list(entry['names'].values()) for entry in models},
                        'model_errors': model_errors,
                        'ppe_ready': any(entry['key'] == 'ppe' for entry in models) and not any(err.startswith('ppe:') for err in model_errors),
                    })
                except (WebSocketDisconnect, RuntimeError):
                    break
                    
            except RuntimeError as exc:
                try:
                    await websocket.send_json({'error': str(exc)})
                except:
                    break
                await asyncio.sleep(1)
            except Exception as exc:
                try:
                    await websocket.send_json({'error': f'Error procesando fotograma: {exc}'})
                except:
                    break
    except WebSocketDisconnect:
        pass


@app.get('/api/v1/vision/diagnostics')
async def vision_diagnostics():
    # Force-load weights and expose their actual class names for troubleshooting.
    try:
        models = await get_yolo_models()
        return {
            'status': 'ready',
            'models': [
                {'key': item['key'], 'source': item['source'], 'classes': list(item['names'].values())}
                for item in models
            ],
            'ppe_ready': any(item['key'] == 'ppe' for item in models),
        }
    except Exception as exc:
        raise HTTPException(status_code=503, detail=str(exc))