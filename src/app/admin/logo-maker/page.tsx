'use client';

/**
 * G24 — AI Logo Maker
 * Simple text-based logo generator for tenant branding.
 * Generates SVG logos from company name + style + color choices.
 */

import { useState, useRef, useCallback } from 'react';
import { Palette, Download, Check, Loader2, Sparkles, Type } from 'lucide-react';
import { useI18n } from '@/i18n/client';
import { toast } from 'sonner';
import { fetchWithCSRF } from '@/lib/csrf';

type LogoStyle = 'modern' | 'classic' | 'playful' | 'minimalist';

interface LogoConfig {
  companyName: string;
  style: LogoStyle;
  primaryColor: string;
  accentColor: string;
  iconType: 'none' | 'circle' | 'square' | 'diamond' | 'hexagon' | 'shield';
}

const STYLE_PRESETS: Record<LogoStyle, { fontFamily: string; fontWeight: number; letterSpacing: string; transform: string }> = {
  modern: { fontFamily: 'Inter, Helvetica, Arial, sans-serif', fontWeight: 700, letterSpacing: '0.05em', transform: 'none' },
  classic: { fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 400, letterSpacing: '0.12em', transform: 'uppercase' },
  playful: { fontFamily: '"Comic Sans MS", cursive, sans-serif', fontWeight: 700, letterSpacing: '0.02em', transform: 'none' },
  minimalist: { fontFamily: 'Inter, Helvetica, Arial, sans-serif', fontWeight: 300, letterSpacing: '0.18em', transform: 'uppercase' },
};

const ICON_PATHS: Record<string, string> = {
  circle: '<circle cx="24" cy="24" r="20" fill="ACCENT" opacity="0.15"/><circle cx="24" cy="24" r="20" stroke="ACCENT" stroke-width="2" fill="none"/>',
  square: '<rect x="4" y="4" width="40" height="40" rx="6" fill="ACCENT" opacity="0.15"/><rect x="4" y="4" width="40" height="40" rx="6" stroke="ACCENT" stroke-width="2" fill="none"/>',
  diamond: '<polygon points="24,2 46,24 24,46 2,24" fill="ACCENT" opacity="0.15"/><polygon points="24,2 46,24 24,46 2,24" stroke="ACCENT" stroke-width="2" fill="none"/>',
  hexagon: '<polygon points="24,2 44,13 44,35 24,46 4,35 4,13" fill="ACCENT" opacity="0.15"/><polygon points="24,2 44,13 44,35 24,46 4,35 4,13" stroke="ACCENT" stroke-width="2" fill="none"/>',
  shield: '<path d="M24 2 L44 12 L44 30 Q44 42 24 46 Q4 42 4 30 L4 12 Z" fill="ACCENT" opacity="0.15"/><path d="M24 2 L44 12 L44 30 Q44 42 24 46 Q4 42 4 30 L4 12 Z" stroke="ACCENT" stroke-width="2" fill="none"/>',
};

