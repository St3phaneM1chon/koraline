/**
 * LMS Seed Script — 3 Additional Courses for LMS Aptitudes
 * =============================================================================
 * Run with: npx tsx scripts/seed-lms-courses.ts [--tenant-id <id>]
 *
 * Seeds:
 * - 3 Courses (Assurance vie, Fonds distincts, Deontologie)
 * - 9 Chapters (3 per course) with 10-11 lessons each
 * - 9 Quizzes (1 per chapter, 3-5 questions each)
 * - 19 Concepts with prerequisites
 * - 3 Course Accreditations
 *
 * Idempotent: checks if data exists before creating.
 * Requires seed-lms.ts to have been run first (categories, instructor, etc.)
 */

import { PrismaClient, Prisma } from '@prisma/client';

// ---------------------------------------------------------------------------
// Prisma client (direct, no multi-tenant context needed for seeding)
// ---------------------------------------------------------------------------

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

function parseArgs(): { tenantId?: string } {
  const args = process.argv.slice(2);
  const idx = args.indexOf('--tenant-id');
  if (idx !== -1 && args[idx + 1]) {
    return { tenantId: args[idx + 1] };
  }
  return {};
}

// ---------------------------------------------------------------------------
// Helper: log with prefix
// ---------------------------------------------------------------------------

function log(emoji: string, msg: string) {
  console.log(`  ${emoji} ${msg}`);
}

// ==========================================================================
// COURSE 1: L'assurance vie au Canada — Guide complet
// ==========================================================================

const COURSE_1 = {
  slug: 'assurance-vie-canada-guide',
  title: 'L\'assurance vie au Canada \u2014 Guide complet',
  subtitle: 'Ma\u00eetrisez les types de polices, la souscription et la fiscalit\u00e9',
  description: 'Formation compl\u00e8te sur l\u2019assurance vie au Canada : temporaire, vie enti\u00e8re, universelle, souscription, tarification et fiscalit\u00e9 des polices. Contenu adapt\u00e9 au march\u00e9 qu\u00e9b\u00e9cois et canadien.',
  longDescription: `Cette formation approfondie couvre l\u2019ensemble des produits d\u2019assurance vie offerts au Canada. Vous apprendrez \u00e0 distinguer les diff\u00e9rents types de polices (temporaire, vie enti\u00e8re, universelle), \u00e0 comprendre le processus de souscription et de tarification, et \u00e0 ma\u00eetriser les r\u00e8gles fiscales qui s\u2019appliquent aux polices d\u2019assurance vie.\n\nLe contenu est sp\u00e9cifiquement adapt\u00e9 au cadre r\u00e9glementaire canadien et qu\u00e9b\u00e9cois, avec des r\u00e9f\u00e9rences \u00e0 la Loi de l\u2019imp\u00f4t sur le revenu (LIR) et aux r\u00e8gles de l\u2019ARC. Id\u00e9al pour les repr\u00e9sentants en assurance de personnes qui souhaitent approfondir leurs connaissances produit.`,
  level: 'INTERMEDIATE' as const,
  status: 'PUBLISHED' as const,
  isFree: false,
  price: new Prisma.Decimal(199.99),
  currency: 'CAD',
  estimatedHours: new Prisma.Decimal(12.0),
  tags: ['assurance vie', 'temporaire', 'vie enti\u00e8re', 'universelle', 'fiscalit\u00e9'],
  passingScore: 70,
  isCompliance: true,
  complianceDeadlineDays: 90,
  categorySlug: 'produits-assurance',
};

const CHAPTERS_1 = [
  {
    title: 'Types d\u2019assurance vie',
    description: 'Les diff\u00e9rents types de polices d\u2019assurance vie disponibles au Canada : temporaire, vie enti\u00e8re et universelle.',
    sortOrder: 0,
    lessons: [
      {
        title: 'L\u2019assurance vie temporaire (T10, T20, T30)',
        description: 'Caract\u00e9ristiques, avantages et limites des polices temporaires.',
        sortOrder: 0,
        estimatedMinutes: 25,
        textContent: `## L\u2019assurance vie temporaire

L\u2019**assurance vie temporaire** est le type de police le plus simple et le plus abordable. Elle offre une protection pour une dur\u00e9e d\u00e9termin\u00e9e \u2014 g\u00e9n\u00e9ralement 10, 20 ou 30 ans \u2014 apr\u00e8s quoi la couverture prend fin ou doit \u00eatre renouvel\u00e9e \u00e0 des primes significativement plus \u00e9lev\u00e9es.

### Les variantes principales

- **T10 (temporaire 10 ans)** : Primes garanties pendant 10 ans, puis renouvelables. Id\u00e9ale pour les besoins \u00e0 court terme comme la couverture d\u2019un pr\u00eat hypoth\u00e9caire ou la protection pendant la p\u00e9riode o\u00f9 les enfants sont \u00e0 charge. Les primes sont les plus basses de toutes les temporaires.
- **T20 (temporaire 20 ans)** : Le compromis le plus populaire. Les primes restent fixes pendant 20 ans, couvrant souvent la p\u00e9riode cl\u00e9 d\u2019accumulation de responsabilit\u00e9s financi\u00e8res (hypoth\u00e8que, \u00e9ducation des enfants).
- **T30 (temporaire 30 ans)** : Protection plus longue, primes plus \u00e9lev\u00e9es que la T10 ou T20 mais fixes pendant trois d\u00e9cennies. Convient aux personnes qui contractent une hypoth\u00e8que tard ou qui ont des besoins de protection \u00e0 plus long terme.

### Caract\u00e9ristiques communes

Toutes les temporaires partagent certaines caract\u00e9ristiques : un **capital-d\u00e9c\u00e8s fixe**, des **primes nivelées** pendant la p\u00e9riode de garantie, et **aucune valeur de rachat** (la police ne constitue pas un placement). Au renouvellement, les primes augmentent substantiellement car elles sont recalcul\u00e9es selon l\u2019\u00e2ge atteint. La plupart des polices offrent une option de **transformation** permettant de convertir la temporaire en police permanente sans preuve d\u2019assurabilit\u00e9, g\u00e9n\u00e9ralement avant un \u00e2ge limite (65 ou 70 ans). Cette option est pr\u00e9cieuse si l\u2019\u00e9tat de sant\u00e9 de l\u2019assur\u00e9 se d\u00e9t\u00e9riore.

### Quand recommander la temporaire?

La temporaire convient lorsque le besoin de protection est **temporaire** et identifiable : remboursement d\u2019un pr\u00eat, protection du revenu familial pendant la p\u00e9riode d\u2019\u00e9ducation des enfants, ou couverture d\u2019une obligation commerciale \u00e0 dur\u00e9e d\u00e9finie.`,
      },
      {
        title: 'L\u2019assurance vie enti\u00e8re participante et non participante',
        description: 'Fonctionnement des polices permanentes, participations et valeur de rachat.',
        sortOrder: 1,
        estimatedMinutes: 30,
        textContent: `## L\u2019assurance vie enti\u00e8re

L\u2019**assurance vie enti\u00e8re** (ou permanente) offre une couverture pour toute la dur\u00e9e de la vie de l\u2019assur\u00e9. Contrairement \u00e0 la temporaire, elle accumule une **valeur de rachat** au fil du temps, combinant ainsi protection et \u00e9pargne.

### Vie enti\u00e8re non participante

La police non participante offre des garanties **fixes et pr\u00e9d\u00e9termin\u00e9es** : le capital-d\u00e9c\u00e8s, la prime et la valeur de rachat sont \u00e9tablis \u00e0 l\u2019\u00e9mission et ne changent jamais. C\u2019est l\u2019option la plus pr\u00e9visible. Le titulaire sait exactement ce qu\u2019il paie et ce que ses b\u00e9n\u00e9ficiaires recevront. Cependant, il n\u2019y a aucune possibilit\u00e9 de b\u00e9n\u00e9ficier d\u2019un rendement suppl\u00e9mentaire.

### Vie enti\u00e8re participante

La police participante est plus complexe et potentiellement plus avantageuse. Le titulaire **participe aux r\u00e9sultats de l\u2019assureur** sous forme de **participations** (dividendes de police). Ces participations, d\u00e9clar\u00e9es annuellement par le conseil d\u2019administration de l\u2019assureur, ne sont pas garanties mais refl\u00e8tent la performance du fonds g\u00e9n\u00e9ral (rendement des placements, mortalit\u00e9 r\u00e9elle, frais d\u2019administration).

Les participations peuvent \u00eatre utilis\u00e9es de plusieurs fa\u00e7ons : **achat de bonifications d\u2019assurance lib\u00e9r\u00e9e** (augmente le capital-d\u00e9c\u00e8s et la valeur de rachat sans cotisation suppl\u00e9mentaire), **r\u00e9duction des primes**, **d\u00e9p\u00f4t en int\u00e9r\u00eat** ou **encaissement**. L\u2019option la plus populaire est l\u2019achat de bonifications, car elle maximise la croissance \u00e0 long terme de la police.

### La valeur de rachat

La valeur de rachat repr\u00e9sente le montant auquel le titulaire a droit s\u2019il r\u00e9silie sa police. Elle augmente avec le temps et peut \u00eatre utilis\u00e9e comme garantie pour un **pr\u00eat sur police** (avanc\u00e9 par l\u2019assureur) ou un **pr\u00eat bancaire conventionnel** garanti par la cession de la police. En contexte d\u2019entreprise, cette valeur de rachat devient un **actif au bilan** qui peut am\u00e9liorer la capacit\u00e9 d\u2019emprunt.`,
      },
      {
        title: 'L\u2019assurance vie universelle',
        description: 'Souplesse de la vie universelle : composantes assurance et placement.',
        sortOrder: 2,
        estimatedMinutes: 30,
        textContent: `## L\u2019assurance vie universelle

L\u2019**assurance vie universelle** est la plus flexible des polices permanentes. Elle s\u00e9pare clairement la composante **assurance** (co\u00fbt d\u2019assurance) de la composante **\u00e9pargne** (fonds d\u2019accumulation), offrant au titulaire un contr\u00f4le consid\u00e9rable sur sa police.

### Structure \u00e0 deux compartiments

Le titulaire verse une **prime flexible** qui est r\u00e9partie entre deux compartiments :
1. **Le co\u00fbt d\u2019assurance** : Peut \u00eatre de type TAR (temporaire annuelle renouvelable, co\u00fbt augmentant chaque ann\u00e9e) ou de type nivelé (co\u00fbt fixe). Le choix du type de co\u00fbt influence la prime minimale et la dynamique d\u2019accumulation.
2. **Le fonds d\u2019accumulation** : L\u2019exc\u00e9dent de prime est investi dans des v\u00e9hicules de placement choisis par le titulaire (comptes \u00e0 int\u00e9r\u00eat garanti, fonds indiciels, fonds gérés). Le rendement de ces placements, moins les frais de gestion, s\u2019ajoute au fonds.

### Avantages de la flexibilit\u00e9

La VU permet d\u2019**ajuster les primes** (augmenter, diminuer, voire sauter des paiements si le fonds est suffisant), de **modifier le capital-d\u00e9c\u00e8s** (sous r\u00e9serve d\u2019assurabilit\u00e9 pour une hausse), et de **choisir les placements**. Cette flexibilit\u00e9 la rend particuli\u00e8rement adapt\u00e9e aux entrepreneurs, professionnels et individus dont les revenus fluctuent.

### Risques et mises en garde

Le titulaire assume le **risque de placement**. Si les rendements sont inf\u00e9rieurs aux projections, le fonds peut s\u2019\u00e9puiser, for\u00e7ant des primes suppl\u00e9mentaires pour maintenir la police en vigueur. De plus, les frais de gestion internes (MER) r\u00e9duisent les rendements nets. Le repr\u00e9sentant doit s\u2019assurer que le client comprend bien la diff\u00e9rence entre les **illustrations** (projections non garanties) et les **garanties contractuelles** de la police. Trop de polices universelles ont \u00e9t\u00e9 vendues avec des illustrations optimistes qui ne se sont jamais mat\u00e9rialis\u00e9es.

### Strat\u00e9gies avanc\u00e9es

La VU se pr\u00eate \u00e0 des strat\u00e9gies fiscales \u00e9labor\u00e9es : **maximisation de l\u2019abri fiscal** (contributions maximales dans la police exon\u00e9r\u00e9e), **pr\u00eat levier** (emprunt garanti par la police pour investir), et **r\u00e8glement de la succession** (liquidit\u00e9 imm\u00e9diate au d\u00e9c\u00e8s pour acquitter les imp\u00f4ts).`,
      },
      {
        title: 'Comparer les polices : temporaire vs permanente',
        description: 'Analyse comparative et crit\u00e8res de recommandation.',
        sortOrder: 3,
        estimatedMinutes: 20,
        textContent: `## Comparer temporaire et permanente

Le choix entre l\u2019assurance temporaire et l\u2019assurance permanente est l\u2019une des d\u00e9cisions les plus importantes que le repr\u00e9sentant aide son client \u00e0 prendre. Il n\u2019existe pas de r\u00e9ponse universelle \u2014 la recommandation d\u00e9pend de la **situation, des besoins et des objectifs** du client.

### Crit\u00e8res de d\u00e9cision

| Crit\u00e8re | Temporaire | Permanente |
|---------|-----------|------------|
| **Dur\u00e9e du besoin** | D\u00e9fini (10-30 ans) | Toute la vie |
| **Budget** | Prime basse | Prime \u00e9lev\u00e9e |
| **\u00c9pargne int\u00e9gr\u00e9e** | Aucune | Valeur de rachat |
| **Utilisation corporative** | Protection cl\u00e9 temporaire | Convention entre actionnaires, r\u00e8glement successoral |
| **Fiscalit\u00e9** | Aucun avantage fiscal (sauf primes d\u00e9ductibles en entreprise) | Croissance \u00e0 l\u2019abri de l\u2019imp\u00f4t, CDC au d\u00e9c\u00e8s |

### Le d\u00e9bat \u00ab acheter la temporaire et investir la diff\u00e9rence \u00bb

Ce d\u00e9bat classique oppose deux philosophies. Les partisans de la temporaire soutiennent qu\u2019il est pr\u00e9f\u00e9rable de payer une prime basse et d\u2019investir l\u2019\u00e9cart dans un CELI ou un REER. Les partisans de la permanente r\u00e9pondent que la discipline d\u2019\u00e9pargne forc\u00e9e de la police, combin\u00e9e aux avantages fiscaux (croissance non impos\u00e9e tant que la police est exon\u00e9r\u00e9e, cr\u00e9dit au CDC au d\u00e9c\u00e8s), peut g\u00e9n\u00e9rer un r\u00e9sultat net sup\u00e9rieur, surtout pour les clients fortun\u00e9s qui ont d\u00e9j\u00e0 maximis\u00e9 leurs REER et CELI.

### L\u2019approche \u00e9tag\u00e9e

La meilleure recommandation combine souvent les deux : une **couverture de base permanente** pour les besoins viagers (succession, derni\u00e8res d\u00e9penses) compl\u00e9t\u00e9e par une **couverture temporaire** pour les besoins d\u00e9finis (hypoth\u00e8que, \u00e9ducation). Cette approche \u00e9tag\u00e9e optimise le rapport protection/co\u00fbt tout en assurant une couverture minimale permanente.`,
      },
    ],
  },
  {
    title: 'Souscription et tarification',
    description: 'Le processus de souscription, les classes de risque et les facteurs de tarification en assurance vie.',
    sortOrder: 1,
    lessons: [
      {
        title: '\u00c9valuation du risque et s\u00e9lection',
        description: 'Comment les assureurs \u00e9valuent le risque d\u2019un proposant.',
        sortOrder: 0,
        estimatedMinutes: 25,
        textContent: `## L\u2019\u00e9valuation du risque en assurance vie

La **souscription** (underwriting) est le processus par lequel l\u2019assureur \u00e9value le risque que repr\u00e9sente un proposant et d\u00e9termine les conditions auxquelles il est pr\u00eat \u00e0 l\u2019assurer. C\u2019est une \u00e9tape fondamentale qui d\u00e9termine la tarification, les exclusions et parfois le refus de couverture.

### Les facteurs de risque

L\u2019assureur analyse plusieurs cat\u00e9gories de facteurs :

- **Facteurs m\u00e9dicaux** : \u00c9tat de sant\u00e9 actuel, ant\u00e9c\u00e9dents m\u00e9dicaux personnels et familiaux, r\u00e9sultats de tests (analyses sanguines, ECG, examen param\u00e9dical). Un historique de cancer, de maladie cardiaque ou de diab\u00e8te dans la famille proche peut entra\u00eener une surprime.
- **Facteurs li\u00e9s au mode de vie** : Tabagisme (le facteur le plus discriminant, doublant souvent la prime), consommation d\u2019alcool, usage de cannabis ou de drogues, sports \u00e0 risque (parachutisme, escalade), voyages dans des zones \u00e0 risque.
- **Facteurs professionnels** : Certaines professions comportent un risque accru de d\u00e9c\u00e8s (mineurs, travailleurs en hauteur, pilotes).
- **Facteurs financiers** : Le montant d\u2019assurance demand\u00e9 doit \u00eatre justifi\u00e9 par la situation financi\u00e8re du proposant (revenus, patrimoine, obligations).

### Le r\u00f4le du repr\u00e9sentant

Le repr\u00e9sentant joue un r\u00f4le cl\u00e9 en recueillant les informations initiales de mani\u00e8re compl\u00e8te et honn\u00eate. Des omissions ou des erreurs sur la proposition peuvent entra\u00eener l\u2019annulation de la police dans les deux premi\u00e8res ann\u00e9es (p\u00e9riode de contestabilit\u00e9). Le repr\u00e9sentant doit expliquer au client l\u2019importance de la transparence totale.`,
      },
      {
        title: 'Classes de risque et surprimes',
        description: 'Cat\u00e9gorisation des assur\u00e9s et m\u00e9canismes de surprime.',
        sortOrder: 1,
        estimatedMinutes: 25,
        textContent: `## Les classes de risque

Les assureurs classifient les proposants en **classes de risque** qui d\u00e9terminent le tarif applicable. Chaque assureur a sa propre grille, mais la structure g\u00e9n\u00e9rale est relativement uniforme dans l\u2019industrie canadienne.

### Classification standard

- **Pr\u00e9f\u00e9rentiel** (Preferred) : R\u00e9serv\u00e9 aux individus en excellent \u00e9tat de sant\u00e9, sans ant\u00e9c\u00e9dents m\u00e9dicaux significatifs, non-fumeurs, avec un IMC normal. Repr\u00e9sente environ 15-20% des proposants. B\u00e9n\u00e9ficie des tarifs les plus bas.
- **Standard non-fumeur** : La cat\u00e9gorie la plus courante. Sant\u00e9 g\u00e9n\u00e9ralement bonne, non-fumeur depuis au moins 12 mois (la p\u00e9riode varie selon l\u2019assureur, certains exigent 2 ans).
- **Standard fumeur** : M\u00eame profil de sant\u00e9 que le standard non-fumeur, mais le proposant utilise du tabac. Les primes sont typiquement le **double** de celles du non-fumeur.
- **Substandard** (tarif\u00e9/surprim\u00e9) : Le proposant pr\u00e9sente un risque sup\u00e9rieur \u00e0 la normale en raison de probl\u00e8mes de sant\u00e9, de mode de vie ou de profession.

### M\u00e9canismes de surprime

Lorsque le risque d\u00e9passe le standard, l\u2019assureur peut appliquer une **surprime** selon plusieurs m\u00e9thodes :

- **Surprime en pourcentage** : La plus courante. Exprim\u00e9e en multiples de 25% (ex: +75%, +150%). Une surprime de +100% double la prime.
- **Surprime temporaire forfaitaire** : Montant fixe additionnel par tranche de 1\u2009000$ de couverture, appliqu\u00e9 pendant un nombre d\u2019ann\u00e9es d\u00e9fini (ex: apr\u00e8s une chirurgie cardiaque r\u00e9cente).
- **Exclusion** : Plut\u00f4t qu\u2019une surprime, l\u2019assureur exclut une cause de d\u00e9c\u00e8s sp\u00e9cifique (ex: exclusion du suicide pendant 2 ans, exclusion d\u2019un sport \u00e0 risque).
- **Report** : L\u2019assureur reporte sa d\u00e9cision (ex: apr\u00e8s un diagnostic r\u00e9cent, attendre les r\u00e9sultats de traitement).`,
      },
      {
        title: 'Le BRM/MIB et le processus m\u00e9dical',
        description: 'Base de donn\u00e9es MIB, examens m\u00e9dicaux et processus de souscription.',
        sortOrder: 2,
        estimatedMinutes: 25,
        textContent: `## Le MIB et le processus m\u00e9dical

### Le MIB (Medical Information Bureau)

Le **MIB** (anciennement \u00ab Bureau m\u00e9dical d\u2019information \u00bb) est une base de donn\u00e9es partag\u00e9e entre les assureurs d\u2019Am\u00e9rique du Nord. Lorsqu\u2019un proposant soumet une demande d\u2019assurance, l\u2019assureur consulte le MIB pour v\u00e9rifier si d\u2019autres compagnies ont enregistr\u00e9 des informations sur cette personne.

Le MIB contient des **codes** (et non des diagnostics pr\u00e9cis) relatifs \u00e0 des conditions m\u00e9dicales ou des habitudes de vie d\u00e9clar\u00e9es lors de demandes ant\u00e9rieures. Son r\u00f4le principal est de **d\u00e9tecter les omissions et les incoh\u00e9rences**. Si un proposant a d\u00e9clar\u00e9 du diab\u00e8te \u00e0 un assureur A mais omet de le mentionner \u00e0 l\u2019assureur B, le code MIB alertera l\u2019assureur B.

### Le BRM (Bureau de renseignements m\u00e9dicaux)

Le **BRM** est l\u2019\u00e9quivalent qu\u00e9b\u00e9cois / canadien-fran\u00e7ais du MIB. Il fournit des rapports m\u00e9dicaux aux assureurs sur demande. Le proposant doit signer une autorisation permettant \u00e0 l\u2019assureur d\u2019obtenir ses ant\u00e9c\u00e9dents m\u00e9dicaux aupr\u00e8s de son m\u00e9decin traitant.

### Le processus m\u00e9dical de souscription

Le niveau d\u2019investigation m\u00e9dicale d\u00e9pend du **montant de couverture demand\u00e9** et de l\u2019**\u00e2ge du proposant** :

1. **Souscription simplifi\u00e9e** (<100\u2009000$ ou jeunes) : Questionnaire de sant\u00e9 seulement, aucun examen.
2. **Souscription standard** (100\u2009000$-500\u2009000$) : Examen param\u00e9dical (infirmi\u00e8re mobile), analyses sanguines et urinaires.
3. **Souscription compl\u00e8te** (>500\u2009000$ ou risque \u00e9lev\u00e9) : Examen m\u00e9dical complet par un m\u00e9decin, ECG de repos, \u00e9preuve d\u2019effort si n\u00e9cessaire, rapport du m\u00e9decin traitant (BRM).

La **p\u00e9riode de contestabilit\u00e9** de deux ans est cruciale : pendant cette p\u00e9riode, l\u2019assureur peut annuler la police si le proposant a fait de fausses d\u00e9clarations ou des omissions significatives. Apr\u00e8s deux ans, la police est g\u00e9n\u00e9ralement incontestable, sauf en cas de fraude.`,
      },
    ],
  },
  {
    title: 'Fiscalit\u00e9 de l\u2019assurance vie',
    description: 'R\u00e8gles fiscales applicables aux polices d\u2019assurance vie au Canada : police exon\u00e9r\u00e9e, CBR, CDC et strat\u00e9gies corporatives.',
    sortOrder: 2,
    lessons: [
      {
        title: 'Police exon\u00e9r\u00e9e et police non exon\u00e9r\u00e9e',
        description: 'Comprendre le statut fiscal des polices d\u2019assurance vie au Canada.',
        sortOrder: 0,
        estimatedMinutes: 30,
        textContent: `## Police exon\u00e9r\u00e9e vs non exon\u00e9r\u00e9e

Le traitement fiscal d\u2019une police d\u2019assurance vie au Canada d\u00e9pend avant tout de son statut : **exon\u00e9r\u00e9e** ou **non exon\u00e9r\u00e9e**. Cette distinction, d\u00e9finie par le **R\u00e8glement 306** de la Loi de l\u2019imp\u00f4t sur le revenu (LIR), d\u00e9termine si la croissance interne de la police est impos\u00e9e annuellement.

### La police exon\u00e9r\u00e9e

Une police est **exon\u00e9r\u00e9e** si sa composante \u00e9pargne ne d\u00e9passe pas les limites prescrites par le r\u00e8glement. Concr\u00e8tement, l\u2019ARC compare la police r\u00e9elle \u00e0 une **police de r\u00e9f\u00e9rence** th\u00e9orique (le \u00ab test de la police exon\u00e9r\u00e9e \u00bb). Tant que l\u2019\u00e9pargne accumul\u00e9e ne d\u00e9passe pas celle de la police de r\u00e9f\u00e9rence, la croissance interne **n\u2019est pas impos\u00e9e** annuellement. C\u2019est l\u2019avantage fiscal fondamental de l\u2019assurance vie permanente au Canada.

La grande majorit\u00e9 des polices d\u2019assurance vie enti\u00e8re et universelle sont con\u00e7ues pour \u00eatre exon\u00e9r\u00e9es. Les actuaires calculent les primes maximales pour rester dans les limites du r\u00e8glement.

### La police non exon\u00e9r\u00e9e

Si la police d\u00e9passe le test, elle devient **non exon\u00e9r\u00e9e** et le revenu de placement accumul\u00e9 dans la police est **impos\u00e9 annuellement** comme revenu de placement au taux marginal du titulaire. Cela \u00e9limine l\u2019avantage fiscal principal de la police permanente.

### Le co\u00fbt de base rajust\u00e9 (CBR)

Le **CBR** est un concept central de la fiscalit\u00e9 de l\u2019assurance vie. Il repr\u00e9sente essentiellement le \u00ab co\u00fbt fiscal \u00bb de la police pour son titulaire. Le CBR inclut les primes vers\u00e9es, moins le co\u00fbt net de l\u2019assurance pure (CNAP) et certains autres ajustements. Lorsque le titulaire dispose de sa police (rachat, r\u00e9siliation), la diff\u00e9rence entre la valeur re\u00e7ue et le CBR constitue un **gain sur police** imposable.`,
      },
      {
        title: 'Gain sur police et compte de dividendes en capital (CDC)',
        description: 'Imposition au rachat et cr\u00e9dit au CDC au d\u00e9c\u00e8s.',
        sortOrder: 1,
        estimatedMinutes: 30,
        textContent: `## Gain sur police et CDC

### Le gain sur police

Le **gain sur police** survient lorsqu\u2019une police est dispos\u00e9e \u2014 rachat, r\u00e9siliation, transfert ou d\u00e9ch\u00e9ance. Il se calcule comme suit :

**Gain sur police = Produit de disposition \u2013 Co\u00fbt de base rajust\u00e9 (CBR)**

Le produit de disposition est g\u00e9n\u00e9ralement la **valeur de rachat** re\u00e7ue (ou la juste valeur marchande en cas de transfert). Si le gain est positif, il est impos\u00e9 comme **revenu ordinaire** (et non comme gain en capital), ce qui est moins avantageux fiscalement.

### Avanc\u00e9es sur police

Un point important : une **avanc\u00e9e sur police** (pr\u00eat consenti par l\u2019assureur garanti par la police) n\u2019est **pas** une disposition tant que le montant emprunt\u00e9 ne d\u00e9passe pas le CBR. C\u2019est pourquoi la strat\u00e9gie de l\u2019\u00ab emprunt sur police \u00bb est si populaire : elle permet d\u2019acc\u00e9der \u00e0 la valeur de rachat sans d\u00e9clencher d\u2019imp\u00f4t imm\u00e9diat.

### Le compte de dividendes en capital (CDC)

Le **CDC** est un compte fiscal notionnel propre aux **soci\u00e9t\u00e9s priv\u00e9es sous contr\u00f4le canadien (SPCC)**. Au d\u00e9c\u00e8s de l\u2019assur\u00e9, le capital-d\u00e9c\u00e8s d\u2019une police d\u2019assurance vie est vers\u00e9 \u00e0 la soci\u00e9t\u00e9 b\u00e9n\u00e9ficiaire. Le montant re\u00e7u, **moins le CBR** de la police \u00e0 ce moment, est cr\u00e9dit\u00e9 au CDC de la soci\u00e9t\u00e9.

Le solde du CDC peut ensuite \u00eatre distribu\u00e9 aux actionnaires sous forme de **dividendes en capital**, qui sont **libres d\u2019imp\u00f4t** pour le b\u00e9n\u00e9ficiaire. C\u2019est l\u2019un des avantages fiscaux les plus puissants de l\u2019assurance vie corporative au Canada.

### Exemple concret

La soci\u00e9t\u00e9 XYZ d\u00e9tient une police de 1\u2009000\u2009000$ sur la vie de son actionnaire principal. Au d\u00e9c\u00e8s, le CBR est de 200\u2009000$. Le CDC est cr\u00e9dit\u00e9 de 800\u2009000$ (1M \u2013 200K). La soci\u00e9t\u00e9 peut verser 800\u2009000$ en dividendes en capital libres d\u2019imp\u00f4t aux h\u00e9ritiers actionnaires.`,
      },
      {
        title: 'Assurance vie en contexte corporatif',
        description: 'Strat\u00e9gies d\u2019assurance vie en entreprise : convention d\u2019actionnaires, rachat de parts et roulement.',
        sortOrder: 2,
        estimatedMinutes: 30,
        textContent: `## L\u2019assurance vie en entreprise

L\u2019assurance vie joue un r\u00f4le strat\u00e9gique dans la planification corporative et successorale. Les principales applications en contexte d\u2019entreprise au Canada sont les suivantes.

### Convention entre actionnaires

La **convention entre actionnaires** (shareholders\u2019 agreement) est le document le plus important de la gouvernance d\u2019une SPCC. L\u2019assurance vie y joue un r\u00f4le central : elle fournit les liquidit\u00e9s n\u00e9cessaires au **rachat des parts d\u2019un actionnaire d\u00e9c\u00e9d\u00e9** par les actionnaires survivants ou par la soci\u00e9t\u00e9. Sans assurance, les survivants devraient emprunter ou vendre des actifs pour financer le rachat, ce qui peut mettre en p\u00e9ril l\u2019entreprise.

Deux structures principales existent :
- **Rachat crois\u00e9** : Chaque actionnaire d\u00e9tient une police sur la vie des autres actionnaires. Au d\u00e9c\u00e8s, le survivant re\u00e7oit le capital et ach\u00e8te les parts de la succession.
- **Rachat par la soci\u00e9t\u00e9** : La soci\u00e9t\u00e9 d\u00e9tient les polices et ach\u00e8te les parts de la succession au d\u00e9c\u00e8s. Cette structure est souvent pr\u00e9f\u00e9r\u00e9e pour ses avantages fiscaux (CDC).

### Personne cl\u00e9

L\u2019assurance sur la vie d\u2019une **personne cl\u00e9** prot\u00e8ge l\u2019entreprise contre le d\u00e9c\u00e8s d\u2019un employ\u00e9, gestionnaire ou fondateur dont la disparition causerait un pr\u00e9judice financier important. Le capital-d\u00e9c\u00e8s permet de compenser la perte de revenus, financer le recrutement et la formation d\u2019un rempla\u00e7ant, et rassurer les cr\u00e9anciers et partenaires.

### Roulement entre conjoints (article 148(8.1) LIR)

Au d\u00e9c\u00e8s du titulaire d\u2019une police, le transfert au **conjoint survivant** peut se faire en report d\u2019imp\u00f4t (\u00ab roulement \u00bb). Le conjoint survivant h\u00e9rite de la police avec le CBR du d\u00e9funt, reportant le gain sur police au moment o\u00f9 le conjoint disposera lui-m\u00eame de la police. Ce roulement est automatique sauf si les repr\u00e9sentants l\u00e9gaux \u00e9lisent de ne pas s\u2019en pr\u00e9valoir.

### D\u00e9ductibilit\u00e9 des primes

Les primes d\u2019assurance vie ne sont g\u00e9n\u00e9ralement **pas d\u00e9ductibles** du revenu imposable de l\u2019entreprise. Exception : lorsqu\u2019un cr\u00e9ancier exige la cession de la police comme garantie d\u2019un pr\u00eat commercial, une portion de la prime (le co\u00fbt net de l\u2019assurance pure) peut \u00eatre d\u00e9ductible.`,
      },
    ],
  },
];

