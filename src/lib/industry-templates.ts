/**
 * Industry Templates — Seed data per industry for onboarding
 *
 * When a new tenant selects their industry during onboarding,
 * we pre-populate categories and suggest recommended modules.
 */

export interface IndustryTemplate {
  id: string;
  label: string;
  categories: string[];
  recommendedModules: string[];
  sampleProducts: Array<{ name: string; price: number; description: string }>;
}

export const INDUSTRY_TEMPLATES: Record<string, IndustryTemplate> = {
  ecommerce: {
    id: 'ecommerce',
    label: 'E-commerce générique',
    categories: ['Nouveautés', 'Populaires', 'Promotions', 'Accessoires', 'Collections'],
    recommendedModules: ['email_marketing', 'loyalty', 'chat'],
    sampleProducts: [
      { name: 'Produit vedette', price: 4999, description: 'Notre produit le plus populaire' },
    ],
  },
  health: {
    id: 'health',
    label: 'Santé / Suppléments',
    categories: ['Vitamines', 'Minéraux', 'Protéines', 'Omégas', 'Probiotiques', 'Herbes', 'Bundles santé'],
    recommendedModules: ['subscriptions', 'loyalty', 'email_marketing'],
    sampleProducts: [
      { name: 'Multivitamines Premium', price: 3499, description: 'Complexe multivitaminé haute absorption' },
    ],
  },
  fashion: {
    id: 'fashion',
    label: 'Mode / Vêtements',
    categories: ['Femmes', 'Hommes', 'Enfants', 'Chaussures', 'Accessoires', 'Nouveautés', 'Soldes'],
    recommendedModules: ['loyalty', 'ambassadors', 'email_marketing'],
    sampleProducts: [
      { name: 'T-shirt essentiel', price: 2999, description: 'Coton biologique, coupe moderne' },
    ],
  },
  food: {
    id: 'food',
    label: 'Alimentation / Restaurant',
    categories: ['Menu du jour', 'Entrées', 'Plats principaux', 'Desserts', 'Boissons', 'Livraison'],
    recommendedModules: ['subscriptions', 'loyalty', 'chat'],
    sampleProducts: [
      { name: 'Box découverte', price: 4999, description: 'Assortiment de nos meilleurs produits' },
    ],
  },
  services: {
    id: 'services',
    label: 'Services professionnels',
    categories: ['Consultation', 'Formation', 'Audit', 'Accompagnement', 'Forfaits'],
    recommendedModules: ['crm_advanced', 'chat', 'monitoring'],
    sampleProducts: [
      { name: 'Consultation initiale', price: 15000, description: 'Séance de consultation 1h' },
    ],
  },
  beauty: {
    id: 'beauty',
    label: 'Beauté / Cosmétiques',
    categories: ['Soins visage', 'Soins corps', 'Maquillage', 'Parfums', 'Coffrets', 'Bio & naturel'],
    recommendedModules: ['subscriptions', 'loyalty', 'ambassadors', 'email_marketing'],
    sampleProducts: [
      { name: 'Crème hydratante', price: 4499, description: 'Soin hydratant quotidien aux actifs naturels' },
    ],
  },
  education: {
    id: 'education',
    label: 'Formation / Cours',
    categories: ['Cours en ligne', 'Ateliers', 'Certifications', 'Ressources', 'Mentorat'],
    recommendedModules: ['subscriptions', 'email_marketing', 'chat'],
    sampleProducts: [
      { name: 'Formation complète', price: 29900, description: 'Programme de formation en ligne complet' },
    ],
  },
  telecom: {
    id: 'telecom',
    label: 'Télécom / Services récurrents',
    categories: ['Forfaits mobiles', 'Internet', 'Téléphonie', 'Solutions entreprise', 'Équipements'],
    recommendedModules: ['subscriptions', 'crm_advanced', 'monitoring', 'chat'],
    sampleProducts: [
      { name: 'Forfait essentiel', price: 2999, description: 'Forfait mensuel de base' },
    ],
  },
  custom: {
    id: 'custom',
    label: 'Personnalisé (vierge)',
    categories: ['Catégorie 1', 'Catégorie 2', 'Catégorie 3'],
    recommendedModules: [],
    sampleProducts: [],
  },
};

/**
 * Get industry template by ID.
 */
export function getIndustryTemplate(industryId: string): IndustryTemplate {
  return INDUSTRY_TEMPLATES[industryId] || INDUSTRY_TEMPLATES.custom;
}

/**
 * Get all available industries for display.
 */
export function getAllIndustries(): Array<{ id: string; label: string }> {
  return Object.values(INDUSTRY_TEMPLATES).map(t => ({ id: t.id, label: t.label }));
}
