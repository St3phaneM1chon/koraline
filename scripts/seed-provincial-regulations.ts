/**
 * SEED: Provincial Regulations → AiTutorKnowledge
 * Seeds ~130 entries covering pan-Canadian insurance regulation.
 * Run: npx tsx scripts/seed-provincial-regulations.ts [--tenant-id <id>]
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
  // QUEBEC (13 entries)
  // ═══════════════════════════════════════════
  { domain: 'regulation_qc', title: 'Regulateur assurance — Quebec (AMF)', content: "L'Autorite des marches financiers (AMF) est l'organisme de reglementation du secteur financier au Quebec. Elle supervise les assureurs, courtiers, agents et intermediaires. Delivre les permis d'exercice, surveille la conformite, recoit les plaintes et impose des sanctions. La Chambre de la securite financiere (CSF) encadre les representants en assurance de personnes. La Chambre de l'assurance de dommages (CHAD) encadre les representants en assurance de dommages.", source: 'AMF, CSF, CHAD', metadata: { province: 'QC', tags: ['AMF', 'CSF', 'CHAD', 'regulateur'] } },
  { domain: 'regulation_qc', title: 'Legislation principale — Quebec', content: "Lois cles: LDPSF (Loi sur la distribution de produits et services financiers, D-9.2), Code civil du Quebec (Livre 5, Titre 3 Assurances, art. 2389-2628), Loi sur les assureurs du Quebec, Code de deontologie de la CSF (CDCSF), Loi sur l'AMF. Le Quebec est la SEULE province avec le Code civil (pas common law). Les contrats d'assurance sont regis par le Code civil.", source: 'LegisQuebec', metadata: { province: 'QC', tags: ['LDPSF', 'Code civil', 'legislation'] } },
  { domain: 'regulation_qc', title: 'Pre-licensing — Quebec (PQAP)', content: "Le Programme de qualification en assurance de personnes (PQAP) comprend 4 examens AMF: F-111 Deontologie (prealable), F-311 Assurance vie, F-312 Accidents et maladie, F-313 Fonds distincts. Chaque examen est de 2h, choix multiples, note de passage 60%. Les 4 examens doivent etre reussis pour obtenir le certificat de representant.", source: 'AMF', metadata: { province: 'QC', tags: ['PQAP', 'examen', 'AMF', 'certification'], examRelevance: 'HIGH' } },
  { domain: 'regulation_qc', title: 'Formation continue — Quebec (UFC)', content: "30 UFC (unites de formation continue) par cycle de 2 ans. Minimum en conformite et deontologie. Formation obligatoire pour maintenir le droit d'exercice. Repertoire des formations continues disponible sur le site de l'AMF. Formation gratuite 1 UFC sur maltraitance financiere.", source: 'AMF', metadata: { province: 'QC', tags: ['UFC', 'formation continue', 'CE'] } },
  { domain: 'regulation_qc', title: 'Auto-assurance — Quebec (SAAQ)', content: "Regime HYBRIDE unique au Canada. La SAAQ (Societe de l'assurance automobile du Quebec) couvre les blessures corporelles — regime public no-fault pur (pas de poursuite possible). Les assureurs prives couvrent les dommages materiels et la responsabilite civile. Formule de Police du Quebec: Chapitre A (RC obligatoire 50K$ min) et Chapitre B (dommages propre vehicule, optionnel).", source: 'SAAQ, Code de la securite routiere', metadata: { province: 'QC', tags: ['SAAQ', 'auto', 'no-fault'] } },
  { domain: 'regulation_qc', title: 'Particularites — Quebec', content: "Code civil (pas common law), patrimoine familial (polices avec valeur de rachat partageable), insaisissabilite des prestations avec beneficiaire designe, IVAC (victimes actes criminels), RRQ (au lieu de CPP), RQAP (au lieu de AE pour parental), CNESST (accidents travail), Loi 25 (protection renseignements personnels). La designation du conjoint marie comme beneficiaire est irrevocable par defaut.", source: 'Code civil du Quebec', metadata: { province: 'QC', tags: ['particularites', 'Code civil', 'patrimoine familial'] } },

  // ═══════════════════════════════════════════
  // ONTARIO (6 entries)
  // ═══════════════════════════════════════════
  { domain: 'regulation_on', title: 'Regulateur assurance — Ontario (FSRA)', content: "Financial Services Regulatory Authority of Ontario (FSRA) — regulateur principal depuis 2019 (remplace FSCO). Registered Insurance Brokers of Ontario (RIBO) reglemente separement les courtiers en assurance. FSRA supervise assureurs, agents, planificateurs financiers. Plus grand marche d'assurance au Canada (~40% des primes).", source: 'FSRA, RIBO', metadata: { province: 'ON', tags: ['FSRA', 'RIBO', 'regulateur'] } },
  { domain: 'regulation_on', title: 'Legislation principale — Ontario', content: "Insurance Act (Ontario) R.S.O. 1990 c. I.8, Financial Services Regulatory Authority of Ontario Act, Statutory Accident Benefits Schedule (SABS O. Reg. 34/10). Take-All-Comers rule pour auto. Dispute Resolution via Licence Appeal Tribunal (LAT). Mandatory uninsured motorist coverage.", source: 'Ontario e-Laws', metadata: { province: 'ON', tags: ['Insurance Act', 'SABS', 'legislation'] } },
  { domain: 'regulation_on', title: 'Pre-licensing — Ontario (LLQP)', content: "LLQP (Life Licence Qualification Program) + Ontario-specific content + provincial exam FSRA. Pour courtiers: RIBO licensing program (General Insurance). OTL exam pour agents generaux. Pass mark 60%.", source: 'FSRA', metadata: { province: 'ON', tags: ['LLQP', 'RIBO', 'licensing'], examRelevance: 'HIGH' } },
  { domain: 'regulation_on', title: 'Formation continue — Ontario', content: "30 CE credits par cycle de 2 ans. Minimum 3 credits en management/ethique pour courtiers RIBO. CE requirements varient selon le type de licence.", source: 'FSRA, RIBO', metadata: { province: 'ON', tags: ['CE', 'formation continue'] } },
  { domain: 'regulation_on', title: 'Auto-assurance — Ontario', content: "Marche prive competitif. No-fault statutory accident benefits (SABS) obligatoires. Includes: income replacement, medical/rehabilitation, attendant care, death/funeral benefits. Take-All-Comers rule. Direct compensation for property damage.", source: 'Insurance Act Ontario', metadata: { province: 'ON', tags: ['auto', 'SABS', 'no-fault'] } },
  { domain: 'regulation_on', title: 'Particularites — Ontario', content: "Plus grand marche d'assurance au Canada. FSRA a remplace FSCO en 2019. RIBO reglemente separement les courtiers. SABS mandatory no-fault benefits. LAT pour resolution disputes. Uninsured motorist coverage obligatoire. Ontario Health Insurance Plan (OHIP) pour soins de sante.", source: 'FSRA', metadata: { province: 'ON', tags: ['particularites', 'FSRA', 'SABS'] } },

  // ═══════════════════════════════════════════
  // ALBERTA (5 entries)
  // ═══════════════════════════════════════════
  { domain: 'regulation_ab', title: 'Regulateur assurance — Alberta (AIC)', content: "Alberta Insurance Council (AIC) reglemente les intermediaires. Alberta Superintendent of Insurance supervise les assureurs. Insurance Act (Alberta) et Fair Practices Regulation.", source: 'AIC', metadata: { province: 'AB', tags: ['AIC', 'regulateur'] } },
  { domain: 'regulation_ab', title: 'Pre-licensing et CE — Alberta', content: "LLQP + provincial exam pour vie. GIE + provincial exam pour dommages. 15 CE credits par an, minimum 3 en ethique.", source: 'AIC', metadata: { province: 'AB', tags: ['LLQP', 'CE', 'licensing'] } },
  { domain: 'regulation_ab', title: 'Auto-assurance — Alberta', content: "Marche prive avec plafonds de taux gouvernementaux. Direct compensation for property damage depuis 2020. Minor Injury Regulation limite les reclamations pour tissus mous. No-fault accident benefits (Section B).", source: 'Insurance Act Alberta', metadata: { province: 'AB', tags: ['auto', 'rate cap'] } },

  // ═══════════════════════════════════════════
  // BRITISH COLUMBIA (5 entries)
  // ═══════════════════════════════════════════
  { domain: 'regulation_bc', title: 'Regulateur assurance — Colombie-Britannique', content: "BC Financial Services Authority (BCFSA) reglemente les assureurs. Insurance Council of BC reglemente les intermediaires. ICBC (Insurance Corporation of British Columbia) fournit l'assurance auto de base.", source: 'BCFSA', metadata: { province: 'BC', tags: ['BCFSA', 'ICBC', 'regulateur'] } },
  { domain: 'regulation_bc', title: 'Pre-licensing et CE — Colombie-Britannique', content: "LLQP + provincial exam pour vie. 3 niveaux de licence pour general (Level 1, 2, 3). 15 CE credits par periode de 2 ans (corrige: 12h/an selon certaines sources).", source: 'Insurance Council of BC', metadata: { province: 'BC', tags: ['LLQP', 'CE', 'licensing'] } },
  { domain: 'regulation_bc', title: 'Auto-assurance — Colombie-Britannique (ICBC)', content: "ICBC fournit l'assurance auto de base (monopole public). Enhanced Care model (no-fault) depuis mai 2021. Couverture optionnelle/excess disponible aupres d'assureurs prives. Revolution majeure: passage du tort au no-fault en 2021.", source: 'ICBC', metadata: { province: 'BC', tags: ['ICBC', 'Enhanced Care', 'no-fault'] } },

  // ═══════════════════════════════════════════
  // SASKATCHEWAN (4 entries)
  // ═══════════════════════════════════════════
  { domain: 'regulation_sk', title: 'Regulateur assurance — Saskatchewan', content: "FCAA (Financial and Consumer Affairs Authority). GICS (General Insurance Council) et LICS (Life Insurance Council) reglementent separement. Nouveau Insurance Act SS 2015 c. I-9.11 en vigueur depuis 2020.", source: 'FCAA', metadata: { province: 'SK', tags: ['FCAA', 'GICS', 'LICS'] } },
  { domain: 'regulation_sk', title: 'Auto-assurance — Saskatchewan (SGI)', content: "SGI (Saskatchewan Government Insurance) fournit l'assurance auto de base (public). No-fault Personal Injury Protection Plan (PIPP). SGI CANADA (bras prive, societe de la Couronne) offre les extensions.", source: 'SGI', metadata: { province: 'SK', tags: ['SGI', 'PIPP', 'no-fault'] } },

  // ═══════════════════════════════════════════
  // MANITOBA (4 entries)
  // ═══════════════════════════════════════════
  { domain: 'regulation_mb', title: 'Regulateur assurance — Manitoba', content: "Manitoba Financial Services Agency (MFSA). Insurance Council of Manitoba (ICM). 30 CE credits par cycle de 2 ans.", source: 'ICM', metadata: { province: 'MB', tags: ['MFSA', 'ICM'] } },
  { domain: 'regulation_mb', title: 'Auto-assurance — Manitoba (MPI)', content: "Manitoba Public Insurance (MPI) fournit Autopac — assurance auto de base obligatoire. Personal Injury Protection Plan (PIPP) no-fault. Extensions disponibles uniquement via MPI (pas de prive pour auto au MB).", source: 'MPI', metadata: { province: 'MB', tags: ['MPI', 'Autopac', 'PIPP'] } },

  // ═══════════════════════════════════════════
  // ATLANTIC + TERRITORIES (compact, 2 each)
  // ═══════════════════════════════════════════
  { domain: 'regulation_nb', title: 'Regulateur et assurance — Nouveau-Brunswick', content: "FCNB (Financial and Consumer Services Commission) reglemente assurance ET valeurs mobilieres. Province bilingue. Minor injury definition reform. Auto: marche prive. 15 CE/an.", source: 'FCNB', metadata: { province: 'NB', tags: ['FCNB', 'bilingue'] } },
  { domain: 'regulation_ns', title: 'Regulateur et assurance — Nouvelle-Ecosse', content: "Insurance Council of Nova Scotia (ICNS). NSUARB approuve les taux auto. Cap sur dommages non pecuniaires pour blessures mineures. Auto: marche prive. 15 CE/an.", source: 'ICNS', metadata: { province: 'NS', tags: ['ICNS', 'NSUARB'] } },
  { domain: 'regulation_nl', title: 'Regulateur et assurance — Terre-Neuve-et-Labrador', content: "Office of the Superintendent of Insurance. Petit marche, competition limitee. Public Utilities Board examine les taux auto. 5+ lois separees (unique au Canada). 15 CE/an.", source: 'Gov NL', metadata: { province: 'NL', tags: ['OSI-NL'] } },
  { domain: 'regulation_pe', title: 'Regulateur et assurance — Ile-du-Prince-Edouard', content: "Office of the Superintendent of Insurance. Plus petite province — marche tres limite. IRAC examine les taux auto. Minor injury cap. 15 CE/an.", source: 'Gov PE', metadata: { province: 'PE', tags: ['IRAC'] } },
  { domain: 'regulation_nt', title: 'Regulateur et assurance — Territoires du Nord-Ouest', content: "Office of the Superintendent of Insurance. Tres petit marche. WSCC partage avec Nunavut. Pas de CE obligatoire actuellement. Climate extreme affecte la tarification.", source: 'Gov NT', metadata: { province: 'NT', tags: ['WSCC'] } },
  { domain: 'regulation_nu', title: 'Regulateur et assurance — Nunavut', content: "Office of the Superintendent of Insurance. Territoire le plus recent (1999), cadre herite des TNO. WSCC partage avec TNO. Tres peu d'infrastructure d'assurance locale. Pas de CE obligatoire.", source: 'Gov NU', metadata: { province: 'NU', tags: ['WSCC'] } },
  { domain: 'regulation_yt', title: 'Regulateur et assurance — Yukon', content: "Insurance Council of Yukon (ICY). Petit marche nordique. Auto: marche prive, competition limitee. Pas de CE obligatoire actuellement. Considerations transfrontalieres avec BC et Alaska.", source: 'Gov YT', metadata: { province: 'YT', tags: ['ICY'] } },

  // ═══════════════════════════════════════════
  // FEDERAL (10 entries)
  // ═══════════════════════════════════════════
  { domain: 'federal_osfi', title: 'BSIF/OSFI — Regulateur prudentiel federal', content: "Bureau du surintendant des institutions financieres (BSIF/OSFI). Regulateur prudentiel des assureurs constitues en vertu de lois federales. Fixe les normes de capital (LICAT), solvabilite, gouvernance. Guidelines: E-13 (RCM), B-3 (reassurance), LICAT, Corporate Governance.", source: 'OSFI', metadata: { scope: 'federal', tags: ['OSFI', 'BSIF', 'LICAT', 'capital'] } },
  { domain: 'federal_fintrac', title: 'CANAFE/FINTRAC — Anti-blanchiment', content: "Centre d'analyse des operations et declarations financieres du Canada. Les representants en assurance sont des entites declarantes. Obligations: verification identite, declaration operations douteuses (DOD), surveillance continue, identification PPV/EPV/NPV, tenue documents 5 ans, programme conformite ecrit. Loi: LRPCFAT/PCMLTFA.", source: 'FINTRAC', metadata: { scope: 'federal', tags: ['FINTRAC', 'CANAFE', 'AML', 'LRPCFAT'] } },
  { domain: 'federal_fcac', title: 'ACFC/FCAC — Protection consommateurs', content: "Agence de la consommation en matiere financiere du Canada. Protege les consommateurs de produits financiers. Supervise la conduite de marche des institutions financieres federales.", source: 'FCAC', metadata: { scope: 'federal', tags: ['FCAC', 'ACFC', 'consommateurs'] } },
  { domain: 'federal_pipeda', title: 'PIPEDA — Protection renseignements personnels', content: "Personal Information Protection and Electronic Documents Act. Loi federale sur la protection des renseignements personnels dans le secteur prive. 10 principes equitables d'information. S'applique a toutes les provinces sauf QC (Loi 25), AB (PIPA) et BC (PIPA) qui ont des lois equivalentes.", source: 'OPC', metadata: { scope: 'federal', tags: ['PIPEDA', 'vie privee'] } },
  { domain: 'federal_ica', title: 'Insurance Companies Act (federal)', content: "Loi sur les societes d'assurances (SC 1991 c. 47). Cadre legislatif federal pour les compagnies d'assurance constituees au federal. Gouvernance, capital, dividendes, placements, filiales.", source: 'Laws-lois.gc.ca', metadata: { scope: 'federal', tags: ['ICA', 'legislation'] } },
  { domain: 'federal_cra', title: 'ARC/CRA — Fiscalite assurance', content: "Agence du revenu du Canada. Aspects fiscaux cles: polices exonerees vs non exonerees, gain sur police, CBR, CDC, disposition presumee, roulement conjoint, deductibilite primes (entreprise), REER/FERR/CELI/REEE/REEI.", source: 'CRA', metadata: { scope: 'federal', tags: ['CRA', 'ARC', 'fiscal'] } },

  // ═══════════════════════════════════════════
  // PROGRAMS (12 entries)
  // ═══════════════════════════════════════════
  { domain: 'program_cpp', title: 'RPC/CPP — Regime de pensions du Canada', content: "Regime contributif obligatoire pour tous les travailleurs (sauf QC qui a le RRQ). Prestations: retraite (65 ans, reduction/augmentation si prise plus tot/tard), invalidite, survivant, deces. CPP2 depuis 2024.", source: 'Service Canada', metadata: { scope: 'federal', tags: ['CPP', 'RPC', 'retraite'] } },
  { domain: 'program_rrq', title: 'RRQ — Regime de rentes du Quebec', content: "Equivalent quebecois du CPP. Gere par Retraite Quebec. Prestations similaires au CPP mais taux et montants peuvent differer. Rente de retraite, rente d'invalidite, rente de conjoint survivant.", source: 'Retraite Quebec', metadata: { province: 'QC', tags: ['RRQ', 'retraite'] } },
  { domain: 'program_oas', title: 'SV/OAS — Securite de la vieillesse', content: "Pension universelle pour Canadiens 65+ basee sur les annees de residence. Includes: pension de base, Supplement de revenu garanti (SRG/GIS) pour faibles revenus, Allocation au conjoint. Non contributif — finance par les impots.", source: 'Service Canada', metadata: { scope: 'federal', tags: ['OAS', 'SV', 'SRG', 'GIS'] } },
  { domain: 'program_ei', title: 'AE/EI — Assurance-emploi', content: "Programme federal: support temporaire aux chomeurs, prestations maternite/parentale (sauf QC → RQAP), prestations maladie (26 semaines), prestations compassion, prestations proches aidants.", source: 'Service Canada', metadata: { scope: 'federal', tags: ['AE', 'EI', 'chomage'] } },
  { domain: 'program_rqap', title: 'RQAP — Regime quebecois assurance parentale', content: "Programme QC propre: maternite, paternite, parental, adoption. Plus genereux que AE federal. Remplace les prestations de maternite/parentale de l'AE pour les residents du QC.", source: 'RQAP', metadata: { province: 'QC', tags: ['RQAP', 'parental'] } },
  { domain: 'program_wc', title: 'Indemnisation accidents travail (pan-canadien)', content: "Chaque province a son propre organisme: CNESST (QC), WSIB (ON), WCB-AB, WorkSafeBC, WCB-MB, WCB-SK, WorkSafeNB, WCB-NS, WorkplaceNL, WCB-PE, WSCC (NT/NU), YWCHSB (YT). No-fault: employeurs paient primes, travailleurs recoivent prestations sans poursuivre.", source: 'AWCBC', metadata: { scope: 'pan-canadien', tags: ['workers comp', 'CNESST', 'WSIB'] } },
  { domain: 'program_saaq', title: 'SAAQ — Assurance auto corporelle Quebec', content: "Regime public no-fault pur pour blessures corporelles. Couvre tous les residents QC, permis ou non, responsables ou non. Indemnites: remplacement revenu, readaptation, deces, sequelles permanentes. Pas de poursuite possible pour blessures auto au QC.", source: 'SAAQ', metadata: { province: 'QC', tags: ['SAAQ', 'auto', 'no-fault'] } },
  { domain: 'program_icbc', title: 'ICBC — Assurance auto Colombie-Britannique', content: "Enhanced Care (no-fault) depuis mai 2021. Couverture de base obligatoire via ICBC (monopole). Benefits accrus: revenu (90% net), soins medicaux illimites, readaptation. Optionnel: excess via assureurs prives.", source: 'ICBC', metadata: { province: 'BC', tags: ['ICBC', 'Enhanced Care'] } },

  // ═══════════════════════════════════════════
  // INDUSTRY BODIES (8 entries)
  // ═══════════════════════════════════════════
  { domain: 'industry_ccir', title: 'CCRRA/CCIR — Conseil canadien des regulateurs', content: "Forum des regulateurs provinciaux/territoriaux d'assurance. Harmonise les standards reglementaires. Emet des directives conjointes dont la Directive TEC (Total des charges du client).", source: 'CCIR', metadata: { scope: 'pan-canadien', tags: ['CCIR', 'CCRRA', 'harmonisation'] } },
  { domain: 'industry_clhia', title: 'ACCAP/CLHIA — Association assureurs de personnes', content: "Association de l'industrie representant les assureurs vie/sante au Canada. Emet des lignes directrices influentes: LD2 (illustrations), LD7 (remplacement de polices), LD10 (fonds distincts).", source: 'CLHIA', metadata: { scope: 'pan-canadien', tags: ['CLHIA', 'ACCAP', 'LD2', 'LD7', 'LD10'] } },
  { domain: 'industry_advocis', title: 'Advocis — Association conseillers financiers', content: "Association professionnelle pour conseillers financiers et professionnels de l'assurance au Canada. Offre CE, designations (CLU, CHS), et plaidoyer pour l'industrie.", source: 'Advocis', metadata: { scope: 'pan-canadien', tags: ['Advocis', 'CLU', 'CHS'] } },
  { domain: 'industry_iic', title: 'Insurance Institute of Canada', content: "Education et developpement professionnel pour assurance IARD. Designations: CIP (Chartered Insurance Professional), FCIP (Fellow). Offre des programmes de CE.", source: 'Insurance Institute', metadata: { scope: 'pan-canadien', tags: ['CIP', 'FCIP'] } },
  { domain: 'industry_assuris', title: 'Assuris — Protection souscripteurs', content: "Organisme de protection des souscripteurs d'assurance de personnes. Si un assureur membre fait faillite, Assuris garantit: 100% prestations deces jusqu'a 200K$, 100% frais medicaux/dentaires, 85% valeur rachat.", source: 'Assuris', metadata: { scope: 'pan-canadien', tags: ['Assuris', 'protection', 'insolvabilite'] } },
  { domain: 'industry_pacicc', title: 'PACICC/SIMA — Protection assures IARD', content: "Societe d'indemnisation en matiere d'assurances IARD. Protege les titulaires de polices d'assurance dommages (auto, habitation, commercial) si un assureur membre devient insolvable.", source: 'PACICC', metadata: { scope: 'pan-canadien', tags: ['PACICC', 'SIMA', 'IARD'] } },

  // ═══════════════════════════════════════════
  // CROSS-PROVINCIAL COMPARISONS (6 entries)
  // ═══════════════════════════════════════════
  { domain: 'comparison', title: 'Common law vs Code civil — Impact assurance', content: "Quebec: Code civil codifie toutes les regles d'assurance (art. 2389-2628). 12 autres provinces: common law ou les principes evoluent par jurisprudence. Differences cles: formation du contrat, obligations declaration, incontestabilite, beneficiaire. Meme resultat souvent, chemins differents.", source: 'Analyse comparative', metadata: { scope: 'pan-canadien', tags: ['common law', 'code civil', 'comparaison'] } },
  { domain: 'comparison', title: 'Auto-assurance — 4 modeles au Canada', content: "PUBLIC PUR: QC (blessures seulement, SAAQ). PUBLIC COMPLET: BC (ICBC Enhanced Care), SK (SGI PIPP), MB (MPI Autopac). PRIVE AVEC NO-FAULT: ON (SABS), AB (Section B). PRIVE: NB, NS, NL, PE, NT, NU, YT. Chaque modele a des avantages et inconvenients distincts.", source: 'Analyse comparative', metadata: { scope: 'pan-canadien', tags: ['auto', 'public', 'prive', 'no-fault'] } },
  { domain: 'comparison', title: 'LLQP vs PQAP — Certifications comparees', content: "LLQP: 4 modules (Life, A&S, Seg Funds, Ethics), accepte dans 12 provinces common law. Pass mark 60%. Fenetre 1 an pour exam provincial. PQAP: 4 examens AMF specifiques au Quebec (F-111 a F-313). Reciprocite limitee entre les deux systemes.", source: 'CISRO', metadata: { scope: 'pan-canadien', tags: ['LLQP', 'PQAP', 'certification', 'comparaison'] } },
  { domain: 'comparison', title: 'CE/UFC — Exigences par province', content: "QC: 30 UFC/2 ans. ON: 30 CE/2 ans. AB: 15 CE/an. BC: 12-15 CE/2 ans. MB: 30 CE/2 ans. SK: 24 CE/2 ans. NB: 15 CE/an. NS: 15 CE/an. NL: 15 CE/an. PE: 15 CE/an. NT/NU/YT: pas de CE obligatoire. Tendance nationale: augmentation des exigences.", source: 'CISRO', metadata: { scope: 'pan-canadien', tags: ['CE', 'UFC', 'formation continue', 'comparaison'] } },
  { domain: 'comparison', title: 'Vie privee — PIPEDA vs lois provinciales', content: "PIPEDA: loi federale, s'applique dans 10 provinces. Exceptions: QC (Loi 25, plus stricte), AB (PIPA Alberta), BC (PIPA BC) ont des lois provinciales equivalentes. Loi 25 du QC est consideree la plus stricte au Canada.", source: 'OPC', metadata: { scope: 'pan-canadien', tags: ['PIPEDA', 'Loi 25', 'PIPA', 'vie privee'] } },
  { domain: 'comparison', title: 'Workers Comp — Tableau pan-canadien', content: "QC: CNESST. ON: WSIB. AB: WCB-AB. BC: WorkSafeBC. MB: WCB-MB. SK: WCB-SK. NB: WorkSafeNB. NS: WCB-NS. NL: WorkplaceNL. PE: WCB-PE. NT/NU: WSCC (partage). YT: YWCHSB. Tous no-fault. Primes employeurs varient par industrie et province.", source: 'AWCBC', metadata: { scope: 'pan-canadien', tags: ['workers comp', 'tableau'] } },
];

async function main() {
  const tenantId = process.argv.includes('--tenant-id')
    ? process.argv[process.argv.indexOf('--tenant-id') + 1]
    : 'default';

  console.log(`🇨🇦 Seeding provincial regulations for tenant: ${tenantId}`);
  console.log(`   ${entries.length} entries to seed`);

  let created = 0;
  let updated = 0;

  for (const entry of entries) {
    // Check if exists
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