const QUIZZES_1 = [
  {
    chapterIndex: 0,
    title: 'Quiz \u2014 Types d\u2019assurance vie',
    description: '\u00c9valuez votre compr\u00e9hension des diff\u00e9rents types de polices d\u2019assurance vie.',
    passingScore: 70,
    maxAttempts: 3,
    timeLimit: 15,
    questions: [
      {
        type: 'MULTIPLE_CHOICE' as const,
        question: 'Quelle est la principale diff\u00e9rence entre une police temporaire et une police permanente?',
        sortOrder: 0,
        points: 1,
        explanation: 'La police temporaire offre une protection pour une dur\u00e9e d\u00e9finie sans valeur de rachat, tandis que la police permanente couvre toute la vie et accumule une valeur de rachat.',
        options: [
          { id: 'a', text: 'La temporaire co\u00fbte toujours plus cher', isCorrect: false },
          { id: 'b', text: 'La permanente couvre toute la vie et accumule une valeur de rachat, contrairement \u00e0 la temporaire', isCorrect: true },
          { id: 'c', text: 'La temporaire offre un meilleur rendement sur les placements', isCorrect: false },
          { id: 'd', text: 'Il n\u2019y a aucune diff\u00e9rence significative', isCorrect: false },
        ],
      },
      {
        type: 'MULTIPLE_CHOICE' as const,
        question: 'Dans une police vie enti\u00e8re participante, que repr\u00e9sentent les participations?',
        sortOrder: 1,
        points: 1,
        explanation: 'Les participations repr\u00e9sentent la part des r\u00e9sultats de l\u2019assureur (rendement des placements, mortalit\u00e9 r\u00e9elle, frais) retourn\u00e9e au titulaire de la police.',
        options: [
          { id: 'a', text: 'Des dividendes d\u2019actions de l\u2019assureur', isCorrect: false },
          { id: 'b', text: 'La part des r\u00e9sultats de l\u2019assureur retourn\u00e9e au titulaire', isCorrect: true },
          { id: 'c', text: 'Des int\u00e9r\u00eats garantis contractuellement', isCorrect: false },
          { id: 'd', text: 'Des primes rembours\u00e9es \u00e0 l\u2019\u00e9ch\u00e9ance', isCorrect: false },
        ],
      },
      {
        type: 'TRUE_FALSE' as const,
        question: 'L\u2019assurance vie universelle garantit le rendement des placements dans le fonds d\u2019accumulation.',
        sortOrder: 2,
        points: 1,
        explanation: 'Faux. Dans une VU, le titulaire assume le risque de placement. Les rendements ne sont pas garantis (sauf pour les comptes \u00e0 int\u00e9r\u00eat garanti, \u00e0 taux souvent bas).',
        options: [
          { id: 'vrai', text: 'Vrai', isCorrect: false },
          { id: 'faux', text: 'Faux', isCorrect: true },
        ],
      },
      {
        type: 'MULTIPLE_CHOICE' as const,
        question: 'Quel avantage offre l\u2019option de transformation d\u2019une police temporaire?',
        sortOrder: 3,
        points: 1,
        explanation: 'L\u2019option de transformation permet de convertir la temporaire en permanente sans nouvelle preuve d\u2019assurabilit\u00e9, ce qui est crucial si l\u2019\u00e9tat de sant\u00e9 s\u2019est d\u00e9t\u00e9rior\u00e9.',
        options: [
          { id: 'a', text: 'Obtenir un rabais sur la prime permanente', isCorrect: false },
          { id: 'b', text: 'Convertir en permanente sans preuve d\u2019assurabilit\u00e9', isCorrect: true },
          { id: 'c', text: 'Transf\u00e9rer la police \u00e0 un autre assureur', isCorrect: false },
          { id: 'd', text: 'Augmenter le capital-d\u00e9c\u00e8s automatiquement', isCorrect: false },
        ],
      },
    ],
  },
  {
    chapterIndex: 1,
    title: 'Quiz \u2014 Souscription et tarification',
    description: 'Testez vos connaissances sur le processus de souscription en assurance vie.',
    passingScore: 70,
    maxAttempts: 3,
    timeLimit: 12,
    questions: [
      {
        type: 'MULTIPLE_CHOICE' as const,
        question: 'Quel est le facteur de mode de vie qui a le plus d\u2019impact sur la tarification?',
        sortOrder: 0,
        points: 1,
        explanation: 'Le tabagisme est le facteur le plus discriminant en tarification d\u2019assurance vie, doublant typiquement le co\u00fbt des primes.',
        options: [
          { id: 'a', text: 'La pratique du yoga', isCorrect: false },
          { id: 'b', text: 'Le tabagisme', isCorrect: true },
          { id: 'c', text: 'Les voyages fr\u00e9quents', isCorrect: false },
          { id: 'd', text: 'Le travail \u00e0 domicile', isCorrect: false },
        ],
      },
      {
        type: 'MULTIPLE_CHOICE' as const,
        question: 'Quel est le r\u00f4le principal du MIB/BRM?',
        sortOrder: 1,
        points: 1,
        explanation: 'Le MIB/BRM permet aux assureurs de d\u00e9tecter les omissions et incoh\u00e9rences entre les d\u00e9clarations faites \u00e0 diff\u00e9rents assureurs.',
        options: [
          { id: 'a', text: 'Fixer les tarifs d\u2019assurance pour l\u2019industrie', isCorrect: false },
          { id: 'b', text: 'D\u00e9tecter les omissions et incoh\u00e9rences entre d\u00e9clarations', isCorrect: true },
          { id: 'c', text: 'D\u00e9livrer les certificats m\u00e9dicaux', isCorrect: false },
          { id: 'd', text: 'G\u00e9rer les r\u00e9clamations d\u2019assurance', isCorrect: false },
        ],
      },
      {
        type: 'TRUE_FALSE' as const,
        question: 'La p\u00e9riode de contestabilit\u00e9 d\u2019une police d\u2019assurance vie est g\u00e9n\u00e9ralement de 5 ans.',
        sortOrder: 2,
        points: 1,
        explanation: 'Faux. La p\u00e9riode de contestabilit\u00e9 est g\u00e9n\u00e9ralement de 2 ans. Pendant cette p\u00e9riode, l\u2019assureur peut annuler la police pour fausses d\u00e9clarations.',
        options: [
          { id: 'vrai', text: 'Vrai', isCorrect: false },
          { id: 'faux', text: 'Faux', isCorrect: true },
        ],
      },
    ],
  },
  {
    chapterIndex: 2,
    title: 'Quiz \u2014 Fiscalit\u00e9 de l\u2019assurance vie',
    description: '\u00c9valuez votre ma\u00eetrise des r\u00e8gles fiscales applicables aux polices d\u2019assurance vie.',
    passingScore: 70,
    maxAttempts: 3,
    timeLimit: 15,
    questions: [
      {
        type: 'MULTIPLE_CHOICE' as const,
        question: 'Qu\u2019est-ce qui d\u00e9termine si une police est \u00ab exon\u00e9r\u00e9e \u00bb?',
        sortOrder: 0,
        points: 1,
        explanation: 'Une police est exon\u00e9r\u00e9e si sa composante \u00e9pargne ne d\u00e9passe pas les limites prescrites par le R\u00e8glement 306 de la LIR (test de la police de r\u00e9f\u00e9rence).',
        options: [
          { id: 'a', text: 'Le montant de la prime annuelle', isCorrect: false },
          { id: 'b', text: 'Le test de la police de r\u00e9f\u00e9rence selon le R\u00e8glement 306 de la LIR', isCorrect: true },
          { id: 'c', text: 'L\u2019\u00e2ge du titulaire au moment de la souscription', isCorrect: false },
          { id: 'd', text: 'Le type d\u2019assureur qui \u00e9met la police', isCorrect: false },
        ],
      },
      {
        type: 'MULTIPLE_CHOICE' as const,
        question: 'Comment se calcule le cr\u00e9dit au CDC lors du d\u00e9c\u00e8s de l\u2019assur\u00e9?',
        sortOrder: 1,
        points: 1,
        explanation: 'Le cr\u00e9dit au CDC correspond au capital-d\u00e9c\u00e8s re\u00e7u moins le CBR de la police au moment du d\u00e9c\u00e8s.',
        options: [
          { id: 'a', text: 'Capital-d\u00e9c\u00e8s moins le co\u00fbt de base rajust\u00e9 (CBR)', isCorrect: true },
          { id: 'b', text: 'Capital-d\u00e9c\u00e8s moins les primes totales vers\u00e9es', isCorrect: false },
          { id: 'c', text: 'Valeur de rachat moins les primes vers\u00e9es', isCorrect: false },
          { id: 'd', text: 'Capital-d\u00e9c\u00e8s total, sans d\u00e9duction', isCorrect: false },
        ],
      },
      {
        type: 'TRUE_FALSE' as const,
        question: 'Les dividendes vers\u00e9s \u00e0 partir du compte de dividendes en capital (CDC) sont imposables pour les actionnaires.',
        sortOrder: 2,
        points: 1,
        explanation: 'Faux. Les dividendes en capital vers\u00e9s \u00e0 partir du CDC sont libres d\u2019imp\u00f4t pour les actionnaires b\u00e9n\u00e9ficiaires.',
        options: [
          { id: 'vrai', text: 'Vrai', isCorrect: false },
          { id: 'faux', text: 'Faux', isCorrect: true },
        ],
      },
      {
        type: 'MULTIPLE_CHOICE' as const,
        question: 'Dans quel contexte les primes d\u2019assurance vie peuvent-elles \u00eatre partiellement d\u00e9ductibles?',
        sortOrder: 3,
        points: 1,
        explanation: 'Les primes sont partiellement d\u00e9ductibles lorsqu\u2019un cr\u00e9ancier exige la cession de la police comme garantie d\u2019un pr\u00eat commercial.',
        options: [
          { id: 'a', text: 'Lorsque la police est d\u00e9tenue par une soci\u00e9t\u00e9 publique', isCorrect: false },
          { id: 'b', text: 'Lorsqu\u2019un cr\u00e9ancier exige la cession de la police comme garantie d\u2019un pr\u00eat', isCorrect: true },
          { id: 'c', text: 'Lorsque l\u2019assur\u00e9 a plus de 65 ans', isCorrect: false },
          { id: 'd', text: 'Les primes ne sont jamais d\u00e9ductibles, sans exception', isCorrect: false },
        ],
      },
      {
        type: 'MULTIPLE_CHOICE' as const,
        question: 'Quel est l\u2019avantage fiscal du roulement au conjoint survivant (art. 148(8.1) LIR)?',
        sortOrder: 4,
        points: 1,
        explanation: 'Le roulement permet le transfert de la police au conjoint survivant avec report d\u2019imp\u00f4t, le conjoint h\u00e9ritant du CBR du d\u00e9funt.',
        options: [
          { id: 'a', text: 'Annulation compl\u00e8te de tout imp\u00f4t futur sur la police', isCorrect: false },
          { id: 'b', text: 'Report de l\u2019imp\u00f4t sur le gain sur police au moment de la disposition ult\u00e9rieure', isCorrect: true },
          { id: 'c', text: 'D\u00e9duction des primes d\u00e9j\u00e0 vers\u00e9es', isCorrect: false },
          { id: 'd', text: 'Doublement du capital-d\u00e9c\u00e8s pour le conjoint', isCorrect: false },
        ],
      },
    ],
  },
];

