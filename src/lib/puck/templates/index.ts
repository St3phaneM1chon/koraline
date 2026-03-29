/**
 * Page Builder Templates — 25 industry-specific starter templates
 * Each template is a pre-configured array of Koraline sections.
 */

export interface PageTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnail: string; // emoji for now, will be replaced with screenshots
  sections: Array<{ id: string; type: string; data: Record<string, unknown> }>;
}

function sec(type: string, data: Record<string, unknown>, idx: number): { id: string; type: string; data: Record<string, unknown> } {
  return { id: `sec_t_${idx}`, type, data };
}

export const PAGE_TEMPLATES: PageTemplate[] = [
  // ═══════════════════════════════════════
  // BUSINESS & SERVICES
  // ═══════════════════════════════════════
  {
    id: 'business', name: 'Entreprise', description: 'Site corporatif professionnel', category: 'Business', thumbnail: '🏢',
    sections: [
      sec('hero', { title: 'Solutions professionnelles pour votre entreprise', subtitle: 'Expert en transformation numérique depuis 2010', ctaText: 'Nos services', ctaUrl: '#services', ctaSecondaryText: 'Nous contacter', variant: 'centered', animation: 'fadeIn', backgroundColor: '#0f172a', textColor: '#ffffff' }, 1),
      sec('stats', { items: [{ value: '500+', label: 'Clients satisfaits' }, { value: '15+', label: 'Années d\'expérience' }, { value: '99%', label: 'Taux de satisfaction' }, { value: '24/7', label: 'Support' }], animation: 'slideUp' }, 2),
      sec('features', { title: 'Nos services', columns: '3', items: [{ icon: '💼', title: 'Conseil stratégique', description: 'Accompagnement personnalisé pour votre croissance' }, { icon: '🔧', title: 'Solutions sur mesure', description: 'Technologies adaptées à vos besoins' }, { icon: '📊', title: 'Analyse de données', description: 'Décisions éclairées par les données' }], animation: 'slideUp' }, 3),
      sec('testimonials', { title: 'Ce que nos clients disent', items: [{ quote: 'Un partenaire de confiance qui comprend nos enjeux.', author: 'Marie Tremblay', role: 'Directrice, TechCo' }, { quote: 'Résultats concrets et mesurables dès le premier mois.', author: 'Pierre Gagnon', role: 'CEO, InnovatePlus' }], animation: 'fadeIn', backgroundColor: '#f8fafc' }, 4),
      sec('cta', { title: 'Prêt à transformer votre entreprise?', subtitle: 'Prenez rendez-vous pour une consultation gratuite', buttonText: 'Planifier un appel', buttonUrl: '#contact', animation: 'fadeIn', backgroundColor: '#2563eb', textColor: '#ffffff' }, 5),
    ],
  },
  {
    id: 'landing', name: 'Page d\'atterrissage', description: 'Landing page de conversion', category: 'Marketing', thumbnail: '🎯',
    sections: [
      sec('hero', { title: 'Le meilleur outil pour votre business', subtitle: 'Essayez gratuitement pendant 14 jours — aucune carte requise', ctaText: 'Essai gratuit', ctaUrl: '#', ctaSecondaryText: 'Voir la démo', variant: 'centered', animation: 'fadeIn' }, 1),
      sec('logo_carousel', { title: 'Ils nous font confiance', logos: [{ url: '', name: 'Desjardins' }, { url: '', name: 'Hydro-Québec' }, { url: '', name: 'SAQ' }, { url: '', name: 'Bombardier' }], animation: 'fadeIn', backgroundColor: '#f8fafc' }, 2),
      sec('features', { title: 'Pourquoi nous choisir', columns: '3', items: [{ icon: '⚡', title: 'Ultra rapide', description: 'Résultats en 5 minutes' }, { icon: '🛡️', title: 'Sécuritaire', description: 'Conforme LPRPDE et Loi 25' }, { icon: '🎯', title: 'Précis', description: 'IA de dernière génération' }], animation: 'slideUp' }, 3),
      sec('pricing_table', { title: 'Forfaits simples et transparents', plans: [{ name: 'Essentiel', price: '29$', period: '/mois', features: '5 utilisateurs\n10 GB stockage\nSupport email\nRapports de base', ctaText: 'Commencer', highlighted: 'false' }, { name: 'Pro', price: '79$', period: '/mois', features: '25 utilisateurs\n100 GB stockage\nSupport prioritaire\nAPI complète\nAnalytique avancée', ctaText: 'Essai gratuit', highlighted: 'true' }, { name: 'Enterprise', price: 'Sur mesure', period: '', features: 'Utilisateurs illimités\nStockage illimité\nGestionnaire dédié\nSLA garanti\nFormation incluse', ctaText: 'Nous contacter', highlighted: 'false' }], animation: 'slideUp' }, 4),
      sec('faq_accordion', { title: 'Questions fréquentes', items: [{ question: 'Puis-je annuler à tout moment?', answer: 'Oui, vous pouvez annuler votre abonnement sans frais à tout moment.' }, { question: 'Y a-t-il un engagement minimum?', answer: 'Non, tous nos forfaits sont sans engagement.' }, { question: 'Offrez-vous un essai gratuit?', answer: 'Oui! 14 jours d\'essai gratuit sur tous les forfaits.' }], animation: 'fadeIn' }, 5),
      sec('cta', { title: 'Lancez-vous maintenant', subtitle: 'Rejoignez plus de 500 entreprises québécoises', buttonText: 'Commencer gratuitement', buttonUrl: '#', animation: 'fadeIn', backgroundColor: '#059669', textColor: '#ffffff' }, 6),
    ],
  },
  {
    id: 'portfolio', name: 'Portfolio', description: 'Portfolio créatif et galerie de travaux', category: 'Créatif', thumbnail: '🎨',
    sections: [
      sec('hero', { title: 'Créateur de solutions visuelles', subtitle: 'Design • Branding • Photographie', ctaText: 'Voir mes projets', variant: 'centered', animation: 'fadeIn', backgroundColor: '#18181b', textColor: '#ffffff' }, 1),
      sec('gallery', { title: 'Projets récents', columns: '3', images: [{ url: '', alt: 'Projet Branding', caption: 'Identité visuelle — TechStartup' }, { url: '', alt: 'Projet Web', caption: 'Site web — RestaurantXYZ' }, { url: '', alt: 'Projet Photo', caption: 'Photographie — Événement annuel' }, { url: '', alt: 'Projet UI', caption: 'App mobile — FinTech' }, { url: '', alt: 'Projet Print', caption: 'Brochure — Immobilier' }, { url: '', alt: 'Projet Social', caption: 'Campagne — Mode' }], animation: 'fadeIn' }, 2),
      sec('text_image', { title: 'À propos de moi', content: 'Créateur passionné avec plus de 10 ans d\'expérience en design et communication visuelle. Basé à Montréal, je travaille avec des entreprises de toutes tailles pour donner vie à leurs idées.', layout: 'imageRight', animation: 'slideUp' }, 3),
      sec('contact_form', { title: 'Discutons de votre projet', subtitle: 'Je suis disponible pour de nouveaux mandats', animation: 'fadeIn' }, 4),
    ],
  },
  {
    id: 'ecommerce', name: 'Boutique en ligne', description: 'E-commerce avec produits vedettes', category: 'Commerce', thumbnail: '🛒',
    sections: [
      sec('hero', { title: 'Découvrez notre collection', subtitle: 'Livraison gratuite sur les commandes de plus de 75$', ctaText: 'Voir la boutique', ctaUrl: '/shop', variant: 'centered', animation: 'fadeIn' }, 1),
      sec('featured_products', { title: 'Meilleures ventes', limit: 4, animation: 'slideUp' }, 2),
      sec('features', { title: 'Pourquoi acheter chez nous', columns: '4', items: [{ icon: '🚚', title: 'Livraison rapide', description: '2-5 jours ouvrables' }, { icon: '↩️', title: 'Retours gratuits', description: 'Sous 30 jours' }, { icon: '🔒', title: 'Paiement sécurisé', description: 'SSL 256-bit' }, { icon: '💬', title: 'Support 24/7', description: 'Chat & téléphone' }], animation: 'slideUp' }, 3),
      sec('newsletter', { title: 'Restez informé', subtitle: '10% de rabais sur votre première commande en vous inscrivant', buttonText: 'M\'inscrire', animation: 'fadeIn', backgroundColor: '#f8fafc' }, 4),
    ],
  },
  {
    id: 'restaurant', name: 'Restaurant', description: 'Site de restaurant avec menu et réservation', category: 'Restauration', thumbnail: '🍽️',
    sections: [
      sec('hero', { title: 'Bienvenue chez nous', subtitle: 'Cuisine authentique depuis 1990 — Réservez votre table', ctaText: 'Réserver', ctaUrl: '#reservation', variant: 'fullscreen', animation: 'fadeIn', backgroundColor: '#1a1a2e', textColor: '#ffffff' }, 1),
      sec('features', { title: 'Notre Menu', subtitle: 'Saveurs du terroir québécois', columns: '3', items: [{ icon: '🥗', title: 'Entrées', description: 'À partir de 12$' }, { icon: '🥩', title: 'Plats principaux', description: 'À partir de 24$' }, { icon: '🍰', title: 'Desserts', description: 'À partir de 9$' }], animation: 'slideUp' }, 2),
      sec('gallery', { title: 'Notre ambiance', columns: '4', images: [{ url: '', alt: 'Salle à manger' }, { url: '', alt: 'Cuisine ouverte' }, { url: '', alt: 'Terrasse d\'été' }, { url: '', alt: 'Bar à cocktails' }], animation: 'fadeIn' }, 3),
      sec('stats', { items: [{ value: '4.8/5', label: 'Note Google' }, { value: '2000+', label: 'Avis clients' }, { value: '30+', label: 'Années' }], animation: 'slideUp' }, 4),
      sec('map', { title: 'Nous trouver', embedUrl: '', height: '350', animation: 'none' }, 5),
    ],
  },
  // ═══════════════════════════════════════
  // SERVICES PROFESSIONNELS
  // ═══════════════════════════════════════
  {
    id: 'avocat', name: 'Cabinet d\'avocats', description: 'Site juridique professionnel', category: 'Services professionnels', thumbnail: '⚖️',
    sections: [
      sec('hero', { title: 'Justice. Intégrité. Résultats.', subtitle: 'Cabinet d\'avocats spécialisé en droit des affaires et litige civil', ctaText: 'Consultation gratuite', variant: 'left', animation: 'fadeIn', backgroundColor: '#1e293b', textColor: '#ffffff' }, 1),
      sec('features', { title: 'Nos domaines d\'expertise', columns: '3', items: [{ icon: '📋', title: 'Droit des affaires', description: 'Incorporation, contrats, transactions commerciales' }, { icon: '🏠', title: 'Droit immobilier', description: 'Achats, ventes, baux commerciaux' }, { icon: '👥', title: 'Droit du travail', description: 'Relations employeur-employé, normes du travail' }], animation: 'slideUp' }, 2),
      sec('team', { title: 'Notre équipe', members: [{ name: 'Me Sophie Lavoie', role: 'Associée principale', imageUrl: '' }, { name: 'Me Marc Tremblay', role: 'Droit des affaires', imageUrl: '' }, { name: 'Me Julie Côté', role: 'Litige civil', imageUrl: '' }], animation: 'fadeIn' }, 3),
      sec('testimonials', { title: 'Nos clients témoignent', items: [{ quote: 'Un accompagnement juridique de premier ordre.', author: 'Jean-Pierre L.', role: 'Entrepreneur' }], animation: 'fadeIn', backgroundColor: '#f8fafc' }, 4),
      sec('contact_form', { title: 'Demandez une consultation', subtitle: 'Première rencontre gratuite et sans engagement', animation: 'fadeIn' }, 5),
    ],
  },
  {
    id: 'comptable', name: 'Comptable / CPA', description: 'Cabinet comptable avec services et tarifs', category: 'Services professionnels', thumbnail: '📊',
    sections: [
      sec('hero', { title: 'Votre partenaire comptable de confiance', subtitle: 'Services comptables, fiscaux et de tenue de livres pour PME', ctaText: 'Demander un devis', variant: 'centered', animation: 'fadeIn' }, 1),
      sec('features', { title: 'Nos services', columns: '4', items: [{ icon: '📒', title: 'Tenue de livres', description: 'Mensuelle ou annuelle' }, { icon: '📝', title: 'Déclarations fiscales', description: 'Particuliers et sociétés' }, { icon: '💰', title: 'Planification fiscale', description: 'Optimisez vos impôts' }, { icon: '📈', title: 'Conseil financier', description: 'Croissance et investissements' }], animation: 'slideUp' }, 2),
      sec('pricing_table', { title: 'Nos forfaits', plans: [{ name: 'Travailleur autonome', price: '89$', period: '/mois', features: 'Tenue de livres\nDéclaration TPS/TVQ\nRapport mensuel', ctaText: 'Choisir', highlighted: 'false' }, { name: 'PME', price: '199$', period: '/mois', features: 'Tout Travailleur autonome\nPaie employés\nBilan annuel\nConseils fiscaux', ctaText: 'Choisir', highlighted: 'true' }], animation: 'slideUp' }, 3),
      sec('faq_accordion', { title: 'Questions fréquentes', items: [{ question: 'Quand dois-je produire ma déclaration?', answer: 'La date limite pour les particuliers est le 30 avril. Pour les sociétés, 6 mois après la fin de l\'exercice financier.' }], animation: 'fadeIn' }, 4),
      sec('contact_form', { title: 'Contactez-nous', animation: 'fadeIn' }, 5),
    ],
  },
  {
    id: 'dentiste', name: 'Clinique dentaire', description: 'Site de clinique dentaire avec services', category: 'Santé', thumbnail: '🦷',
    sections: [
      sec('hero', { title: 'Votre sourire, notre priorité', subtitle: 'Soins dentaires personnalisés dans un environnement chaleureux', ctaText: 'Prendre rendez-vous', variant: 'split', animation: 'fadeIn' }, 1),
      sec('features', { title: 'Nos soins', columns: '3', items: [{ icon: '🪥', title: 'Soins préventifs', description: 'Nettoyage, examen, radiographies' }, { icon: '✨', title: 'Esthétique', description: 'Blanchiment, facettes, Invisalign' }, { icon: '🦷', title: 'Restauration', description: 'Couronnes, implants, prothèses' }], animation: 'slideUp' }, 2),
      sec('team', { title: 'Notre équipe', members: [{ name: 'Dre Marie Bolduc', role: 'Dentiste généraliste', imageUrl: '' }, { name: 'Dr Louis Martin', role: 'Orthodontiste', imageUrl: '' }], animation: 'fadeIn' }, 3),
      sec('testimonials', { title: 'Avis de nos patients', items: [{ quote: 'Enfin un dentiste en qui j\'ai confiance!', author: 'Sophie R.', role: 'Patiente depuis 5 ans' }], animation: 'fadeIn', backgroundColor: '#f0fdf4' }, 4),
      sec('cta', { title: 'Prenez soin de votre sourire', buttonText: 'Prendre rendez-vous', buttonUrl: '#', animation: 'fadeIn', backgroundColor: '#0891b2', textColor: '#ffffff' }, 5),
    ],
  },
  {
    id: 'photographie', name: 'Photographe', description: 'Portfolio photo plein écran', category: 'Créatif', thumbnail: '📸',
    sections: [
      sec('hero', { title: 'Capturer l\'instant', subtitle: 'Photographie professionnelle — Mariage • Portrait • Événement', ctaText: 'Voir mon portfolio', variant: 'fullscreen', animation: 'fadeIn', backgroundColor: '#000000', textColor: '#ffffff' }, 1),
      sec('gallery', { title: '', columns: '3', images: [{ url: '', alt: 'Mariage', caption: 'Mariage Sophie & Marc' }, { url: '', alt: 'Portrait', caption: 'Séance portrait corporatif' }, { url: '', alt: 'Événement', caption: 'Gala annuel' }, { url: '', alt: 'Nature', caption: 'Paysage laurentien' }, { url: '', alt: 'Studio', caption: 'Mode studio' }, { url: '', alt: 'Reportage', caption: 'Reportage communautaire' }], animation: 'fadeIn' }, 2),
      sec('pricing_table', { title: 'Forfaits', plans: [{ name: 'Portrait', price: '249$', period: '', features: '1 heure\n20 photos retouchées\nGalerie en ligne', ctaText: 'Réserver', highlighted: 'false' }, { name: 'Mariage', price: '2 499$', period: '', features: '8 heures\n500+ photos\nAlbum premium\nPré-mariage inclus', ctaText: 'Réserver', highlighted: 'true' }], animation: 'slideUp' }, 3),
      sec('contact_form', { title: 'Réservez votre séance', animation: 'fadeIn' }, 4),
    ],
  },
  {
    id: 'construction', name: 'Construction', description: 'Entreprise de construction avec projets', category: 'Construction', thumbnail: '🏗️',
    sections: [
      sec('hero', { title: 'Construisons ensemble votre vision', subtitle: 'Entrepreneur général licencié RBQ — Résidentiel et commercial', ctaText: 'Demander un devis gratuit', variant: 'left', animation: 'fadeIn', backgroundColor: '#422006', textColor: '#ffffff' }, 1),
      sec('features', { title: 'Nos services', columns: '3', items: [{ icon: '🏠', title: 'Construction neuve', description: 'Maisons, condos, bâtiments commerciaux' }, { icon: '🔨', title: 'Rénovation', description: 'Cuisine, salle de bain, sous-sol' }, { icon: '📐', title: 'Agrandissement', description: 'Extensions et ajouts d\'étage' }], animation: 'slideUp' }, 2),
      sec('gallery', { title: 'Nos réalisations', columns: '3', images: [{ url: '', alt: 'Projet 1', caption: 'Maison contemporaine — Laval' }, { url: '', alt: 'Projet 2', caption: 'Rénovation cuisine — Montréal' }, { url: '', alt: 'Projet 3', caption: 'Commercial — Longueuil' }], animation: 'fadeIn' }, 3),
      sec('stats', { items: [{ value: '200+', label: 'Projets complétés' }, { value: '25', label: 'Années d\'expérience' }, { value: 'RBQ', label: 'Licencié' }], animation: 'slideUp' }, 4),
      sec('contact_form', { title: 'Demandez votre devis gratuit', subtitle: 'Réponse sous 24 heures', animation: 'fadeIn' }, 5),
    ],
  },
  // ═══════════════════════════════════════
  // BIEN-ÊTRE & BEAUTÉ
  // ═══════════════════════════════════════
  {
    id: 'spa', name: 'Salon / Spa', description: 'Salon de coiffure ou spa de beauté', category: 'Beauté', thumbnail: '💇',
    sections: [
      sec('hero', { title: 'Votre oasis de bien-être', subtitle: 'Soins esthétiques • Coiffure • Massothérapie', ctaText: 'Réserver en ligne', variant: 'centered', animation: 'fadeIn', backgroundColor: '#fdf2f8', textColor: '#831843' }, 1),
      sec('features', { title: 'Nos soins', columns: '3', items: [{ icon: '💆', title: 'Massothérapie', description: 'Relaxation, thérapeutique, pierres chaudes' }, { icon: '💅', title: 'Esthétique', description: 'Soins du visage, manucure, pédicure' }, { icon: '💇', title: 'Coiffure', description: 'Coupe, coloration, coiffure événement' }], animation: 'slideUp' }, 2),
      sec('gallery', { title: 'Notre espace', columns: '4', images: [{ url: '', alt: 'Salon' }, { url: '', alt: 'Salle de massage' }, { url: '', alt: 'Espace détente' }, { url: '', alt: 'Esthétique' }], animation: 'fadeIn' }, 3),
      sec('cta', { title: 'Offrez-vous un moment de détente', buttonText: 'Réserver maintenant', buttonUrl: '#', animation: 'fadeIn', backgroundColor: '#be185d', textColor: '#ffffff' }, 4),
    ],
  },
  {
    id: 'consultant', name: 'Consultant', description: 'Site de consultant indépendant', category: 'Services professionnels', thumbnail: '🎯',
    sections: [
      sec('hero', { title: 'Transformez votre entreprise', subtitle: 'Consultant en stratégie numérique et transformation', ctaText: 'Planifier un appel', variant: 'centered', animation: 'fadeIn' }, 1),
      sec('features', { title: 'Mon expertise', columns: '3', items: [{ icon: '🎯', title: 'Stratégie', description: 'Plan de croissance sur mesure' }, { icon: '📱', title: 'Numérique', description: 'Transformation digitale' }, { icon: '📈', title: 'Performance', description: 'Optimisation des processus' }], animation: 'slideUp' }, 2),
      sec('stats', { items: [{ value: '150+', label: 'Mandats complétés' }, { value: '45%', label: 'Croissance moyenne' }, { value: '10+', label: 'Industries' }], animation: 'slideUp' }, 3),
      sec('testimonials', { title: 'Résultats clients', items: [{ quote: 'ROI de 300% en 6 mois grâce à la stratégie mise en place.', author: 'Marc B.', role: 'VP Marketing, GroupeXYZ' }], animation: 'fadeIn', backgroundColor: '#f8fafc' }, 4),
      sec('contact_form', { title: 'Discutons de votre projet', animation: 'fadeIn' }, 5),
    ],
  },
  {
    id: 'elearning', name: 'E-learning', description: 'Plateforme de formation en ligne', category: 'Éducation', thumbnail: '📚',
    sections: [
      sec('hero', { title: 'Apprenez de chez vous', subtitle: 'Formations professionnelles certifiantes — À votre rythme', ctaText: 'Voir les cours', ctaUrl: '/learn', variant: 'centered', animation: 'fadeIn' }, 1),
      sec('featured_products', { title: 'Formations populaires', limit: 4, animation: 'slideUp' }, 2),
      sec('features', { title: 'Pourquoi apprendre avec nous', columns: '4', items: [{ icon: '🎓', title: 'Certifiant', description: 'Certificats reconnus' }, { icon: '📱', title: 'Mobile', description: 'Apprenez partout' }, { icon: '👨‍🏫', title: 'Experts', description: 'Formateurs qualifiés' }, { icon: '💬', title: 'Communauté', description: 'Échanges entre apprenants' }], animation: 'slideUp' }, 3),
      sec('stats', { items: [{ value: '10K+', label: 'Apprenants' }, { value: '50+', label: 'Cours' }, { value: '4.9/5', label: 'Note' }], animation: 'fadeIn' }, 4),
      sec('cta', { title: 'Commencez votre formation', buttonText: 'S\'inscrire gratuitement', buttonUrl: '/auth/signup', animation: 'fadeIn', backgroundColor: '#7c3aed', textColor: '#ffffff' }, 5),
    ],
  },
  {
    id: 'association', name: 'Association / OBNL', description: 'Site d\'organisme à but non lucratif', category: 'Nonprofit', thumbnail: '🤝',
    sections: [
      sec('hero', { title: 'Ensemble pour un monde meilleur', subtitle: 'Association québécoise dédiée à l\'aide communautaire', ctaText: 'Faire un don', ctaUrl: '#don', ctaSecondaryText: 'Devenir bénévole', variant: 'centered', animation: 'fadeIn' }, 1),
      sec('stats', { items: [{ value: '5000+', label: 'Personnes aidées' }, { value: '200', label: 'Bénévoles' }, { value: '15', label: 'Programmes' }], animation: 'slideUp' }, 2),
      sec('features', { title: 'Notre mission', columns: '3', items: [{ icon: '❤️', title: 'Aide alimentaire', description: 'Soutien aux familles dans le besoin' }, { icon: '📚', title: 'Éducation', description: 'Programmes d\'alphabétisation' }, { icon: '🏠', title: 'Logement', description: 'Hébergement d\'urgence' }], animation: 'slideUp' }, 3),
      sec('cta', { title: 'Chaque geste compte', subtitle: 'Votre don fait une différence concrète', buttonText: 'Faire un don', buttonUrl: '#', animation: 'fadeIn', backgroundColor: '#dc2626', textColor: '#ffffff' }, 4),
      sec('newsletter', { title: 'Restez informé', subtitle: 'Recevez nos nouvelles et l\'impact de vos dons', buttonText: 'S\'abonner', animation: 'fadeIn' }, 5),
    ],
  },
  {
    id: 'startup', name: 'Startup Tech', description: 'Page produit pour startup technologique', category: 'Tech', thumbnail: '🚀',
    sections: [
      sec('hero', { title: 'L\'IA qui révolutionne votre workflow', subtitle: 'Automatisez 80% de vos tâches répétitives en 5 minutes', ctaText: 'Essai gratuit 14 jours', ctaUrl: '#', ctaSecondaryText: 'Voir la démo', variant: 'gradient', animation: 'fadeIn', backgroundColor: '#312e81', textColor: '#ffffff' }, 1),
      sec('logo_carousel', { title: 'Adopté par +500 entreprises', logos: [{ url: '', name: 'Startup 1' }, { url: '', name: 'Startup 2' }, { url: '', name: 'Startup 3' }, { url: '', name: 'Startup 4' }], animation: 'fadeIn' }, 2),
      sec('features', { title: 'Fonctionnalités clés', columns: '3', items: [{ icon: '🤖', title: 'IA avancée', description: 'Modèles entraînés sur vos données' }, { icon: '🔗', title: 'Intégrations', description: 'Slack, Notion, Jira, +50 outils' }, { icon: '📊', title: 'Analytics', description: 'Tableaux de bord en temps réel' }], animation: 'slideUp' }, 3),
      sec('testimonials', { title: 'Ce que disent nos utilisateurs', items: [{ quote: 'On a économisé 20 heures par semaine grâce à cette plateforme.', author: 'Alexandre P.', role: 'CTO, FintechQC' }], animation: 'fadeIn', backgroundColor: '#f8fafc' }, 4),
      sec('pricing_table', { title: 'Forfaits', plans: [{ name: 'Starter', price: '0$', period: '/mois', features: '100 automatisations\n1 utilisateur\nCommunauté', ctaText: 'Gratuit', highlighted: 'false' }, { name: 'Growth', price: '49$', period: '/mois', features: 'Illimité\n10 utilisateurs\nSupport prioritaire\nAPI', ctaText: 'Essai gratuit', highlighted: 'true' }], animation: 'slideUp' }, 5),
    ],
  },
  // ═══════════════════════════════════════
  // AUTRES INDUSTRIES
  // ═══════════════════════════════════════
  {
    id: 'saas', name: 'SaaS', description: 'Page produit logiciel SaaS', category: 'Tech', thumbnail: '💻',
    sections: [
      sec('hero', { title: 'Gérez tout depuis une seule plateforme', subtitle: 'La suite complète pour les entreprises modernes', ctaText: 'Démarrer', variant: 'centered', animation: 'fadeIn' }, 1),
      sec('features', { title: 'Tout-en-un', columns: '3', items: [{ icon: '📧', title: 'Email marketing', description: 'Campagnes automatisées' }, { icon: '📞', title: 'CRM intégré', description: 'Suivez vos prospects' }, { icon: '📊', title: 'Analytique', description: 'Données en temps réel' }], animation: 'slideUp' }, 2),
      sec('pricing_table', { title: 'Choisissez votre plan', plans: [{ name: 'Gratuit', price: '0$', period: '', features: 'Fonctionnalités de base\n1 utilisateur', ctaText: 'S\'inscrire', highlighted: 'false' }, { name: 'Pro', price: '49$', period: '/mois', features: 'Tout illimité\nSupport\nAPI', ctaText: 'Essai gratuit', highlighted: 'true' }], animation: 'slideUp' }, 3),
      sec('faq_accordion', { title: 'FAQ', items: [{ question: 'Comment migrer mes données?', answer: 'Notre équipe s\'en occupe gratuitement.' }], animation: 'fadeIn' }, 4),
      sec('cta', { title: 'Prêt?', buttonText: 'Commencer', buttonUrl: '#', animation: 'fadeIn', backgroundColor: '#2563eb', textColor: '#ffffff' }, 5),
    ],
  },
  {
    id: 'agence', name: 'Agence créative', description: 'Agence de marketing ou communication', category: 'Business', thumbnail: '🎪',
    sections: [
      sec('hero', { title: 'Créativité sans limites', subtitle: 'Agence de communication • Branding • Marketing digital', ctaText: 'Nos réalisations', variant: 'centered', animation: 'fadeIn', backgroundColor: '#0c0a09', textColor: '#ffffff' }, 1),
      sec('features', { title: 'Nos expertises', columns: '4', items: [{ icon: '🎨', title: 'Branding', description: 'Identité visuelle' }, { icon: '📱', title: 'Digital', description: 'Sites & apps' }, { icon: '📣', title: 'Marketing', description: 'Stratégie & contenu' }, { icon: '📹', title: 'Vidéo', description: 'Production & montage' }], animation: 'slideUp' }, 2),
      sec('gallery', { title: 'Portfolio', columns: '3', images: [{ url: '', alt: 'Projet 1' }, { url: '', alt: 'Projet 2' }, { url: '', alt: 'Projet 3' }], animation: 'fadeIn' }, 3),
      sec('team', { title: 'L\'équipe', members: [{ name: 'Directeur créatif', role: '', imageUrl: '' }, { name: 'Designer senior', role: '', imageUrl: '' }, { name: 'Stratège marketing', role: '', imageUrl: '' }], animation: 'slideUp' }, 4),
      sec('contact_form', { title: 'Parlons de votre projet', animation: 'fadeIn' }, 5),
    ],
  },
  {
    id: 'evenement', name: 'Événement', description: 'Page d\'événement avec inscription', category: 'Événements', thumbnail: '🎪',
    sections: [
      sec('hero', { title: 'Conférence Tech Montréal 2026', subtitle: '15-16 mai 2026 — Centre de congrès', ctaText: 'S\'inscrire', variant: 'centered', animation: 'fadeIn', backgroundColor: '#7c3aed', textColor: '#ffffff' }, 1),
      sec('countdown', { title: 'L\'événement commence dans', targetDate: '2026-05-15', animation: 'fadeIn', backgroundColor: '#1e1b4b', textColor: '#ffffff' }, 2),
      sec('features', { title: 'Au programme', columns: '3', items: [{ icon: '🎤', title: '20+ conférenciers', description: 'Experts de l\'industrie' }, { icon: '💡', title: '15 ateliers', description: 'Pratiques et interactifs' }, { icon: '🤝', title: 'Réseautage', description: '500+ participants' }], animation: 'slideUp' }, 3),
      sec('team', { title: 'Conférenciers vedettes', members: [{ name: 'Sarah Tech', role: 'CEO, AIStartup', imageUrl: '' }, { name: 'Marc Data', role: 'VP Engineering, BigCo', imageUrl: '' }], animation: 'fadeIn' }, 4),
      sec('pricing_table', { title: 'Billets', plans: [{ name: 'Régulier', price: '299$', period: '', features: '2 jours\nConférences\nLunch inclus', ctaText: 'Acheter', highlighted: 'false' }, { name: 'VIP', price: '599$', period: '', features: 'Tout Régulier\nAteliers\nCocktail VIP\nAccès exclusif', ctaText: 'Acheter', highlighted: 'true' }], animation: 'slideUp' }, 5),
      sec('map', { title: 'Lieu', embedUrl: '', height: '300', animation: 'none' }, 6),
    ],
  },
  {
    id: 'fitness', name: 'Fitness / Gym', description: 'Centre de conditionnement physique', category: 'Santé', thumbnail: '💪',
    sections: [
      sec('hero', { title: 'Dépassez vos limites', subtitle: 'Centre de conditionnement physique — Montréal', ctaText: 'Essai gratuit', variant: 'centered', animation: 'fadeIn', backgroundColor: '#0f172a', textColor: '#ffffff' }, 1),
      sec('features', { title: 'Nos programmes', columns: '3', items: [{ icon: '🏋️', title: 'Musculation', description: 'Équipement dernier cri' }, { icon: '🧘', title: 'Yoga & Pilates', description: 'Corps et esprit' }, { icon: '🥊', title: 'Boxe & CrossFit', description: 'Haute intensité' }], animation: 'slideUp' }, 2),
      sec('pricing_table', { title: 'Abonnements', plans: [{ name: 'Base', price: '29$', period: '/mois', features: 'Accès salle\nLun-Ven\n6h-22h', ctaText: 'S\'inscrire', highlighted: 'false' }, { name: 'Premium', price: '49$', period: '/mois', features: 'Accès illimité\n7j/7\nCours de groupe\nSauna', ctaText: 'Essai gratuit', highlighted: 'true' }], animation: 'slideUp' }, 3),
      sec('cta', { title: 'Votre première séance est gratuite', buttonText: 'Réserver', buttonUrl: '#', animation: 'fadeIn', backgroundColor: '#dc2626', textColor: '#ffffff' }, 4),
    ],
  },
  {
    id: 'immobilier', name: 'Immobilier', description: 'Courtier immobilier ou agence', category: 'Immobilier', thumbnail: '🏠',
    sections: [
      sec('hero', { title: 'Trouvez la maison de vos rêves', subtitle: 'Courtier immobilier agréé — Grand Montréal', ctaText: 'Voir les propriétés', variant: 'centered', animation: 'fadeIn' }, 1),
      sec('stats', { items: [{ value: '350+', label: 'Propriétés vendues' }, { value: '98%', label: 'Satisfaction' }, { value: '21', label: 'Jours délai moyen' }], animation: 'slideUp' }, 2),
      sec('features', { title: 'Mes services', columns: '3', items: [{ icon: '🏠', title: 'Vente', description: 'Stratégie de mise en marché optimale' }, { icon: '🔍', title: 'Achat', description: 'Accompagnement de A à Z' }, { icon: '📊', title: 'Évaluation', description: 'Estimation gratuite de votre propriété' }], animation: 'slideUp' }, 3),
      sec('gallery', { title: 'Propriétés en vedette', columns: '3', images: [{ url: '', alt: 'Maison 1', caption: 'Brossard — 549 000$' }, { url: '', alt: 'Condo', caption: 'Montréal — 389 000$' }, { url: '', alt: 'Maison 2', caption: 'Laval — 625 000$' }], animation: 'fadeIn' }, 4),
      sec('contact_form', { title: 'Estimation gratuite', subtitle: 'Obtenez la valeur de votre propriété en 24h', animation: 'fadeIn' }, 5),
    ],
  },
  {
    id: 'education', name: 'École / Formation', description: 'Établissement d\'enseignement', category: 'Éducation', thumbnail: '🎓',
    sections: [
      sec('hero', { title: 'Formez-vous pour l\'avenir', subtitle: 'Centre de formation professionnelle accrédité', ctaText: 'Voir les programmes', variant: 'centered', animation: 'fadeIn' }, 1),
      sec('features', { title: 'Nos programmes', columns: '3', items: [{ icon: '💻', title: 'Technologie', description: 'Développement web, IA, data' }, { icon: '📈', title: 'Gestion', description: 'Comptabilité, RH, marketing' }, { icon: '🎨', title: 'Création', description: 'Design, photo, vidéo' }], animation: 'slideUp' }, 2),
      sec('stats', { items: [{ value: '95%', label: 'Taux de placement' }, { value: '2000+', label: 'Diplômés' }, { value: '4.8/5', label: 'Satisfaction' }], animation: 'fadeIn' }, 3),
      sec('testimonials', { title: 'Nos diplômés témoignent', items: [{ quote: 'J\'ai trouvé un emploi 2 semaines après ma formation!', author: 'Karim A.', role: 'Développeur web' }], animation: 'fadeIn', backgroundColor: '#f8fafc' }, 4),
      sec('cta', { title: 'Prochaine session: Septembre 2026', buttonText: 'S\'inscrire', buttonUrl: '#', animation: 'fadeIn', backgroundColor: '#1d4ed8', textColor: '#ffffff' }, 5),
    ],
  },
  {
    id: 'service', name: 'Service local', description: 'Plombier, électricien, nettoyage, etc.', category: 'Services', thumbnail: '🔧',
    sections: [
      sec('hero', { title: 'Service rapide et fiable', subtitle: 'Plomberie résidentielle et commerciale — Montréal et environs', ctaText: 'Appeler maintenant', ctaUrl: 'tel:+14388030370', ctaSecondaryText: 'Demander un devis', variant: 'left', animation: 'fadeIn' }, 1),
      sec('features', { title: 'Nos services', columns: '3', items: [{ icon: '🚿', title: 'Plomberie', description: 'Réparation, installation, déblocage' }, { icon: '🔥', title: 'Chauffage', description: 'Installation et entretien' }, { icon: '🚰', title: 'Urgence 24/7', description: 'Intervention en 1 heure' }], animation: 'slideUp' }, 2),
      sec('stats', { items: [{ value: '1h', label: 'Délai intervention' }, { value: '5000+', label: 'Interventions' }, { value: '4.9★', label: 'Google' }], animation: 'slideUp' }, 3),
      sec('testimonials', { title: 'Avis clients', items: [{ quote: 'Rapide, professionnel et prix honnête. Je recommande!', author: 'Pierre L.', role: 'Laval' }], animation: 'fadeIn', backgroundColor: '#f8fafc' }, 4),
      sec('cta', { title: 'Urgence? Appelez-nous maintenant', buttonText: '📞 438-803-0370', buttonUrl: 'tel:+14388030370', animation: 'fadeIn', backgroundColor: '#b91c1c', textColor: '#ffffff' }, 5),
    ],
  },
  {
    id: 'nonprofit', name: 'OBNL / Charité', description: 'Organisme caritatif avec dons', category: 'Nonprofit', thumbnail: '❤️',
    sections: [
      sec('hero', { title: 'Chaque geste compte', subtitle: 'Ensemble, construisons un avenir meilleur pour nos communautés', ctaText: 'Faire un don', ctaUrl: '#don', variant: 'centered', animation: 'fadeIn', backgroundColor: '#7f1d1d', textColor: '#ffffff' }, 1),
      sec('stats', { items: [{ value: '10K+', label: 'Personnes aidées' }, { value: '500', label: 'Bénévoles' }, { value: '95¢', label: 'Sur chaque dollar' }], animation: 'slideUp' }, 2),
      sec('features', { title: 'Nos programmes', columns: '3', items: [{ icon: '🍎', title: 'Sécurité alimentaire', description: 'Paniers de provisions hebdomadaires' }, { icon: '📖', title: 'Alphabétisation', description: 'Cours gratuits pour adultes' }, { icon: '🏠', title: 'Logement', description: 'Accompagnement vers un toit' }], animation: 'slideUp' }, 3),
      sec('cta', { title: 'Votre don fait une vraie différence', subtitle: '25$ = 1 semaine de nourriture pour une famille', buttonText: 'Donner maintenant', buttonUrl: '#', animation: 'fadeIn', backgroundColor: '#dc2626', textColor: '#ffffff' }, 4),
    ],
  },
  {
    id: 'blog', name: 'Blog / Magazine', description: 'Blog ou magazine en ligne', category: 'Contenu', thumbnail: '📝',
    sections: [
      sec('hero', { title: 'Idées. Histoires. Inspiration.', subtitle: 'Le magazine en ligne qui fait réfléchir', ctaText: 'Lire le dernier article', variant: 'centered', animation: 'fadeIn' }, 1),
      sec('features', { title: 'Nos rubriques', columns: '4', items: [{ icon: '💡', title: 'Innovation', description: 'Tech et startups' }, { icon: '🌍', title: 'Société', description: 'Enjeux d\'ici et d\'ailleurs' }, { icon: '💼', title: 'Business', description: 'Entrepreneuriat' }, { icon: '🎨', title: 'Culture', description: 'Arts et créativité' }], animation: 'slideUp' }, 2),
      sec('newsletter', { title: 'Ne manquez rien', subtitle: 'Recevez nos meilleurs articles chaque semaine', buttonText: 'S\'abonner', animation: 'fadeIn', backgroundColor: '#f8fafc' }, 3),
    ],
  },
  {
    id: 'blank', name: 'Page vide', description: 'Commencez de zéro', category: 'Autre', thumbnail: '📄',
    sections: [],
  },
];

export function getTemplateById(id: string): PageTemplate | undefined {
  return PAGE_TEMPLATES.find(t => t.id === id);
}

export function getTemplatesByCategory(category: string): PageTemplate[] {
  return PAGE_TEMPLATES.filter(t => t.category === category);
}

export function getTemplateCategories(): string[] {
  return [...new Set(PAGE_TEMPLATES.map(t => t.category))];
}