function generateSVG(config: LogoConfig): string {
  const preset = STYLE_PRESETS[config.style];
  const hasIcon = config.iconType !== 'none';
  const iconWidth = hasIcon ? 56 : 0;
  const textX = hasIcon ? iconWidth + 8 : 0;

  // Estimate text width (rough: 0.6em per char at size 32)
  const fontSize = 32;
  const textWidth = config.companyName.length * fontSize * 0.55;
  const totalWidth = textX + textWidth + 16;
  const height = 56;

  let iconSvg = '';
  if (hasIcon && ICON_PATHS[config.iconType]) {
    iconSvg = ICON_PATHS[config.iconType].replace(/ACCENT/g, config.accentColor);
    // Add first letter inside icon
    const initial = config.companyName.trim()[0]?.toUpperCase() || 'A';
    iconSvg += `<text x="24" y="24" text-anchor="middle" dominant-baseline="central" font-family="${preset.fontFamily}" font-weight="${preset.fontWeight}" font-size="22" fill="${config.accentColor}">${initial}</text>`;
  }

  const displayName = preset.transform === 'uppercase' ? config.companyName.toUpperCase() : config.companyName;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${height}" width="${totalWidth}" height="${height}">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;700&amp;display=swap');
    </style>
  </defs>
  ${hasIcon ? `<g transform="translate(0, ${(height - 48) / 2})">${iconSvg}</g>` : ''}
  <text x="${textX}" y="${height / 2}" dominant-baseline="central" font-family="${preset.fontFamily}" font-weight="${preset.fontWeight}" font-size="${fontSize}" letter-spacing="${preset.letterSpacing}" fill="${config.primaryColor}">${escapeXml(displayName)}</text>
</svg>`;
}

function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

export default function LogoMakerPage() {
  const { t } = useI18n();
  const [config, setConfig] = useState<LogoConfig>({
    companyName: '',
    style: 'modern',
    primaryColor: '#1e293b',
    accentColor: '#6366f1',
    iconType: 'none',
  });
  const [settingAsLogo, setSettingAsLogo] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const svgContent = config.companyName.trim() ? generateSVG(config) : '';

  const handleDownloadSVG = useCallback(() => {
    if (!svgContent) return;
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logo-${config.companyName.toLowerCase().replace(/\s+/g, '-')}.svg`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t('admin.logoMaker.downloaded'));
  }, [svgContent, config.companyName, t]);

  const handleDownloadPNG = useCallback(async () => {
    if (!svgContent) return;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      canvas.width = img.width * 2;
      canvas.height = img.height * 2;
      ctx.scale(2, 2);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      canvas.toBlob((blob) => {
        if (!blob) return;
        const pngUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = pngUrl;
        a.download = `logo-${config.companyName.toLowerCase().replace(/\s+/g, '-')}.png`;
        a.click();
        URL.revokeObjectURL(pngUrl);
        toast.success(t('admin.logoMaker.downloaded'));
      }, 'image/png');
    };
    img.src = url;
  }, [svgContent, config.companyName, t]);

  const handleSetAsTenantLogo = useCallback(async () => {
    if (!svgContent) return;
    setSettingAsLogo(true);
    try {
      const svgDataUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgContent)))}`;
      const res = await fetchWithCSRF('/api/admin/brand-kit', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logoUrl: svgDataUrl }),
      });
      if (res.ok) {
        toast.success(t('admin.logoMaker.setAsLogoSuccess'));
      } else {
        toast.error(t('admin.logoMaker.setAsLogoError'));
      }
    } catch {
      toast.error(t('admin.logoMaker.setAsLogoError'));
    } finally {
      setSettingAsLogo(false);
    }
  }, [svgContent, t]);

  const styles: { value: LogoStyle; labelKey: string }[] = [
    { value: 'modern', labelKey: 'admin.logoMaker.styleModern' },
    { value: 'classic', labelKey: 'admin.logoMaker.styleClassic' },
    { value: 'playful', labelKey: 'admin.logoMaker.stylePlayful' },
    { value: 'minimalist', labelKey: 'admin.logoMaker.styleMinimalist' },
  ];

  const iconTypes: { value: LogoConfig['iconType']; labelKey: string }[] = [
    { value: 'none', labelKey: 'admin.logoMaker.iconNone' },
    { value: 'circle', labelKey: 'admin.logoMaker.iconCircle' },
    { value: 'square', labelKey: 'admin.logoMaker.iconSquare' },
    { value: 'diamond', labelKey: 'admin.logoMaker.iconDiamond' },
    { value: 'hexagon', labelKey: 'admin.logoMaker.iconHexagon' },
    { value: 'shield', labelKey: 'admin.logoMaker.iconShield' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-indigo-600" />
          {t('admin.logoMaker.title')}
        </h1>
        <p className="text-slate-500">{t('admin.logoMaker.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Configuration Panel */}
        <div className="space-y-6">
          {/* Company Name */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Type className="w-5 h-5" />
              {t('admin.logoMaker.companyNameLabel')}
            </h2>
            <input
              type="text"
              value={config.companyName}
              onChange={(e) => setConfig({ ...config, companyName: e.target.value })}
              placeholder={t('admin.logoMaker.companyNamePlaceholder')}
              className="w-full border border-slate-300 rounded-lg px-4 py-3 text-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              maxLength={40}
              aria-label={t('admin.logoMaker.companyNameLabel')}
            />
          </div>

          {/* Style Selector */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Palette className="w-5 h-5" />
              {t('admin.logoMaker.styleLabel')}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {styles.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setConfig({ ...config, style: s.value })}
                  className={`px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                    config.style === s.value
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-200'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                  aria-pressed={config.style === s.value}
                >
                  {t(s.labelKey)}
                </button>
              ))}
            </div>
          </div>

          {/* Icon Shape */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">{t('admin.logoMaker.iconLabel')}</h2>
            <div className="grid grid-cols-3 gap-2">
              {iconTypes.map((icon) => (
                <button
                  key={icon.value}
                  onClick={() => setConfig({ ...config, iconType: icon.value })}
                  className={`px-3 py-2 rounded-lg border text-sm transition-all ${
                    config.iconType === icon.value
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-200'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                  aria-pressed={config.iconType === icon.value}
                >
                  {t(icon.labelKey)}
                </button>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">{t('admin.logoMaker.colorsLabel')}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  {t('admin.logoMaker.primaryColor')}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={config.primaryColor}
                    onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                    className="w-10 h-10 rounded border cursor-pointer"
                    aria-label={t('admin.logoMaker.primaryColor')}
                  />
                  <input
                    type="text"
                    value={config.primaryColor}
                    onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                    className="flex-1 border rounded-lg px-3 py-2 text-sm font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  {t('admin.logoMaker.accentColor')}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={config.accentColor}
                    onChange={(e) => setConfig({ ...config, accentColor: e.target.value })}
                    className="w-10 h-10 rounded border cursor-pointer"
                    aria-label={t('admin.logoMaker.accentColor')}
                  />
                  <input
                    type="text"
                    value={config.accentColor}
                    onChange={(e) => setConfig({ ...config, accentColor: e.target.value })}
                    className="flex-1 border rounded-lg px-3 py-2 text-sm font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Preview & Actions Panel */}
        <div className="space-y-6">
          {/* Preview */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">{t('admin.logoMaker.preview')}</h2>

            {/* Light background preview */}
            <div
              ref={previewRef}
              className="p-8 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center min-h-[120px]"
            >
              {svgContent ? (
                <div dangerouslySetInnerHTML={{ __html: svgContent }} />
              ) : (
                <p className="text-slate-400 text-sm">{t('admin.logoMaker.enterNamePrompt')}</p>
              )}
            </div>

            {/* Dark background preview */}
            <div className="p-8 bg-slate-800 border border-slate-700 rounded-lg flex items-center justify-center min-h-[120px]">
              {svgContent ? (
                <div
                  dangerouslySetInnerHTML={{
                    __html: svgContent.replace(
                      `fill="${config.primaryColor}"`,
                      'fill="#ffffff"'
                    ),
                  }}
                />
              ) : (
                <p className="text-slate-500 text-sm">{t('admin.logoMaker.enterNamePrompt')}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-3">
            <h2 className="text-lg font-semibold text-slate-800">{t('admin.logoMaker.actions')}</h2>
            <button
              onClick={handleDownloadSVG}
              disabled={!svgContent}
              className="w-full px-4 py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              {t('admin.logoMaker.downloadSVG')}
            </button>
            <button
              onClick={handleDownloadPNG}
              disabled={!svgContent}
              className="w-full px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              {t('admin.logoMaker.downloadPNG')}
            </button>
            <button
              onClick={handleSetAsTenantLogo}
              disabled={!svgContent || settingAsLogo}
              className="w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
            >
              {settingAsLogo ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              {t('admin.logoMaker.setAsTenantLogo')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
