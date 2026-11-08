import React, { useEffect, useState, useRef } from 'react';
import { AlertTriangle, Video, Camera, Play, CircleStop, ClipboardList, ShieldCheck } from 'lucide-react';
import type { Analysis, Role } from '../../core/types';
import type { Store } from '../../core/storage';
import PageHead from '../../components/PageHead';

interface AnalysisPageProps {
  store: Store;
  user: { name: string; role: Role };
  onRun: (a: Analysis) => void;
  notify: (s: string) => void;
}

export default function AnalysisPage({ store, user, onRun, notify }: AnalysisPageProps) {
  const [scenarioId, setScenarioId] = useState(store.scenarios[0]?.id);
  const [threshold, setThreshold] = useState(10);
  const thresholdRef = useRef(10);
  useEffect(() => { thresholdRef.current = threshold; }, [threshold]);

  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [detections, setDetections] = useState<any[]>([]);
  const [fps, setFps] = useState(0);
  const [frames, setFrames] = useState(0);
  const [busy, setBusy] = useState(false);
  const [wsStatus, setWsStatus] = useState<'offline' | 'connecting' | 'online' | 'error'>('offline');
  const [cameraList, setCameraList] = useState<MediaDeviceInfo[]>([]);
  const [cameraId, setCameraId] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<number | undefined>(undefined);
  const lastFrameRef = useRef(0);
  const framePendingRef = useRef(false);

  const stopCamera = () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = undefined;
    framePendingRef.current = false;
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
    setWsStatus('offline');
    setDetections([]);
    setFps(0);
    setCameraError('');
  };

  useEffect(() => {
    refreshCameras();
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      wsRef.current?.close();
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const refreshCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cams = devices.filter(d => d.kind === 'videoinput');
      setCameraList(cams);
      if (!cameraId && cams[0]) setCameraId(cams[0].deviceId);
    } catch {
      setCameraError('No se pudieron consultar las cámaras del dispositivo.');
    }
  };

  const startCamera = async () => {
    setCameraError('');
    setBusy(true);
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('El navegador no permite acceder a la cámara. Usa localhost o HTTPS.');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: cameraId ? { exact: cameraId } : undefined, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      await refreshCameras();
      setCameraOn(true);
      setWsStatus('connecting');

      // Actualizado para apuntar directamente a Render por defecto si no hay variable de entorno
      const configuredApi = (import.meta as any).env?.VITE_API_URL || 'https://visionia-4111.onrender.com/api/v1';
      const apiBase = configuredApi.replace(/\/api\/v1\/?$/, '');
      const wsUrl = apiBase.replace(/^http/, 'ws') + '/api/v1/vision/stream';
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsStatus('online');
        notify('Cámara conectada · Inferencia YOLO activa');
      };
      ws.onmessage = (event) => {
        framePendingRef.current = false;
        try {
          const msg = JSON.parse(event.data);
          if (msg.error) { setCameraError(msg.error); return; }
          if (msg.model_errors?.length) {
            setCameraError('Advertencia del motor: ' + msg.model_errors.join(' | '));
          } else if (msg.ppe_ready) {
            setCameraError('');
          }
          setDetections((msg.detections || []).filter((d: any) => d.confidence >= thresholdRef.current / 100));
          setFps(msg.fps || 0);
          setFrames(v => v + 1);
        } catch { }
      };
      ws.onerror = () => {
        setWsStatus('error');
        setCameraError('No se pudo conectar con el motor YOLO. Verifica que el backend esté activo.');
      };
      ws.onclose = () => {
        if (streamRef.current) { setWsStatus('error'); }
      };
    } catch (e: any) {
      stopCamera();
      setCameraError(e?.message || 'No se pudo iniciar la cámara.');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!cameraOn || wsStatus !== 'online') return;
    timerRef.current = window.setInterval(() => {
      const video = videoRef.current, canvas = canvasRef.current, ws = wsRef.current;
      if (!video || !canvas || !ws || ws.readyState !== WebSocket.OPEN || video.readyState < 2 || framePendingRef.current) return;
      const now = performance.now();
      if (now - lastFrameRef.current < 180) return;
      lastFrameRef.current = now;
      canvas.width = 960;
      canvas.height = Math.round(960 * video.videoHeight / Math.max(1, video.videoWidth));
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const data = canvas.toDataURL('image/jpeg', 0.82).split(',')[1];
      framePendingRef.current = true;
      ws.send(JSON.stringify({ 
        frame: data, 
        confidence: threshold / 100, 
        scenario: scenarioId 
      }));
    }, 100);
    return () => { if (timerRef.current) window.clearInterval(timerRef.current); };
  }, [cameraOn, wsStatus, threshold]);

  const captureFrame = () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2 || !cameraOn) {
      setCameraError('Enciende la cámara antes de capturar.');
      return;
    }
    const output = document.createElement('canvas');
    const width = video.videoWidth, height = video.videoHeight;
    output.width = width; output.height = height;
    const ctx = output.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, width, height);
    const palette = ['#13c5d9', '#21bd8b', '#efa14e', '#9275ed'];
    ctx.lineWidth = Math.max(2, width / 640 * 2);
    ctx.font = `bold ${Math.max(14, width / 640 * 13)}px Arial`;
    detections.forEach((d: any, i: number) => {
      const x = d.x * width, y = d.y * height, w = d.w * width, h = d.h * height, color = palette[i % palette.length];
      ctx.strokeStyle = color;
      ctx.strokeRect(x, y, w, h);
      const label = `${d.label} ${(d.confidence * 100).toFixed(1)}%`;
      const pad = 6, textWidth = ctx.measureText(label).width;
      const labelY = Math.max(0, y - Math.max(24, width / 640 * 24));
      ctx.fillStyle = color;
      ctx.fillRect(x, labelY, textWidth + pad * 2, Math.max(24, width / 640 * 24));
      ctx.fillStyle = '#fff';
      ctx.fillText(label, x + pad, labelY + Math.max(17, width / 640 * 17));
    });
    const link = document.createElement('a');
    link.download = `vision-ai-captura-${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
    link.href = output.toDataURL('image/png');
    link.click();
    notify('Captura guardada con las detecciones visibles');
  };

  const saveSession = () => {
    const id = `VIS-${Date.now()}`;
    const mapped = detections.map((d: any, i) => ({
      id: `D${i + 1}`,
      label: d.label,
      confidence: d.confidence,
      x: d.x, y: d.y, w: d.w, h: d.h,
      color: ['#12b8d0', '#8b72ed', '#efa14e', '#28a879'][i % 4]
    }));
    const confidence = mapped.length ? mapped.reduce((a, d) => a + d.confidence, 0) / mapped.length : 0;
    const a: Analysis = {
      id,
      date: new Date().toISOString(),
      user: user.name,
      scenario: 'Cámara en tiempo real',
      type: 'Detección de objetos',
      image: '',
      detections: mapped,
      confidence,
      duration: 0,
      status: 'Completado',
      patterns: []
    };
    onRun(a);
    stopCamera();
  };

  const counts = Object.entries(detections.reduce((acc: any, d: any) => {
    acc[d.label] = (acc[d.label] || 0) + 1;
    return acc;
  }, {} as Record<string, number>));

  return (
    <>
      <PageHead 
        eyebrow="MOTOR DE VISIÓN / CÁMARA EN DIRECTO" 
        title="Centro de análisis visual" 
        desc="Conecta una cámara y detecta objetos en tiempo real mediante el modelo YOLO del backend." 
      />
      <div className="live-camera-toolbar">
        <div>
          <span className={`live-indicator ${wsStatus === 'online' ? 'on' : ''}`} />
          <b>{wsStatus === 'online' ? 'Motor YOLO conectado' : wsStatus === 'connecting' ? 'Conectando motor...' : wsStatus === 'error' ? 'Error de conexión' : 'Cámara detenida'}</b>
          <small>Procesamiento en backend · FastAPI + OpenCV + YOLO</small>
        </div>
        <div className="camera-actions">
          <select value={scenarioId} onChange={e => setScenarioId(e.target.value)}>
            {store.scenarios.map((sc: any) => (
              <option key={sc.id} value={sc.id}>{sc.name}</option>
            ))}
          </select>

          <select value={cameraId} onChange={e => setCameraId(e.target.value)} disabled={cameraOn}>
            <option value="">Cámara predeterminada</option>
            {cameraList.map((c, i) => <option key={c.deviceId} value={c.deviceId}>{c.label || `Cámara ${i + 1}`}</option>)}
          </select>
          <span className={`camera-device-state ${cameraOn ? 'active' : ''}`}>{cameraOn ? 'Cámara activa' : 'Cámara apagada'}</span>
        </div>
      </div>

      {cameraError && <div className="camera-error"><AlertTriangle size={16} />{cameraError}</div>}

      <div className="live-analysis-grid">
        <div className="panel live-view-panel">
          <div className="panel-head">
            <div><h3>Vista de cámara</h3><p>Detección y seguimiento de objetos sobre el video</p></div>
            <span className={`panel-tag ${wsStatus === 'online' ? 'live-tag' : ''}`}>{wsStatus === 'online' ? '● EN DIRECTO' : 'SIN SEÑAL'}</span>
          </div>
          <div className="live-video-stage">
            <video ref={videoRef} muted playsInline className={cameraOn ? 'visible-video' : 'hidden-video'} />
            <canvas ref={canvasRef} className="capture-canvas" />
            {cameraOn && (
              <div className="live-overlay">
                {detections.map((d: any, i) => (
                  <div key={`${d.class_id}-${i}`} className="live-bbox" style={{ left: `${d.x * 100}%`, top: `${d.y * 100}%`, width: `${d.w * 100}%`, height: `${d.h * 100}%`, borderColor: ['#13c5d9', '#21bd8b', '#efa14e', '#9275ed'][i % 4] }}>
                    <span style={{ background: ['#13a9bd', '#159a70', '#c17a20', '#7658d1'][i % 4] }}>{d.label} · {(d.confidence * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            )}
            {!cameraOn && (
              <div className="camera-empty">
                <div><Video size={36} /><b>Vista de cámara inactiva</b><span>Inicia la cámara para visualizar detecciones reales.</span></div>
              </div>
            )}
            <div className="video-watermark">VISION AI · YOLO REALTIME</div>
          </div>
          <div className="live-stats-row">
            <div><b>{detections.filter((d: any) => ['person', 'persona'].includes(String(d.label).toLowerCase())).length}</b><small>Personas</small></div>
            <div><b>{detections.length}</b><small>Objetos detectados</small></div>
            <div><b>{fps.toFixed(1)}</b><small>FPS backend</small></div>
            <div><b>{frames}</b><small>Fotogramas analizados</small></div>
          </div>
          <div className="live-footer-actions">
            <label>Confianza mínima <b>{threshold}%</b><input type="range" min="5" max="95" value={threshold} onChange={e => setThreshold(+e.target.value)} /></label>
            <div className="live-action-buttons">
              <button className="btn secondary" onClick={captureFrame} disabled={!cameraOn}><Camera size={16} /> Capturar</button>
              {!cameraOn ? (
                <button className="btn primary" onClick={startCamera} disabled={busy}><Play size={16} />{busy ? 'Activando cámara...' : 'Encender cámara'}</button>
              ) : (
                <button className="btn danger" onClick={stopCamera}><CircleStop size={16} /> Apagar cámara</button>
              )}
              <button className="btn secondary" disabled={!cameraOn || !detections.length} onClick={saveSession}><ClipboardList size={16} /> Guardar en historial</button>
            </div>
          </div>
        </div>
        <aside className="panel live-detections-panel">
          <div className="panel-head">
            <div><h3>Objetos detectados</h3><p>Inferencia del modelo YOLO</p></div>
            <span className="count-pill">{detections.length}</span>
          </div>
          <div className="live-count-list">
            {counts.length ? counts.map(([label, count]) => (
              <div className="live-count-item" key={label}><span className="legend-dot" /><b>{label}</b><strong>{count as number}</strong></div>
            )) : <div className="no-detections">{cameraOn ? 'Esperando objetos en el campo visual...' : 'Inicia la cámara para comenzar.'}</div>}
          </div>
          <div className="live-confidence">
            <small>Confianza media</small>
            <b>{detections.length ? (detections.reduce((a: number, d: any) => a + d.confidence, 0) / detections.length * 100).toFixed(1) : '0.0'}%</b>
          </div>
          <div className="live-model-note">
            <ShieldCheck size={15} />
            <span>Modelo PPE: Hardhat, Gloves, Safety Vest, Goggles. Consulta /api/v1/vision/diagnostics.</span>
          </div>
        </aside>
      </div>
      <div className="panel live-config-panel">
        <div><h3>Configuración del motor</h3><p>El backend debe tener instalado Ultralytics y el archivo de pesos configurado.</p></div>
        <div className="model-status"><span className={`live-indicator ${wsStatus === 'online' ? 'on' : ''}`} />{wsStatus === 'online' ? 'Conectado' : 'No conectado'}</div>
      </div>
    </>
  );
}