'use client';

/**
 * PAGE DEMANDE DE DEMO — Platform (attitudes.vip)
 * Formulaire de demande de demo Koraline
 * Decision D31: Pas de trial gratuit, demo seulement
 */

import { useState } from 'react';

const MODULES_OPTIONS = [
  { id: 'commerce', label: 'Commerce en ligne' },
  { id: 'crm', label: 'CRM & Gestion clients' },
  { id: 'accounting', label: 'Comptabilite' },
  { id: 'marketing', label: 'Marketing & Campagnes' },
  { id: 'lms', label: 'Formation (LMS)' },
  { id: 'voip', label: 'Telephonie (VoIP)' },
  { id: 'loyalty', label: 'Fidelite & Recompenses' },
  { id: 'media', label: 'Gestion des medias' },
] as const;

export default function PlatformDemoPage() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    phone: '',
    employees: '',
    message: '',
  });
  const [modules, setModules] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const toggleModule = (id: string) => {
    setModules((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError('');

    try {
      const res = await fetch('/api/demo-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, modules }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Une erreur est survenue. Veuillez reessayer.');
        return;
      }
      setSent(true);
    } catch {
      setError('Erreur de connexion. Veuillez reessayer.');
    } finally {
      setSending(false);
    }
  };

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-blue-50 to-white pt-20 pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
            Reservez votre demo
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Decouvrez Koraline en action. Notre equipe vous presentera la plateforme
            avec vos propres cas d&apos;usage, en 30 minutes.
          </p>
        </div>
      </section>

      {/* Pourquoi planifier une demo? */}
      <section className="py-12 bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Pourquoi planifier une demo?
          </h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              {
                icon: (
                  <svg className="w-8 h-8 text-[#0066CC]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                  </svg>
                ),
                title: 'Visite guidee personnalisee de la plateforme',
                desc: 'Un expert vous accompagne a travers chaque fonctionnalite, adaptee a votre contexte reel.',
              },
              {
                icon: (
                  <svg className="w-8 h-8 text-[#0066CC]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                  </svg>
                ),
                title: 'Reponses a toutes vos questions',
                desc: 'Migration, integrations, tarification, deploiement — rien ne reste sans reponse.',
              },
              {
                icon: (
                  <svg className="w-8 h-8 text-[#0066CC]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                  </svg>
                ),
                title: 'Configuration adaptee a votre industrie',
                desc: 'Votre secteur a ses particularites. On configure la plateforme pour qu&apos;elle y reponde.',
              },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  {item.icon}
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="pb-24 pt-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-5 gap-12 items-start">
            {/* Left — Benefits */}
            <div className="md:col-span-2 space-y-8 pt-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-6">Ce que vous verrez</h2>
                <ul className="space-y-5">
                  {[
                    {
                      title: 'Configuration en direct',
                      desc: 'Creation de votre boutique, catalogue, branding — en temps reel.',
                    },
                    {
                      title: 'Modules sur mesure',
                      desc: 'Commerce, CRM, comptabilite, marketing — adaptes a votre secteur.',
                    },
                    {
                      title: 'Questions & reponses',
                      desc: 'Posez toutes vos questions. Migration, integrations, tarification.',
                    },
                    {
                      title: 'Plan d\'implementation',
                      desc: 'Recevez un plan personnalise pour lancer votre boutique.',
                    },
                  ].map((item) => (
                    <li key={item.title} className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-[#0066CC] mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                        <p className="text-sm text-gray-500">{item.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Testimonial */}
              <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
                <p className="text-sm text-gray-700 italic mb-3">
                  &laquo;En 30 minutes, l&apos;equipe m&apos;a montre exactement comment
                  Koraline pouvait remplacer nos 4 outils actuels. On a signe le
                  jour meme.&raquo;
                </p>
                <p className="text-xs text-gray-500 font-medium">
                  -- Proprietaire de boutique, Montreal
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
                  <p className="text-2xl font-bold text-[#0066CC]">30 min</p>
                  <p className="text-xs text-gray-500">Duree de la demo</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
                  <p className="text-2xl font-bold text-[#0066CC]">24h</p>
                  <p className="text-xs text-gray-500">Delai de reponse</p>
                </div>
              </div>

              {/* Guarantee Badge */}
              <div className="flex items-center gap-3 bg-green-50 rounded-xl p-4 border border-green-100">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Sans engagement, 100% gratuit</p>
                  <p className="text-xs text-gray-500">Aucune carte de credit requise. Annulez a tout moment.</p>
                </div>
              </div>
            </div>

            {/* Right — Form */}
            <div className="md:col-span-3">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-lg shadow-gray-100/50 p-8">
                {sent ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">Demande envoyee!</h2>
                    <p className="text-gray-500 mb-2">
                      Notre equipe vous contactera dans les 24 heures pour planifier votre demo.
                    </p>
                    <p className="text-sm text-gray-400">
                      Verifiez votre boite courriel, incluant les spams.
                    </p>
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">Demandez votre demo</h2>
                    <p className="text-sm text-gray-500 mb-6">Tous les champs marques * sont obligatoires.</p>

                    <form onSubmit={handleSubmit} className="space-y-5">
                      {/* Name */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="demo-first" className="block text-sm font-medium text-gray-700 mb-1.5">
                            Prenom *
                          </label>
                          <input
                            id="demo-first"
                            type="text"
                            required
                            value={form.firstName}
                            onChange={(e) => update('firstName', e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC] outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label htmlFor="demo-last" className="block text-sm font-medium text-gray-700 mb-1.5">
                            Nom *
                          </label>
                          <input
                            id="demo-last"
                            type="text"
                            required
                            value={form.lastName}
                            onChange={(e) => update('lastName', e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC] outline-none transition-all"
                          />
                        </div>
                      </div>

                      {/* Email */}
                      <div>
                        <label htmlFor="demo-email" className="block text-sm font-medium text-gray-700 mb-1.5">
                          Courriel professionnel *
                        </label>
                        <input
                          id="demo-email"
                          type="email"
                          required
                          value={form.email}
                          onChange={(e) => update('email', e.target.value)}
                          placeholder="vous@entreprise.com"
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC] outline-none transition-all"
                        />
                      </div>

                      {/* Company + phone */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="demo-company" className="block text-sm font-medium text-gray-700 mb-1.5">
                            Entreprise *
                          </label>
                          <input
                            id="demo-company"
                            type="text"
                            required
                            value={form.company}
                            onChange={(e) => update('company', e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC] outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label htmlFor="demo-phone" className="block text-sm font-medium text-gray-700 mb-1.5">
                            Telephone
                          </label>
                          <input
                            id="demo-phone"
                            type="tel"
                            value={form.phone}
                            onChange={(e) => update('phone', e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC] outline-none transition-all"
                          />
                        </div>
                      </div>

                      {/* Employees */}
                      <div>
                        <label htmlFor="demo-employees" className="block text-sm font-medium text-gray-700 mb-1.5">
                          Nombre d&apos;employes *
                        </label>
                        <select
                          id="demo-employees"
                          required
                          value={form.employees}
                          onChange={(e) => update('employees', e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC] outline-none transition-all bg-white"
                        >
                          <option value="">Selectionnez</option>
                          <option value="1-3">1 a 3</option>
                          <option value="4-10">4 a 10</option>
                          <option value="11-25">11 a 25</option>
                          <option value="26-50">26 a 50</option>
                          <option value="50+">50+</option>
                        </select>
                      </div>

                      {/* Modules of interest */}
                      <fieldset>
                        <legend className="block text-sm font-medium text-gray-700 mb-2">
                          Modules qui vous interessent
                        </legend>
                        <div className="grid grid-cols-2 gap-2">
                          {MODULES_OPTIONS.map((mod) => (
                            <label
                              key={mod.id}
                              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border text-sm cursor-pointer transition-all ${
                                modules.includes(mod.id)
                                  ? 'border-[#0066CC] bg-blue-50 text-[#0066CC] font-medium'
                                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={modules.includes(mod.id)}
                                onChange={() => toggleModule(mod.id)}
                                className="sr-only"
                                aria-label={mod.label}
                              />
                              <span
                                className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                  modules.includes(mod.id)
                                    ? 'bg-[#0066CC] border-[#0066CC]'
                                    : 'border-gray-300 bg-white'
                                }`}
                              >
                                {modules.includes(mod.id) && (
                                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                  </svg>
                                )}
                              </span>
                              {mod.label}
                            </label>
                          ))}
                        </div>
                      </fieldset>

                      {/* Message */}
                      <div>
                        <label htmlFor="demo-message" className="block text-sm font-medium text-gray-700 mb-1.5">
                          Message (optionnel)
                        </label>
                        <textarea
                          id="demo-message"
                          rows={3}
                          value={form.message}
                          onChange={(e) => update('message', e.target.value)}
                          placeholder="Decrivez brievement votre projet ou vos besoins..."
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC] outline-none transition-all resize-y"
                        />
                      </div>

                      {/* Error */}
                      {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                          {error}
                        </div>
                      )}

                      {/* Submit */}
                      <button
                        type="submit"
                        disabled={sending}
                        className="w-full py-3 bg-[#0066CC] text-white font-semibold rounded-full hover:bg-[#0052A3] transition-all disabled:opacity-50 text-sm"
                      >
                        {sending ? 'Envoi en cours...' : 'Reserver ma demo gratuite'}
                      </button>

                      <p className="text-xs text-gray-400 text-center">
                        En soumettant ce formulaire, vous acceptez notre{' '}
                        <a href="/privacy" className="underline hover:text-gray-600">politique de confidentialite</a>.
                        Aucun engagement requis.
                      </p>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