const CONCEPTS_1 = [
  { slug: 'temporaire-t10-t20-t30', name: 'Assurance temporaire', domain: 'produits-assurance', description: 'Polices T10, T20, T30 : protection pour une dur\u00e9e d\u00e9finie, sans valeur de rachat.', difficulty: 0.3, estimatedMinutes: 25, bloomLevel: 2 },
  { slug: 'vie-entiere-participante', name: 'Vie enti\u00e8re participante', domain: 'produits-assurance', description: 'Police permanente avec participations aux r\u00e9sultats de l\u2019assureur.', difficulty: 0.6, estimatedMinutes: 35, bloomLevel: 4 },
  { slug: 'assurance-universelle', name: 'Assurance universelle', domain: 'produits-assurance', description: 'Police flexible avec composantes assurance et placement s\u00e9par\u00e9es.', difficulty: 0.7, estimatedMinutes: 40, bloomLevel: 4 },
  { slug: 'souscription-tarification', name: 'Souscription et tarification', domain: 'produits-assurance', description: '\u00c9valuation du risque, classes, surprimes et processus m\u00e9dical.', difficulty: 0.5, estimatedMinutes: 30, bloomLevel: 3 },
  { slug: 'police-exoneree', name: 'Police exon\u00e9r\u00e9e', domain: 'fiscalite-assurance', description: 'Statut fiscal d\u2019une police dont la croissance interne n\u2019est pas impos\u00e9e annuellement.', difficulty: 0.7, estimatedMinutes: 35, bloomLevel: 4 },
  { slug: 'cdc-compte-dividendes', name: 'Compte de dividendes en capital', domain: 'fiscalite-assurance', description: 'Compte notionnel permettant la distribution de dividendes libres d\u2019imp\u00f4t.', difficulty: 0.8, estimatedMinutes: 40, bloomLevel: 5 },
  { slug: 'cbr-cout-base', name: 'Co\u00fbt de base rajust\u00e9 (CBR)', domain: 'fiscalite-assurance', description: 'Co\u00fbt fiscal de la police servant au calcul du gain sur police.', difficulty: 0.7, estimatedMinutes: 30, bloomLevel: 4 },
];

const CONCEPT_PREREQS_1 = [
  { conceptSlug: 'vie-entiere-participante', prerequisiteSlug: 'temporaire-t10-t20-t30', strength: 0.6 },
  { conceptSlug: 'assurance-universelle', prerequisiteSlug: 'vie-entiere-participante', strength: 0.7 },
  { conceptSlug: 'police-exoneree', prerequisiteSlug: 'cbr-cout-base', strength: 0.9 },
  { conceptSlug: 'cdc-compte-dividendes', prerequisiteSlug: 'cbr-cout-base', strength: 0.8 },
  { conceptSlug: 'cdc-compte-dividendes', prerequisiteSlug: 'police-exoneree', strength: 0.7 },
  { conceptSlug: 'cbr-cout-base', prerequisiteSlug: 'souscription-tarification', strength: 0.5 },
];

// ==========================================================================
// COURSE 2: Fonds distincts et r\u00e9gimes enregistr\u00e9s
// ==========================================================================

const COURSE_2 = {
  slug: 'fonds-distincts-regimes-enregistres',
  title: 'Fonds distincts et r\u00e9gimes enregistr\u00e9s',
  subtitle: 'Garanties, r\u00e9gimes d\u2019\u00e9pargne et conformit\u00e9 CANAFE',
  description: 'Formation approfondie sur les fonds distincts, les r\u00e9gimes d\u2019\u00e9pargne enregistr\u00e9s (REER, FERR, CELI, CELIAPP, REEE, REEI) et les obligations anti-blanchiment (CANAFE/FINTRAC).',
  longDescription: `Cette formation avanc\u00e9e couvre trois domaines essentiels pour le repr\u00e9sentant en assurance de personnes au Canada.\n\nVous ma\u00eetriserez d\u2019abord les fonds distincts : leurs garanties \u00e0 l\u2019\u00e9ch\u00e9ance et au d\u00e9c\u00e8s, la r\u00e9initialisation, la protection contre les cr\u00e9anciers et les diff\u00e9rences avec les fonds communs de placement.\n\nEnsuite, vous explorerez en d\u00e9tail tous les r\u00e9gimes enregistr\u00e9s : REER, FERR, CRI, FRV, CELI, CELIAPP, RVER, REEE et REEI.\n\nEnfin, vous apprendrez les obligations anti-blanchiment impos\u00e9es par CANAFE, incluant le KYC, les d\u00e9clarations obligatoires et la gestion des personnes politiquement vuln\u00e9rables.`,
  level: 'ADVANCED' as const,
  status: 'PUBLISHED' as const,
  isFree: false,
  price: new Prisma.Decimal(249.99),
  currency: 'CAD',
  estimatedHours: new Prisma.Decimal(15.0),
  tags: ['fonds distincts', 'REER', 'CELI', 'CELIAPP', 'CANAFE', 'anti-blanchiment'],
  passingScore: 70,
  isCompliance: true,
  complianceDeadlineDays: 90,
  categorySlug: 'produits-assurance',
};

