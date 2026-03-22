/**
 * Privacy Policy — Attitudes VIP / Koraline
 * URL: /privacy
 */

export const metadata = {
  title: 'Politique de confidentialité | Attitudes VIP',
  description: 'Politique de confidentialité de la plateforme Attitudes VIP et de la suite Koraline.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Politique de confidentialité</h1>
        <p className="text-sm text-gray-500 mb-8">Dernière mise à jour : Mars 2026</p>

        <div className="prose prose-gray max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">1. Introduction</h2>
            <p className="text-gray-600">
              Attitudes VIP (&quot;nous&quot;, &quot;notre&quot;) exploite la plateforme Koraline et ses services associés.
              Cette politique de confidentialité décrit comment nous collectons, utilisons et protégeons vos informations personnelles
              conformément à la Loi sur la protection des renseignements personnels et les documents électroniques (LPRPDE/PIPEDA)
              et à la Loi 25 du Québec.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">2. Données collectées</h2>
            <p className="text-gray-600">
              Nous collectons les informations que vous nous fournissez directement : nom, adresse courriel,
              adresse postale, numéro de téléphone, informations de paiement, et toute autre information
              que vous choisissez de nous communiquer.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">3. Utilisation des données</h2>
            <p className="text-gray-600">
              Vos données sont utilisées pour : traiter vos commandes, gérer votre compte,
              vous envoyer des communications relatives à votre compte, améliorer nos services,
              et respecter nos obligations légales.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">4. Responsable de la protection des données</h2>
            <p className="text-gray-600">
              Conformément à la Loi 25 du Québec, notre responsable de la protection des renseignements personnels
              peut être contacté à : privacy@attitudes.vip
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">5. Vos droits</h2>
            <p className="text-gray-600">
              Vous avez le droit d&apos;accéder à vos données personnelles, de les rectifier, de les supprimer,
              et de demander leur portabilité. Pour exercer ces droits, contactez-nous à privacy@attitudes.vip.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">6. Contact</h2>
            <p className="text-gray-600">
              Attitudes VIP<br />
              Montréal, QC, Canada<br />
              privacy@attitudes.vip
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
