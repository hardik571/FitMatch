import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, Upload, X, RefreshCw, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CameraCaptureProps {
  onCapture: (base64: string) => void;
  label?: string;
  aspectRatio?: 'square' | 'video';
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, label = "Capture Image", aspectRatio = 'video' }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCamera = async () => {
    console.log("Starting camera...");
    setError(null);
    setIsInitializing(true);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API not supported or blocked.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
        console.log("Camera stream started.");
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError(err instanceof Error ? err.message : "Could not access camera");
    } finally {
      setIsInitializing(false);
    }
  };

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsStreaming(false);
      console.log("Camera stream stopped.");
    }
  }, []);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        const base64 = dataUrl.split(',')[1];
        setPreview(dataUrl);
        onCapture(base64);
        stopCamera();
        console.log("Photo captured successfully.");
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreview(result);
        onCapture(result.split(',')[1]);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const reset = () => {
    setPreview(null);
    setError(null);
    stopCamera();
  };

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  return (
    <div className="w-full flex flex-col gap-4">
      {label && <h3 className="font-medium text-gray-700">{label}</h3>}
      
      <div className={`relative w-full bg-gray-900 rounded-[2rem] overflow-hidden shadow-2xl group ${aspectRatio === 'square' ? 'aspect-square' : 'aspect-video'}`}>
        
        <AnimatePresence mode="wait">
          {/* Initial State */}
          {!isStreaming && !preview && (
            <motion.div 
              key="initial"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-8 text-center z-10"
            >
              {error ? (
                <div className="flex flex-col items-center gap-3 text-red-400">
                  <AlertCircle size={40} />
                  <p className="text-sm font-medium">{error}</p>
                  <button 
                    onClick={() => setError(null)}
                    className="text-white bg-white/10 px-4 py-1 rounded-full text-xs hover:bg-white/20"
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-2">
                    <Sparkles className="text-white/40" size={32} />
                  </div>
                  <div className="flex gap-4">
                    <button 
                      type="button"
                      disabled={isInitializing}
                      onClick={startCamera}
                      className="flex flex-col items-center justify-center w-24 h-24 bg-white rounded-3xl shadow-xl hover:scale-105 active:scale-95 transition-all text-black cursor-pointer disabled:opacity-50"
                    >
                      {isInitializing ? (
                        <RefreshCw className="animate-spin text-gray-400" size={24} />
                      ) : (
                        <>
                          <Camera size={28} />
                          <span className="text-[10px] mt-2 font-bold uppercase tracking-wider text-center px-2">Camera</span>
                        </>
                      )}
                    </button>
                    <button 
                      type="button"
                      onClick={triggerUpload}
                      className="flex flex-col items-center justify-center w-24 h-24 bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl shadow-xl hover:scale-105 active:scale-95 transition-all text-white cursor-pointer"
                    >
                      <Upload size={28} />
                      <span className="text-[10px] mt-2 font-bold uppercase tracking-wider text-center px-2">Upload</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-[0.2em]">{label}</p>
                </>
              )}
            </motion.div>
          )}

          {/* Video Stream */}
          {isStreaming && (
            <motion.div 
              key="stream"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 w-full h-full"
            >
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted
                className="w-full h-full object-cover" 
              />
              <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center gap-8 z-10">
                <button onClick={stopCamera} className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white">
                  <X size={20} />
                </button>
                <button 
                  onClick={capturePhoto}
                  className="w-16 h-16 rounded-full border-4 border-white/30 p-1 hover:scale-110 transition-transform"
                >
                  <div className="w-full h-full rounded-full bg-white shadow-lg" />
                </button>
                <div className="w-10" />
              </div>
            </motion.div>
          )}

          {/* Preview State */}
          {preview && (
            <motion.div 
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 w-full h-full"
            >
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/20" />
              <button 
                onClick={reset}
                className="absolute top-4 right-4 bg-white text-black p-2 rounded-full shadow-xl hover:scale-110 transition-transform"
              >
                <RefreshCw size={18} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <input 
          ref={fileInputRef}
          type="file" 
          accept="image/*" 
          className="hidden" 
          onChange={handleFileUpload} 
        />
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};

export default CameraCapture;
