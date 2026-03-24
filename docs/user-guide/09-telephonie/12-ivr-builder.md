# Constructeur IVR

> **Section**: Telephonie > IVR Builder

---

## Concepts pour debutants

L'**IVR** (Interactive Voice Response) est le menu vocal automatise qui accueille les appelants
et les dirige vers le bon service. Par exemple : "Appuyez sur 1 pour les ventes, 2 pour le
support, 3 pour la comptabilite." C'est la premiere interaction telephonique avec votre entreprise.

Le **constructeur IVR** de Koraline permet de creer et modifier ces menus vocaux visuellement,
sans competences techniques. Chaque menu definit un message d'accueil (texte-a-parole ou fichier
audio), des options DTMF (touches du clavier), et des actions associees (transfert, sous-menu,
messagerie, raccrocher).

Les menus peuvent etre imbriques : une option peut pointer vers un sous-menu, permettant
une arborescence de choix.

---

## Comment y acceder

1. Dans le panneau d'administration, cliquez sur l'icone **Telephone** dans la barre laterale.
2. Sous **Avance**, cliquez sur **IVR Builder**.
3. L'URL directe est : `/admin/telephonie/ivr-builder`

---

## Apercu de l'interface

### Panneau gauche : Liste des menus
La colonne de gauche liste tous les menus IVR existants :
- **Nom** du menu
- **Nombre d'options** et langue
- Le menu selectionne est surligne en bleu

### Bouton "Nouveau menu"
En haut de la liste, un bouton permet de creer un nouveau menu.

### Zone principale : Vue du flow
Quand un menu est selectionne, la zone centrale affiche sa structure visuelle :

**Carte d'en-tete du menu** :
- Nom et description
- Message d'accueil (texte TTS entre guillemets)
- Parametres : timeout, nombre de tentatives, action sur timeout, langue
- Bouton "Modifier" pour editer

