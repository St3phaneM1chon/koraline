'use client';

/**
 * G26 — Custom Fonts Upload
 * Upload WOFF2 font files, preview, set as primary/secondary tenant font.
 * Fonts stored as JSON in BrandKit.customFonts (or SiteSettings).
 */

import { useState, useEffect, useRef } from 'react';
import { Type, Upload, Trash2, Eye, Check, Loader2, Star } from 'lucide-react';
import { useI18n } from '@/i18n/client';
import { toast } from 'sonner';
import { fetchWithCSRF } from '@/lib/csrf';

interface CustomFont {
  name: string;
  url: string;
  weight: string;
  style: string;
}

export default function FontsPage() {
  const { t } = useI18n();
  const [fonts, setFonts] = useState<CustomFont[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [previewText, setPreviewText] = useState('The quick brown fox jumps over the lazy dog');
  const [activePrimary, setActivePrimary] = useState<string | null>(null);
  const [activeSecondary, setActiveSecondary] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load fonts on mount
  useEffect(() => {
    fetch('/api/admin/fonts')
      .then((r) => r.json())
      .then((data) => {
        if (data.fonts) setFonts(data.fonts);
        if (data.primary) setActivePrimary(data.primary);
        if (data.secondary) setActiveSecondary(data.secondary);
      })
      .catch(() => toast.error(t('admin.fonts.loadError')))
      .finally(() => setLoading(false));
  }, [t]);

  // Inject @font-face rules for previewing
  useEffect(() => {
    const styleEl = document.getElementById('custom-fonts-preview') || document.createElement('style');
    styleEl.id = 'custom-fonts-preview';
    styleEl.textContent = fonts
      .map(
        (f) =>
          `@font-face { font-family: '${f.name}'; src: url('${f.url}') format('woff2'); font-weight: ${f.weight}; font-style: ${f.style}; font-display: swap; }`
      )
      .join('\n');
    if (!document.getElementById('custom-fonts-preview')) {
      document.head.appendChild(styleEl);
    }
    return () => {
      const el = document.getElementById('custom-fonts-preview');
      if (el) el.remove();
    };
  }, [fonts]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.woff2') && !file.name.endsWith('.woff') && !file.name.endsWith('.ttf')) {
      toast.error(t('admin.fonts.invalidFormat'));
      return;
    }

    // Max 2MB
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t('admin.fonts.tooLarge'));
      return;
    }

    setUploading(true);
    try {
      // Convert to base64 data URL for storage
      const arrayBuffer = await file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );
      const mimeType = file.name.endsWith('.woff2')
        ? 'font/woff2'
        : file.name.endsWith('.woff')
          ? 'font/woff'
          : 'font/ttf';
      const dataUrl = `data:${mimeType};base64,${base64}`;

      const fontName = file.name.replace(/\.(woff2|woff|ttf)$/, '').replace(/[-_]/g, ' ');

      const newFont: CustomFont = {
        name: fontName,
        url: dataUrl,
        weight: '400',
        style: 'normal',
      };

      const res = await fetchWithCSRF('/api/admin/fonts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ font: newFont }),
      });

      if (res.ok) {
        const data = await res.json();
        setFonts(data.fonts || [...fonts, newFont]);
        toast.success(t('admin.fonts.uploaded'));
      } else {
        toast.error(t('admin.fonts.uploadError'));
      }
    } catch {
      toast.error(t('admin.fonts.uploadError'));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (fontName: string) => {
    try {
      const res = await fetchWithCSRF('/api/admin/fonts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fontName }),
      });

      if (res.ok) {
        const data = await res.json();
        setFonts(data.fonts || fonts.filter((f) => f.name !== fontName));
        if (activePrimary === fontName) setActivePrimary(null);
        if (activeSecondary === fontName) setActiveSecondary(null);
        toast.success(t('admin.fonts.deleted'));
      } else {
        toast.error(t('admin.fonts.deleteError'));
      }
    } catch {
      toast.error(t('admin.fonts.deleteError'));
    }
  };

  const handleSetFont = async (fontName: string, role: 'primary' | 'secondary') => {
    try {
      const res = await fetchWithCSRF('/api/admin/fonts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fontName, role }),
      });

      if (res.ok) {
        if (role === 'primary') setActivePrimary(fontName);
        else setActiveSecondary(fontName);
        toast.success(
          role === 'primary'
            ? t('admin.fonts.setPrimarySuccess')
            : t('admin.fonts.setSecondarySuccess')
        );
      } else {
        toast.error(t('admin.fonts.setFontError'));
      }
    } catch {
      toast.error(t('admin.fonts.setFontError'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Type className="w-6 h-6 text-indigo-600" />
            {t('admin.fonts.title')}
          </h1>
          <p className="text-slate-500">{t('admin.fonts.subtitle')}</p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".woff2,.woff,.ttf"
            onChange={handleUpload}
            className="hidden"
            aria-label={t('admin.fonts.uploadLabel')}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-600 disabled:opacity-50 flex items-center gap-2 transition-all"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            {t('admin.fonts.uploadButton')}
          </button>
        </div>
      </div>

      {/* Preview Text */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <label className="block text-sm font-medium text-slate-600 mb-2">
          <Eye className="w-4 h-4 inline mr-1" />
          {t('admin.fonts.previewTextLabel')}
        </label>
        <input
          type="text"
          value={previewText}
          onChange={(e) => setPreviewText(e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          aria-label={t('admin.fonts.previewTextLabel')}
        />
      </div>

      {/* Font List */}
      {fonts.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Type className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-600">{t('admin.fonts.noFonts')}</h3>
          <p className="text-slate-400 text-sm mt-1">{t('admin.fonts.noFontsHint')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {fonts.map((font) => (
            <div
              key={font.name}
              className="bg-white rounded-xl border border-slate-200 p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">{font.name}</h3>
                  <p className="text-xs text-slate-400">
                    {t('admin.fonts.weight')}: {font.weight} | {t('admin.fonts.style')}: {font.style}
                    {activePrimary === font.name && (
                      <span className="ml-2 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-medium">
                        {t('admin.fonts.primary')}
                      </span>
                    )}
                    {activeSecondary === font.name && (
                      <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-[10px] font-medium">
                        {t('admin.fonts.secondary')}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSetFont(font.name, 'primary')}
                    className={`px-3 py-1.5 text-xs rounded-lg border transition-all flex items-center gap-1 ${
                      activePrimary === font.name
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                        : 'border-slate-200 text-slate-600 hover:border-indigo-300'
                    }`}
                    title={t('admin.fonts.setAsPrimary')}
                  >
                    <Star className="w-3 h-3" />
                    {t('admin.fonts.primary')}
                  </button>
                  <button
                    onClick={() => handleSetFont(font.name, 'secondary')}
                    className={`px-3 py-1.5 text-xs rounded-lg border transition-all flex items-center gap-1 ${
                      activeSecondary === font.name
                        ? 'bg-purple-50 border-purple-300 text-purple-700'
                        : 'border-slate-200 text-slate-600 hover:border-purple-300'
                    }`}
                    title={t('admin.fonts.setAsSecondary')}
                  >
                    <Check className="w-3 h-3" />
                    {t('admin.fonts.secondary')}
                  </button>
                  <button
                    onClick={() => handleDelete(font.name)}
                    className="px-3 py-1.5 text-xs rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-all flex items-center gap-1"
                    title={t('admin.fonts.delete')}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Font Preview */}
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                <p
                  style={{ fontFamily: `'${font.name}', sans-serif`, fontSize: '24px' }}
                  className="text-slate-800"
                >
                  {previewText}
                </p>
                <p
                  style={{ fontFamily: `'${font.name}', sans-serif`, fontSize: '16px' }}
                  className="text-slate-600 mt-2"
                >
                  {previewText}
                </p>
                <p
                  style={{ fontFamily: `'${font.name}', sans-serif`, fontSize: '12px' }}
                  className="text-slate-400 mt-1"
                >
                  ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
