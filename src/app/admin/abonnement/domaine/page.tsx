'use client';

/**
 * Custom Domain Configuration — Tenant owner
 * URL: /admin/abonnement/domaine
 */

import { useState, useEffect } from 'react';

export default function DomainConfigPage() {
  const [domainKoraline, setDomainKoraline] = useState('');
  const [domainCustom, setDomainCustom] = useState('');
  const [dnsVerified, setDnsVerified] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/platform/domain')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setDomainKoraline(data.domainKoraline || '');
          setDomainCustom(data.domainCustom || '');
          setDnsVerified(data.dnsVerified || false);
          setNewDomain(data.domainCustom || '');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/platform/domain', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: newDomain }),
      });
      const data = await res.json();
      if (res.ok) {
        setDomainCustom(data.domain);
        setDnsVerified(data.dnsVerified);
        setMessage(data.message);
      } else {
        setMessage(data.error || 'Erreur');
      }
    } catch {
      setMessage('Erreur de connexion');
    } finally {
      setSaving(false);
    }
  };

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const res = await fetch('/api/platform/domain');
      const data = await res.json();
      setDnsVerified(data.dnsVerified || false);
      setMessage(data.dnsVerified ? 'DNS vérifié avec succès !' : 'DNS pas encore configuré. Vérifiez vos paramètres CNAME.');
    } catch {
      setMessage('Erreur de vérification');
    } finally {
      setVerifying(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm('Retirer votre domaine personnalisé ?')) return;
    setSaving(true);
    try {
      const res = await fetch('/api/platform/domain', { method: 'DELETE' });
      if (res.ok) {
        setDomainCustom('');
        setNewDomain('');
        setDnsVerified(false);
        setMessage('Domaine personnalisé retiré');
      }
    } catch {
      setMessage('Erreur');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8"><div className="animate-pulse h-48 bg-gray-200 rounded-xl" /></div>;
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <a href="/admin/abonnement" className="text-sm text-gray-500 hover:text-gray-700">
          &#8592; Retour à l&apos;abonnement
        </a>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Domaine personnalisé</h1>
        <p className="text-gray-500 mt-1">Connectez votre propre nom de domaine à votre boutique Koraline.</p>
      </div>

      {message && (
        <div className={`p-3 rounded-lg mb-6 text-sm ${
          message.includes('succès') || message.includes('vérifié')
            ? 'bg-green-50 text-green-700 border border-green-200'
            : message.includes('Erreur') || message.includes('pas encore')
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-blue-50 text-blue-700 border border-blue-200'
        }`}>
          {message}
        </div>
      )}

      {/* Koraline subdomain (readonly) */}
      <div className="bg-white rounded-xl border p-5 mb-6">
        <h3 className="font-semibold text-gray-900 mb-2">Sous-domaine Koraline</h3>
        <div className="flex items-center gap-2">
          <span className="font-mono text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg text-sm">
            {domainKoraline}
          </span>
          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Actif</span>
        </div>
        <p className="text-xs text-gray-400 mt-2">Ce sous-domaine est toujours disponible.</p>
      </div>

      {/* Custom domain */}
      <div className="bg-white rounded-xl border p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Domaine personnalisé</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Votre domaine</label>
            <input
              type="text"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value.toLowerCase())}
              placeholder="boutique.monsite.com"
              className="w-full px-4 py-2.5 border rounded-lg"
            />
          </div>

          {domainCustom && (
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${dnsVerified ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-600">
                {dnsVerified ? 'DNS vérifié' : 'DNS non vérifié'}
              </span>
              <button
                onClick={handleVerify}
                disabled={verifying}
                className="text-sm text-blue-600 hover:underline ml-2"
              >
                {verifying ? 'Vérification...' : 'Re-vérifier'}
              </button>
            </div>
          )}

          {/* DNS instructions */}
          {newDomain && (
            <div className="bg-gray-50 rounded-lg p-4 text-sm">
              <p className="font-medium text-gray-900 mb-2">Instructions DNS</p>
              <p className="text-gray-600 mb-2">
                Ajoutez un enregistrement <strong>CNAME</strong> chez votre registraire DNS :
              </p>
              <div className="bg-white border rounded-lg p-3 font-mono text-xs">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-gray-400">Type</span>
                    <p className="font-bold">CNAME</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Nom</span>
                    <p className="font-bold">{newDomain.split('.')[0]}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Cible</span>
                    <p className="font-bold text-blue-600">{domainKoraline}</p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                La propagation DNS peut prendre jusqu&apos;à 48h.
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving || !newDomain}
              className="flex-1 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Sauvegarde...' : 'Enregistrer'}
            </button>
            {domainCustom && (
              <button
                onClick={handleRemove}
                disabled={saving}
                className="py-2.5 px-4 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
              >
                Retirer
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