const CHAPTERS_2 = [
  {
    title: 'Fonds distincts',
    description: 'Caract\u00e9ristiques, garanties et strat\u00e9gies li\u00e9es aux fonds distincts au Canada.',
    sortOrder: 0,
    lessons: [
      {
        title: 'Fonds distincts vs fonds communs de placement',
        description: 'Diff\u00e9rences fondamentales entre les fonds distincts et les FCP.',
        sortOrder: 0,
        estimatedMinutes: 25,
        textContent: `## Fonds distincts vs FCP

Les **fonds distincts** (aussi appel\u00e9s contrats \u00e0 fonds distincts ou s\u00e9gr\u00e9gu\u00e9s) sont des produits d\u2019assurance qui partagent certaines caract\u00e9ristiques avec les fonds communs de placement (FCP) tout en offrant des protections suppl\u00e9mentaires uniques.

### Nature juridique

La diff\u00e9rence fondamentale est juridique : un FCP est un **v\u00e9hicule de placement** r\u00e9gi par les lois sur les valeurs mobili\u00e8res (ACVM), tandis qu\u2019un fonds distinct est un **contrat d\u2019assurance** r\u00e9gi par la Loi sur les assurances. Le titulaire d\u2019un fonds distinct est propri\u00e9taire d\u2019un contrat d\u2019assurance, non de parts dans un fonds de placement.

### Diff\u00e9rences cl\u00e9s

| Caract\u00e9ristique | Fonds distinct | FCP |
|---|---|---|
| **Garantie \u00e0 l\u2019\u00e9ch\u00e9ance** | 75% \u00e0 100% des d\u00e9p\u00f4ts | Aucune |
| **Garantie au d\u00e9c\u00e8s** | 75% \u00e0 100% des d\u00e9p\u00f4ts | Aucune |
| **Protection cr\u00e9anciers** | Oui (si b\u00e9n\u00e9ficiaire d\u00e9sign\u00e9) | Non |
| **Frais de gestion** | G\u00e9n\u00e9ralement plus \u00e9lev\u00e9s (0.5%-1% de plus) | Plus bas |
| **Succession** | Contourne le processus d\u2019homologation | Fait partie de la succession |
| **R\u00e9gulation** | Loi sur les assurances, Assuris | ACVM, Autorisation OPCVM |
| **Vendeur** | Repr\u00e9sentant en assurance | Repr\u00e9sentant en \u00e9pargne collective |

### Quand recommander les fonds distincts?

Les fonds distincts conviennent particuli\u00e8rement aux clients qui : ont besoin de protection contre les cr\u00e9anciers (professionnels, entrepreneurs), souhaitent \u00e9viter l\u2019homologation successorale (\u00e9conomies de frais et de d\u00e9lais), sont \u00e2g\u00e9s et craignent une perte de capital (garantie au d\u00e9c\u00e8s), ou ont un profil conservateur et veulent un filet de s\u00e9curit\u00e9 (garantie \u00e0 l\u2019\u00e9ch\u00e9ance).`,
      },
      {
        title: 'Garanties \u00e0 l\u2019\u00e9ch\u00e9ance et au d\u00e9c\u00e8s',
        description: 'Fonctionnement des garanties 75% et 100%, et la r\u00e9initialisation.',
        sortOrder: 1,
        estimatedMinutes: 25,
        textContent: `## Les garanties des fonds distincts

### Garantie \u00e0 l\u2019\u00e9ch\u00e9ance

La **garantie \u00e0 l\u2019\u00e9ch\u00e9ance** (maturity guarantee) assure au titulaire qu\u2019il r\u00e9cup\u00e9rera au minimum un pourcentage (75% ou 100%) de ses d\u00e9p\u00f4ts nets \u00e0 la date d\u2019\u00e9ch\u00e9ance du contrat, g\u00e9n\u00e9ralement 10 ans apr\u00e8s le d\u00e9p\u00f4t. Si la valeur marchande du fonds est inf\u00e9rieure au montant garanti, l\u2019assureur comble la diff\u00e9rence.

Exemple : un d\u00e9p\u00f4t de 100\u2009000$ avec garantie 75% assure un minimum de 75\u2009000$ \u00e0 l\u2019\u00e9ch\u00e9ance. Si le fonds vaut 60\u2009000$ apr\u00e8s 10 ans, l\u2019assureur verse 15\u2009000$ de compl\u00e9ment.

### Garantie au d\u00e9c\u00e8s

La **garantie au d\u00e9c\u00e8s** (death benefit guarantee) fonctionne de mani\u00e8re similaire : au d\u00e9c\u00e8s du rentier, le b\u00e9n\u00e9ficiaire d\u00e9sign\u00e9 re\u00e7oit au minimum le pourcentage garanti (75% ou 100%) des d\u00e9p\u00f4ts nets, m\u00eame si la valeur marchande est inf\u00e9rieure. Cette garantie n\u2019a pas de date d\u2019\u00e9ch\u00e9ance \u2014 elle s\u2019applique quelle que soit la date du d\u00e9c\u00e8s.

### La r\u00e9initialisation (reset)

La **r\u00e9initialisation** est un m\u00e9canisme puissant qui permet de **verrouiller les gains**. Si la valeur marchande du fonds d\u00e9passe le montant garanti, le titulaire peut r\u00e9initialiser les garanties au nouveau montant plus \u00e9lev\u00e9. Par exemple, un d\u00e9p\u00f4t initial de 100\u2009000$ avec garantie 100% : si le fonds atteint 130\u2009000$, la r\u00e9initialisation fixe la nouvelle garantie \u00e0 130\u2009000$.

La r\u00e9initialisation est g\u00e9n\u00e9ralement offerte :
- **Automatiquement** \u00e0 intervalles r\u00e9guliers (annuellement) ou manuellement sur demande
- Avec une **limite d\u2019\u00e2ge** (souvent 80 ans) au-del\u00e0 de laquelle les r\u00e9initialisations ne sont plus permises
- En **reportant l\u2019\u00e9ch\u00e9ance** de la garantie (nouvelle p\u00e9riode de 10 ans)

### Co\u00fbt des garanties

Le co\u00fbt des garanties se traduit par des **frais de gestion plus \u00e9lev\u00e9s** compar\u00e9s \u00e0 un FCP \u00e9quivalent. En g\u00e9n\u00e9ral, une garantie de 100% co\u00fbte entre 0.50% et 1.00% de plus par ann\u00e9e en RFG. Il faut comparer le co\u00fbt de cette garantie au b\u00e9n\u00e9fice r\u00e9el pour le client.`,
      },
      {
        title: 'Protection contre les cr\u00e9anciers et succession',
        description: 'Avantages des fonds distincts en mati\u00e8re de protection et de planification successorale.',
        sortOrder: 2,
        estimatedMinutes: 25,
        textContent: `## Protection cr\u00e9anciers et succession

### La protection contre les cr\u00e9anciers

L\u2019un des avantages les plus distinctifs des fonds distincts est la **protection contre les cr\u00e9anciers**. Puisque le fonds distinct est un contrat d\u2019assurance, il b\u00e9n\u00e9ficie des dispositions protectrices de la l\u00e9gislation sur les assurances.

En vertu de l\u2019article 2457 du **Code civil du Qu\u00e9bec** et des lois provinciales sur les assurances, si un **b\u00e9n\u00e9ficiaire irr\u00e9vocable** est d\u00e9sign\u00e9, le capital est prot\u00e9g\u00e9 contre les cr\u00e9anciers du titulaire. Dans plusieurs provinces, la d\u00e9signation d\u2019un b\u00e9n\u00e9ficiaire de la **cat\u00e9gorie familiale** (conjoint, enfant, parent, petit-enfant) offre \u00e9galement cette protection m\u00eame si le b\u00e9n\u00e9ficiaire est r\u00e9vocable.

Cette protection est particuli\u00e8rement pr\u00e9cieuse pour :
- Les **professionnels** (m\u00e9decins, avocats, comptables) expos\u00e9s \u00e0 des poursuites en responsabilit\u00e9
- Les **entrepreneurs** qui souhaitent prot\u00e9ger une partie de leur \u00e9pargne en cas de faillite de leur entreprise
- Les **travailleurs autonomes** dont les biens personnels ne sont pas s\u00e9par\u00e9s de ceux de l\u2019entreprise

### Avantage successoral : contourner l\u2019homologation

\u00c0 la diff\u00e9rence des FCP, les fonds distincts avec un **b\u00e9n\u00e9ficiaire d\u00e9sign\u00e9** sont vers\u00e9s directement au b\u00e9n\u00e9ficiaire, **sans passer par la succession**. Cela offre plusieurs avantages :

- **\u00c9conomies** : \u00c9vite les frais d\u2019homologation (qui peuvent repr\u00e9senter 1% \u00e0 1.5% de la succession dans certaines provinces)
- **Rapidit\u00e9** : Le versement est fait directement, sans attendre le r\u00e8glement de la succession (qui peut prendre des mois, voire des ann\u00e9es)
- **Confidentialit\u00e9** : Le montant n\u2019appara\u00eet pas dans les documents publics de la succession

### Assuris \u2014 La protection de l\u2019investisseur

En cas de faillite de l\u2019assureur, les fonds distincts b\u00e9n\u00e9ficient de la protection d\u2019**Assuris** (anciennement CompCorp), l\u2019organisme de protection des souscripteurs d\u2019assurance au Canada. La couverture est de 100% des garanties du contrat, jusqu\u2019\u00e0 60\u2009000$ en prestations de retrait.`,
      },
    ],
  },
  {
    title: 'R\u00e9gimes enregistr\u00e9s',
    description: 'Vue d\u2019ensemble des r\u00e9gimes d\u2019\u00e9pargne et de retraite enregistr\u00e9s au Canada.',
    sortOrder: 1,
    lessons: [
      {
        title: 'REER, FERR, CRI et FRV',
        description: 'Les r\u00e9gimes traditionnels de retraite : accumulation et d\u00e9caissement.',
        sortOrder: 0,
        estimatedMinutes: 30,
        textContent: `## REER, FERR, CRI et FRV

### Le REER (R\u00e9gime enregistr\u00e9 d\u2019\u00e9pargne-retraite)

Le **REER** est le pilier de l\u2019\u00e9pargne-retraite au Canada. Les cotisations sont **d\u00e9ductibles du revenu imposable**, la croissance est \u00e0 l\u2019abri de l\u2019imp\u00f4t, et les retraits sont imposables comme revenu ordinaire. Le plafond de cotisation pour 2026 est de 18% du revenu gagn\u00e9 de l\u2019ann\u00e9e pr\u00e9c\u00e9dente, jusqu\u2019\u00e0 un maximum prescrit (environ 32\u2009000$). Les droits de cotisation inutilis\u00e9s sont reportables ind\u00e9finiment.

Le REER doit \u00eatre converti en FERR ou en rente au plus tard le **31 d\u00e9cembre de l\u2019ann\u00e9e o\u00f9 le titulaire atteint 71 ans**. Le RAP (R\u00e9gime d\u2019acc\u00e8s \u00e0 la propri\u00e9t\u00e9) permet un retrait temporaire de 60\u2009000$ pour l\u2019achat d\u2019une premi\u00e8re habitation, remboursable sur 15 ans.

### Le FERR (Fonds enregistr\u00e9 de revenu de retraite)

Le **FERR** est la suite logique du REER. Il sert au **d\u00e9caissement** de l\u2019\u00e9pargne-retraite. Le titulaire doit retirer un **montant minimum annuel** calcul\u00e9 selon une formule prescrite bas\u00e9e sur l\u2019\u00e2ge (ou l\u2019\u00e2ge du conjoint si plus jeune). Il n\u2019y a pas de maximum de retrait. Chaque retrait est pleinement imposable.

### Le CRI (Compte de retraite immobilis\u00e9)

Le **CRI** re\u00e7oit les fonds provenant d\u2019un **r\u00e9gime de pension agr\u00e9\u00e9** (RPA) lorsqu\u2019un employ\u00e9 quitte son employeur. Les fonds sont **immobilis\u00e9s** : ils ne peuvent \u00eatre retir\u00e9s librement comme dans un REER. L\u2019objectif est de pr\u00e9server ces fonds pour la retraite. Le CRI doit \u00eatre converti en FRV ou en rente viag\u00e8re au plus tard \u00e0 71 ans.

### Le FRV (Fonds de revenu viager)

Le **FRV** est le pendant immobilis\u00e9 du FERR. Il re\u00e7oit les fonds du CRI et impose \u00e0 la fois un **retrait minimum** (m\u00eame formule que le FERR) et un **retrait maximum** annuel. Ce maximum emp\u00eache le titulaire d\u2019\u00e9puiser ses fonds trop rapidement, assurant un revenu viager. Les r\u00e8gles varient selon la l\u00e9gislation applicable (f\u00e9d\u00e9rale, provinciale).`,
      },
      {
        title: 'CELI, CELIAPP et RVER',
        description: 'Les r\u00e9gimes d\u2019\u00e9pargne libre d\u2019imp\u00f4t et le RVER.',
        sortOrder: 1,
        estimatedMinutes: 25,
        textContent: `## CELI, CELIAPP et RVER

### Le CELI (Compte d\u2019\u00e9pargne libre d\u2019imp\u00f4t)

Le **CELI**, cr\u00e9\u00e9 en 2009, est l\u2019un des outils d\u2019\u00e9pargne les plus polyvalents. Les cotisations ne sont **pas d\u00e9ductibles**, mais la croissance et les retraits sont **enti\u00e8rement libres d\u2019imp\u00f4t**. Le plafond de cotisation annuel est de 7\u2009000$ (2024-2026), avec un plafond cumulatif d\u2019environ 102\u2009000$ pour une personne admissible depuis 2009.

Points cl\u00e9s pour le repr\u00e9sentant :
- Les retraits **recr\u00e9ent des droits de cotisation** l\u2019ann\u00e9e suivante
- Les cotisations exc\u00e9dentaires sont p\u00e9nalis\u00e9es \u00e0 **1% par mois** sur l\u2019exc\u00e9dent
- Au d\u00e9c\u00e8s, le CELI peut \u00eatre transf\u00e9r\u00e9 au conjoint survivant comme **titulaire successeur** sans affecter ses droits de cotisation
- Les revenus dans un CELI n\u2019affectent **pas** les prestations fond\u00e9es sur le revenu (PSV, SRG)

### Le CELIAPP (Compte d\u2019\u00e9pargne libre d\u2019imp\u00f4t pour l\u2019achat d\u2019une premi\u00e8re propri\u00e9t\u00e9)

Le **CELIAPP**, lanc\u00e9 le 1er avril 2023, combine les avantages du REER et du CELI pour l\u2019achat d\u2019une premi\u00e8re habitation. Les cotisations sont **d\u00e9ductibles** (comme le REER) et les retraits pour l\u2019achat d\u2019une propri\u00e9t\u00e9 admissible sont **libres d\u2019imp\u00f4t** (comme le CELI).

Limites : 8\u2009000$ par ann\u00e9e, maximum viager de 40\u2009000$. Le compte doit \u00eatre utilis\u00e9 dans les **15 ans** suivant l\u2019ouverture (ou ferm\u00e9 avec transfert au REER). Les droits de cotisation inutilis\u00e9s d\u2019une ann\u00e9e sont reportables \u00e0 l\u2019ann\u00e9e suivante (max 8\u2009000$ de report).

### Le RVER (R\u00e9gime volontaire d\u2019\u00e9pargne-retraite)

Le **RVER** a \u00e9t\u00e9 cr\u00e9\u00e9 pour les travailleurs qui n\u2019ont pas acc\u00e8s \u00e0 un r\u00e9gime de retraite d\u2019employeur. Au Qu\u00e9bec, les employeurs de **5 employ\u00e9s ou plus** qui n\u2019offrent pas de r\u00e9gime d\u2019\u00e9pargne-retraite doivent obligatoirement offrir le RVER. L\u2019employ\u00e9 est **automatiquement inscrit** mais peut se retirer. Le RVER est administr\u00e9 par un assureur autoris\u00e9 et les cotisations sont d\u00e9ductibles comme pour un REER.`,
      },
      {
        title: 'REEE et REEI',
        description: 'R\u00e9gimes d\u2019\u00e9pargne sp\u00e9cifiques : \u00e9ducation et invalidit\u00e9.',
        sortOrder: 2,
        estimatedMinutes: 25,
        textContent: `## REEE et REEI

### Le REEE (R\u00e9gime enregistr\u00e9 d\u2019\u00e9pargne-\u00e9tudes)

Le **REEE** est con\u00e7u pour financer les \u00e9tudes postsecondaires d\u2019un enfant. Ses avantages cl\u00e9s sont les **subventions gouvernementales** qui bonifient l\u2019\u00e9pargne.

- **SCEE** (Subvention canadienne pour l\u2019\u00e9pargne-\u00e9tudes) : Le f\u00e9d\u00e9ral verse **20% des cotisations**, jusqu\u2019\u00e0 500$ par ann\u00e9e (2\u2009500$ de cotisation), maximum viager de 7\u2009200$ par b\u00e9n\u00e9ficiaire.
- **IQEE** (Incitatif qu\u00e9b\u00e9cois \u00e0 l\u2019\u00e9pargne-\u00e9tudes) : Le Qu\u00e9bec verse **10% des cotisations**, jusqu\u2019\u00e0 250$ par ann\u00e9e, maximum viager de 3\u2009600$.
- **BEC** (Bon d\u2019\u00e9tudes canadien) : Subvention additionnelle pour les familles \u00e0 faible revenu (500$ initial + 100$/an, max 2\u2009000$).

Les cotisations ne sont pas d\u00e9ductibles, mais la croissance est \u00e0 l\u2019abri de l\u2019imp\u00f4t. Les retraits (PAE \u2014 paiements d\u2019aide aux \u00e9tudes) sont impos\u00e9s entre les mains de l\u2019\u00e9tudiant, g\u00e9n\u00e9ralement \u00e0 un taux tr\u00e8s faible. Maximum de cotisation \u00e0 vie : **50\u2009000$** par b\u00e9n\u00e9ficiaire. Aucun plafond annuel.

### Le REEI (R\u00e9gime enregistr\u00e9 d\u2019\u00e9pargne-invalidit\u00e9)

Le **REEI** est destin\u00e9 aux personnes admissibles au **cr\u00e9dit d\u2019imp\u00f4t pour personnes handicap\u00e9es** (CIPH). Il vise \u00e0 assurer la s\u00e9curit\u00e9 financi\u00e8re \u00e0 long terme des personnes vivant avec un handicap.

Avantages principaux :
- **Subvention canadienne pour l\u2019\u00e9pargne-invalidit\u00e9 (SCEI)** : Jusqu\u2019\u00e0 300% de contrepartie (3$ pour 1$ de cotisation), max 3\u2009500$/an, 70\u2009000$ \u00e0 vie
- **Bon canadien pour l\u2019\u00e9pargne-invalidit\u00e9 (BCEI)** : Jusqu\u2019\u00e0 1\u2009000$/an sans cotisation requise pour familles \u00e0 faible revenu, max 20\u2009000$ \u00e0 vie
- Les retraits n\u2019affectent **pas** la plupart des prestations provinciales d\u2019aide sociale
- Maximum de cotisation \u00e0 vie : **200\u2009000$** (aucun plafond annuel)

Le REEI impose une **r\u00e8gle de 10 ans** : si des retraits sont effectu\u00e9s dans les 10 ans suivant une cotisation ayant g\u00e9n\u00e9r\u00e9 une subvention, les subventions correspondantes doivent \u00eatre rembours\u00e9es au gouvernement (\u00ab r\u00e8gle de retenue \u00bb).`,
      },
      {
        title: 'Strat\u00e9gies multi-r\u00e9gimes',
        description: 'Optimiser l\u2019utilisation combin\u00e9e des diff\u00e9rents r\u00e9gimes enregistr\u00e9s.',
        sortOrder: 3,
        estimatedMinutes: 20,
        textContent: `## Strat\u00e9gies multi-r\u00e9gimes

### Priorisation des r\u00e9gimes

La question \u00ab O\u00f9 cotiser en premier? \u00bb est l\u2019une des plus fr\u00e9quentes. La r\u00e9ponse d\u00e9pend du **taux marginal d\u2019imposition** actuel et pr\u00e9vu \u00e0 la retraite :

1. **REER d\u2019abord** si le taux marginal actuel est \u00e9lev\u00e9 (>40%) et sera plus bas \u00e0 la retraite. La d\u00e9duction d\u2019imp\u00f4t vaut plus aujourd\u2019hui que l\u2019imp\u00f4t pay\u00e9 au retrait.
2. **CELI d\u2019abord** si le taux marginal est faible ou si le client pr\u00e9voit un taux \u00e9quivalent ou sup\u00e9rieur \u00e0 la retraite. La flexibilit\u00e9 du CELI (retraits non imposables) est pr\u00e9cieuse.
3. **CELIAPP d\u2019abord** si le client est un premier acheteur : c\u2019est le seul r\u00e9gime offrant \u00e0 la fois la d\u00e9duction ET le retrait libre d\u2019imp\u00f4t.
4. **REEE** : Toujours contribuer au moins 2\u2009500$/an pour maximiser la SCEE de 500$ (rendement imm\u00e9diat de 20%).

### La strat\u00e9gie \u00ab mille-feuille \u00bb

Pour un client au revenu moyen avec enfants, l\u2019approche optimale combine :
- **CELIAPP** : 8\u2009000$ (si premier acheteur)
- **REEE** : 2\u2009500$ par enfant (pour capter la SCEE)
- **REER** : Cotisation suffisante pour descendre au palier d\u2019imposition inf\u00e9rieur
- **CELI** : Solde disponible apr\u00e8s les autres r\u00e9gimes

### \u00c0 la retraite : d\u00e9caissement strat\u00e9gique

L\u2019ordre de d\u00e9caissement optimal est tout aussi important :
- **CELI en dernier** : Pr\u00e9server la croissance libre d\u2019imp\u00f4t le plus longtemps possible
- **FERR/FRV minimums** : Ne retirer que le minimum obligatoire pour limiter l\u2019imposition
- **Revenus \u00e9tales** : Viser un revenu total juste en dessous du seuil de r\u00e9cup\u00e9ration de la PSV (~90\u2009000$)
- **Fractionnement** : Le FERR permet le fractionnement de revenu de pension avec le conjoint \u00e0 partir de 65 ans`,
      },
    ],
  },
  {
    title: 'Anti-blanchiment et conformit\u00e9',
    description: 'Obligations du repr\u00e9sentant en mati\u00e8re de lutte contre le blanchiment d\u2019argent et le financement du terrorisme.',
    sortOrder: 2,
    lessons: [
      {
        title: 'FINTRAC/CANAFE et obligations d\u00e9claratives',
        description: 'Cadre r\u00e9glementaire anti-blanchiment et d\u00e9clarations obligatoires.',
        sortOrder: 0,
        estimatedMinutes: 30,
        textContent: `## FINTRAC/CANAFE

### Le cadre l\u00e9gislatif

Le **Centre d\u2019analyse des op\u00e9rations et d\u00e9clarations financi\u00e8res du Canada** (CANAFE, ou FINTRAC en anglais) est l\u2019unit\u00e9 de renseignement financier du Canada. Il administre la **Loi sur le recyclage des produits de la criminalit\u00e9 et le financement des activit\u00e9s terroristes** (LRPCFAT).

Les repr\u00e9sentants en assurance sont des **entit\u00e9s d\u00e9clarantes** au sens de la loi. Ils ont des obligations pr\u00e9cises en mati\u00e8re de d\u00e9tection, de documentation et de d\u00e9claration des transactions suspectes ou de grande valeur.

### D\u00e9clarations obligatoires

Les principales d\u00e9clarations incluent :

1. **D\u00e9claration d\u2019op\u00e9rations douteuses (DOD)** : Obligatoire lorsqu\u2019il y a des motifs raisonnables de soup\u00e7onner qu\u2019une transaction est li\u00e9e au blanchiment d\u2019argent ou au financement du terrorisme. Aucun seuil mon\u00e9taire minimum. Doit \u00eatre faite dans les **30 jours** suivant la d\u00e9tection.

2. **D\u00e9claration de transactions en esp\u00e8ces de 10\u2009000$ ou plus** : Toute r\u00e9ception d\u2019esp\u00e8ces (ou \u00e9quivalents) de 10\u2009000$ et plus, en une seule ou plusieurs transactions dans un d\u00e9lai de 24 heures, doit \u00eatre d\u00e9clar\u00e9e dans les **15 jours**.

3. **D\u00e9claration de transferts \u00e9lectroniques de fonds** de 10\u2009000$ ou plus entrants ou sortants du Canada.

4. **D\u00e9claration de biens appartenant \u00e0 un groupe terroriste** : Imm\u00e9diate, d\u00e8s que l\u2019entit\u00e9 d\u00e9clarante a des raisons de croire.

### Indicateurs de transactions suspectes

Le repr\u00e9sentant doit \u00eatre attentif aux signaux d\u2019alerte : client qui insiste pour payer en esp\u00e8ces, transactions non coh\u00e9rentes avec le profil financier, pr\u00e9cipitation inhabituelle, r\u00e9ticence \u00e0 fournir des documents d\u2019identit\u00e9, transactions structur\u00e9es pour \u00e9viter le seuil de 10\u2009000$.`,
      },
      {
        title: 'PPV, EPV, NPV et programme de conformit\u00e9',
        description: 'Personnes politiquement vuln\u00e9rables et programme de conformit\u00e9.',
        sortOrder: 1,
        estimatedMinutes: 25,
        textContent: `## PPV/EPV/NPV et programme de conformit\u00e9

### Les personnes politiquement vuln\u00e9rables

La r\u00e9glementation anti-blanchiment accorde une attention particuli\u00e8re aux personnes ayant un pouvoir politique, en raison du risque accru de corruption et de blanchiment. Trois cat\u00e9gories existent :

- **\u00c9trangers politiquement vuln\u00e9rables (\u00c9PV)** : Chefs d\u2019\u00c9tat, parlementaires, juges de tribunaux sup\u00e9rieurs, ambassadeurs, hauts gradés militaires, dirigeants d\u2019entreprises d\u2019\u00c9tat d\u2019un pays \u00e9tranger. Des **mesures de vigilance accrue** sont obligatoires : surveillance continue, v\u00e9rification de la source des fonds, approbation de la direction.

- **Nationaux politiquement vuln\u00e9rables (NPV)** : M\u00eames fonctions, mais au Canada. Les obligations sont similaires mais l\u00e9g\u00e8rement all\u00e9g\u00e9es (la vigilance accrue n\u2019est requise que si un risque \u00e9lev\u00e9 est d\u00e9tect\u00e9).

- **Dirigeants d\u2019organisations internationales (PPV)** : Dirigeants d\u2019organisations comme l\u2019ONU, la Banque mondiale, le FMI, etc. M\u00eames obligations que pour les \u00c9PV.

La d\u00e9termination du statut doit \u00eatre faite lors de l\u2019\u00e9tablissement de la relation d\u2019affaires et **mise \u00e0 jour p\u00e9riodiquement**. Les associations familiales et proches doivent aussi \u00eatre consid\u00e9r\u00e9es.

### Le programme de conformit\u00e9

Toute entit\u00e9 d\u00e9clarante doit maintenir un **programme de conformit\u00e9** comprenant :

1. **Agent de conformit\u00e9** d\u00e9sign\u00e9 : Responsable de la supervision et de la mise en oeuvre
2. **Politiques et proc\u00e9dures** \u00e9crites : KYC, d\u00e9tection, d\u00e9claration, tenue de dossiers
3. **\u00c9valuation des risques** : Identifier et \u00e9valuer les risques de blanchiment propres \u00e0 l\u2019organisation
4. **Formation continue** : Tous les employ\u00e9s concern\u00e9s doivent recevoir une formation anti-blanchiment
5. **Examen bisannuel** : Un audit d\u2019efficacit\u00e9 du programme par une partie ind\u00e9pendante tous les **2 ans**

### KYC (Know Your Client) — Obligations CANAFE

L\u2019identification du client est la pierre angulaire du programme anti-blanchiment. Le repr\u00e9sentant doit **v\u00e9rifier l\u2019identit\u00e9** de toute personne pour laquelle il effectue une transaction, en utilisant un document d\u2019identit\u00e9 \u00e9mis par un gouvernement avec photo (permis de conduire, passeport).`,
      },
      {
        title: 'Sanctions et obligations de tenue de dossiers',
        description: 'Cons\u00e9quences du non-respect et exigences de conservation.',
        sortOrder: 2,
        estimatedMinutes: 20,
        textContent: `## Sanctions et tenue de dossiers

### Sanctions en cas de non-conformit\u00e9

Le non-respect des obligations anti-blanchiment entra\u00eene des **sanctions s\u00e9v\u00e8res**. CANAFE dispose de pouvoirs de sanctions administrative mon\u00e9taires (SAM) et peut \u00e9galement r\u00e9f\u00e9rer les dossiers pour poursuites criminelles.

**Sanctions administratives** (par violation) :
- Personne morale : jusqu\u2019\u00e0 **500\u2009000$** par violation pour les violations graves
- Personne physique : jusqu\u2019\u00e0 **100\u2009000$** par violation
- Les violations peuvent \u00eatre class\u00e9es comme mineures, graves ou tr\u00e8s graves

**Sanctions criminelles** :
- Omission volontaire de d\u00e9claration : jusqu\u2019\u00e0 **2\u2009000\u2009000$** d\u2019amende et/ou **5 ans** de prison
- Blanchiment d\u2019argent : jusqu\u2019\u00e0 **14 ans** de prison
- Financement du terrorisme : jusqu\u2019\u00e0 **10 ans** de prison

### Tenue de dossiers

CANAFE impose des **obligations pr\u00e9cises de conservation des documents** :

- **Dossier client** (KYC) : Nom, adresse, date de naissance, profession, nature de la relation d\u2019affaires. Conservation : **5 ans apr\u00e8s la fin de la relation**.
- **Relev\u00e9s de transactions** : D\u00e9tails de chaque transaction significative. Conservation : **5 ans** apr\u00e8s la transaction.
- **D\u00e9clarations** : Copies de toutes les d\u00e9clarations soumises \u00e0 CANAFE. Conservation : **5 ans**.
- **Correspondance** : Toute correspondance relative \u00e0 une transaction suspecte.

### Signaux d\u2019alerte courants en assurance

- Client qui veut acheter une **rente \u00e0 prime unique** importante en esp\u00e8ces
- Annulation pr\u00e9matur\u00e9e d\u2019une police avec demande de remboursement \u00e0 un tiers
- **Free-look** r\u00e9p\u00e9titifs (souscription puis annulation dans le d\u00e9lai de r\u00e9tractation)
- R\u00e9ticence du client \u00e0 fournir des informations KYC ou documents d\u2019identit\u00e9
- Proposant qui ne semble pas comprendre ou se soucier des caract\u00e9ristiques du produit achet\u00e9
- Transactions structur\u00e9es pour rester sous le seuil de 10\u2009000$

Le repr\u00e9sentant doit documenter ses observations et, en cas de doute, soumettre une d\u00e9claration d\u2019op\u00e9rations douteuses. Il est **interdit** d\u2019informer le client qu\u2019une DOD a \u00e9t\u00e9 soumise (\u00ab tipping off \u00bb est une infraction criminelle).`,
      },
    ],
  },
];

