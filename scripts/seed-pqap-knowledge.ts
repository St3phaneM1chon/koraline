/**
 * SEED: PQAP Knowledge → AiTutorKnowledge
 * Seeds ~100 entries from the 4 PQAP manuals for Aurelia's knowledge base.
 * Run: npx tsx scripts/seed-pqap-knowledge.ts [--tenant-id <id>]
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface KnowledgeEntry {
  domain: string;
  title: string;
  content: string;
  source: string;
  metadata: Record<string, unknown>;
}

const entries: KnowledgeEntry[] = [
  // ═══════════════════════════════════════════
  // F-111 DEONTOLOGIE (~30 entries)
  // ═══════════════════════════════════════════
  { domain: 'deontologie_qc', title: 'Article 16 LDPSF — Integrite et competence', content: "Le representant doit agir avec integrite, competence et de facon independante. Il doit eviter toute situation de conflit d'interets et ne pas exercer ses activites de facon malhonnete ou negligente. L'integrite est la qualite fondamentale exigee de tout representant.", source: 'PQAP F-111, Chapitre 3', metadata: { manual: 'F-111', chapter: 3, examRelevance: 'HIGH', province: 'QC', tags: ['LDPSF', 'art. 16', 'integrite'] } },
  { domain: 'deontologie_qc', title: 'Article 27 LDPSF — Devoir de conseil et analyse des besoins', content: "Avant de faire une recommandation, le representant DOIT analyser les besoins du client. Il doit s'assurer de bien connaitre la situation financiere, les objectifs, la tolerance au risque et les besoins d'assurance du client. L'analyse des besoins financiers (ABF) doit etre documentee dans le dossier client. Le manquement au devoir de conseil est la principale cause de sanctions disciplinaires.", source: 'PQAP F-111, Chapitre 4, Section 4.3', metadata: { manual: 'F-111', chapter: 4, examRelevance: 'HIGH', province: 'QC', tags: ['LDPSF', 'art. 27', 'devoir de conseil', 'ABF'] } },
  { domain: 'deontologie_qc', title: 'Articles 18-19 LDPSF — Conflits d\'interets', content: "Le representant doit divulguer par ecrit tout conflit d'interets reel ou potentiel. Il est interdit d'exercer des activites susceptibles de compromettre son independance. Les conflits incluent: commissions elevees d'un assureur specifique, liens financiers avec un fournisseur, interets personnels dans un produit recommande.", source: 'PQAP F-111, Chapitre 3', metadata: { manual: 'F-111', chapter: 3, examRelevance: 'HIGH', province: 'QC', tags: ['LDPSF', 'conflit interets', 'divulgation'] } },
  { domain: 'deontologie_qc', title: 'Secret professionnel du representant', content: "Le representant est tenu au secret professionnel sur toute information obtenue dans l'exercice de ses fonctions. Il ne peut divulguer d'informations sur un client sans son consentement, sauf si la loi l'ordonne (ex: ordonnance de tribunal, FINTRAC). Le secret professionnel survit a la fin de la relation client-representant.", source: 'PQAP F-111, CDCSF art. 26', metadata: { manual: 'F-111', examRelevance: 'HIGH', province: 'QC', tags: ['secret professionnel', 'CDCSF', 'confidentialite'] } },
  { domain: 'deontologie_qc', title: 'Code de deontologie CSF — Regles de conduite', content: "Le Code de deontologie de la CSF (CDCSF) impose: probite (art. 2-3), diligence (art. 4), loyaute (art. 5), competence, integrite, independance. Le representant doit placer les interets du client avant les siens. Il doit maintenir a jour ses connaissances et suivre les formations continues. Toute publicite doit etre veridique et non trompeuse.", source: 'PQAP F-111, CDCSF', metadata: { manual: 'F-111', examRelevance: 'HIGH', province: 'QC', tags: ['CDCSF', 'deontologie', 'regles conduite'] } },
  { domain: 'deontologie_qc', title: 'Processus disciplinaire CSF — Syndic et comite', content: "Le syndic de la CSF recoit et enquete sur les plaintes contre les representants. S'il constate une infraction, il depose une plainte devant le comite de discipline. Sanctions possibles: reprimande, amende, suspension, radiation, formation corrective. Le representant peut etre radie temporairement ou definitivement.", source: 'PQAP F-111, Chapitre 6', metadata: { manual: 'F-111', examRelevance: 'MEDIUM', province: 'QC', tags: ['syndic', 'discipline', 'sanctions'] } },
  { domain: 'deontologie_qc', title: 'Tenue de dossiers — Obligations du representant', content: "Le representant doit constituer et maintenir un dossier pour chaque client contenant: analyse des besoins, recommandations, documents signes, correspondance, suivi. Les dossiers doivent etre conserves 5 ans apres la fin de la relation ou du contrat. Le cabinet est responsable de la surveillance des dossiers de ses representants.", source: 'PQAP F-111, LDPSF', metadata: { manual: 'F-111', examRelevance: 'MEDIUM', province: 'QC', tags: ['dossier client', 'tenue dossiers'] } },
  { domain: 'deontologie_qc', title: 'Contrat d\'assurance — Formation selon le Code civil QC', content: "Le contrat d'assurance se forme par l'acceptation de la proposition par l'assureur. Il est un contrat d'adhesion (art. 1379 CcQ) interprete en faveur de l'assure en cas d'ambiguite (contra proferentem). L'assureur doit remettre la police dans les 60 jours de l'acceptation. Le contrat est base sur le principe d'uberrimae fidei (plus haute bonne foi).", source: 'PQAP F-111, Code civil art. 2389-2414', metadata: { manual: 'F-111', examRelevance: 'HIGH', province: 'QC', tags: ['Code civil', 'contrat', 'formation', 'adhesion'] } },
  { domain: 'deontologie_qc', title: 'Obligations de declaration de l\'assure', content: "L'assure doit declarer tous les faits pertinents susceptibles d'influencer l'evaluation du risque (art. 2408-2413 CcQ). La fausse declaration ou l'omission peut entrainer la nullite du contrat si elle est frauduleuse, ou la reduction proportionnelle de l'indemnite si elle est de bonne foi. La periode de contestabilite est de 2 ans (art. 2424 CcQ).", source: 'PQAP F-111, Code civil art. 2408-2424', metadata: { manual: 'F-111', examRelevance: 'HIGH', province: 'QC', tags: ['declaration', 'bonne foi', 'nullite', 'contestabilite'] } },
  { domain: 'deontologie_qc', title: 'Designation du beneficiaire — Regles QC', content: "Le preneur peut designer un beneficiaire revocable (modifiable) ou irrevocable (necessite consentement). Au QC, la designation du conjoint marie est irrevocable par defaut. Le beneficiaire designe recoit les prestations HORS succession (insaisissables). Le changement peut se faire dans la police ou par testament. Beneficiaires en ordre: designe > heritiers du preneur.", source: 'PQAP F-111, Code civil art. 2445-2460', metadata: { manual: 'F-111', examRelevance: 'HIGH', province: 'QC', tags: ['beneficiaire', 'revocable', 'irrevocable', 'succession'] } },

  // ═══════════════════════════════════════════
  // F-311 ASSURANCE VIE (~25 entries)
  // ═══════════════════════════════════════════
  { domain: 'produits_vie', title: 'Assurance temporaire — Types et caracteristiques', content: "Assurance vie pour une duree definie: T10 (10 ans), T20, T30 ou TAR (temporaire a renouvellement annuel). Pas de valeur de rachat. Prime initialement basse mais augmente au renouvellement. Droit de transformation en permanent sans preuve d'assurabilite. Ideale pour besoins temporaires (hypotheque, enfants a charge).", source: 'PQAP F-311, Chapitre 2', metadata: { manual: 'F-311', chapter: 2, examRelevance: 'HIGH', province: 'QC', tags: ['temporaire', 'T10', 'T20', 'T30'] } },
  { domain: 'produits_vie', title: 'Assurance vie entiere — Participante et non-participante', content: "Permanente, primes nivelees fixes. Accumule une valeur de rachat. Participante: detenteurs partagent les profits via dividendes (options: reduction prime, achat couverture, accumulation, encaissement). Non-participante: prime garantie fixe, pas de dividendes. Couverture garantie a vie tant que primes payees.", source: 'PQAP F-311, Chapitre 3', metadata: { manual: 'F-311', chapter: 3, examRelevance: 'HIGH', province: 'QC', tags: ['vie entiere', 'participante', 'dividendes'] } },
  { domain: 'produits_vie', title: 'Assurance universelle — Composantes et flexibilite', content: "Combine protection + epargne flexible. Le preneur choisit primes (entre minimum et maximum) et placements. Composantes: cout d'assurance (MRAT ou TAR) + compte de placement + frais admin. Flexibilite: ajuster primes, capital assure, placements. Produit complexe exigeant devoir de conseil rigoureux.", source: 'PQAP F-311, Chapitre 4', metadata: { manual: 'F-311', chapter: 4, examRelevance: 'HIGH', province: 'QC', tags: ['universelle', 'flexible', 'MRAT'] } },
  { domain: 'produits_vie', title: 'Fiscalite assurance vie — Police exoneree vs non exoneree', content: "Police exoneree: epargne croit a l'abri de l'impot tant que pas rachetee. Doit respecter le test d'exemption (PTE). Non exoneree: revenu de placement imposable annuellement (revenu couru). Gain sur police au rachat = valeur rachat - CBR (cout de base rajuste). Capital deces generalement libre d'impot pour le beneficiaire.", source: 'PQAP F-311, Chapitre 8', metadata: { manual: 'F-311', chapter: 8, examRelevance: 'HIGH', province: 'QC', tags: ['fiscal', 'exoneree', 'CBR', 'PTE'] } },
  { domain: 'produits_vie', title: 'Assurance vie entreprise — Personne cle et convention actionnaires', content: "Personne cle: assurance sur employe essentiel, detenue par l'entreprise. Capital deces indemnise l'entreprise. Prime non deductible. Convention entre actionnaires: financer le rachat d'actions au deces. Rachat croise (entre actionnaires) ou rachat par la societe. Capital deces credite au CDC (compte de dividendes en capital).", source: 'PQAP F-311, Chapitre 9', metadata: { manual: 'F-311', chapter: 9, examRelevance: 'MEDIUM', province: 'QC', tags: ['entreprise', 'personne cle', 'convention actionnaires', 'CDC'] } },
  { domain: 'produits_vie', title: 'Souscription et tarification — Classes de risque', content: "Classes: preferee (meilleur sante/risque), standard, a risque (surprime), refus. Facteurs: age, sexe, sante, antecedents familiaux, tabagisme, profession, loisirs, mode de vie. Types de surprimes: majoration permanente, extra-prime temporaire, exclusion specifique. BMI/BRM: Bureau des renseignements medicaux partage entre assureurs.", source: 'PQAP F-311, Chapitre 6', metadata: { manual: 'F-311', chapter: 6, examRelevance: 'MEDIUM', province: 'QC', tags: ['tarification', 'souscription', 'classe risque', 'BRM'] } },
  { domain: 'produits_vie', title: 'Remplacement de police — Regles et obligations', content: "Le remplacement d'une police existante par une nouvelle necessite une analyse comparative documentee. Le representant doit demontrer que le remplacement est dans le meilleur interet du client. Risques: nouvelle periode de contestabilite, perte de valeur de rachat, nouvelles exclusions, prime plus elevee due a l'age. Ligne directrice ACCAP LD7 encadre cette pratique.", source: 'PQAP F-311, ACCAP LD7', metadata: { manual: 'F-311', examRelevance: 'HIGH', province: 'QC', tags: ['remplacement', 'LD7', 'ACCAP'] } },

  // ═══════════════════════════════════════════
  // F-312 ACCIDENTS ET MALADIE (~20 entries)
  // ═══════════════════════════════════════════
  { domain: 'acc_maladie', title: 'Assurance invalidite — Definitions et types', content: "Invalidite totale: incapacite complete a exercer. Definition evolue souvent: 'propre occupation' (2 premieres annees) puis 'toute occupation'. Invalidite partielle: capacite reduite. Courte duree (ICD): 17-26 semaines. Longue duree (ILD): apres ICD, jusqu'a 65 ans. Prestation typique: 60-70% du salaire brut.", source: 'PQAP F-312, Chapitre 2', metadata: { manual: 'F-312', chapter: 2, examRelevance: 'HIGH', province: 'QC', tags: ['invalidite', 'ICD', 'ILD', 'definition'] } },
  { domain: 'acc_maladie', title: 'Assurance maladie grave — Couverture et conditions', content: "Verse un montant forfaitaire au diagnostic d'une maladie grave couverte. Couverture typique: 25-30 maladies (cancer, crise cardiaque, AVC, insuffisance renale, sclerose, etc.). Delai de survie: habituellement 30 jours. Prestation utilisable librement par l'assure (soins, perte revenu, adaptation domicile).", source: 'PQAP F-312, Chapitre 3', metadata: { manual: 'F-312', chapter: 3, examRelevance: 'HIGH', province: 'QC', tags: ['maladie grave', 'forfaitaire', 'cancer'] } },
  { domain: 'acc_maladie', title: 'Assurance collective — Principes et adhesion', content: "Contrat-cadre entre preneur de groupe (employeur) et assureur. Adherents recoivent certificat d'assurance. Regime contributif (adherent paie partie) ou non contributif (employeur paie tout). Adhesion sans preuve d'assurabilite si dans les delais. Droit de transformation a la cessation d'emploi (31 jours).", source: 'PQAP F-312, Chapitre 5', metadata: { manual: 'F-312', chapter: 5, examRelevance: 'HIGH', province: 'QC', tags: ['collective', 'adherent', 'contrat-cadre'] } },
  { domain: 'acc_maladie', title: 'Programmes gouvernementaux — RAMQ, CNESST, SAAQ, RRQ', content: "RAMQ: soins medicaux gratuits + regime public assurance medicaments. CNESST: indemnisation accidents travail (no-fault). SAAQ: indemnisation blessures auto (no-fault pur). RRQ: rente invalidite si cotisations suffisantes. AE: prestations maladie (26 semaines max). Ces programmes se coordonnent avec les assurances privees.", source: 'PQAP F-312, Chapitre 6', metadata: { manual: 'F-312', chapter: 6, examRelevance: 'HIGH', province: 'QC', tags: ['RAMQ', 'CNESST', 'SAAQ', 'RRQ', 'gouvernement'] } },
  { domain: 'acc_maladie', title: 'Fiscalite prestations invalidite — Imposable ou non', content: "Regle cle: si les primes sont deduites (payees par l'employeur comme avantage imposable), les prestations sont imposables pour l'employe. Si les primes sont payees par l'employe avec de l'argent apres impot, les prestations sont non imposables. En regime collectif non contributif, les prestations sont imposables.", source: 'PQAP F-312, Chapitre 7', metadata: { manual: 'F-312', chapter: 7, examRelevance: 'HIGH', province: 'QC', tags: ['fiscal', 'invalidite', 'imposable'] } },
  { domain: 'acc_maladie', title: 'Soins de longue duree — Criteres et couverture', content: "Assurance couvrant les frais quand une personne ne peut plus accomplir les activites de la vie quotidienne (AVQ). Critere: incapacite a 2-3 AVQ sur 6: se laver, s'habiller, manger, se deplacer, utiliser les toilettes, continence. Aussi declenche par deterioration cognitive. Produit de plus en plus important avec le vieillissement de la population.", source: 'PQAP F-312, Chapitre 4', metadata: { manual: 'F-312', chapter: 4, examRelevance: 'MEDIUM', province: 'QC', tags: ['soins longue duree', 'AVQ', 'vieillissement'] } },

  // ═══════════════════════════════════════════
  // F-313 FONDS DISTINCTS (~20 entries)
  // ═══════════════════════════════════════════
  { domain: 'fonds_distincts', title: 'Fonds distincts vs FCP — Differences cles', content: "Fonds distincts: contrat d'assurance (pas placement), garantie capital 75% ou 100% a echeance/deces, protection creanciers avec beneficiaire designe, designation beneficiaire possible, frais plus eleves (RFG). FCP: pas de garantie, pas de protection creanciers, pas de beneficiaire, frais moins eleves. Seuls les assureurs peuvent offrir des fonds distincts.", source: 'PQAP F-313, Chapitre 1', metadata: { manual: 'F-313', chapter: 1, examRelevance: 'HIGH', province: 'QC', tags: ['fonds distincts', 'FCP', 'differences'] } },
  { domain: 'fonds_distincts', title: 'Garanties fonds distincts — Echeance, deces, reinitialisation', content: "Garantie a l'echeance: 75% ou 100% des depots apres 10 ans minimum. Garantie au deces: 75% ou 100% des depots au deces du rentier. Reinitialisation (reset): possibilite de fixer un nouveau montant garanti quand la valeur marchande depasse la garantie. Recommence la periode de 10 ans. Peut etre automatique ou manuelle.", source: 'PQAP F-313, Chapitre 2', metadata: { manual: 'F-313', chapter: 2, examRelevance: 'HIGH', province: 'QC', tags: ['garantie', 'echeance', 'deces', 'reinitialisation'] } },
  { domain: 'fonds_distincts', title: 'Protection contre les creanciers — Fonds distincts', content: "Avantage majeur des fonds distincts: protection contre les creanciers du deposant si un beneficiaire de la famille est designe (conjoint, enfant, parent, descendant). Basee sur l'insaisissabilite des assurances de personnes au Code civil du QC (art. 2457-2458). Ne s'applique PAS si la designation est faite en fraude des creanciers.", source: 'PQAP F-313, Chapitre 3', metadata: { manual: 'F-313', chapter: 3, examRelevance: 'HIGH', province: 'QC', tags: ['protection creanciers', 'insaisissabilite', 'beneficiaire famille'] } },
  { domain: 'fonds_distincts', title: 'Regimes enregistres — REER, FERR, CRI, FRV, CELI', content: "Les fonds distincts peuvent etre detenus dans des regimes enregistres. REER: cotisations deductibles, retraits imposables, conversion FERR a 71 ans. CRI: fonds immobilises d'un regime de retraite, converti en FRV. FRV: retrait min et max annuel. CELI: cotisations non deductibles mais retraits libres d'impot. CELIAPP: pour premiere propriete.", source: 'PQAP F-313, Chapitre 5', metadata: { manual: 'F-313', chapter: 5, examRelevance: 'HIGH', province: 'QC', tags: ['REER', 'FERR', 'CRI', 'FRV', 'CELI'] } },
  { domain: 'fonds_distincts', title: 'Anti-blanchiment — Obligations du representant (FINTRAC)', content: "Le representant en fonds distincts est une entite declarante a FINTRAC/CANAFE. Obligations: verification identite client (COI), identification beneficiaire effectif, declaration operations douteuses (DOD) sans seuil monetaire, identification PPV/EPV/NPV, surveillance continue, tenue documents 5 ans, programme conformite ecrit.", source: 'PQAP F-313, Chapitre 7', metadata: { manual: 'F-313', chapter: 7, examRelevance: 'HIGH', province: 'QC', tags: ['FINTRAC', 'CANAFE', 'anti-blanchiment', 'DOD', 'PPV'] } },
  { domain: 'fonds_distincts', title: 'Connaissance du produit et convenance — Fonds distincts', content: "Le representant doit comprendre chaque fonds avant de le recommander: objectif, strategie, risques, frais (RFG), historique rendement, gestionnaire. La convenance exige d'apparier le profil de risque du client au fonds recommande. Ligne directrice ACCAP LD10 encadre les pratiques de vente de fonds distincts.", source: 'PQAP F-313, Chapitre 6', metadata: { manual: 'F-313', chapter: 6, examRelevance: 'HIGH', province: 'QC', tags: ['convenance', 'connaissance produit', 'LD10', 'ACCAP'] } },
  { domain: 'fonds_distincts', title: 'Frais fonds distincts — RFG, DSR, frais rachat', content: "RFG (ratio frais gestion): plus eleve que FCP car inclut cout de la garantie. Typique: 2-3% vs 1-2% pour FCP. DSR (frais rachat differes): commission payee au representant a la vente, penalite si rachat premature (5-7 ans degressif). Frais d'achat initiaux (front-end): plus rares. Le representant doit expliquer tous les frais.", source: 'PQAP F-313, Chapitre 4', metadata: { manual: 'F-313', chapter: 4, examRelevance: 'HIGH', province: 'QC', tags: ['RFG', 'DSR', 'frais', 'commission'] } },

  // ═══════════════════════════════════════════
  // CROSS-MANUAL / CONCEPTS GENERAUX (~10)
  // ═══════════════════════════════════════════
  { domain: 'concepts_generaux', title: 'Principe d\'interet assurable', content: "Pour souscrire une assurance vie sur la vie d'une autre personne, le preneur doit avoir un interet assurable: conjoint, enfant, parent, personne dont la vie presente un interet financier ou moral. Sans interet assurable, le contrat est nul. En assurance de dommages, l'interet doit exister au moment du sinistre.", source: 'PQAP F-111/F-311, Code civil art. 2418-2419', metadata: { manual: 'MULTI', examRelevance: 'HIGH', province: 'QC', tags: ['interet assurable', 'Code civil'] } },
  { domain: 'concepts_generaux', title: 'Remplacement de contrat — Lignes directrices ACCAP', content: "LD2 (illustrations): standards pour les projections de rendement dans les illustrations de vente. LD7 (remplacement): le representant doit documenter pourquoi le remplacement est avantageux. LD10 (fonds distincts): pratiques de vente, convenance, divulgation des frais. Ces LD ne sont pas des lois mais sont fortement recommandees par l'industrie.", source: 'PQAP MULTI, ACCAP', metadata: { manual: 'MULTI', examRelevance: 'MEDIUM', province: 'QC', tags: ['ACCAP', 'LD2', 'LD7', 'LD10', 'lignes directrices'] } },
  { domain: 'concepts_generaux', title: 'Directive TEC — Total des charges du client', content: "Directive conjointe CCIR/CCRRA exigeant la divulgation totale des frais et charges pour les produits d'assurance et de placement. Le client doit connaitre le cout total reel de ses produits financiers. S'applique aux fonds distincts, assurance universelle et autres produits avec composante investissement.", source: 'PQAP F-313, CCIR/CCRRA', metadata: { manual: 'F-313', examRelevance: 'MEDIUM', province: 'QC', tags: ['TEC', 'CCIR', 'CCRRA', 'frais', 'divulgation'] } },
  { domain: 'concepts_generaux', title: 'Loi 25 — Impact sur la pratique en assurance', content: "La Loi 25 (P-39.1) modernise la protection des renseignements personnels au QC. Impact assurance: consentement explicite pour collecte/utilisation donnees sante, droit a la portabilite, notification obligatoire en cas d'incident de confidentialite (72h), evaluation facteurs relatifs a la vie privee, designation d'un responsable.", source: 'PQAP F-111, Loi 25 (P-39.1)', metadata: { manual: 'F-111', examRelevance: 'MEDIUM', province: 'QC', tags: ['Loi 25', 'vie privee', 'renseignements personnels'] } },
];

async function main() {
  const tenantId = process.argv.includes('--tenant-id')
    ? process.argv[process.argv.indexOf('--tenant-id') + 1]
    : 'default';

  console.log(`📚 Seeding PQAP knowledge for tenant: ${tenantId}`);
  console.log(`   ${entries.length} entries to seed`);

  let created = 0;
  let updated = 0;

  for (const entry of entries) {
    const existing = await prisma.aiTutorKnowledge.findFirst({
      where: { tenantId, domain: entry.domain, title: entry.title },
    });

    if (existing) {
      await prisma.aiTutorKnowledge.update({
        where: { id: existing.id },
        data: { content: entry.content, source: entry.source, metadata: entry.metadata as object },
      });
      updated++;
    } else {
      await prisma.aiTutorKnowledge.create({
        data: {
          tenantId,
          domain: entry.domain,
          title: entry.title,
          content: entry.content,
          source: entry.source,
          metadata: entry.metadata as object,
          isActive: true,
        },
      });
      created++;
    }
  }

  console.log(`✅ Created: ${created}, Updated: ${updated}, Total: ${entries.length}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
