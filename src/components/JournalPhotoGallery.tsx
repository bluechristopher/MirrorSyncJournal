import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Image as ImageIcon, 
  Trash2, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  UploadCloud, 
  Loader2, 
  Maximize2
} from 'lucide-react';
import type { JournalPhoto } from '../types';
import { 
  uploadJournalPhoto, 
  deleteJournalPhoto, 
  compressImage, 
  fileToDataUrl, 
  auth 
} from '../firebase';

interface JournalPhotoGalleryProps {
  entryId: string;
  photos?: JournalPhoto[];
  onUpdatePhotos: (updatedPhotos: JournalPhoto[]) => void;
  isExpanded?: boolean;
  disabled?: boolean;
}

export const JournalPhotoGallery: React.FC<JournalPhotoGalleryProps> = ({
  entryId,
  photos = [],
  onUpdatePhotos,
  disabled = false,
}) => {
  const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState<JournalPhoto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (activeLightboxIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveLightboxIndex(null);
      } else if (e.key === 'ArrowRight') {
        setActiveLightboxIndex((prev) => 
          prev !== null ? (prev + 1) % photos.length : null
        );
      } else if (e.key === 'ArrowLeft') {
        setActiveLightboxIndex((prev) => 
          prev !== null ? (prev - 1 + photos.length) % photos.length : null
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeLightboxIndex, photos.length]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);
    await processAndUploadFiles(files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled || isUploading) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
      if (files.length > 0) {
        await processAndUploadFiles(files);
      }
    }
  };

  const processAndUploadFiles = async (files: File[]) => {
    if (files.length === 0) return;
    setIsUploading(true);
    const currentUser = auth.currentUser;
    const newUploadedPhotos: JournalPhoto[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(`Uploading ${i + 1} of ${files.length}...`);

        // Store compressed JPEG base64 directly in Firestore (800px width, 0.75 quality)
        const compressedBlob = await compressImage(file, 800, 0.75);
        const dataUrl = await fileToDataUrl(compressedBlob);
        const photoId = `photo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const cleanName = (file.name || 'journal_photo.jpg').replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\.[^/.]+$/, '') + '.jpg';
        newUploadedPhotos.push({
          id: photoId,
          url: dataUrl,
          name: cleanName,
          size: compressedBlob.size,
          createdAt: Date.now(),
        });
      }

      const updated = [...photos, ...newUploadedPhotos];
      onUpdatePhotos(updated);
    } catch (err) {
      console.error('[JournalPhotoGallery] Upload error:', err);
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const handleDeletePhoto = async (photo: JournalPhoto, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsDeleting(true);
    try {
      if (photo.storagePath) {
        await deleteJournalPhoto(photo.storagePath);
      }
      const updated = photos.filter((p) => p.id !== photo.id);
      onUpdatePhotos(updated);

      if (activeLightboxIndex !== null) {
        if (updated.length === 0) {
          setActiveLightboxIndex(null);
        } else if (activeLightboxIndex >= updated.length) {
          setActiveLightboxIndex(updated.length - 1);
        }
      }
    } catch (err) {
      console.error('[JournalPhotoGallery] Delete error:', err);
    } finally {
      setIsDeleting(false);
      setPhotoToDelete(null);
    }
  };

  const activePhoto = activeLightboxIndex !== null ? photos[activeLightboxIndex] : null;

  return (
    <div 
      className="mt-3.5 pt-3 border-t border-white/10"
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        multiple
        className="hidden"
        disabled={disabled || isUploading}
      />

      {/* GALLERY HEADER BAR */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-white/90">
          <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
          <span>Journal Photos</span>
          {photos.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {photos.length}
            </span>
          )}
        </div>

        {/* Add Photo Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white/10 hover:bg-white/15 active:scale-95 text-white/90 border border-white/15 transition-all shadow-xs cursor-pointer disabled:opacity-50"
          title="Add photos to this journal entry"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
              <span>{uploadProgress || 'Uploading...'}</span>
            </>
          ) : (
            <>
              <Plus className="w-3 h-3 text-amber-400" />
              <span>Add Photo</span>
            </>
          )}
        </button>
      </div>

      {/* UPLOAD DROP ZONE (When no photos yet) */}
      {photos.length === 0 && (
        <div
          onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
          className={`group relative p-3 sm:p-4 rounded-xl border border-dashed transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-1.5 ${
            dragOver 
              ? 'border-amber-400 bg-amber-500/10' 
              : 'border-white/15 bg-white/5 hover:bg-white/8 hover:border-amber-400/40'
          }`}
        >
          {isUploading ? (
            <div className="py-2 flex flex-col items-center gap-1.5">
              <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
              <span className="text-xs text-amber-300 font-medium">{uploadProgress || 'Uploading photos...'}</span>
            </div>
          ) : (
            <>
              <div className="w-8 h-8 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                <UploadCloud className="w-4 h-4" />
              </div>
              <div className="text-xs font-medium text-white/80">
                Attach photos to this journal entry
              </div>
              <div className="text-[10px] text-white/40">
                Drag & drop images here or click to browse (supports multi-upload)
              </div>
            </>
          )}
        </div>
      )}

      {/* INSTAGRAM-STYLE RESPONSIVE PHOTO GRID */}
      {photos.length > 0 && (
        <div className="relative rounded-xl overflow-hidden border border-white/15 shadow-md bg-black/40">
          
          {/* LAYOUT 1: SINGLE PHOTO */}
          {photos.length === 1 && (
            <div 
              onClick={() => setActiveLightboxIndex(0)}
              className="group relative w-full aspect-[16/9] sm:aspect-[2/1] overflow-hidden cursor-pointer"
            >
              <img 
                src={photos[0].url} 
                alt={photos[0].name || 'Journal photo'} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3">
                <span className="text-xs text-white/90 font-medium truncate drop-shadow-md">
                  {photos[0].name || 'Photo 1'}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setPhotoToDelete(photos[0]); }}
                    className="p-1.5 rounded-lg bg-red-500/80 hover:bg-red-600 text-white shadow-xs transition-colors cursor-pointer"
                    title="Delete photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <div className="p-1.5 rounded-lg bg-black/60 text-white/90">
                    <Maximize2 className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* LAYOUT 2: TWO PHOTOS (Side-by-side) */}
          {photos.length === 2 && (
            <div className="grid grid-cols-2 gap-1 w-full aspect-[16/9] sm:aspect-[2/1]">
              {photos.map((photo, idx) => (
                <div
                  key={photo.id || idx}
                  onClick={() => setActiveLightboxIndex(idx)}
                  className="group relative w-full h-full overflow-hidden cursor-pointer bg-black/30"
                >
                  <img
                    src={photo.url}
                    alt={photo.name || `Photo ${idx + 1}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setPhotoToDelete(photo); }}
                      className="p-1.5 rounded-lg bg-red-500/80 hover:bg-red-600 text-white shadow-xs transition-colors cursor-pointer"
                      title="Delete photo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="p-1.5 rounded-lg bg-black/60 text-white/90">
                      <Maximize2 className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* LAYOUT 3: THREE PHOTOS (1 Featured Left + 2 Stacked Right) */}
          {photos.length === 3 && (
            <div className="grid grid-cols-3 gap-1 w-full aspect-[16/9] sm:aspect-[2/1]">
              {/* Featured Left (2 cols wide) */}
              <div
                onClick={() => setActiveLightboxIndex(0)}
                className="group relative col-span-2 w-full h-full overflow-hidden cursor-pointer bg-black/30"
              >
                <img
                  src={photos[0].url}
                  alt={photos[0].name || 'Photo 1'}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setPhotoToDelete(photos[0]); }}
                    className="p-1.5 rounded-lg bg-red-500/80 hover:bg-red-600 text-white shadow-xs transition-colors cursor-pointer"
                    title="Delete photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <div className="p-1.5 rounded-lg bg-black/60 text-white/90">
                    <Maximize2 className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              {/* Stacked Right (2 rows) */}
              <div className="grid grid-rows-2 gap-1 w-full h-full">
                {photos.slice(1, 3).map((photo, idx) => (
                  <div
                    key={photo.id || idx}
                    onClick={() => setActiveLightboxIndex(idx + 1)}
                    className="group relative w-full h-full overflow-hidden cursor-pointer bg-black/30"
                  >
                    <img
                      src={photo.url}
                      alt={photo.name || `Photo ${idx + 2}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setPhotoToDelete(photo); }}
                        className="p-1 rounded-md bg-red-500/80 hover:bg-red-600 text-white shadow-xs transition-colors cursor-pointer"
                        title="Delete photo"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* LAYOUT 4+: 2x2 QUAD GRID with "+N More" Overlay on 4th */}
          {photos.length >= 4 && (
            <div className="grid grid-cols-2 gap-1 w-full aspect-[4/3] sm:aspect-[16/9]">
              {photos.slice(0, 4).map((photo, idx) => {
                const isFourthAndMore = idx === 3 && photos.length > 4;
                const remainingCount = photos.length - 3;

                return (
                  <div
                    key={photo.id || idx}
                    onClick={() => setActiveLightboxIndex(idx)}
                    className="group relative w-full h-full overflow-hidden cursor-pointer bg-black/30"
                  >
                    <img
                      src={photo.url}
                      alt={photo.name || `Photo ${idx + 1}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />

                    {isFourthAndMore ? (
                      <div className="absolute inset-0 bg-black/75 backdrop-blur-[2px] flex flex-col items-center justify-center text-white font-bold transition-all group-hover:bg-black/85">
                        <span className="text-xl sm:text-2xl tracking-tight text-amber-300">+{remainingCount}</span>
                        <span className="text-[10px] sm:text-xs text-white/80 font-medium">View all</span>
                      </div>
                    ) : (
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setPhotoToDelete(photo); }}
                          className="p-1.5 rounded-lg bg-red-500/80 hover:bg-red-600 text-white shadow-xs transition-colors cursor-pointer"
                          title="Delete photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <div className="p-1.5 rounded-lg bg-black/60 text-white/90">
                          <Maximize2 className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Uploading progress bar overlay if user adds more photos to existing gallery */}
          {isUploading && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-10">
              <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
              <span className="text-xs text-white font-semibold">{uploadProgress || 'Uploading...'}</span>
            </div>
          )}
        </div>
      )}

      {/* FULL-SCREEN LIGHTBOX MODAL */}
      <AnimatePresence>
        {activeLightboxIndex !== null && activePhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-between p-3 sm:p-6"
            onClick={() => setActiveLightboxIndex(null)}
          >
            {/* Top Toolbar */}
            <div 
              className="w-full max-w-5xl flex items-center justify-between text-white/90 z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/10 border border-white/15">
                  {activeLightboxIndex + 1} of {photos.length}
                </span>
                <span className="text-xs text-white/70 truncate max-w-[200px] sm:max-w-md">
                  {activePhoto.name || 'Journal Photo'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Download Button */}
                <a
                  href={activePhoto.url}
                  download={activePhoto.name || 'journal_photo.jpg'}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                  title="Download / Open Full Res"
                >
                  <Download className="w-4 h-4" />
                </a>

                {/* Delete in Lightbox */}
                <button
                  type="button"
                  onClick={() => setPhotoToDelete(activePhoto)}
                  className="p-2 rounded-xl bg-red-500/20 hover:bg-red-500/40 text-red-300 border border-red-500/30 transition-colors cursor-pointer"
                  title="Delete this photo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setActiveLightboxIndex(null)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                  title="Close (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Central Photo View with Nav Arrows */}
            <div 
              className="relative w-full max-w-5xl flex-1 flex items-center justify-center my-2"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Prev Button */}
              {photos.length > 1 && (
                <button
                  type="button"
                  onClick={() => setActiveLightboxIndex((prev) => (prev !== null ? (prev - 1 + photos.length) % photos.length : 0))}
                  className="absolute left-2 sm:left-4 z-20 p-2.5 sm:p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 transition-all cursor-pointer active:scale-95"
                  title="Previous (Left Arrow)"
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              )}

              {/* Main Image */}
              <motion.img
                key={activePhoto.id || activeLightboxIndex}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                src={activePhoto.url}
                alt={activePhoto.name || 'Full view'}
                className="max-w-full max-h-[78vh] object-contain rounded-lg shadow-2xl border border-white/10 select-none"
              />

              {/* Next Button */}
              {photos.length > 1 && (
                <button
                  type="button"
                  onClick={() => setActiveLightboxIndex((prev) => (prev !== null ? (prev + 1) % photos.length : 0))}
                  className="absolute right-2 sm:right-4 z-20 p-2.5 sm:p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 transition-all cursor-pointer active:scale-95"
                  title="Next (Right Arrow)"
                >
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              )}
            </div>

            {/* Bottom Thumbnail Strip for Fast Seeking */}
            {photos.length > 1 && (
              <div 
                className="w-full max-w-2xl flex items-center justify-center gap-1.5 overflow-x-auto py-1 px-2 scrollbar-none z-10"
                onClick={(e) => e.stopPropagation()}
              >
                {photos.map((p, idx) => (
                  <button
                    key={p.id || idx}
                    type="button"
                    onClick={() => setActiveLightboxIndex(idx)}
                    className={`relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all cursor-pointer ${
                      idx === activeLightboxIndex 
                        ? 'border-amber-400 scale-105 shadow-md shadow-amber-500/20' 
                        : 'border-white/20 opacity-50 hover:opacity-100'
                    }`}
                  >
                    <img src={p.url} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONFIRM DELETE DIALOG MODAL */}
      <AnimatePresence>
        {photoToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => !isDeleting && setPhotoToDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-neutral-900 border border-red-500/30 p-5 rounded-2xl max-w-sm w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2.5 text-red-400 mb-2">
                <Trash2 className="w-5 h-5" />
                <h3 className="font-semibold text-sm text-white">Delete Photo?</h3>
              </div>
              <p className="text-xs text-white/70 mb-4 leading-relaxed">
                This photo will be permanently removed from this journal entry and deleted from Cloud Storage.
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPhotoToDelete(null)}
                  disabled={isDeleting}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium bg-white/10 hover:bg-white/15 text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDeletePhoto(photoToDelete)}
                  disabled={isDeleting}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-500 text-white shadow-md transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <span>Confirm Delete</span>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

