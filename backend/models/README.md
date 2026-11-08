# Modelos YOLO

El backend carga un modelo general COCO (`YOLO_MODEL`) y otro especializado en EPP (`YOLO_PPE_MODEL`).

El modelo PPE configurado por defecto es `Hexmon/vyra-yolo-ppe-detection` (`best.pt`). Su ficha publica 14 clases: `Fall-Detected`, `Gloves`, `Goggles`, `Hardhat`, `Ladder`, `Mask`, `NO-Gloves`, `NO-Goggles`, `NO-Hardhat`, `NO-Mask`, `NO-Safety Vest`, `Person`, `Safety Cone` y `Safety Vest`. La primera inferencia requiere Internet para descargar el peso (aprox. 52 MB).

Para usar pesos propios, copia el archivo `.pt` aquí y define `YOLO_PPE_MODEL=models/mi_modelo_epp.pt` en `backend/.env`. Los nombres proceden de `model.names`; no se inventan detecciones.

Se recomienda `YOLO_PPE_CONFIDENCE=0.08` y `YOLO_PPE_IMGSZ=960` para mejorar la sensibilidad a objetos pequeños. Esto puede aumentar falsos positivos y carga de CPU. Si la cámara produce pocos FPS, reduce `YOLO_PPE_IMGSZ` a `640`.
