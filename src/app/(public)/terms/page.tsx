/**
 * Terms of Service — Attitudes VIP / Koraline
 * URL: /terms
 */

export const metadata = {
  title: 'Conditions d\'utilisation | Attitudes VIP',
  description: 'Conditions d\'utilisation de la plateforme Attitudes VIP et de la suite Koraline.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Conditions d&apos;utilisation</h1>
        <p className="text-sm text-gray-500 mb-8">Dernière mise à jour : Mars 2026</p>

        <div className="prose prose-gray max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">1. Acceptation des conditions</h2>
            <p className="text-gray-600">
              En utilisant la plateforme Attitudes VIP et la suite Koraline, vous acceptez les présentes
              conditions d&apos;utilisation. Si vous n&apos;acceptez pas ces conditions, veuillez ne pas utiliser nos services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">2. Description du service</h2>
            <p className="text-gray-600">
              Attitudes VIP fournit une plateforme SaaS de commerce en ligne (Suite Koraline) permettant aux
              entreprises de créer et gérer leur boutique en ligne, leur CRM, leur comptabilité et leurs
              communications.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">3. Comptes et abonnements</h2>
            <p className="text-gray-600">
              Vous êtes responsable de maintenir la confidentialité de vos identifiants de connexion.
              Les abonnements sont facturés mensuellement. Vous pouvez annuler votre abonnement à tout moment,
              l&apos;accès étant maintenu jusqu&apos;à la fin de la période payée.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">4. Propriété des données</h2>
            <p className="text-gray-600">
              Vous restez propriétaire de toutes les données que vous saisissez dans la plateforme.
              En cas de résiliation, vous disposez de 30 jours pour exporter vos données.
              Après ce délai, vos données seront supprimées de nos systèmes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">5. Limitation de responsabilité</h2>
            <p className="text-gray-600">
              Attitudes VIP ne saurait être tenue responsable des dommages indirects, accessoires ou consécutifs
              résultant de l&apos;utilisation de la plateforme. Notre responsabilité totale est limitée au montant
              des frais d&apos;abonnement payés au cours des 12 derniers mois.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">6. Droit applicable</h2>
            <p className="text-gray-600">
              Les présentes conditions sont régies par les lois de la province de Québec et les lois fédérales
              du Canada qui s&apos;y appliquent. Tout litige sera soumis aux tribunaux compétents de Montréal, Québec.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">7. Contact</h2>
            <p className="text-gray-600">
              Attitudes VIP<br />
              Montréal, QC, Canada<br />
              legal@attitudes.vip
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
