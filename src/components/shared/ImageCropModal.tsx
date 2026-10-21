// ============================================================
// src/components/shared/ImageCropModal.tsx
// ------------------------------------------------------------
// Modal crop gambar interaktif (react-easy-crop). Wajib untuk foto pengantin (3:4) dan cover (16:9) sebelum upload.
// Dipakai di  : hooks/useFileUpload.tsx
// Keterikatan : react-easy-crop (+ css-nya), lucide-react
// ============================================================

// Modal crop interaktif (react-easy-crop) dengan rasio terkunci.
// Menerima file mentah, mengembalikan area pangkas dalam piksel citra asli
// lewat onConfirm — pemrosesan WebP dilakukan oleh pemanggil (useFileUpload).

import { useEffect, useMemo, useState } from 'react';
import Cropper from 'react-easy-crop';
import { Check, Loader2 } from 'lucide-react';
import 'react-easy-crop/react-easy-crop.css';
import Modal from '../ui/Modal';

export interface CropAreaPixels {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ImageCropModalProps {
  file: File | Blob;
  /** Rasio w/h yang dikunci, mis. 3/4 atau 16/9. */
  aspect: number;
  title: string;
  onCancel: () => void;
  onConfirm: (area: CropAreaPixels) => void;
}

export default function ImageCropModal({
  file,
  aspect,
  title,
  onCancel,
  onConfirm,
}: ImageCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [areaPixels, setAreaPixels] = useState<CropAreaPixels | null>(null);

  const objectUrl = useMemo(() => URL.createObjectURL(file), [file]);

  // Lepas object URL saat modal ditutup / file berganti.
  // Tunda pencabutan beberapa milidetik agar proses decode internal
  // cropper yang masih berjalan tidak menabrak URL yang sudah dicabut.
  useEffect(() => {
    const timer = setTimeout(() => URL.revokeObjectURL(objectUrl), 120);
    return () => clearTimeout(timer);
  }, [objectUrl]);

  const ready = Boolean(objectUrl) && Boolean(areaPixels);

  return (
    <Modal
      onClose={onCancel}
      ariaLabel={title}
      closeOnEsc={false}
      closeOnBackdrop={false}
      overlayClassName="items-center justify-center bg-ink-950/70 p-4 backdrop-blur-sm"
      panelClassName="max-h-dvh w-full max-w-lg overflow-y-auto rounded-2xl border border-cream-300 bg-cream-100 shadow-2xl"
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <h3 className="font-bold text-ink-900">{title}</h3>
        <p className="text-[14px] text-ink-500 mt-0.5">
          Geser &amp; perbesar untuk memilih area &mdash; rasio sudah terkunci otomatis.
        </p>
      </div>

      {/* Cropper �?" tinggi mengikuti rasio: potret lebih tinggi, lanskap penuh lebar */}
      <div
        className="relative mx-4 overflow-hidden rounded-xl bg-ink-950"
        style={{ height: aspect >= 1 ? 280 : 440 }}
      >
        {objectUrl && (
          <Cropper
            image={objectUrl}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_, pixels) => setAreaPixels(pixels)}
            showGrid
            objectFit="contain"
            restrictPosition
          />
        )}
        {!objectUrl && (
          <div className="absolute inset-0 grid place-items-center text-ink-500">
            <Loader2 className="animate-spin" />
          </div>
        )}
      </div>

      {/* Zoom slider */}
      <div className="px-5 pt-4 flex items-center gap-3">
        <span className="text-[14px] font-bold uppercase tracking-wider text-ink-500 shrink-0">Zoom</span>
        <input
          type="range"
          min={1}
          max={3}
          step={0.05}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="w-full accent-ember-600"
        />
      </div>

      {/* Aksi */}
      <div className="flex gap-3 p-5">
        <button
          type="button"
          onClick={onCancel}
          disabled={!ready}
          className="flex-1 py-2.5 rounded-xl border border-cream-300 bg-white text-ink-600 font-bold text-sm hover:bg-cream-100 transition"
        >
          Batal
        </button>
        <button
          type="button"
          onClick={() => areaPixels && onConfirm(areaPixels)}
          disabled={!ready}
          className="flex-1 py-2.5 rounded-xl bg-ember-600 text-white font-bold text-sm hover:bg-ember-700 transition shadow-md flex items-center justify-center gap-1.5"
        >
          <Check size={16} /> Pangkas &amp; Unggah
        </button>
      </div>
    </Modal>
  );
}