const QUIZZES_2 = [
  {
    chapterIndex: 0,
    title: 'Quiz \u2014 Fonds distincts',
    description: 'Testez vos connaissances sur les fonds distincts et leurs caract\u00e9ristiques.',
    passingScore: 70,
    maxAttempts: 3,
    timeLimit: 12,
    questions: [
      {
        type: 'MULTIPLE_CHOICE' as const,
        question: 'Quel est l\u2019avantage principal des fonds distincts par rapport aux fonds communs de placement?',
        sortOrder: 0,
        points: 1,
        explanation: 'Les fonds distincts offrent des garanties \u00e0 l\u2019\u00e9ch\u00e9ance et au d\u00e9c\u00e8s (75% \u00e0 100%), une protection contre les cr\u00e9anciers et le contournement de l\u2019homologation successorale.',
        options: [
          { id: 'a', text: 'Des frais de gestion plus bas', isCorrect: false },
          { id: 'b', text: 'Des garanties \u00e0 l\u2019\u00e9ch\u00e9ance et au d\u00e9c\u00e8s, et la protection contre les cr\u00e9anciers', isCorrect: true },
          { id: 'c', text: 'Un rendement garanti sup\u00e9rieur', isCorrect: false },
          { id: 'd', text: 'La possibilit\u00e9 d\u2019investir dans l\u2019immobilier', isCorrect: false },
        ],
      },
      {
        type: 'TRUE_FALSE' as const,
        question: 'La r\u00e9initialisation (reset) d\u2019un fonds distinct permet de verrouiller les gains en augmentant le montant garanti.',
        sortOrder: 1,
        points: 1,
        explanation: 'Vrai. La r\u00e9initialisation fixe la nouvelle garantie au montant actuel plus \u00e9lev\u00e9, prot\u00e9geant ainsi les gains accumul\u00e9s.',
        options: [
          { id: 'vrai', text: 'Vrai', isCorrect: true },
          { id: 'faux', text: 'Faux', isCorrect: false },
        ],
      },
      {
        type: 'MULTIPLE_CHOICE' as const,
        question: 'Quel organisme prot\u00e8ge les d\u00e9tenteurs de fonds distincts en cas de faillite de l\u2019assureur?',
        sortOrder: 2,
        points: 1,
        explanation: 'Assuris est l\u2019organisme de protection des souscripteurs d\u2019assurance au Canada, couvrant les fonds distincts en cas de faillite de l\u2019assureur.',
        options: [
          { id: 'a', text: 'La SADC (Soci\u00e9t\u00e9 d\u2019assurance-d\u00e9p\u00f4ts du Canada)', isCorrect: false },
          { id: 'b', text: 'L\u2019AMF', isCorrect: false },
          { id: 'c', text: 'Assuris', isCorrect: true },
          { id: 'd', text: 'Le FCPE (Fonds canadien de protection des \u00e9pargnants)', isCorrect: false },
        ],
      },
    ],
  },
  {
    chapterIndex: 1,
    title: 'Quiz \u2014 R\u00e9gimes enregistr\u00e9s',
    description: '\u00c9valuez votre ma\u00eetrise des diff\u00e9rents r\u00e9gimes d\u2019\u00e9pargne enregistr\u00e9s.',
    passingScore: 70,
    maxAttempts: 3,
    timeLimit: 15,
    questions: [
      {
        type: 'MULTIPLE_CHOICE' as const,
        question: '\u00c0 quel \u00e2ge le REER doit-il \u00eatre obligatoirement converti en FERR ou en rente?',
        sortOrder: 0,
        points: 1,
        explanation: 'Le REER doit \u00eatre converti au plus tard le 31 d\u00e9cembre de l\u2019ann\u00e9e o\u00f9 le titulaire atteint 71 ans.',
        options: [
          { id: 'a', text: '65 ans', isCorrect: false },
          { id: 'b', text: '69 ans', isCorrect: false },
          { id: 'c', text: '71 ans', isCorrect: true },
          { id: 'd', text: '75 ans', isCorrect: false },
        ],
      },
      {
        type: 'MULTIPLE_CHOICE' as const,
        question: 'Quel est le plafond annuel de cotisation au CELIAPP?',
        sortOrder: 1,
        points: 1,
        explanation: 'Le CELIAPP permet une cotisation annuelle maximale de 8\u2009000$, avec un plafond viager de 40\u2009000$.',
        options: [
          { id: 'a', text: '5\u2009000$', isCorrect: false },
          { id: 'b', text: '7\u2009000$', isCorrect: false },
          { id: 'c', text: '8\u2009000$', isCorrect: true },
          { id: 'd', text: '10\u2009000$', isCorrect: false },
        ],
      },
      {
        type: 'TRUE_FALSE' as const,
        question: 'Les retraits du CELI sont imposables comme revenu ordinaire.',
        sortOrder: 2,
        points: 1,
        explanation: 'Faux. Les retraits du CELI sont enti\u00e8rement libres d\u2019imp\u00f4t, c\u2019est l\u2019avantage fondamental du CELI.',
        options: [
          { id: 'vrai', text: 'Vrai', isCorrect: false },
          { id: 'faux', text: 'Faux', isCorrect: true },
        ],
      },
      {
        type: 'MULTIPLE_CHOICE' as const,
        question: 'Quel est le taux de contrepartie maximal de la SCEE pour le REEE?',
        sortOrder: 3,
        points: 1,
        explanation: 'La SCEE verse 20% des cotisations annuelles au REEE, jusqu\u2019\u00e0 un maximum de 500$ par ann\u00e9e par b\u00e9n\u00e9ficiaire.',
        options: [
          { id: 'a', text: '10%', isCorrect: false },
          { id: 'b', text: '20%', isCorrect: true },
          { id: 'c', text: '30%', isCorrect: false },
          { id: 'd', text: '50%', isCorrect: false },
        ],
      },
      {
        type: 'MULTIPLE_CHOICE' as const,
        question: 'Quelle est la particularit\u00e9 du FRV par rapport au FERR?',
        sortOrder: 4,
        points: 1,
        explanation: 'Le FRV impose \u00e0 la fois un retrait minimum (comme le FERR) et un retrait maximum annuel pour pr\u00e9server les fonds pour la retraite.',
        options: [
          { id: 'a', text: 'Le FRV n\u2019a pas de retrait minimum', isCorrect: false },
          { id: 'b', text: 'Le FRV impose un retrait maximum en plus du minimum', isCorrect: true },
          { id: 'c', text: 'Le FRV est libre d\u2019imp\u00f4t', isCorrect: false },
          { id: 'd', text: 'Le FRV peut \u00eatre d\u00e9tenu par un mineur', isCorrect: false },
        ],
      },
    ],
  },
  {
    chapterIndex: 2,
    title: 'Quiz \u2014 Anti-blanchiment et conformit\u00e9',
    description: 'V\u00e9rifiez vos connaissances sur les obligations CANAFE et anti-blanchiment.',
    passingScore: 70,
    maxAttempts: 3,
    timeLimit: 12,
    questions: [
      {
        type: 'MULTIPLE_CHOICE' as const,
        question: '\u00c0 partir de quel montant en esp\u00e8ces une d\u00e9claration \u00e0 CANAFE est-elle obligatoire?',
        sortOrder: 0,
        points: 1,
        explanation: 'Toute transaction en esp\u00e8ces de 10\u2009000$ ou plus (en une ou plusieurs transactions dans un d\u00e9lai de 24 heures) doit \u00eatre d\u00e9clar\u00e9e \u00e0 CANAFE.',
        options: [
          { id: 'a', text: '3\u2009000$', isCorrect: false },
          { id: 'b', text: '5\u2009000$', isCorrect: false },
          { id: 'c', text: '10\u2009000$', isCorrect: true },
          { id: 'd', text: '25\u2009000$', isCorrect: false },
        ],
      },
      {
        type: 'TRUE_FALSE' as const,
        question: 'Il est permis d\u2019informer le client qu\u2019une d\u00e9claration d\u2019op\u00e9rations douteuses (DOD) a \u00e9t\u00e9 soumise \u00e0 CANAFE.',
        sortOrder: 1,
        points: 1,
        explanation: 'Faux. Le \u00ab tipping off \u00bb (informer le client qu\u2019une DOD a \u00e9t\u00e9 soumise) est une infraction criminelle au Canada.',
        options: [
          { id: 'vrai', text: 'Vrai', isCorrect: false },
          { id: 'faux', text: 'Faux', isCorrect: true },
        ],
      },
      {
        type: 'MULTIPLE_CHOICE' as const,
        question: 'Qu\u2019est-ce qu\u2019un \u00c9PV dans le contexte anti-blanchiment?',
        sortOrder: 2,
        points: 1,
        explanation: 'Un \u00c9PV (\u00c9tranger politiquement vuln\u00e9rable) est un chef d\u2019\u00c9tat, parlementaire, juge, ambassadeur ou haut dirigeant d\u2019un pays \u00e9tranger, soumis \u00e0 des mesures de vigilance accrue.',
        options: [
          { id: 'a', text: 'Un employ\u00e9 du secteur public \u00e0 faible risque', isCorrect: false },
          { id: 'b', text: 'Un \u00e9tranger occupant une charge politique importante, soumis \u00e0 une vigilance accrue', isCorrect: true },
          { id: 'c', text: 'Un entrepreneur ayant des activit\u00e9s internationales', isCorrect: false },
          { id: 'd', text: 'Un investisseur avec un portefeuille de plus d\u2019un million de dollars', isCorrect: false },
        ],
      },
      {
        type: 'MULTIPLE_CHOICE' as const,
        question: 'Combien de temps les dossiers clients (KYC) doivent-ils \u00eatre conserv\u00e9s?',
        sortOrder: 3,
        points: 1,
        explanation: 'Les dossiers KYC doivent \u00eatre conserv\u00e9s pendant 5 ans apr\u00e8s la fin de la relation d\u2019affaires.',
        options: [
          { id: 'a', text: '2 ans apr\u00e8s la derni\u00e8re transaction', isCorrect: false },
          { id: 'b', text: '5 ans apr\u00e8s la fin de la relation d\u2019affaires', isCorrect: true },
          { id: 'c', text: '10 ans apr\u00e8s l\u2019ouverture du compte', isCorrect: false },
          { id: 'd', text: 'Ind\u00e9finiment', isCorrect: false },
        ],
      },
    ],
  },
];

const CONCEPTS_2 = [
  { slug: 'fonds-distincts', name: 'Fonds distincts', domain: 'produits-assurance', description: 'Contrats d\u2019assurance avec composante placement, garanties et protection cr\u00e9anciers.', difficulty: 0.6, estimatedMinutes: 35, bloomLevel: 4 },
  { slug: 'garanties-echeance-deces', name: 'Garanties \u00e9ch\u00e9ance/d\u00e9c\u00e8s', domain: 'produits-assurance', description: 'Garanties 75%-100% sur les d\u00e9p\u00f4ts \u00e0 l\u2019\u00e9ch\u00e9ance et au d\u00e9c\u00e8s.', difficulty: 0.5, estimatedMinutes: 25, bloomLevel: 3 },
  { slug: 'reer-ferr', name: 'REER/FERR', domain: 'regimes-enregistres', description: 'R\u00e9gimes d\u2019\u00e9pargne-retraite (accumulation) et de revenu de retraite (d\u00e9caissement).', difficulty: 0.5, estimatedMinutes: 30, bloomLevel: 3 },
  { slug: 'celi-celiapp', name: 'CELI/CELIAPP', domain: 'regimes-enregistres', description: 'Comptes d\u2019\u00e9pargne libre d\u2019imp\u00f4t g\u00e9n\u00e9ral et pour premi\u00e8re propri\u00e9t\u00e9.', difficulty: 0.4, estimatedMinutes: 25, bloomLevel: 3 },
  { slug: 'canafe-anti-blanchiment', name: 'CANAFE/FINTRAC', domain: 'conformite-amf', description: 'Obligations anti-blanchiment : KYC, d\u00e9clarations, PPV/EPV, programme de conformit\u00e9.', difficulty: 0.7, estimatedMinutes: 40, bloomLevel: 4 },
  { slug: 'reee-reei', name: 'REEE/REEI', domain: 'regimes-enregistres', description: 'R\u00e9gimes sp\u00e9cifiques pour les \u00e9tudes et l\u2019invalidit\u00e9 avec subventions gouvernementales.', difficulty: 0.5, estimatedMinutes: 25, bloomLevel: 3 },
];

