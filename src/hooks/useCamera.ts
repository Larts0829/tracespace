import { useEffect, useRef, useState } from 'react';

export type CameraStatus = 'idle' | 'starting' | 'live' | 'error';

const NO_API_MESSAGE =
  'Camera is not available here. Open TraceSpace over HTTPS or localhost in a current browser.';

export function describeCameraError(err: unknown): string {
  const name = (err as DOMException | undefined)?.name;
  switch (name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return 'Camera permission was denied. Allow camera access in your browser settings, then try again. You can still trace using the reference image alone.';
    case 'NotFoundError':
    case 'OverconstrainedError':
      return 'No camera was found on this device.';
    case 'NotReadableError':
    case 'AbortError':
      return 'The camera is being used by another app. Close that app and try again.';
    default:
      return 'The camera could not start. Make sure you are on HTTPS or localhost.';
  }
}

/**
 * Starts the camera (preferring the rear lens) while `enabled` is true, and
 * always stops every track when disabled or unmounted.
 */
export function useCamera(enabled: boolean, deviceId?: string) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<CameraStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [activeId, setActiveId] = useState<string>();
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setStatus('idle');
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('error');
      setError(NO_API_MESSAGE);
      return;
    }

    let stream: MediaStream | null = null;
    let cancelled = false;
    setStatus('starting');
    setError(null);

    const facing: MediaTrackConstraints = deviceId
      ? { deviceId: { exact: deviceId } }
      : { facingMode: { ideal: 'environment' } };

    navigator.mediaDevices
      .getUserMedia({
        audio: false,
        video: { ...facing, width: { ideal: 1920 }, height: { ideal: 1080 } },
      })
      .then(async s => {
        if (cancelled) {
          s.getTracks().forEach(track => track.stop());
          return;
        }
        stream = s;
        const track = s.getVideoTracks()[0];
        track?.addEventListener('ended', () => {
          if (!cancelled) {
            setStatus('error');
            setError('The camera stopped. Tap "Try again" to restart it.');
          }
        });

        const el = videoRef.current;
        if (el) {
          el.srcObject = s;
          await el.play().catch(() => {});
        }
        setActiveId(track?.getSettings().deviceId);
        setStatus('live');

        const list = (await navigator.mediaDevices.enumerateDevices()).filter(d => d.kind === 'videoinput');
        if (!cancelled) setDevices(list);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setStatus('error');
        setError(describeCameraError(err));
      });

    return () => {
      cancelled = true;
      stream?.getTracks().forEach(track => track.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [enabled, deviceId, attempt]);

  return {
    videoRef,
    status,
    error,
    devices,
    activeId,
    retry: () => setAttempt(a => a + 1),
  };
}
