'use client';

/**
 * Page d'inscription Koraline — Choisir un plan et créer un compte
 * URL: /signup
 *
 * Flow: Choisir plan → Remplir infos → Stripe Checkout → Onboarding
 */

import { useState } from 'react';
import { KORALINE_PLANS, type KoralinePlan } from '@/lib/stripe-attitudes';

export default function SignupPage() {
  const [selectedPlan, setSelectedPlan] = useState<KoralinePlan>('pro');
  const [step, setStep] = useState<'plan' | 'info'>('plan');
  const [form, setForm] = useState({ slug: '', name: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const plans = Object.entries(KORALINE_PLANS) as [KoralinePlan, typeof KORALINE_PLANS[KoralinePlan]][];

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/platform/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: selectedPlan,
          slug: form.slug,
          name: form.name,
          email: form.email,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Une erreur est survenue');
        return;
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">K</div>
          <span className="text-xl font-bold text-gray-900">Kor@line</span>
          <span className="text-sm text-gray-400 ml-2">by Attitudes VIP</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pb-16">
        {step === 'plan' ? (
          <>
            {/* Titre */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Lancez votre boutique en ligne
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Tout ce dont vous avez besoin pour vendre en ligne. Commerce, CRM, comptabilité, marketing — tout inclus dans une seule plateforme.
              </p>
            </div>

            {/* Plans */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {plans.map(([key, plan]) => {
                const isSelected = selectedPlan === key;
                const isPro = key === 'pro';
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedPlan(key)}
                    className={`relative text-left p-6 rounded-2xl border-2 transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 shadow-lg'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    {isPro && (
                      <span className="absolute -top-3 left-6 px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-full">
                        Populaire
                      </span>
                    )}
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{plan.name}</h3>
                    <p className="text-sm text-gray-500 mb-4">{plan.description}</p>
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-gray-900">
                        {(plan.monthlyPrice / 100).toFixed(0)}$
                      </span>
                      <span className="text-gray-500">/mois</span>
                    </div>
                    <ul className="space-y-2">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                          <span className="text-green-500 mt-0.5">&#10003;</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                    {isSelected && (
                      <div className="absolute top-4 right-4 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm">&#10003;</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="text-center">
              <button
                onClick={() => setStep('info')}
                className="px-8 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors text-lg"
              >
                Continuer avec {KORALINE_PLANS[selectedPlan].name}
              </button>
              <p className="text-sm text-gray-400 mt-3">
                Modules optionnels disponibles après l&apos;inscription
              </p>
            </div>
          </>
        ) : (
          <>
            {/* Formulaire info */}
            <div className="max-w-md mx-auto">
              <button
                onClick={() => setStep('plan')}
                className="text-sm text-gray-500 hover:text-gray-700 mb-6 flex items-center gap-1"
              >
                &#8592; Changer de plan
              </button>

              <div className="bg-white rounded-2xl border p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Créez votre compte</h2>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                    {KORALINE_PLANS[selectedPlan].name}
                  </span>
                </div>

                <form onSubmit={handleCheckout} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom de votre entreprise
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Mon Entreprise Inc."
                      className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Identifiant unique (slug)
                    </label>
                    <div className="flex items-center">
                      <input
                        type="text"
                        value={form.slug}
                        onChange={(e) => setForm({
                          ...form,
                          slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                        })}
                        placeholder="mon-entreprise"
                        className="w-full px-4 py-2.5 border rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                        minLength={3}
                        maxLength={30}
                      />
                      <span className="px-3 py-2.5 bg-gray-100 border border-l-0 rounded-r-lg text-sm text-gray-500 whitespace-nowrap">
                        .koraline.app
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Votre courriel
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="vous@entreprise.com"
                      className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Redirection vers le paiement...' : `Passer au paiement — ${(KORALINE_PLANS[selectedPlan].monthlyPrice / 100).toFixed(0)}$/mois`}
                  </button>

                  <p className="text-xs text-gray-400 text-center">
                    Paiement sécurisé par Stripe. Annulable à tout moment.
                  </p>
                </form>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