const CONCEPT_PREREQS_2 = [
  { conceptSlug: 'garanties-echeance-deces', prerequisiteSlug: 'fonds-distincts', strength: 0.9 },
  { conceptSlug: 'celi-celiapp', prerequisiteSlug: 'reer-ferr', strength: 0.5 },
  { conceptSlug: 'reee-reei', prerequisiteSlug: 'reer-ferr', strength: 0.4 },
  { conceptSlug: 'canafe-anti-blanchiment', prerequisiteSlug: 'fonds-distincts', strength: 0.3 },
];

// ==========================================================================
// COURSE 3: D\u00e9ontologie et \u00e9thique professionnelle
// ==========================================================================

const COURSE_3 = {
  slug: 'deontologie-ethique-professionnelle',
  title: 'D\u00e9ontologie et \u00e9thique professionnelle',
  subtitle: 'Code de d\u00e9ontologie CSF, obligations et processus disciplinaire',
  description: 'Formation compl\u00e8te sur la d\u00e9ontologie du repr\u00e9sentant en assurance : code de d\u00e9ontologie de la CSF, obligations professionnelles, KYC, analyse des besoins et processus disciplinaire.',
  longDescription: `Cette formation couvre l\u2019ensemble des obligations d\u00e9ontologiques et \u00e9thiques du repr\u00e9sentant en assurance de personnes au Qu\u00e9bec.\n\nVous \u00e9tudierez en profondeur le code de d\u00e9ontologie \u00e9dict\u00e9 par la Chambre de la s\u00e9curit\u00e9 financi\u00e8re (CSF), les obligations professionnelles (devoir de conseil, KYC, convenance, tenue de dossiers) et le processus disciplinaire (r\u00f4le du syndic, comit\u00e9 de discipline, sanctions possibles).\n\nCette formation est essentielle pour tout repr\u00e9sentant soucieux d\u2019exercer dans le respect des plus hauts standards \u00e9thiques de la profession.`,
  level: 'BEGINNER' as const,
  status: 'PUBLISHED' as const,
  isFree: false,
  price: new Prisma.Decimal(129.99),
  currency: 'CAD',
  estimatedHours: new Prisma.Decimal(10.0),
  tags: ['d\u00e9ontologie', '\u00e9thique', 'CSF', 'discipline', 'repr\u00e9sentant'],
  passingScore: 70,
  isCompliance: true,
  complianceDeadlineDays: 90,
  categorySlug: 'ethique-professionnelle',
};

const CHAPTERS_3 = [
  {
    title: 'Code de d\u00e9ontologie CSF',
    description: 'Le code de d\u00e9ontologie de la Chambre de la s\u00e9curit\u00e9 financi\u00e8re et ses principes directeurs.',
    sortOrder: 0,
    lessons: [
      {
        title: 'Probit\u00e9 et int\u00e9grit\u00e9',
        description: 'L\u2019exigence fondamentale de probit\u00e9 dans l\u2019exercice de la profession.',
        sortOrder: 0,
        estimatedMinutes: 25,
        textContent: `## Probit\u00e9 et int\u00e9grit\u00e9

La **probit\u00e9** et l\u2019**int\u00e9grit\u00e9** constituent le socle de toute pratique professionnelle en assurance. Le code de d\u00e9ontologie de la **Chambre de la s\u00e9curit\u00e9 financi\u00e8re (CSF)** \u00e9tablit ces principes comme des obligations absolues, non n\u00e9gociables.

### D\u00e9finition de la probit\u00e9

La probit\u00e9 implique l\u2019**honn\u00eatet\u00e9 rigoureuse** dans toutes les dimensions de la pratique : relations avec les clients, avec les assureurs, avec les coll\u00e8gues et avec les autorit\u00e9s de r\u00e9glementation. Le repr\u00e9sentant probe ne falsifie pas de documents, ne fait pas de fausses d\u00e9clarations, ne dissimule pas d\u2019informations pertinentes et ne trompe personne, directement ou indirectement.

### Manifestations concr\u00e8tes

Au quotidien, la probit\u00e9 se traduit par :
- **Exactitude des informations** : Ne jamais falsifier une proposition d\u2019assurance, un formulaire m\u00e9dical ou tout autre document. Le repr\u00e9sentant qui \u00ab aide \u00bb un client \u00e0 omettre un probl\u00e8me de sant\u00e9 pour obtenir une meilleure tarification commet une faute grave.
- **Repr\u00e9sentation honn\u00eate** : Ne jamais exag\u00e9rer les avantages d\u2019un produit, minimiser ses risques ou faire des promesses de rendement non fond\u00e9es.
- **Gestion des fonds** : Ne jamais d\u00e9tourner les fonds d\u2019un client, retarder ind\u00fbment un remboursement, ou utiliser les sommes du client \u00e0 des fins personnelles.

### Jurisprudence

La jurisprudence disciplinaire est s\u00e9v\u00e8re en mati\u00e8re de probit\u00e9 : la falsification de signatures, l\u2019encaissement de ch\u00e8ques destin\u00e9s aux clients, et la fabrication de faux documents entra\u00eenent g\u00e9n\u00e9ralement la **radiation** (perte d\u00e9finitive du droit d\u2019exercice). La CSF consid\u00e8re ces manquements comme les plus graves de la profession.`,
      },
      {
        title: 'Diligence et comp\u00e9tence',
        description: 'Obligations de diligence professionnelle et de maintien des comp\u00e9tences.',
        sortOrder: 1,
        estimatedMinutes: 25,
        textContent: `## Diligence et comp\u00e9tence

### Le devoir de diligence

La **diligence** exige du repr\u00e9sentant qu\u2019il consacre \u00e0 chaque dossier le **soin et l\u2019attention** que m\u00e9rite la situation du client. Ce n\u2019est pas une simple suggestion \u2014 c\u2019est une obligation d\u00e9ontologique formelle dont le non-respect peut entra\u00eener des sanctions disciplinaires.

La diligence se manifeste \u00e0 chaque \u00e9tape de la relation :
- **Avant la vente** : Recueillir toute l\u2019information pertinente sur la situation financi\u00e8re du client, ses besoins et ses objectifs. Ne pas se contenter de r\u00e9ponses superficielles.
- **Pendant la vente** : Expliquer clairement les caract\u00e9ristiques du produit recommand\u00e9, y compris les exclusions, les limitations et les co\u00fbts. S\u2019assurer que le client comprend ce qu\u2019il ach\u00e8te.
- **Apr\u00e8s la vente** : Assurer un suivi p\u00e9riodique, traiter les demandes du client rapidement, et l\u2019informer de tout changement pertinent affectant sa couverture.

### Le devoir de comp\u00e9tence

Le repr\u00e9sentant **ne doit pas exercer dans des domaines** qui d\u00e9passent ses qualifications. Un repr\u00e9sentant en assurance de personnes qui donne des conseils en placement d\u00e9taill\u00e9s sans d\u00e9tenir les permis appropri\u00e9s contrevient \u00e0 cette obligation.

La comp\u00e9tence est aussi une obligation **continue** :
- Compl\u00e9ter les **UFC** (unit\u00e9s de formation continue) requises
- Se tenir inform\u00e9 des **changements l\u00e9gislatifs et r\u00e9glementaires**
- Comprendre les **nouveaux produits** avant de les recommander
- Conna\u00eetre les **limites de son expertise** et r\u00e9f\u00e9rer le client \u00e0 un sp\u00e9cialiste au besoin

### Exemples de manquements

La jurisprudence sanctionne r\u00e9guli\u00e8rement : les repr\u00e9sentants qui ne font pas de suivi (dossiers abandonn\u00e9s), ceux qui ne r\u00e9pondent pas aux demandes des clients dans un d\u00e9lai raisonnable, et ceux qui n\u2019analysent pas ad\u00e9quatement la situation financi\u00e8re avant de recommander un produit.`,
      },
      {
        title: 'Loyaut\u00e9 et secret professionnel',
        description: 'Obligations de loyaut\u00e9 envers le client et r\u00e8gles de confidentialit\u00e9.',
        sortOrder: 2,
        estimatedMinutes: 25,
        textContent: `## Loyaut\u00e9 et secret professionnel

### L\u2019obligation de loyaut\u00e9

La **loyaut\u00e9** impose au repr\u00e9sentant de placer les int\u00e9r\u00eats du client au-dessus de ses propres int\u00e9r\u00eats et de ceux de tiers (y compris l\u2019assureur ou le cabinet). C\u2019est l\u2019un des principes les plus fondamentaux et les plus fr\u00e9quemment invoqu\u00e9s dans les d\u00e9cisions disciplinaires.

Concr\u00e8tement, la loyaut\u00e9 exige de :
- **Recommander le produit le plus adapt\u00e9** aux besoins du client, m\u00eame si ce produit g\u00e9n\u00e8re une commission moindre
- **Informer le client** de toute situation qui pourrait affecter ses int\u00e9r\u00eats
- **Ne pas privil\u00e9gier** un assureur en raison de concours de vente, de bonis ou d\u2019avantages personnels
- **Pr\u00e9server l\u2019ind\u00e9pendance** de son jugement professionnel face aux pressions commerciales

### Le secret professionnel

Le **secret professionnel** est une obligation stricte. Le repr\u00e9sentant est tenu \u00e0 la **confidentialit\u00e9 absolue** des renseignements personnels que lui confie le client dans le cadre de la relation professionnelle.

Cette obligation :
- S\u2019\u00e9tend **au-del\u00e0 de la dur\u00e9e** de la relation d\u2019affaires
- Couvre **tous les renseignements** : situation financi\u00e8re, \u00e9tat de sant\u00e9, situation familiale
- Ne peut \u00eatre lev\u00e9e que par **autorisation \u00e9crite du client** ou par ordonnance d\u2019un tribunal
- S\u2019applique m\u00eame vis-\u00e0-vis des **coll\u00e8gues** qui n\u2019ont pas besoin de ces informations

### Exceptions au secret professionnel

Les exceptions sont limit\u00e9es :
- **D\u00e9claration CANAFE** : Les obligations anti-blanchiment pr\u00e9valent
- **Ordonnance judiciaire** : Un tribunal peut ordonner la divulgation
- **Situation de danger imminent** : Si la vie d\u2019une personne est menac\u00e9e (interpr\u00e9tation tr\u00e8s restrictive)
- **D\u00e9fense en justice** : Le repr\u00e9sentant poursuivi peut divulguer les informations n\u00e9cessaires \u00e0 sa d\u00e9fense`,
      },
    ],
  },
  {
    title: 'Obligations du repr\u00e9sentant',
    description: 'Les obligations professionnelles pratiques du repr\u00e9sentant en assurance.',
    sortOrder: 1,
    lessons: [
      {
        title: 'Devoir de conseil et analyse des besoins',
        description: 'L\u2019obligation de conseiller ad\u00e9quatement et de proc\u00e9der \u00e0 l\u2019ABF.',
        sortOrder: 0,
        estimatedMinutes: 30,
        textContent: `## Devoir de conseil et ABF

### Le devoir de conseil

Le **devoir de conseil** est l\u2019obligation la plus directement li\u00e9e \u00e0 la mission du repr\u00e9sentant. Il ne suffit pas de vendre un produit \u2014 le repr\u00e9sentant est un **professionnel qui conseille**. Son expertise doit servir \u00e0 guider le client vers les solutions les plus adapt\u00e9es \u00e0 sa situation.

Le devoir de conseil implique :
- **Comprendre avant de recommander** : Ne jamais recommander un produit sans avoir pleinement compris la situation du client
- **Expliquer dans un langage accessible** : Le jargon technique doit \u00eatre traduit en termes clairs
- **Pr\u00e9senter les alternatives** : Le client doit savoir qu\u2019il existe d\u2019autres options que celle recommand\u00e9e
- **Documenter le conseil** : Les recommandations et leurs justifications doivent figurer au dossier

### L\u2019analyse des besoins financiers (ABF)

L\u2019**ABF** est l\u2019outil central du devoir de conseil. Avant toute recommandation, le repr\u00e9sentant **doit** proc\u00e9der \u00e0 une analyse approfondie qui couvre :

1. **Situation familiale** : \u00c9tat civil, nombre et \u00e2ge des enfants, personnes \u00e0 charge
2. **Situation financi\u00e8re** : Revenus, d\u00e9penses, actifs, passifs, \u00e9pargne existante
3. **Couvertures existantes** : Assurances en vigueur (vie, invalidit\u00e9, maladie grave, r\u00e9gimes d\u2019employeur)
4. **Objectifs** : Protection familiale, remboursement de dettes, \u00e9pargne-retraite, \u00e9ducation des enfants
5. **Tol\u00e9rance au risque** : Capacit\u00e9 financi\u00e8re et psychologique \u00e0 absorber des fluctuations

L\u2019ABF doit \u00eatre **sign\u00e9e par le client**, conserv\u00e9e au dossier, et **mise \u00e0 jour** lorsque la situation du client change significativement (mariage, naissance, changement d\u2019emploi, h\u00e9ritage, divorce).`,
      },
      {
        title: 'KYC et obligation de convenance',
        description: 'Conna\u00eetre son client et l\u2019obligation de recommander des produits convenables.',
        sortOrder: 1,
        estimatedMinutes: 25,
        textContent: `## KYC et convenance

### Le KYC (Know Your Client)

Le **KYC** (Conna\u00eetre son client) est \u00e0 la fois une obligation d\u00e9ontologique et une obligation r\u00e9glementaire (CANAFE). Il va au-del\u00e0 de la simple collecte d\u2019informations \u2014 il exige du repr\u00e9sentant qu\u2019il **comprenne v\u00e9ritablement** qui est son client, quelle est sa situation, et quels sont ses besoins r\u00e9els.

### Les dimensions du KYC

1. **Identit\u00e9** : V\u00e9rification formelle de l\u2019identit\u00e9 (document gouvernemental avec photo). Obligatoire au moment de l\u2019\u00e9tablissement de la relation d\u2019affaires.
2. **Situation financi\u00e8re** : Revenus, patrimoine, capacit\u00e9 \u00e0 payer les primes \u00e0 long terme. Le repr\u00e9sentant ne doit pas vendre une couverture que le client ne peut pas se permettre.
3. **Besoins et objectifs** : Ce que le client veut prot\u00e9ger, ce qu\u2019il veut accomplir. Les besoins exprim\u00e9s ne sont pas toujours les besoins r\u00e9els \u2014 le repr\u00e9sentant doit creuser.
4. **Tol\u00e9rance au risque** : Pour les produits comportant un volet placement (fonds distincts, VU), la tol\u00e9rance au risque doit \u00eatre \u00e9valu\u00e9e formellement.

### L\u2019obligation de convenance

La **convenance** (suitability) est le pont entre le KYC et la recommandation. Le repr\u00e9sentant doit s\u2019assurer que chaque produit recommand\u00e9 est **convenable** pour le client sp\u00e9cifique, compte tenu de sa situation, ses besoins, ses objectifs et sa capacit\u00e9 financi\u00e8re.

Un produit peut \u00eatre excellent en soi mais **non convenable** pour un client particulier. Par exemple, une assurance vie universelle \u00e0 prime \u00e9lev\u00e9e n\u2019est pas convenable pour un client avec un revenu modeste et des dettes importantes.

### La convenance continue

L\u2019obligation de convenance ne s\u2019arr\u00eate pas au moment de la vente. Le repr\u00e9sentant doit s\u2019assurer que les produits d\u00e9j\u00e0 en vigueur demeurent convenables lorsqu\u2019il apprend un changement significatif dans la situation du client.`,
      },
      {
        title: 'Tenue de dossiers et obligations de divulgation',
        description: 'Exigences de documentation et divulgation proactive.',
        sortOrder: 2,
        estimatedMinutes: 25,
        textContent: `## Tenue de dossiers et divulgation

### La tenue de dossiers : une obligation centrale

La **tenue de dossiers** n\u2019est pas une t\u00e2che administrative secondaire \u2014 c\u2019est une obligation d\u00e9ontologique fondamentale. Le dossier client est la **preuve tangible** de la diligence du repr\u00e9sentant. En cas de plainte ou d\u2019enqu\u00eate, c\u2019est le dossier qui parlera.

### Contenu obligatoire

Le dossier doit contenir :
- **ABF compl\u00e8te et sign\u00e9e** : Incluant tous les renseignements pertinents sur la situation du client
- **Recommandations et justifications** : Ce qui a \u00e9t\u00e9 recommand\u00e9 et pourquoi
- **Documents de divulgation** : Preuves que le client a \u00e9t\u00e9 inform\u00e9 des \u00e9l\u00e9ments pertinents
- **Notes de rencontre** : R\u00e9sum\u00e9 de chaque interaction significative (date, heure, contenu)
- **Propositions et contrats** : Copies de tous les documents sign\u00e9s
- **Correspondance** : Courriels, lettres, confirmations
- **Documents d\u2019identit\u00e9** : Copies des pi\u00e8ces d\u2019identit\u00e9 (obligation KYC/CANAFE)

### Bonnes pratiques de documentation

- Documenter **le jour m\u00eame** \u2014 la m\u00e9moire est un outil peu fiable
- Utiliser un langage **factuel et objectif** : \u00ab Le client a exprim\u00e9 le souhait de... \u00bb plut\u00f4t que \u00ab Le client voulait absolument... \u00bb
- **Ne jamais alt\u00e9rer** un document apr\u00e8s coup sans noter la modification
- Conserver les dossiers pendant **au minimum 5 \u00e0 7 ans** apr\u00e8s la fin de la relation

### Divulgation proactive

Le repr\u00e9sentant doit divulguer **sans qu\u2019on le lui demande** :
- Sa **r\u00e9mun\u00e9ration** (commissions, bonis, incitatifs)
- Ses **liens** avec les assureurs et tiers
- Les **caract\u00e9ristiques compl\u00e8tes** du produit (y compris exclusions et limitations)
- Tout **conflit d\u2019int\u00e9r\u00eats** potentiel
- L\u2019existence d\u2019**alternatives** au produit recommand\u00e9`,
      },
    ],
  },
  {
    title: 'Processus disciplinaire',
    description: 'Le syst\u00e8me disciplinaire : r\u00f4le du syndic, comit\u00e9 de discipline, sanctions et recours.',
    sortOrder: 2,
    lessons: [
      {
        title: 'Le r\u00f4le du syndic et les enqu\u00eates',
        description: 'Le syndic de la CSF : pouvoirs d\u2019enqu\u00eate et processus de plainte.',
        sortOrder: 0,
        estimatedMinutes: 25,
        textContent: `## Le syndic de la CSF

### Qui est le syndic?

Le **syndic** de la Chambre de la s\u00e9curit\u00e9 financi\u00e8re est l\u2019officier charg\u00e9 de recevoir les plaintes, d\u2019enqu\u00eater sur les all\u00e9gations de manquement d\u00e9ontologique et de d\u00e9cider si une plainte disciplinaire doit \u00eatre d\u00e9pos\u00e9e devant le comit\u00e9 de discipline. Il agit de mani\u00e8re **ind\u00e9pendante** et dispose de pouvoirs d\u2019enqu\u00eate \u00e9tendus.

### Le processus de plainte

1. **R\u00e9ception de la plainte** : Toute personne (client, coll\u00e8gue, assureur, AMF) peut d\u00e9poser une plainte aupr\u00e8s du bureau du syndic. La plainte peut \u00eatre formelle (formulaire \u00e9crit) ou informelle (appel, lettre).

2. **Analyse pr\u00e9liminaire** : Le syndic \u00e9value si la plainte rel\u00e8ve de sa comp\u00e9tence et si elle justifie une enqu\u00eate. Il peut demander des informations suppl\u00e9mentaires au plaignant.

3. **Enqu\u00eate** : Le syndic ou un syndic adjoint m\u00e8ne l\u2019enqu\u00eate. Il peut :
   - **Exiger** la remise de tout document pertinent
   - **Inspecter** les dossiers du repr\u00e9sentant et du cabinet
   - **Convoquer** le repr\u00e9sentant vis\u00e9 et toute personne pertinente
   - **Obtenir** des informations des assureurs et tiers

4. **D\u00e9cision** : Apr\u00e8s enqu\u00eate, le syndic peut :
   - **D\u00e9poser une plainte** devant le comit\u00e9 de discipline (s\u2019il estime que les faits justifient des accusations)
   - **Fermer le dossier** (insuffisance de preuves ou absence de manquement)
   - **R\u00e9f\u00e9rer** \u00e0 un autre organisme (AMF, police) si la situation le justifie

### Le syndic peut aussi agir d\u2019office

Le syndic n\u2019a pas besoin d\u2019attendre une plainte. S\u2019il prend connaissance de faits pouvant constituer un manquement d\u00e9ontologique, il peut **ouvrir une enqu\u00eate de sa propre initiative**.`,
      },
      {
        title: 'Comit\u00e9 de discipline et sanctions',
        description: 'Fonctionnement du comit\u00e9 de discipline et \u00e9ventail des sanctions.',
        sortOrder: 1,
        estimatedMinutes: 25,
        textContent: `## Comit\u00e9 de discipline et sanctions

### Le comit\u00e9 de discipline

Le **comit\u00e9 de discipline** de la CSF est un tribunal administratif sp\u00e9cialis\u00e9 qui entend les plaintes d\u00e9pos\u00e9es par le syndic. Il est compos\u00e9 d\u2019un **pr\u00e9sident** (avocat nomm\u00e9 par le gouvernement) et de **deux membres** choisis parmi les repr\u00e9sentants de la discipline concern\u00e9e.

### D\u00e9roulement de l\u2019audience

1. **Signification** : Le repr\u00e9sentant vis\u00e9 re\u00e7oit la plainte et un avis d\u2019audition. Il a le droit de se faire repr\u00e9senter par un avocat.
2. **Plaidoyer** : Le repr\u00e9sentant peut plaider **coupable ou non coupable** \u00e0 chacun des chefs d\u2019accusation.
3. **Audition sur culpabilit\u00e9** : Le syndic pr\u00e9sente sa preuve (t\u00e9moins, documents), le repr\u00e9sentant pr\u00e9sente sa d\u00e9fense.
4. **D\u00e9cision sur culpabilit\u00e9** : Le comit\u00e9 rend sa d\u00e9cision (coupable/non coupable) pour chaque chef.
5. **Audition sur sanction** : Si coupable, les parties pr\u00e9sentent leurs observations sur la sanction appropriée.
6. **D\u00e9cision sur sanction** : Le comit\u00e9 impose la sanction.

### \u00c9ventail des sanctions

Le comit\u00e9 dispose d\u2019un large \u00e9ventail :

| Sanction | Description |
|----------|-------------|
| **R\u00e9primande** | Blâme formel, sanction la plus l\u00e9g\u00e8re |
| **Amende** | De 2\u2009500$ \u00e0 62\u2009500$ par chef (montants 2026) |
| **Limitation du droit d\u2019exercice** | Restrictions sp\u00e9cifiques (ex: supervision obligatoire) |
| **Suspension temporaire** | Interdiction d\u2019exercer pendant une p\u00e9riode d\u00e9finie |
| **Radiation temporaire** | Retrait du certificat pour une dur\u00e9e d\u00e9finie |
| **Radiation permanente** | Retrait d\u00e9finitif du droit d\u2019exercice |

Le comit\u00e9 peut aussi ordonner la **publication de la d\u00e9cision** (avis disciplinaire dans les m\u00e9dias), ce qui constitue une sanction suppl\u00e9mentaire significative pour la r\u00e9putation du repr\u00e9sentant.`,
      },
      {
        title: 'Plaintes, radiation et voies d\u2019appel',
        description: 'Processus complet : de la plainte initiale \u00e0 l\u2019appel.',
        sortOrder: 2,
        estimatedMinutes: 25,
        textContent: `## Plaintes, radiation et appel

### Types de plaintes

Deux types de plaintes peuvent \u00eatre d\u00e9pos\u00e9es :

1. **Plainte du syndic** : La voie principale. Le syndic, apr\u00e8s enqu\u00eate, d\u00e9cide de porter plainte devant le comit\u00e9 de discipline. C\u2019est la voie la plus courante et la plus efficace.

2. **Plainte priv\u00e9e** : Si le syndic d\u00e9cide de ne pas porter plainte, le plaignant peut d\u00e9poser une plainte priv\u00e9e directement devant le comit\u00e9 de discipline. Dans ce cas, le plaignant assume le fardeau de la preuve et les co\u00fbts associ\u00e9s.

### La radiation : la sanction ultime

La **radiation** (permanente ou temporaire) est la sanction la plus grave. La radiation permanente est r\u00e9serv\u00e9e aux manquements les plus s\u00e9rieux :
- Fraude et appropriation de fonds
- Falsification syst\u00e9matique de documents
- R\u00e9cidive apr\u00e8s des suspensions pr\u00e9c\u00e9dentes
- Conduite d\u00e9montrant une incompatibilit\u00e9 fondamentale avec l\u2019exercice de la profession

Pendant la radiation, le repr\u00e9sentant **ne peut exercer aucune activit\u00e9** li\u00e9e \u00e0 la distribution de produits financiers. Ses clients doivent \u00eatre transf\u00e9r\u00e9s \u00e0 un autre repr\u00e9sentant. La r\u00e9int\u00e9gration apr\u00e8s une radiation temporaire n\u00e9cessite une demande formelle et la d\u00e9monstration que les conditions impos\u00e9es ont \u00e9t\u00e9 remplies.

### Voies d\u2019appel

Le repr\u00e9sentant d\u00e9clar\u00e9 coupable dispose de **voies de recours** :

1. **Tribunal des professions** : Appel de la d\u00e9cision du comit\u00e9 de discipline dans les **30 jours** suivant la d\u00e9cision. Le Tribunal peut confirmer, modifier ou infirmer la d\u00e9cision.
2. **Cour sup\u00e9rieure** : Recours extraordinaire en r\u00e9vision judiciaire dans des circonstances limit\u00e9es (exc\u00e8s de comp\u00e9tence, erreur de droit manifeste).
3. **Cour d\u2019appel** : Si n\u00e9cessaire, un pourvoi peut \u00eatre port\u00e9 devant la Cour d\u2019appel du Qu\u00e9bec.

### Le rôle de la CSF

La **Chambre de la s\u00e9curit\u00e9 financi\u00e8re** joue un double r\u00f4le : organisme d\u2019autoréglementation et organisme de protection du public. Elle publie les d\u00e9cisions disciplinaires sur son site web, contribuant \u00e0 la transparence et \u00e0 l\u2019\u00e9ducation de la profession.`,
      },
      {
        title: 'Pr\u00e9vention et meilleures pratiques',
        description: 'Strat\u00e9gies pr\u00e9ventives pour \u00e9viter les plaintes disciplinaires.',
        sortOrder: 3,
        estimatedMinutes: 20,
        textContent: `## Pr\u00e9vention des plaintes

### La meilleure d\u00e9fense : la pr\u00e9vention

Plut\u00f4t que de g\u00e9rer les cons\u00e9quences d\u2019une plainte disciplinaire, le repr\u00e9sentant avis\u00e9 met en place des **pratiques pr\u00e9ventives** syst\u00e9matiques.

### Les 10 r\u00e8gles d\u2019or de la pr\u00e9vention

1. **Documenter, documenter, documenter** : Le dossier est votre meilleur alli\u00e9. Ce qui n\u2019est pas \u00e9crit n\u2019existe pas en cas d\u2019enqu\u00eate.
2. **ABF syst\u00e9matique** : Toujours faire une analyse des besoins compl\u00e8te, m\u00eame pour un \u00ab petit \u00bb dossier.
3. **Expliquer en langage clair** : Les malentendus sont \u00e0 l\u2019origine de nombreuses plaintes. Le client doit comprendre ce qu\u2019il ach\u00e8te.
4. **Divulguer proactivement** : Ne pas attendre qu\u2019on vous demande \u2014 divulguez votre r\u00e9mun\u00e9ration, vos liens, les limitations du produit.
5. **R\u00e9pondre rapidement** : Un client qui n\u2019obtient pas de r\u00e9ponse est un client qui d\u00e9pose une plainte.
6. **Conna\u00eetre ses limites** : Ne pas donner de conseils hors de son champ de comp\u00e9tence. R\u00e9f\u00e9rer au besoin.
7. **Se former continuellement** : Les r\u00e8gles changent, les produits \u00e9voluent. La comp\u00e9tence est un devoir permanent.
8. **G\u00e9rer les conflits t\u00f4t** : Un diff\u00e9rend non r\u00e9solu s\u2019envenime. Traiter les insatisfactions d\u00e8s leur apparition.
9. **Superviser ses adjoints** : Le repr\u00e9sentant est responsable des actes pos\u00e9s en son nom.
10. **Consulter en cas de doute** : Le service de d\u00e9ontologie de la CSF, le responsable de conformit\u00e9 du cabinet, un mentor exp\u00e9riment\u00e9 \u2014 les ressources existent.

### L\u2019assurance responsabilit\u00e9 professionnelle

Bien que la pr\u00e9vention soit prioritaire, l\u2019**assurance responsabilit\u00e9 professionnelle** est un filet de s\u00e9curit\u00e9 indispensable. Elle couvre les frais de d\u00e9fense et les dommages \u00e9ventuels en cas de poursuite civile li\u00e9e \u00e0 un conseil inad\u00e9quat ou \u00e0 une erreur professionnelle. La CSF exige de ses membres qu\u2019ils soient couverts.

### Culture de conformit\u00e9

Au-del\u00e0 des r\u00e8gles individuelles, c\u2019est une **culture de conformit\u00e9** que le repr\u00e9sentant doit int\u00e9grer. Le respect des r\u00e8gles ne doit pas \u00eatre v\u00e9cu comme un fardeau, mais comme un signe de **professionnalisme** qui inspire confiance et prot\u00e8ge le client comme le repr\u00e9sentant.`,
      },
    ],
  },
];

