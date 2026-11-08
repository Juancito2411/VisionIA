# Backend VISION AI

FastAPI + SQLite + WebSocket de inferencia YOLO.

## Modelos

El backend combina `YOLO_MODEL` (COCO general) con `YOLO_PPE_MODEL` (PPE especializado). Por defecto el segundo usa `hf://Hexmon/vyra-yolo-ppe-detection/best.pt` y se descarga al primer uso. Requiere `huggingface_hub` (incluido en requirements) e Internet la primera vez.

El modelo PPE incluye clases como Gloves, Hardhat, Goggles, Safety Vest y etiquetas de ausencia como NO-Gloves y NO-Hardhat. Las etiquetas visibles se leen de `model.names` del peso cargado. Para un modelo propio usa una ruta relativa a `backend/`, por ejemplo `YOLO_PPE_MODEL=models/epp_custom.pt`.

Consulta la configuración sin descargar pesos en `GET /api/v1/vision/models`.

## Ejecutar

```powershell
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
