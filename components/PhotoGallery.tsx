import React, { useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { Camera, Link, X, ExternalLink } from 'lucide-react';
import { ImageCropper } from './ImageCropper';

interface PhotoGalleryProps {
  photos: string[];
  onChange: (photos: string[]) => void;
  maxPhotos?: number;
}

function isDirectImage(url: string): boolean {
  return url.startsWith('data:') || /\.(jpe?g|png|gif|webp|svg|avif)(\?.*)?$/i.test(url);
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({ photos, onChange, maxPhotos = 10 }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropperDataUrl, setCropperDataUrl] = useState<string | null>(null);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkValue, setLinkValue] = useState('');

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setCropperDataUrl(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCropConfirm = (url: string) => {
    onChange([...photos, url]);
    setCropperDataUrl(null);
  };

  const handleAddLink = () => {
    const url = linkValue.trim();
    if (!url) return;
    onChange([...photos, url]);
    setLinkValue('');
    setShowLinkInput(false);
  };

  const handleRemove = (index: number) => {
    onChange(photos.filter((_, i) => i !== index));
  };

  return (
    <>
      {cropperDataUrl && ReactDOM.createPortal(
        <ImageCropper
          imageDataUrl={cropperDataUrl}
          onConfirm={handleCropConfirm}
          onCancel={() => setCropperDataUrl(null)}
        />,
        document.body
      )}

      <div className="space-y-3">
        {/* Thumbnails */}
        {photos.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {photos.map((url, i) => (
              <div
                key={i}
                className="relative w-20 h-20 rounded-xl overflow-hidden border border-sand/40 flex-shrink-0 group"
              >
                {isDirectImage(url) ? (
                  <img src={url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full h-full flex flex-col items-center justify-center bg-sand/15 text-pencil/50 hover:bg-sand/25 transition-colors"
                    onClick={e => e.stopPropagation()}
                  >
                    <ExternalLink size={16} />
                    <span className="text-[9px] font-sans mt-1 text-center px-1 leading-tight">查看</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => handleRemove(i)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-ink/55 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={9} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add buttons */}
        {photos.length < maxPhotos && (
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-sand/80 text-pencil/55 hover:border-clay/40 hover:text-clay transition-all text-xs font-sans"
            >
              <Camera size={13} />
              上傳照片
            </button>
            <button
              type="button"
              onClick={() => setShowLinkInput(v => !v)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-sand/80 text-pencil/55 hover:border-clay/40 hover:text-clay transition-all text-xs font-sans"
            >
              <Link size={13} />
              貼上連結
            </button>
          </div>
        )}

        {/* Link input */}
        {showLinkInput && (
          <div className="flex items-center gap-2">
            <input
              type="url"
              value={linkValue}
              onChange={e => setLinkValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddLink(); } }}
              placeholder="貼上 Imgur / Cloudinary / 直連圖片 URL（Google Drive 不支援直接顯示）"
              className="flex-1 py-2 bg-transparent border-b border-sand focus:border-clay text-ink text-sm font-sans rounded-none placeholder-sand/50 focus:outline-none"
              autoFocus
            />
            <button
              type="button"
              onClick={handleAddLink}
              disabled={!linkValue.trim()}
              className="text-xs text-clay font-semibold font-sans disabled:opacity-30 flex-shrink-0"
            >
              新增
            </button>
            <button
              type="button"
              onClick={() => { setShowLinkInput(false); setLinkValue(''); }}
              className="text-pencil/35 flex-shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        )}

        <input type="file" ref={fileInputRef} onChange={handleUpload} accept="image/*" className="hidden" />
      </div>
    </>
  );
};

/** Compact photo strip for display in cards — shows thumbnails + link icons */
export const PhotoStrip: React.FC<{ photos: string[]; photoUrl?: string }> = ({ photos, photoUrl }) => {
  const all = photos.length > 0 ? photos : (photoUrl ? [photoUrl] : []);
  if (all.length === 0) return null;
  return (
    <div className="flex gap-1.5 flex-wrap mt-3">
      {all.slice(0, 4).map((url, i) =>
        isDirectImage(url) ? (
          <img key={i} src={url} alt="" className="w-14 h-14 rounded-lg object-cover border border-sand/30" />
        ) : (
          <a
            key={i}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-14 h-14 rounded-lg bg-sand/15 flex flex-col items-center justify-center text-pencil/45 border border-sand/30 hover:bg-sand/25 transition-colors"
            onClick={e => e.stopPropagation()}
          >
            <ExternalLink size={14} />
            <span className="text-[8px] font-sans mt-0.5">查看</span>
          </a>
        )
      )}
      {all.length > 4 && (
        <div className="w-14 h-14 rounded-lg bg-sand/15 flex items-center justify-center text-pencil/40 border border-sand/30 text-xs font-sans">
          +{all.length - 4}
        </div>
      )}
    </div>
  );
};