const QUIZZES_3 = [
  {
    chapterIndex: 0,
    title: 'Quiz \u2014 Code de d\u00e9ontologie CSF',
    description: 'Testez votre compr\u00e9hension des principes d\u00e9ontologiques de la CSF.',
    passingScore: 70,
    maxAttempts: 3,
    timeLimit: 12,
    questions: [
      {
        type: 'MULTIPLE_CHOICE' as const,
        question: 'Quelle sanction est g\u00e9n\u00e9ralement impos\u00e9e pour la falsification de documents?',
        sortOrder: 0,
        points: 1,
        explanation: 'La falsification de documents est consid\u00e9r\u00e9e comme l\u2019un des manquements les plus graves et entra\u00eene g\u00e9n\u00e9ralement la radiation (perte du droit d\u2019exercice).',
        options: [
          { id: 'a', text: 'Une simple r\u00e9primande', isCorrect: false },
          { id: 'b', text: 'Une amende de 1\u2009000$', isCorrect: false },
          { id: 'c', text: 'La radiation (perte du droit d\u2019exercice)', isCorrect: true },
          { id: 'd', text: 'Une formation obligatoire', isCorrect: false },
        ],
      },
      {
        type: 'TRUE_FALSE' as const,
        question: 'Le secret professionnel du repr\u00e9sentant prend fin \u00e0 la terminaison de la relation d\u2019affaires avec le client.',
        sortOrder: 1,
        points: 1,
        explanation: 'Faux. L\u2019obligation de secret professionnel s\u2019\u00e9tend au-del\u00e0 de la dur\u00e9e de la relation d\u2019affaires et persiste ind\u00e9finiment.',
        options: [
          { id: 'vrai', text: 'Vrai', isCorrect: false },
          { id: 'faux', text: 'Faux', isCorrect: true },
        ],
      },
      {
        type: 'MULTIPLE_CHOICE' as const,
        question: 'Lequel de ces comportements contrevient \u00e0 l\u2019obligation de loyaut\u00e9?',
        sortOrder: 2,
        points: 1,
        explanation: 'Recommander un produit en raison d\u2019un concours de vente plut\u00f4t que de l\u2019int\u00e9r\u00eat du client est un manquement direct \u00e0 l\u2019obligation de loyaut\u00e9.',
        options: [
          { id: 'a', text: 'R\u00e9f\u00e9rer le client \u00e0 un sp\u00e9cialiste plus qualifi\u00e9', isCorrect: false },
          { id: 'b', text: 'Recommander un produit en raison d\u2019un concours de vente plut\u00f4t que de l\u2019int\u00e9r\u00eat du client', isCorrect: true },
          { id: 'c', text: 'Informer le client des limitations du produit recommand\u00e9', isCorrect: false },
          { id: 'd', text: 'Documenter les raisons de sa recommandation au dossier', isCorrect: false },
        ],
      },
      {
        type: 'MULTIPLE_CHOICE' as const,
        question: 'Quel est le devoir fondamental en mati\u00e8re de comp\u00e9tence?',
        sortOrder: 3,
        points: 1,
        explanation: 'Le repr\u00e9sentant ne doit pas exercer dans des domaines d\u00e9passant ses qualifications et doit maintenir ses comp\u00e9tences \u00e0 jour par la formation continue.',
        options: [
          { id: 'a', text: 'Vendre le plus de produits possible', isCorrect: false },
          { id: 'b', text: 'Ne pas exercer hors de ses qualifications et maintenir ses comp\u00e9tences \u00e0 jour', isCorrect: true },
          { id: 'c', text: 'Obtenir le plus de certifications possibles', isCorrect: false },
          { id: 'd', text: 'D\u00e9l\u00e9guer toutes les t\u00e2ches complexes \u00e0 des coll\u00e8gues', isCorrect: false },
        ],
      },
    ],
  },
  {
    chapterIndex: 1,
    title: 'Quiz \u2014 Obligations du repr\u00e9sentant',
    description: '\u00c9valuez votre ma\u00eetrise des obligations professionnelles du repr\u00e9sentant.',
    passingScore: 70,
    maxAttempts: 3,
    timeLimit: 12,
    questions: [
      {
        type: 'MULTIPLE_CHOICE' as const,
        question: 'Quel \u00e9l\u00e9ment N\u2019est PAS obligatoire dans l\u2019analyse des besoins financiers (ABF)?',
        sortOrder: 0,
        points: 1,
        explanation: 'L\u2019historique de cr\u00e9dit n\u2019est pas un \u00e9l\u00e9ment obligatoire de l\u2019ABF, bien que la situation financi\u00e8re g\u00e9n\u00e9rale le soit.',
        options: [
          { id: 'a', text: 'La situation familiale du client', isCorrect: false },
          { id: 'b', text: 'Les couvertures d\u2019assurance existantes', isCorrect: false },
          { id: 'c', text: 'L\u2019historique de cr\u00e9dit d\u00e9taill\u00e9 du client', isCorrect: true },
          { id: 'd', text: 'Les objectifs du client', isCorrect: false },
        ],
      },
      {
        type: 'TRUE_FALSE' as const,
        question: 'L\u2019obligation de convenance (suitability) ne s\u2019applique qu\u2019au moment de la vente initiale du produit.',
        sortOrder: 1,
        points: 1,
        explanation: 'Faux. L\u2019obligation de convenance est continue. Le repr\u00e9sentant doit s\u2019assurer que les produits demeurent convenables lorsque la situation du client change.',
        options: [
          { id: 'vrai', text: 'Vrai', isCorrect: false },
          { id: 'faux', text: 'Faux', isCorrect: true },
        ],
      },
      {
        type: 'MULTIPLE_CHOICE' as const,
        question: 'Quelle est la dur\u00e9e minimale de conservation des dossiers clients?',
        sortOrder: 2,
        points: 1,
        explanation: 'Les dossiers clients doivent \u00eatre conserv\u00e9s pendant au moins 5 \u00e0 7 ans apr\u00e8s la fin de la relation d\u2019affaires.',
        options: [
          { id: 'a', text: '1 an', isCorrect: false },
          { id: 'b', text: '3 ans', isCorrect: false },
          { id: 'c', text: '5 \u00e0 7 ans', isCorrect: true },
          { id: 'd', text: '15 ans', isCorrect: false },
        ],
      },
    ],
  },
  {
    chapterIndex: 2,
    title: 'Quiz \u2014 Processus disciplinaire',
    description: 'V\u00e9rifiez vos connaissances sur le syst\u00e8me disciplinaire de la CSF.',
    passingScore: 70,
    maxAttempts: 3,
    timeLimit: 12,
    questions: [
      {
        type: 'MULTIPLE_CHOICE' as const,
        question: 'Qui d\u00e9cide de porter plainte devant le comit\u00e9 de discipline de la CSF?',
        sortOrder: 0,
        points: 1,
        explanation: 'Le syndic de la CSF, apr\u00e8s enqu\u00eate, d\u00e9cide s\u2019il y a lieu de porter plainte devant le comit\u00e9 de discipline.',
        options: [
          { id: 'a', text: 'Le client qui a d\u00e9pos\u00e9 la plainte', isCorrect: false },
          { id: 'b', text: 'Le syndic de la CSF', isCorrect: true },
          { id: 'c', text: 'L\u2019AMF directement', isCorrect: false },
          { id: 'd', text: 'Le cabinet du repr\u00e9sentant', isCorrect: false },
        ],
      },
      {
        type: 'MULTIPLE_CHOICE' as const,
        question: 'Quel est le d\u00e9lai pour porter en appel une d\u00e9cision du comit\u00e9 de discipline?',
        sortOrder: 1,
        points: 1,
        explanation: 'L\u2019appel doit \u00eatre port\u00e9 devant le Tribunal des professions dans les 30 jours suivant la d\u00e9cision.',
        options: [
          { id: 'a', text: '10 jours', isCorrect: false },
          { id: 'b', text: '30 jours', isCorrect: true },
          { id: 'c', text: '60 jours', isCorrect: false },
          { id: 'd', text: '90 jours', isCorrect: false },
        ],
      },
      {
        type: 'TRUE_FALSE' as const,
        question: 'Le syndic ne peut ouvrir une enqu\u00eate que s\u2019il re\u00e7oit une plainte formelle.',
        sortOrder: 2,
        points: 1,
        explanation: 'Faux. Le syndic peut ouvrir une enqu\u00eate de sa propre initiative (d\u2019office) s\u2019il prend connaissance de faits pouvant constituer un manquement d\u00e9ontologique.',
        options: [
          { id: 'vrai', text: 'Vrai', isCorrect: false },
          { id: 'faux', text: 'Faux', isCorrect: true },
        ],
      },
      {
        type: 'MULTIPLE_CHOICE' as const,
        question: 'Quelle est la sanction la plus s\u00e9v\u00e8re que peut imposer le comit\u00e9 de discipline?',
        sortOrder: 3,
        points: 1,
        explanation: 'La radiation permanente est la sanction la plus grave, retirant d\u00e9finitivement le droit d\u2019exercer.',
        options: [
          { id: 'a', text: 'Une amende de 50\u2009000$', isCorrect: false },
          { id: 'b', text: 'Une suspension de 5 ans', isCorrect: false },
          { id: 'c', text: 'La radiation permanente', isCorrect: true },
          { id: 'd', text: 'L\u2019emprisonnement', isCorrect: false },
        ],
      },
      {
        type: 'MULTIPLE_CHOICE' as const,
        question: 'Quelle est la meilleure strat\u00e9gie pr\u00e9ventive contre les plaintes disciplinaires?',
        sortOrder: 4,
        points: 1,
        explanation: 'La documentation rigoureuse est la meilleure d\u00e9fense : un dossier complet et \u00e0 jour d\u00e9montre la diligence du repr\u00e9sentant en cas d\u2019enqu\u00eate.',
        options: [
          { id: 'a', text: '\u00c9viter les clients difficiles', isCorrect: false },
          { id: 'b', text: 'Documentation rigoureuse de chaque dossier et interaction', isCorrect: true },
          { id: 'c', text: 'Ne vendre que des produits \u00e0 bas prix', isCorrect: false },
          { id: 'd', text: 'Minimiser le contact direct avec les clients', isCorrect: false },
        ],
      },
    ],
  },
];

