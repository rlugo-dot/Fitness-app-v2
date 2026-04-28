import { useEffect, useRef, useState } from 'react';
import { Loader2, CameraOff } from 'lucide-react';

interface Props {
  onDetected: (code: string) => void;
}

export default function BarcodeScanner({ onDetected }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<'starting' | 'scanning' | 'error'>('starting');
  const [errorMsg, setErrorMsg] = useState('');
  const detectedRef = useRef(false);

  useEffect(() => {
    detectedRef.current = false;
    let stopFn: (() => void) | null = null;

    async function start() {
      try {
        const { BrowserMultiFormatReader } = await import('@zxing/browser');
        const reader = new BrowserMultiFormatReader();
        const controls = await reader.decodeFromVideoDevice(
          undefined,
          videoRef.current!,
          (result, err) => {
            if (result && !detectedRef.current) {
              detectedRef.current = true;
              controls.stop();
              onDetected(result.getText());
            }
            if (!err) setStatus('scanning');
          }
        );
        stopFn = () => controls.stop();
        setStatus('scanning');
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('denied')) {
          setErrorMsg('Camera permission denied. Please allow camera access and try again.');
        } else {
          setErrorMsg('Could not start camera. Try again.');
        }
        setStatus('error');
      }
    }

    start();
    return () => { stopFn?.(); };
  }, [onDetected]);

  return (
    <div className="relative rounded-2xl overflow-hidden bg-black aspect-video">
      <video ref={videoRef} className="w-full h-full object-cover" />

      {status === 'starting' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <Loader2 className="animate-spin text-white" size={28} />
          <p className="text-white/70 text-xs">Starting camera…</p>
        </div>
      )}

      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
          <CameraOff className="text-white/60" size={32} />
          <p className="text-white/80 text-sm">{errorMsg}</p>
        </div>
      )}

      {status === 'scanning' && (
        <>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-60 h-36">
              <span className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-green-400 rounded-tl-sm" />
              <span className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-green-400 rounded-tr-sm" />
              <span className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-green-400 rounded-bl-sm" />
              <span className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-green-400 rounded-br-sm" />
              <div className="absolute inset-x-0 top-1/2 h-px bg-green-400/60 animate-pulse" />
            </div>
          </div>
          <p className="absolute bottom-3 inset-x-0 text-center text-white/60 text-xs">
            Point at a product barcode
          </p>
        </>
      )}
    </div>
  );
}
