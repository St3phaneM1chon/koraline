/**
 * Seed 15 Koraline FAQ entries for the Attitudes VIP tenant.
 * Categories: general (5), technique (5), formation (5)
 *
 * Usage: node scripts/seed-koraline-faqs.js
 */

const { PrismaClient } = require('../node_modules/.prisma/client');
const prisma = new PrismaClient();

const TENANT_ID = 'cmn06w0m80001uz9wugnd7a0n'; // Attitudes VIP

const faqs = [
  // ─── GÉNÉRAL (5) ──────────────────────────────────────────
  {
    question: "Qu'est-ce que la Suite Koraline ?",
    answer: "La Suite Koraline est une plateforme tout-en-un de gestion commerciale conçue pour les PME et entrepreneurs québécois. Elle regroupe un système de commerce en ligne, un CRM, une comptabilité intégrée, un module de téléphonie VoIP, un LMS (formation en ligne), un programme de fidélité et bien plus — le tout dans une seule interface unifiée propulsée par l'intelligence artificielle Aurelia.",
    category: "general",
    locale: "fr",
    sortOrder: 1,
  },
  {
    question: "Combien coûte Koraline ?",
    answer: "Koraline offre plusieurs forfaits adaptés à la taille de votre entreprise. Un forfait de base inclut la boutique en ligne, le CRM et la comptabilité. Des modules complémentaires (téléphonie, formation, fidélité, marketing avancé) peuvent être ajoutés à la carte. Consultez notre page Tarifs pour les détails actuels. Tous les forfaits incluent l'hébergement, les mises à jour et le support technique.",
    category: "general",
    locale: "fr",
    sortOrder: 2,
  },
  {
    question: "Puis-je essayer avant de payer ?",
    answer: "Oui ! Koraline offre une période d'essai gratuite de 14 jours avec accès complet à toutes les fonctionnalités. Aucune carte de crédit n'est requise pour commencer. À la fin de l'essai, vous choisissez le forfait qui convient le mieux à vos besoins. Vos données sont conservées lors du passage au forfait payant.",
    category: "general",
    locale: "fr",
    sortOrder: 3,
  },
  {
    question: "Comment migrer depuis Shopify ou WooCommerce ?",
    answer: "Koraline propose un assistant de migration intégré qui importe automatiquement vos produits, catégories, clients et historique de commandes depuis Shopify, WooCommerce et plusieurs autres plateformes. Le processus prend généralement moins de 24 heures. Notre équipe de support vous accompagne à chaque étape pour assurer une transition sans perte de données.",
    category: "general",
    locale: "fr",
    sortOrder: 4,
  },
  {
    question: "Est-ce que Koraline est disponible en anglais ?",
    answer: "Oui. L'interface de Koraline est entièrement bilingue (français et anglais) et supporte 22 langues au total pour la vitrine en ligne. L'interface d'administration est disponible en français et en anglais. Votre boutique peut afficher les produits, descriptions et pages dans la langue de votre choix, avec traduction automatique assistée par IA.",
    category: "general",
    locale: "fr",
    sortOrder: 5,
  },

  // ─── TECHNIQUE (5) ────────────────────────────────────────
  {
    question: "Quelles méthodes de paiement sont supportées ?",
    answer: "Koraline s'intègre nativement avec Stripe pour accepter les cartes Visa, Mastercard, American Express et les virements bancaires. Le paiement par Interac en ligne est aussi disponible. Vous pouvez configurer des devises multiples (CAD, USD, EUR) et offrir des options de paiement en plusieurs versements pour les commandes importantes.",
    category: "technique",
    locale: "fr",
    sortOrder: 1,
  },
  {
    question: "Puis-je utiliser mon propre nom de domaine ?",
    answer: "Absolument. Koraline supporte les noms de domaine personnalisés avec vérification DNS automatique. Il suffit d'ajouter un enregistrement CNAME chez votre registraire (GoDaddy, Namecheap, etc.) et Koraline configure automatiquement le certificat SSL. Le processus prend généralement moins de 15 minutes.",
    category: "technique",
    locale: "fr",
    sortOrder: 2,
  },
  {
    question: "Comment fonctionne la comptabilité intégrée ?",
    answer: "Le module comptable de Koraline offre un plan comptable complet conforme aux normes canadiennes (PCGR/NCECF). Il enregistre automatiquement les ventes, achats et paiements en écritures de journal. Vous disposez d'un grand livre, d'une balance de vérification, d'états financiers (bilan, résultats) et de la gestion des taxes TPS/TVQ. L'export vers votre comptable est disponible en format CSV et PDF.",
    category: "technique",
    locale: "fr",
    sortOrder: 3,
  },
  {
    question: "Koraline est-il conforme à la Loi 25 ?",
    answer: "Oui. Koraline est conçu en conformité avec la Loi 25 (protection des renseignements personnels au Québec). La plateforme inclut une politique de confidentialité intégrée, un mécanisme de consentement aux cookies, un portail de suppression des données personnelles et un registre des incidents. Les données sont hébergées au Canada avec chiffrement au repos et en transit.",
    category: "technique",
    locale: "fr",
    sortOrder: 4,
  },
  {
    question: "Quelle est la disponibilité du service ?",
    answer: "Koraline vise une disponibilité de 99,9 % grâce à une infrastructure hébergée sur Railway avec réplication automatique. Les sauvegardes de base de données sont effectuées deux fois par jour. En cas d'incident, notre système de monitoring détecte et signale les problèmes en temps réel. Le support technique est disponible par courriel et clavardage.",
    category: "technique",
    locale: "fr",
    sortOrder: 5,
  },

  // ─── FORMATION / LMS (5) ──────────────────────────────────
  {
    question: "Comment créer un cours en ligne ?",
    answer: "Le module Formation de Koraline vous permet de créer des cours structurés en chapitres et leçons. Chaque leçon peut contenir du texte enrichi, des vidéos, des fichiers à télécharger et des quiz. L'éditeur visuel est intuitif : glissez-déposez les éléments, réorganisez les sections et prévisualisez le résultat en temps réel. Aucune compétence technique n'est requise.",
    category: "formation",
    locale: "fr",
    sortOrder: 1,
  },
  {
    question: "Quels types de quiz sont supportés ?",
    answer: "Koraline supporte plusieurs types de questions : choix multiples, vrai ou faux, réponse courte, association et questions à développement. Vous pouvez configurer un seuil de réussite, un nombre de tentatives maximal et un temps limite. Les résultats sont automatiquement enregistrés et accessibles dans le tableau de bord de progression de chaque étudiant.",
    category: "formation",
    locale: "fr",
    sortOrder: 2,
  },
  {
    question: "La certification est-elle automatique ?",
    answer: "Oui. Lorsqu'un étudiant complète toutes les leçons et réussit les quiz d'un cours, un certificat de réussite est généré automatiquement au format PDF. Vous pouvez personnaliser le modèle de certificat avec votre logo, vos couleurs et les informations du cours. Les certificats peuvent être vérifiés en ligne via un code QR unique.",
    category: "formation",
    locale: "fr",
    sortOrder: 3,
  },
  {
    question: "Aurelia IA peut-elle aider mes étudiants ?",
    answer: "Oui. Aurelia, l'assistante IA intégrée à Koraline, agit comme tutrice personnelle pour chaque étudiant. Elle répond aux questions sur le contenu du cours, génère des quiz de révision adaptés au niveau de l'étudiant, planifie les sessions de révision avec la répétition espacée et peut simuler des mises en situation professionnelles. Aurelia est disponible 24/7 directement dans l'interface du cours.",
    category: "formation",
    locale: "fr",
    sortOrder: 4,
  },
  {
    question: "Puis-je vendre des formations à l'unité ?",
    answer: "Oui. Koraline offre une flexibilité totale pour la vente de formations : vous pouvez vendre des cours individuels, créer des bundles (paquets de cours à prix réduit), offrir des abonnements mensuels ou annuels donnant accès à l'ensemble du catalogue, ou encore proposer des codes d'accès pour les entreprises. Tous les paiements sont traités via Stripe avec facturation automatique.",
    category: "formation",
    locale: "fr",
    sortOrder: 5,
  },
];

async function seed() {
  console.log('Deleting existing FAQs...');
  await prisma.faqTranslation.deleteMany({});
  await prisma.faq.deleteMany({});

  console.log(`Seeding ${faqs.length} Koraline FAQs for tenant ${TENANT_ID}...`);

  for (const faq of faqs) {
    const created = await prisma.faq.create({
      data: {
        tenantId: TENANT_ID,
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
        locale: faq.locale,
        sortOrder: faq.sortOrder,
        isPublished: true,
      },
    });
    console.log(`  [${faq.category}] ${faq.question.substring(0, 60)}... → ${created.id}`);
  }

  const total = await prisma.faq.count();
  console.log(`\nDone! Total FAQs in database: ${total}`);
}

seed()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
