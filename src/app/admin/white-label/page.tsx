'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Save, Lock, Shield,
} from 'lucide-react';
import { PageHeader, Button, SectionCard, FormField, Input, Textarea, MediaUploader } from '@/components/admin';
import { toast } from 'sonner';
import { addCSRFHeader } from '@/lib/csrf';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WhiteLabelConfig {
  loginLogoUrl?: string | null;
  loginBackgroundUrl?: string | null;
  loginBackgroundColor?: string | null;
  loginTagline?: string | null;
  faviconUrl?: string | null;
  customCss?: string | null;
  emailDomain?: string | null;
  emailFromName?: string | null;
  removePoweredBy: boolean;
  custom404Title?: string | null;
  custom404Message?: string | null;
  custom404ImageUrl?: string | null;
}

interface PremiumFeatures {
  removePoweredBy: boolean;
  customCss: boolean;
  emailDomain: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function WhiteLabelPage() {
  const [config, setConfig] = useState<WhiteLabelConfig>({
    removePoweredBy: false,
  });
  const [premium, setPremium] = useState<PremiumFeatures>({
    removePoweredBy: false,
    customCss: true,
    emailDomain: true,
  });
  const [plan, setPlan] = useState('pro');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/white-label');
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      if (data.config) setConfig(data.config);
      if (data.premiumFeatures) setPremium(data.premiumFeatures);
      if (data.plan) setPlan(data.plan);
    } catch {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/white-label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...addCSRFHeader() },
        body: JSON.stringify(config),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Save failed');
      }
      toast.success('Configuration sauvegardee');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur de sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (key: keyof WhiteLabelConfig, value: unknown) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="p-6 animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="White-Label"
        subtitle="Personnalisez l'apparence de votre plateforme pour vos clients"
      />

      {/* Plan info */}
      <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <Shield className="w-4 h-4 text-blue-600" />
        <span className="text-sm">
          Plan actuel: <strong className="capitalize">{plan}</strong>
          {plan !== 'enterprise' && ' — Certaines fonctionnalites requierent le plan Enterprise'}
        </span>
      </div>

      {/* Login Page Branding */}
      <SectionCard title="Page de connexion" >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Logo de connexion">
            <MediaUploader
              value={config.loginLogoUrl || ''}
              onChange={(url) => updateConfig('loginLogoUrl', url)}
            />
          </FormField>
          <FormField label="Image de fond">
            <MediaUploader
              value={config.loginBackgroundUrl || ''}
              onChange={(url) => updateConfig('loginBackgroundUrl', url)}
            />
          </FormField>
          <FormField label="Couleur de fond (si pas d'image)">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={config.loginBackgroundColor || '#0066CC'}
                onChange={(e) => updateConfig('loginBackgroundColor', e.target.value)}
                className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
              />
              <Input
                value={config.loginBackgroundColor || ''}
                onChange={(e) => updateConfig('loginBackgroundColor', e.target.value)}
                placeholder="#0066CC"
                className="flex-1"
              />
            </div>
          </FormField>
          <FormField label="Slogan de connexion">
            <Input
              value={config.loginTagline || ''}
              onChange={(e) => updateConfig('loginTagline', e.target.value)}
              placeholder="Bienvenue sur votre espace"
            />
          </FormField>
        </div>
      </SectionCard>

      {/* Branding */}
      <SectionCard title="Branding global" >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Favicon">
            <MediaUploader
              value={config.faviconUrl || ''}
              onChange={(url) => updateConfig('faviconUrl', url)}
            />
          </FormField>
          <div>
            <FormField label={premium.removePoweredBy ? 'Retirer "Powered by Koraline"' : 'Retirer "Powered by Koraline" (Enterprise)'}>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.removePoweredBy || false}
                  onChange={(e) => updateConfig('removePoweredBy', e.target.checked)}
                  disabled={!premium.removePoweredBy}
                  id="remove-powered-by"
                  className="rounded"
                />
                <label htmlFor="remove-powered-by" className="text-sm">
                  {premium.removePoweredBy
                    ? 'Masquer la mention en bas de page'
                    : 'Disponible avec le plan Enterprise'}
                </label>
              </div>
            </FormField>
          </div>
        </div>
      </SectionCard>

      {/* Email Domain */}
      <SectionCard title="Configuration email" >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label={premium.emailDomain ? 'Domaine email' : 'Domaine email (Pro/Enterprise)'}>
            <Input
              value={config.emailDomain || ''}
              onChange={(e) => updateConfig('emailDomain', e.target.value)}
              placeholder="mail.votredomaine.com"
              disabled={!premium.emailDomain}
            />
            <p className="text-xs text-gray-500 mt-1">Configurez un CNAME et des enregistrements SPF/DKIM pour utiliser votre domaine.</p>
          </FormField>
          <FormField label="Nom de l'expediteur">
            <Input
              value={config.emailFromName || ''}
              onChange={(e) => updateConfig('emailFromName', e.target.value)}
              placeholder="Votre Entreprise"
            />
          </FormField>
        </div>
      </SectionCard>

      {/* Custom CSS */}
      <SectionCard title="CSS personnalise" >
        {premium.customCss ? (
          <FormField label="CSS personnalise (avance)">
            <Textarea
              value={config.customCss || ''}
              onChange={(e) => updateConfig('customCss', e.target.value)}
              placeholder={`/* Exemple */\n.storefront-header { background: #1a1a1a; }\n.product-card { border-radius: 16px; }`}
              rows={8}
              className="font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">Maximum 10,000 caracteres. S&apos;applique a la boutique publique uniquement.</p>
          </FormField>
        ) : (
          <div className="flex items-center gap-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Lock className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-500">CSS personnalise disponible avec le plan Pro ou Enterprise</span>
          </div>
        )}
      </SectionCard>

      {/* Custom 404 */}
      <SectionCard title="Page 404 personnalisee" >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Titre">
            <Input
              value={config.custom404Title || ''}
              onChange={(e) => updateConfig('custom404Title', e.target.value)}
              placeholder="Page introuvable"
            />
          </FormField>
          <FormField label="Image">
            <MediaUploader
              value={config.custom404ImageUrl || ''}
              onChange={(url) => updateConfig('custom404ImageUrl', url)}
            />
          </FormField>
          <div className="md:col-span-2">
            <FormField label="Message">
              <Textarea
                value={config.custom404Message || ''}
                onChange={(e) => updateConfig('custom404Message', e.target.value)}
                placeholder="Desolee, cette page n'existe pas. Revenez a l'accueil."
                rows={3}
              />
            </FormField>
          </div>
        </div>
      </SectionCard>

      {/* Preview */}
      <SectionCard title="Apercu page de connexion" >
        <div
          className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 h-64 flex items-center justify-center"
          style={{
            backgroundColor: config.loginBackgroundColor || '#0066CC',
            backgroundImage: config.loginBackgroundUrl ? `url(${config.loginBackgroundUrl})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="bg-white dark:bg-gray-900 rounded-xl p-8 shadow-xl max-w-sm w-full mx-4 text-center">
            {config.loginLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={config.loginLogoUrl} alt="Logo" className="h-12 mx-auto mb-4 object-contain" />
            ) : (
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded mx-auto mb-4 w-32" />
            )}
            {config.loginTagline && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{config.loginTagline}</p>
            )}
            <div className="space-y-2">
              <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded" />
              <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded" />
              <div className="h-10 bg-blue-600 rounded" />
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Save */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Sauvegarde en cours...' : 'Sauvegarder'}
        </Button>
      </div>
    </div>
  );
}