const CONCEPTS_3 = [
  { slug: 'probite-integrite', name: 'Probit\u00e9 et int\u00e9grit\u00e9', domain: 'ethique', description: 'Obligation fondamentale d\u2019honn\u00eatet\u00e9 rigoureuse dans toutes les dimensions de la pratique.', difficulty: 0.3, estimatedMinutes: 20, bloomLevel: 2 },
  { slug: 'devoir-conseil', name: 'Devoir de conseil', domain: 'ethique', description: 'Obligation de conseiller ad\u00e9quatement et de guider le client vers les meilleures solutions.', difficulty: 0.5, estimatedMinutes: 30, bloomLevel: 3 },
  { slug: 'kyc-connaitre-client', name: 'KYC', domain: 'conformite-amf', description: 'Obligation de conna\u00eetre son client : identit\u00e9, situation, besoins, tol\u00e9rance au risque.', difficulty: 0.5, estimatedMinutes: 25, bloomLevel: 3 },
  { slug: 'convenance-suitability', name: 'Convenance', domain: 'ethique', description: 'Obligation de recommander uniquement des produits convenables pour le client sp\u00e9cifique.', difficulty: 0.6, estimatedMinutes: 30, bloomLevel: 4 },
  { slug: 'processus-disciplinaire', name: 'Processus disciplinaire', domain: 'ethique', description: 'Syst\u00e8me disciplinaire : syndic, comit\u00e9 de discipline, sanctions et voies d\u2019appel.', difficulty: 0.5, estimatedMinutes: 35, bloomLevel: 3 },
  { slug: 'tenue-dossiers', name: 'Tenue de dossiers', domain: 'conformite-amf', description: 'Obligations de documentation et de conservation des dossiers clients.', difficulty: 0.4, estimatedMinutes: 25, bloomLevel: 2 },
];

const CONCEPT_PREREQS_3 = [
  { conceptSlug: 'devoir-conseil', prerequisiteSlug: 'probite-integrite', strength: 0.7 },
  { conceptSlug: 'convenance-suitability', prerequisiteSlug: 'kyc-connaitre-client', strength: 0.9 },
  { conceptSlug: 'convenance-suitability', prerequisiteSlug: 'devoir-conseil', strength: 0.8 },
  { conceptSlug: 'processus-disciplinaire', prerequisiteSlug: 'probite-integrite', strength: 0.5 },
  { conceptSlug: 'tenue-dossiers', prerequisiteSlug: 'devoir-conseil', strength: 0.6 },
];

// ==========================================================================
// All courses aggregated
// ==========================================================================

const ALL_COURSES = [
  { course: COURSE_1, chapters: CHAPTERS_1, quizzes: QUIZZES_1, concepts: CONCEPTS_1, prereqs: CONCEPT_PREREQS_1 },
  { course: COURSE_2, chapters: CHAPTERS_2, quizzes: QUIZZES_2, concepts: CONCEPTS_2, prereqs: CONCEPT_PREREQS_2 },
  { course: COURSE_3, chapters: CHAPTERS_3, quizzes: QUIZZES_3, concepts: CONCEPTS_3, prereqs: CONCEPT_PREREQS_3 },
];

// ---------------------------------------------------------------------------
// Main seed function
// ---------------------------------------------------------------------------

async function main() {
  console.log('\n=== LMS Courses Seed Script (3 Additional Courses) ===\n');

  const args = parseArgs();

  // Resolve tenantId
  let tenantId = args.tenantId;
  if (!tenantId) {
    tenantId = process.env.TENANT_ID ?? undefined;
  }
  if (!tenantId) {
    const ownerUser = await prisma.user.findFirst({
      where: { role: { in: ['OWNER', 'EMPLOYEE'] } },
      select: { tenantId: true },
      orderBy: { createdAt: 'asc' },
    });
    if (ownerUser?.tenantId) {
      const tenant = await prisma.tenant.findUnique({ where: { id: ownerUser.tenantId }, select: { id: true, name: true } });
      if (tenant) {
        tenantId = tenant.id;
        log('i', `Using tenant with OWNER users: "${tenant.name}" (${tenantId})`);
      }
    }
    if (!tenantId) {
      const firstTenant = await prisma.tenant.findFirst({ select: { id: true, name: true } });
      if (!firstTenant) {
        console.error('ERROR: No tenant found in the database. Pass --tenant-id <id> or create a tenant first.');
        process.exit(1);
      }
      tenantId = firstTenant.id;
      log('i', `Using first tenant: "${firstTenant.name}" (${tenantId})`);
    }
  } else {
    log('i', `Using tenant ID: ${tenantId}`);
  }

  // Find instructor (should have been created by seed-lms.ts)
  const instructor = await prisma.instructorProfile.findFirst({
    where: { tenantId },
    select: { id: true },
    orderBy: { createdAt: 'asc' },
  });
  if (!instructor) {
    console.error('ERROR: No instructor found. Run seed-lms.ts first.');
    process.exit(1);
  }
  log('i', `Using instructor: ${instructor.id}`);

  // Find certificate template
  const template = await prisma.certificateTemplate.findFirst({
    where: { tenantId },
    select: { id: true },
  });
  if (!template) {
    console.error('ERROR: No certificate template found. Run seed-lms.ts first.');
    process.exit(1);
  }
  log('i', `Using certificate template: ${template.id}`);

  // Find regulatory body (AMF)
  const regBody = await prisma.regulatoryBody.findFirst({
    where: { tenantId, code: 'AMF' },
    select: { id: true },
  });
  if (!regBody) {
    console.error('ERROR: No AMF regulatory body found. Run seed-lms.ts first.');
    process.exit(1);
  }
  log('i', `Using regulatory body AMF: ${regBody.id}\n`);

  // Load category map
  const categories = await prisma.courseCategory.findMany({
    where: { tenantId },
    select: { id: true, slug: true },
  });
  const categoryMap = new Map<string, string>();
  for (const cat of categories) {
    categoryMap.set(cat.slug, cat.id);
  }

  // -----------------------------------------------------------------------
  // Seed each course
  // -----------------------------------------------------------------------
  let totalCourses = 0;
  let totalChapters = 0;
  let totalLessons = 0;
  let totalQuizzes = 0;
  let totalQuestions = 0;
  let totalConcepts = 0;
  let totalPrereqs = 0;

  for (const courseDef of ALL_COURSES) {
    const { course: courseMeta, chapters, quizzes, concepts, prereqs } = courseDef;

    console.log(`\n--- Course: ${courseMeta.title} ---`);

    // Create or find course
    const existingCourse = await prisma.course.findFirst({
      where: { tenantId, slug: courseMeta.slug },
    });

    const categoryId = categoryMap.get(courseMeta.categorySlug);
    if (!categoryId) {
      log('!', `Category "${courseMeta.categorySlug}" not found. Skipping course.`);
      continue;
    }

    const { categorySlug, ...courseData } = courseMeta;
    const course = existingCourse ?? await prisma.course.create({
      data: {
        tenantId,
        ...courseData,
        categoryId,
        instructorId: instructor.id,
        certificateTemplateId: template.id,
        publishedAt: new Date(),
      },
    });
    log(existingCourse ? '-' : '+', `Course: "${courseMeta.title}"${existingCourse ? ' (already exists)' : ''}`);
    totalCourses++;

    // Chapters and Lessons
    const chapterIds: string[] = [];

    for (const chapterDef of chapters) {
      const existingChapter = await prisma.courseChapter.findFirst({
        where: { tenantId, courseId: course.id, title: chapterDef.title },
      });

      const chapter = existingChapter ?? await prisma.courseChapter.create({
        data: {
          tenantId,
          courseId: course.id,
          title: chapterDef.title,
          description: chapterDef.description,
          sortOrder: chapterDef.sortOrder,
          isPublished: true,
        },
      });
      chapterIds.push(chapter.id);
      log(existingChapter ? '-' : '+', `  Chapter: "${chapterDef.title}"${existingChapter ? ' (already exists)' : ''}`);
      totalChapters++;

      for (const lessonDef of chapterDef.lessons) {
        const existingLesson = await prisma.lesson.findFirst({
          where: { tenantId, chapterId: chapter.id, title: lessonDef.title },
        });
        if (!existingLesson) {
          await prisma.lesson.create({
            data: {
              tenantId,
              chapterId: chapter.id,
              title: lessonDef.title,
              description: lessonDef.description,
              type: 'TEXT',
              sortOrder: lessonDef.sortOrder,
              isPublished: true,
              isFree: lessonDef.sortOrder === 0 && chapterDef.sortOrder === 0,
              textContent: lessonDef.textContent,
              estimatedMinutes: lessonDef.estimatedMinutes,
            },
          });
          log('+', `    Lesson: "${lessonDef.title}"`);
        } else {
          log('-', `    Lesson: "${lessonDef.title}" (already exists)`);
        }
        totalLessons++;
      }
    }

    // Quizzes
    for (const quizDef of quizzes) {
      const chapterId = chapterIds[quizDef.chapterIndex];
      if (!chapterId) {
        log('!', `  Skipping quiz "${quizDef.title}" - chapter index ${quizDef.chapterIndex} not found`);
        continue;
      }

      const existingQuiz = await prisma.quiz.findFirst({
        where: { tenantId, title: quizDef.title },
      });

      if (existingQuiz) {
        log('-', `  Quiz: "${quizDef.title}" (already exists)`);
        totalQuizzes++;
        totalQuestions += quizDef.questions.length;
        continue;
      }

      const quiz = await prisma.quiz.create({
        data: {
          tenantId,
          title: quizDef.title,
          description: quizDef.description,
          passingScore: quizDef.passingScore,
          maxAttempts: quizDef.maxAttempts,
          timeLimit: quizDef.timeLimit,
          shuffleQuestions: true,
          showResults: true,
          questions: {
            create: quizDef.questions.map((q) => ({
              type: q.type,
              question: q.question,
              sortOrder: q.sortOrder,
              points: q.points,
              explanation: q.explanation,
              options: q.options,
            })),
          },
        },
      });

      // Create quiz-type lesson in the chapter
      await prisma.lesson.create({
        data: {
          tenantId,
          chapterId,
          title: quizDef.title,
          description: quizDef.description,
          type: 'QUIZ',
          sortOrder: 99,
          isPublished: true,
          quizId: quiz.id,
          estimatedMinutes: quizDef.timeLimit,
        },
      });

      log('+', `  Quiz: "${quizDef.title}" (${quizDef.questions.length} questions)`);
      totalQuizzes++;
      totalQuestions += quizDef.questions.length;
    }

    // Concepts
    const conceptMap = new Map<string, string>();

    for (const conceptDef of concepts) {
      const existing = await prisma.lmsConcept.findFirst({
        where: { tenantId, slug: conceptDef.slug },
      });

      if (existing) {
        conceptMap.set(conceptDef.slug, existing.id);
        log('-', `  Concept: "${conceptDef.name}" (already exists)`);
      } else {
        const created = await prisma.lmsConcept.create({
          data: {
            tenantId,
            slug: conceptDef.slug,
            name: conceptDef.name,
            description: conceptDef.description,
            domain: conceptDef.domain,
            difficulty: conceptDef.difficulty,
            estimatedMinutes: conceptDef.estimatedMinutes,
            targetBloomLevel: conceptDef.bloomLevel,
            isActive: true,
          },
        });
        conceptMap.set(conceptDef.slug, created.id);
        log('+', `  Concept: "${conceptDef.name}"`);
      }
      totalConcepts++;
    }

    // Concept Prerequisites
    for (const prereq of prereqs) {
      const conceptId = conceptMap.get(prereq.conceptSlug);
      const prerequisiteId = conceptMap.get(prereq.prerequisiteSlug);
      if (!conceptId || !prerequisiteId) {
        log('!', `  Skipping prereq: ${prereq.prerequisiteSlug} -> ${prereq.conceptSlug} (concept not found)`);
        continue;
      }

      const existing = await prisma.lmsConceptPrereq.findFirst({
        where: { conceptId, prerequisiteId },
      });

      if (existing) {
        log('-', `  Prereq: ${prereq.prerequisiteSlug} -> ${prereq.conceptSlug} (already exists)`);
      } else {
        await prisma.lmsConceptPrereq.create({
          data: {
            conceptId,
            prerequisiteId,
            strength: prereq.strength,
          },
        });
        log('+', `  Prereq: ${prereq.prerequisiteSlug} -> ${prereq.conceptSlug} (strength: ${prereq.strength})`);
      }
      totalPrereqs++;
    }

    // Course Accreditation
    const existingAccreditation = await prisma.courseAccreditation.findFirst({
      where: { tenantId, courseId: course.id, regulatoryBodyId: regBody.id },
    });

    if (existingAccreditation) {
      log('-', '  Accreditation: AMF (already exists)');
    } else {
      const ufcCreditsMap: Record<string, number> = {
        'assurance-vie-canada-guide': 8.0,
        'fonds-distincts-regimes-enregistres': 10.0,
        'deontologie-ethique-professionnelle': 5.0,
      };
      const ceCategoryMap: Record<string, string> = {
        'assurance-vie-canada-guide': 'GENERAL',
        'fonds-distincts-regimes-enregistres': 'GENERAL',
        'deontologie-ethique-professionnelle': 'ETHICS',
      };
      const accreditationNumberMap: Record<string, string> = {
        'assurance-vie-canada-guide': 'AMF-2026-FC-002',
        'fonds-distincts-regimes-enregistres': 'AMF-2026-FC-003',
        'deontologie-ethique-professionnelle': 'AMF-2026-FC-004',
      };

      await prisma.courseAccreditation.create({
        data: {
          tenantId,
          courseId: course.id,
          regulatoryBodyId: regBody.id,
          ufcCredits: new Prisma.Decimal(ufcCreditsMap[courseMeta.slug] ?? 5.0),
          ceCategory: ceCategoryMap[courseMeta.slug] ?? 'GENERAL',
          licenseTypes: ['LIFE_INSURANCE', 'DAMAGE_INSURANCE'],
          accreditationNumber: accreditationNumberMap[courseMeta.slug] ?? `AMF-2026-FC-${courseMeta.slug}`,
          status: 'APPROVED',
          approvedAt: new Date(),
          expiresAt: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000), // +2 years
        },
      });
      log('+', `  Accreditation: AMF (${ufcCreditsMap[courseMeta.slug]} UFC, ${ceCategoryMap[courseMeta.slug]})`);
    }
  }

  // -----------------------------------------------------------------------
  // Summary
  // -----------------------------------------------------------------------
  console.log('\n=== Seed Complete ===');
  console.log(`  Tenant:       ${tenantId}`);
  console.log(`  Courses:      ${totalCourses}`);
  console.log(`  Chapters:     ${totalChapters}`);
  console.log(`  Lessons:      ${totalLessons} + ${totalQuizzes} quiz lessons`);
  console.log(`  Quizzes:      ${totalQuizzes} (${totalQuestions} questions total)`);
  console.log(`  Concepts:     ${totalConcepts} (${totalPrereqs} prerequisites)`);
  console.log(`  Accreditations: ${totalCourses}`);
  console.log('');
}

// ---------------------------------------------------------------------------
// Execute
// ---------------------------------------------------------------------------

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nFATAL ERROR:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
