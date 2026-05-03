import React, { useState, useRef, useEffect } from 'react';
import { Check, X, ZoomIn, ZoomOut } from 'lucide-react';

const CROP_SIZE = 260;

interface ImageCropperProps {
  imageDataUrl: string;
  onConfirm: (croppedDataUrl: string) => void;
  onCancel: () => void;
}

export const ImageCropper: React.FC<ImageCropperProps> = ({ imageDataUrl, onConfirm, onCancel }) => {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [imgNatural, setImgNatural] = useState({ w: 0, h: 0 });
  const [fillScale, setFillScale] = useState(1);
  const pointerRef = useRef<{ active: boolean; lastX: number; lastY: number }>({
    active: false, lastX: 0, lastY: 0,
  });

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      setImgNatural({ w, h });
      const fs = Math.max(CROP_SIZE / w, CROP_SIZE / h);
      setFillScale(fs);
      setScale(fs);
      setOffset({ x: 0, y: 0 });
    };
    img.src = imageDataUrl;
  }, [imageDataUrl]);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointerRef.current = { active: true, lastX: e.clientX, lastY: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!pointerRef.current.active) return;
    const dx = e.clientX - pointerRef.current.lastX;
    const dy = e.clientY - pointerRef.current.lastY;
    pointerRef.current.lastX = e.clientX;
    pointerRef.current.lastY = e.clientY;
    setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
  };

  const handlePointerUp = () => {
    pointerRef.current.active = false;
  };

  const handleConfirm = () => {
    if (!imgNatural.w) return;
    const { w, h } = imgNatural;
    const sx = w / 2 - (CROP_SIZE / 2 + offset.x) / scale;
    const sy = h / 2 - (CROP_SIZE / 2 + offset.y) / scale;
    const sw = CROP_SIZE / scale;
    const sh = CROP_SIZE / scale;

    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 800;
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = '#FDFAF5';
      ctx.fillRect(0, 0, 800, 800);
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, 800, 800);
      onConfirm(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.src = imageDataUrl;
  };

  const minScale = Math.max(0.05, fillScale);
  const maxScale = fillScale * 5;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col select-none" style={{ background: '#1a1410' }}>
      {/* Header */}
      <div className="flex-shrink-0 flex justify-between items-center px-5 py-4">
        <button
          onClick={onCancel}
          className="w-10 h-10 rounded-full flex items-center justify-center text-white"
          style={{ background: 'rgba(255,255,255,0.12)' }}
        >
          <X size={18} />
        </button>
        <span className="font-fangsong text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>
          拖曳調整・滑動縮放
        </span>
        <button
          onClick={handleConfirm}
          className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg"
          style={{ background: '#C17A5B' }}
        >
          <Check size={18} />
        </button>
      </div>

      {/* Drag area */}
      <div
        className="flex-1 relative overflow-hidden"
        style={{ touchAction: 'none', cursor: 'grab' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Image */}
        {imgNatural.w > 0 && (
          <img
            src={imageDataUrl}
            alt=""
            draggable={false}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: imgNatural.w,
              height: imgNatural.h,
              transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${scale})`,
              transformOrigin: 'center center',
              pointerEvents: 'none',
              userSelect: 'none',
              maxWidth: 'none',
            }}
          />
        )}

        {/* Dark mask with crop window */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div
            style={{
              width: CROP_SIZE,
              height: CROP_SIZE,
              boxShadow: '0 0 0 9999px rgba(26,20,16,0.68)',
              borderRadius: 18,
              border: '2px solid rgba(255,255,255,0.5)',
              position: 'relative',
            }}
          >
            {/* Corner accents */}
            {(['tl','tr','bl','br'] as const).map(corner => (
              <div
                key={corner}
                style={{
                  position: 'absolute',
                  width: 22,
                  height: 22,
                  borderColor: 'rgba(255,255,255,0.9)',
                  borderStyle: 'solid',
                  borderWidth: 0,
                  ...(corner === 'tl' ? { top: -2, left: -2, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 16 } : {}),
                  ...(corner === 'tr' ? { top: -2, right: -2, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 16 } : {}),
                  ...(corner === 'bl' ? { bottom: -2, left: -2, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 16 } : {}),
                  ...(corner === 'br' ? { bottom: -2, right: -2, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 16 } : {}),
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Zoom slider */}
      <div className="flex-shrink-0 flex items-center gap-3 px-6 py-4">
        <ZoomOut size={17} style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
        <input
          type="range"
          min={minScale}
          max={maxScale}
          step={0.005}
          value={scale}
          onChange={e => setScale(Number(e.target.value))}
          className="flex-1"
          style={{ accentColor: '#C17A5B' }}
        />
        <ZoomIn size={17} style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
      </div>

      {/* Confirm button */}
      <div className="flex-shrink-0 px-6" style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}>
        <button
          onClick={handleConfirm}
          className="w-full py-4 rounded-2xl font-fangsong text-base text-white shadow-lg"
          style={{ background: '#C17A5B' }}
        >
          確認裁切
        </button>
      </div>
    </div>
  );
};