**Grille d'options DTMF** :
Chaque option est une carte affichant :
- Badge numerote (1-9, 0, *, #)
- Libelle de l'option (ex: "Service des ventes")
- Action et destination (ex: "Transfert vers file > Ventes")
- Lien cliquable vers le sous-menu si applicable

**Lien heures non ouvrables** :
Si configure, un bandeau ambre affiche les horaires d'ouverture et le menu utilise
en dehors de ces heures.

---

## Fonctions detaillees

### Formulaire d'edition de menu

| Champ | Description |
|-------|-------------|
| **Nom** | Identifiant du menu (ex: "Menu principal") |
| **Description** | Description optionnelle |
| **Message d'accueil TTS** | Texte lu par la synthese vocale |
| **URL audio** | Fichier audio personnalise (alternative au TTS) |
| **Timeout** | Secondes d'attente avant de repeter/agir (1-30s) |
| **Tentatives max** | Nombre de repetitions avant l'action de timeout (0-10) |
| **Action sur timeout** | Que faire apres les tentatives : Rejouer, Operateur, Messagerie |

### Actions DTMF

| Action | Description | Necessite une cible |
|--------|-------------|---------------------|
| **Transfert vers extension** | Diriger vers un poste specifique | Oui (numero d'extension) |
| **Transfert vers file** | Diriger vers un groupe de sonnerie | Oui (nom de la file) |
| **Sous-menu** | Aller vers un autre menu IVR | Oui (ID du menu) |
| **Messagerie vocale** | Diriger vers la boite vocale | Oui (extension cible) |
| **Rejouer** | Relire le message d'accueil | Non |
| **Raccrocher** | Terminer l'appel | Non |

### Touches DTMF disponibles
12 touches au total : 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, *, #. Chaque touche ne peut etre
assignee qu'une fois par menu.

### Menus imbriques
L'action "Sous-menu" permet de creer une arborescence. Par exemple :
- Menu principal > Touche 1 > Sous-menu "Ventes"
  - Sous-menu Ventes > Touche 1 > "Peptides therapeutiques"
  - Sous-menu Ventes > Touche 2 > "Peptides cosmetiques"

Depuis la vue flow, un lien cliquable permet de naviguer directement vers le sous-menu.

### Horaires d'ouverture
Chaque menu peut definir des horaires d'ouverture et un menu alternatif pour les
heures non ouvrables. En dehors des heures definies, les appels sont rediriges
automatiquement vers le menu alternatif.

---

## Workflows courants

### Workflow 1 : Creer le menu principal
1. Cliquez sur **Nouveau menu**.
2. Nommez-le "Menu principal".
3. Redigez le message d'accueil : "Bienvenue chez BioCycle Peptides. Pour les ventes,
   appuyez sur 1. Pour le support, appuyez sur 2. Pour laisser un message, appuyez sur 3."
4. Ajoutez les options :
   - Touche 1 > Transfert vers file > "Ventes"
   - Touche 2 > Transfert vers file > "Support"
   - Touche 3 > Messagerie vocale
5. Definissez le timeout a 5 secondes et 3 tentatives max.
6. Sauvegardez.

### Workflow 2 : Ajouter un menu apres les heures
1. Creez un nouveau menu "Hors heures".
2. Message d'accueil : "Nos bureaux sont fermes. Pour laisser un message, appuyez sur 1."
3. Option 1 > Messagerie vocale.
4. Dans le menu principal, configurez les horaires (9h-17h) et associez le menu "Hors heures".

---

## FAQ

**Q : Puis-je utiliser un fichier audio au lieu du texte-a-parole ?**
R : Oui, vous pouvez fournir une URL vers un fichier audio MP3 ou WAV.

**Q : Le texte-a-parole supporte-t-il le francais ?**
R : Oui, le TTS Telnyx supporte le francais canadien.

**Q : Combien de niveaux d'imbrication sont possibles ?**
R : Il n'y a pas de limite technique, mais plus de 3 niveaux nuit a l'experience client.

---

## Strategie expert : Conception du menu vocal optimal pour une PME de peptides (1-5 employes)

### Principes de conception pour une petite equipe

Avec 1 a 5 employes, la complexite du menu vocal doit rester minimale. Un IVR trop profond frustre les appelants et surcharge inutilement une equipe reduite. La regle absolue : **maximum 4 options au niveau 1, maximum 2 niveaux d'imbrication**.

**Regles d'or de l'IVR pour une PME :**

| Regle | Justification |
|-------|---------------|
| Maximum 4 options au niveau 1 | Au-dela, les appelants oublient les premieres options (limite de la memoire de travail) |
| Maximum 2 niveaux de profondeur | Chaque niveau supplementaire cause 10-15% d'abandon d'appel |
| Option "parler a un humain" toujours disponible | Les appels B2B veulent souvent un contact direct immediat |
| Duree totale du message d'accueil < 30 secondes | Les appelants decrochent mentalement apres 30 secondes |
| Pas de musique d'attente generique | Utiliser un message informatif (horaires, site web, email) |

### Message d'accueil bilingue FR/EN

Le Quebec impose la primaute du francais (Loi 101 / Charte de la langue francaise), mais la clientele de BioCycle Peptides est souvent bilingue ou anglophone (chercheurs, institutions). Voici la structure recommandee :

**Message d'accueil principal (francais en premier, conformement a la Loi 101) :**

> "Bienvenue chez BioCycle Peptides. Pour le service en francais, appuyez sur 1 ou restez en ligne. For service in English, press 2."

**Apres le choix de langue -- Menu francais :**

> "Pour passer une commande ou pour nos produits, appuyez sur 1. Pour le suivi d'une commande existante, appuyez sur 2. Pour le support technique, appuyez sur 3. Pour laisser un message, appuyez sur 4."

**Apres le choix de langue -- Menu anglais :**

> "To place an order or for product information, press 1. For order tracking, press 2. For technical support, press 3. To leave a message, press 4."

### Structure IVR recommandee pour BioCycle Peptides

```
Menu Principal (Niveau 0)
|
+-- Touche 1 : Francais → Menu FR (Niveau 1)
|   +-- Touche 1 : Commandes / Produits → File "Ventes" (ou extension directe si 1 vendeur)
|   +-- Touche 2 : Suivi commande → File "Support" (ou extension directe)
|   +-- Touche 3 : Support technique → File "Support" (ou extension directe)
|   +-- Touche 4 : Messagerie vocale → Boite vocale generale
|
+-- Touche 2 : English → Menu EN (Niveau 1)
|   +-- (Meme structure qu'en francais, messages en anglais)
|
+-- Timeout (5 sec, 3 tentatives) → Transfert vers receptionniste ou messagerie
```

### Parametres techniques recommandes

| Parametre | Valeur | Justification |
|-----------|--------|---------------|
| **Timeout** | 5 secondes | Assez court pour ne pas frustrer, assez long pour reflenir |
| **Tentatives max** | 3 | Apres 3 tentatives sans saisie, transferer a un humain |
| **Action sur timeout** | Transfert vers operateur (heures ouvrables) / Messagerie (hors heures) | Ne jamais raccrocher automatiquement |
| **Langue TTS** | Francais canadien (fr-CA) | Important : le francais de France sonne artificiel au Quebec |
| **Vitesse TTS** | Normale a legirement lente | Les appelants doivent comprendre du premier coup |

### Messages d'attente professionnels

Quand l'appelant est en file d'attente, ne pas utiliser de musique generique. Utiliser des messages informatifs qui reduisent la frustration et renforcent la marque :

**Rotation de 3 messages (toutes les 30 secondes) :**

1. "Merci de patienter. Un conseiller sera avec vous sous peu. Saviez-vous que vous pouvez passer commande directement sur notre site biocyclepeptides.com ?"

2. "Votre appel est important pour nous. En attendant, nous vous rappelons que tous nos peptides sont accompagnes d'un certificat d'analyse verifiable en ligne."

3. "Nous traitons votre appel dans l'ordre de reception. Pour les questions simples comme le suivi de commande, visitez votre espace client sur biocyclepeptides.com."

**Message hors heures d'ouverture :**

> "Merci d'avoir appele BioCycle Peptides. Nos bureaux sont ouverts du lundi au vendredi, de 9 heures a 17 heures, heure de l'Est. Pour passer une commande, visitez biocyclepeptides.com. Pour laisser un message, appuyez sur 1. Nous vous rappellerons le prochain jour ouvrable."

### Horaires d'ouverture recommandes

| Jour | Horaires | Justification |
|------|----------|---------------|
| **Lundi - Vendredi** | 9h00 - 17h00 EST | Heures de bureau standard Quebec |
| **Samedi** | Ferme (ou 10h-14h si volume le justifie) | Les clients B2B sont rarement actifs le samedi |
| **Dimanche et jours feries** | Ferme | Message hors heures + messagerie vocale |

**Jours feries a configurer dans le systeme :**
- Jour de l'An, Vendredi saint, Lundi de Paques, Journee nationale des patriotes, Fete nationale du Quebec (24 juin), Fete du Canada (1er juillet), Fete du Travail, Action de graces, Noel, Lendemain de Noel

### Metriques de performance de l'IVR

| Indicateur | Cible | Seuil d'alerte |
|------------|-------|----------------|
| Taux d'abandon dans l'IVR | < 5% | > 10% |
| Temps moyen dans l'IVR avant connexion humaine | < 45 secondes | > 90 secondes |
| Taux d'utilisation de la messagerie vocale | < 15% des appels totaux | > 25% (indique un sous-effectif) |
| Taux de "0 pour operateur" | < 20% | > 35% (le menu est mal concu) |
| Appels raccroches pendant l'attente | < 8% | > 15% (attente trop longue) |

---

## Glossaire

| Terme | Definition |
|-------|-----------|
| **IVR** | Interactive Voice Response, menu vocal interactif |
| **DTMF** | Dual-Tone Multi-Frequency, signaux des touches telephoniques |
| **TTS** | Text-to-Speech, synthese vocale a partir de texte |
| **Arborescence** | Structure hierarchique de menus imbriques |

---

## Pages associees

- [Groupes de sonnerie](./10-groupes.md) : Files d'attente ciblees par l'IVR
- [Transferts](./09-transferts.md) : Renvois individuels en complement
- [Messagerie vocale](./04-messagerie.md) : Destination finale des appels
- [Parametres](./22-parametres.md) : Configuration des horaires d'ouverture
