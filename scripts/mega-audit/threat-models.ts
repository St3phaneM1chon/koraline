/**
 * THREAT MODEL PREAMBLES
 * Domain-specific context injected before each function audit.
 * Research shows +40% accuracy when threat model is explicit.
 */

export interface ThreatModel {
  domain: string;
  description: string;
  attackerType: string;
  dataAtRisk: string;
  compliance: string;
  focusAreas: string[];
  negativeExamples: string[];
}

export const THREAT_MODELS: Record<string, ThreatModel> = {
  auth: {
    domain: 'Authentication & Authorization',
    description: 'Gestion des identites, sessions, tokens JWT, OAuth, MFA, permissions RBAC.',
    attackerType: 'Attaquant externe non-authentifie tentant elevation de privileges, et utilisateur authentifie tentant acces cross-tenant.',
    dataAtRisk: 'Mots de passe (bcrypt), tokens de session, cles API, tokens OAuth refresh.',
    compliance: 'OWASP A01:2025 Broken Access Control, OWASP A07:2025 Auth Failures, Loi 25 Quebec (PII).',
    focusAreas: [
      'Bypass authentication (missing auth checks, weak session validation)',
      'Privilege escalation (user accessing admin routes, cross-tenant data)',
      'Session fixation/hijacking (predictable tokens, missing rotation)',
      'Credential stuffing (missing brute-force protection, timing attacks)',
      'OAuth misconfiguration (state parameter, redirect URI validation)',
    ],
    negativeExamples: [
      'NE PAS rapporter: "missing rate limiting" si le route utilise withAdminGuard/withUserGuard (rate limit integre)',
      'NE PAS rapporter: "SQL injection" sur les queries Prisma (parameterisation automatique)',
      'NE PAS rapporter: "missing CSRF" sur les requetes GET (CSRF ne s\'applique qu\'aux mutations)',
    ],
  },

  payment: {
    domain: 'Payment & Billing',
    description: 'Integration Stripe, checkout, webhooks, remboursements, abonnements, facturation.',
    attackerType: 'Attaquant externe tentant: card testing via checkout, manipulation de prix, double-charge, contournement paiement.',
    dataAtRisk: 'Donnees de carte (jamais stockees — Stripe tokenise), montants de transaction, historique achats.',
    compliance: 'PCI-DSS (delegue a Stripe), OWASP A04:2025 Insecure Design, Loi sur la protection du consommateur QC.',
    focusAreas: [
      'Price manipulation (client-side price sent to server without validation)',
      'Double-charge (missing idempotency on payment creation)',
      'Webhook signature bypass (missing Stripe signature verification)',
      'Refund fraud (unauthorized refund triggering, missing amount validation)',
      'Race condition on inventory/enrollment (concurrent purchases)',
    ],
    negativeExamples: [
      'NE PAS rapporter: "credit card data exposure" si seul le Stripe paymentIntentId est stocke',
      'NE PAS rapporter: "missing encryption" sur les montants (montants ne sont pas des donnees sensibles)',
      'NE PAS rapporter: "webhook not authenticated" si le handler verifie stripe.webhooks.constructEvent()',
    ],
  },

  accounting: {
    domain: 'Accounting & Journal',
    description: 'Journal comptable, grand livre, rapports financiers, taxes TPS/TVQ, rapprochement bancaire.',
    attackerType: 'Employe malveillant tentant manipulation des ecritures, erreur comptable causant desequilibre.',
    dataAtRisk: 'Ecritures comptables, soldes de comptes, rapports fiscaux, donnees bancaires.',
    compliance: 'PCGR/IFRS, Lois fiscales QC/Canada, audit trail obligatoire, principe de double entree.',
    focusAreas: [
      'Double-entry violation (debit != credit in journal entry)',
      'Unbalanced transactions ($transaction missing, partial commits)',
      'Audit trail gaps (modifications without logging)',
      'Tax calculation errors (TPS/TVQ rates, rounding)',
      'Reconciliation integrity (bank sync data mismatch)',
    ],
    negativeExamples: [
      'NE PAS rapporter: "missing encryption" sur les montants comptables (pas des donnees sensibles)',
      'NE PAS rapporter: "XSS" sur les pages admin de comptabilite (protegees par withAdminGuard)',
    ],
  },

  ecommerce: {
    domain: 'E-commerce (Products, Cart, Orders)',
    description: 'Catalogue produits, panier, commandes, variantes, prix, inventaire, livraison.',
    attackerType: 'Acheteur malveillant tentant: manipulation de prix, exploitation promotions, commande sans paiement.',
    dataAtRisk: 'Adresses de livraison, historique commandes, preferences client.',
    compliance: 'Loi sur la protection du consommateur QC, CASL (marketing), normes e-commerce.',
    focusAreas: [
      'Price manipulation (cart price != database price at checkout)',
      'Inventory race condition (overselling on concurrent orders)',
      'Coupon/discount abuse (stacking, expired codes)',
      'Order state machine violations (invalid status transitions)',
      'N+1 queries on product listing pages',
    ],
    negativeExamples: [
      'NE PAS rapporter: "missing auth" sur les pages catalogue public (intentionnellement public)',
      'NE PAS rapporter: "PII exposure" pour les adresses dans les commandes admin (admin a besoin de ces donnees)',
    ],
  },

  crm: {
    domain: 'CRM (Leads, Deals, Pipelines)',
    description: 'Gestion des leads, deals, pipelines de vente, contacts, tickets, workflows automatises.',
    attackerType: 'Utilisateur CRM tentant acces aux leads d\'un autre vendeur, cross-tenant data leak.',
    dataAtRisk: 'Noms, emails, telephones des contacts, historique interactions, valeur des deals.',
    compliance: 'RGPD/Loi 25 (PII contacts), CASL (consentement marketing), PIPEDA.',
    focusAreas: [
      'Cross-tenant isolation (user sees leads from another tenant)',
      'PII exposure in API responses (emails, phones in list endpoints)',
      'Lead assignment race conditions (concurrent assignments)',
      'Workflow automation loops (infinite trigger chains)',
      'Bulk operations without transaction (CSV import partial failure)',
    ],
    negativeExamples: [
      'NE PAS rapporter: "missing pagination" si take/limit est deja present',
      'NE PAS rapporter: "unauthorized access" si withAdminGuard verifie le role',
    ],
  },

  voip: {
    domain: 'VoIP & Telephony',
    description: 'Appels VoIP via Telnyx, IVR, enregistrements, transcriptions, SIP, WebRTC.',
    attackerType: 'Attaquant tentant: toll fraud (appels internationaux non-autorises), ecoute non-autorisee, spoofing CallerID.',
    dataAtRisk: 'Enregistrements audio d\'appels, transcriptions, numeros de telephone, metadata appels.',
    compliance: 'Loi sur l\'ecoute privee QC, CRTC reglementations, consentement enregistrement.',
    focusAreas: [
      'Toll fraud (missing call destination whitelist/limit)',
      'Recording access control (unauthorized download of call recordings)',
      'Telnyx webhook signature validation',
      'Call direction normalization (inbound vs incoming mismatch)',
      'WebRTC credential exposure',
    ],
    negativeExamples: [
      'NE PAS rapporter: "sensitive data in logs" pour les metadata d\'appels (necessaire au debugging)',
    ],
  },

  lms: {
    domain: 'LMS (Formation / Aptitudes)',
    description: 'Cours, lecons, quiz, examens, certificats, progression, gamification, AI Tutor, conformite UFC.',
    attackerType: 'Etudiant tentant: triche aux examens, bypass progression sequentielle, usurpation certificat.',
    dataAtRisk: 'Resultats d\'examens, certificats professionnels, credits UFC (reglementaire AMF).',
    compliance: 'AMF/CSF (credits UFC obligatoires), PQAP, Open Badges 3.0, RGPD (profil etudiant).',
    focusAreas: [
      'Quiz timer bypass (server-side enforcement)',
      'Sequential gate bypass (client-side only checks)',
      'Certificate forgery (verification code predictability)',
      'Cross-tenant enrollment (accessing other tenant courses)',
      'UFC credit manipulation (false completion → real credits)',
    ],
    negativeExamples: [
      'NE PAS rapporter: "quiz answers exposed" si showResults=true (intentionnel)',
      'NE PAS rapporter: "missing auth" sur /certificates/verify/[code] (endpoint PUBLIC par design)',
    ],
  },

  loyalty: {
    domain: 'Loyalty & Rewards',
    description: 'Programme de fidelite, points, niveaux, cadeaux, cartes-cadeaux, promotions.',
    attackerType: 'Client tentant: accumulation frauduleuse de points, duplication carte-cadeau, exploitation promotions.',
    dataAtRisk: 'Solde de points, historique transactions, codes de cartes-cadeaux.',
    compliance: 'Loi sur la protection du consommateur QC, normes PCI pour cartes-cadeaux.',
    focusAreas: [
      'Points duplication (race condition on concurrent point awards)',
      'Gift card code enumeration (predictable codes)',
      'Negative balance exploitation (spending more points than available)',
      'Promotion stacking abuse',
      'Cross-tenant point transfer',
    ],
    negativeExamples: [
      'NE PAS rapporter: "hardcoded values" pour les taux de conversion points (configures en DB)',
    ],
  },

  media: {
    domain: 'Media & Content Management',
    description: 'Upload fichiers, images, videos, transcoding, CDN, galerie media.',
    attackerType: 'Utilisateur tentant: upload malveillant (web shell, virus), SSRF via URL distante, DoS via fichier enorme.',
    dataAtRisk: 'Fichiers uploades, metadata EXIF (localisation GPS), URLs signees.',
    compliance: 'Limites de taille fichier, types MIME whiteliste, nettoyage metadata.',
    focusAreas: [
      'Unrestricted file upload (missing type validation, size limit)',
      'Path traversal in file download (../../etc/passwd)',
      'SSRF via remote URL fetch (internal network scanning)',
      'Missing access control on media files (public CDN URLs)',
      'EXIF metadata not stripped (GPS location leak)',
    ],
    negativeExamples: [
      'NE PAS rapporter: "public URLs" pour les images produit (intentionnellement publiques via CDN)',
    ],
  },

  communications: {
    domain: 'Emails, Chat & Notifications',
    description: 'Envoi emails transactionnels/marketing, chat en temps reel, notifications push, SMS.',
    attackerType: 'Spammeur tentant: abus envoi emails, injection HTML dans templates, phishing via redirect.',
    dataAtRisk: 'Adresses email, contenu messages, tokens de desinscription, historique chat.',
    compliance: 'LCAP/CASL (consentement email obligatoire), CAN-SPAM, RGPD droit a l\'oubli.',
    focusAreas: [
      'Email injection (header injection via user input in subject/from)',
      'Template injection (user content rendered in email HTML)',
      'Unsubscribe token prediction (missing HMAC)',
      'Chat message XSS (stored XSS via message content)',
      'Rate limiting on email sending (prevent abuse)',
    ],
    negativeExamples: [
      'NE PAS rapporter: "email sent without consent" pour les emails transactionnels (pas soumis a LCAP)',
    ],
  },
};

/**
 * Generate a threat model preamble for injection into the audit prompt.
 */
export function generateThreatPreamble(domainKey: string): string {
  const model = THREAT_MODELS[domainKey];
  if (!model) return '';

  return `
## THREAT MODEL — ${model.domain}

**Description:** ${model.description}
**Attaquant:** ${model.attackerType}
**Donnees a risque:** ${model.dataAtRisk}
**Conformite:** ${model.compliance}

### Focus prioritaire:
${model.focusAreas.map((f, i) => `${i + 1}. ${f}`).join('\n')}

### NE PAS rapporter (faux positifs connus):
${model.negativeExamples.map(n => `- ${n}`).join('\n')}
`.trim();
}
