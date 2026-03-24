# Sauvegardes (Backups)

> **Section**: Systeme > Aurelia > Sauvegardes
> **URL**: `/admin/backups`
> **Niveau**: Intermediaire
> **Temps de lecture**: ~15 minutes

---

## A quoi sert cette page ?

La page **Sauvegardes** gere la protection des donnees de BioCycle Peptides contre la perte accidentelle, les pannes techniques ou les incidents de securite. Des sauvegardes regulieres et automatiques garantissent que vous pouvez toujours recuperer vos donnees.

**En tant qu'administrateur, vous pouvez :**
- Voir l'historique des sauvegardes effectuees
- Lancer une sauvegarde manuelle
- Telecharger une sauvegarde
- Restaurer une sauvegarde precedente
- Configurer la frequence des sauvegardes automatiques
- Verifier l'integrite des sauvegardes

---

## Concepts de base pour les debutants

### Pourquoi sauvegarder ?

Les donnees sont l'actif le plus precieux de votre entreprise. Sans sauvegarde, vous risquez de perdre :
- Toutes vos commandes et l'historique des ventes
- Les fiches contacts et l'historique CRM
- La comptabilite complete
- Les parametres et configurations

Les causes de perte possibles :
- **Panne materielle** : disque dur qui tombe en panne
- **Erreur humaine** : suppression accidentelle de donnees
- **Cyberattaque** : ransomware chiffrant vos donnees
- **Bug logiciel** : corruption de la base de donnees

### Regle du 3-2-1

La bonne pratique universelle :
- **3** copies des donnees
- **2** supports differents (serveur + cloud)
- **1** copie hors site (dans un autre lieu physique)

---

## Comment y acceder

1. Systeme > groupe **Aurelia** > **Sauvegardes**
2. URL directe : `/admin/backups`

---

## Vue d'ensemble de l'interface

### 1. L'etat des sauvegardes

En haut de la page, un resume :

| Indicateur | Description |
|------------|-------------|
| **Derniere sauvegarde** | Date et heure de la derniere sauvegarde reussie |
| **Prochaine sauvegarde** | Date et heure de la prochaine sauvegarde planifiee |
| **Taille** | Taille de la derniere sauvegarde |
| **Statut** | Reussi, en cours, ou echec |

### 2. L'historique des sauvegardes

| Colonne | Description |
|---------|-------------|
| **Date** | Quand la sauvegarde a ete effectuee |
| **Type** | Automatique ou manuelle |
| **Taille** | Volume de donnees sauvegardees |
| **Statut** | Succes ou echec |
| **Actions** | Telecharger, restaurer, supprimer |

---

## Fonctionnalites detaillees

### 1. Sauvegarde automatique

Le systeme effectue des sauvegardes automatiques selon ce calendrier :

| Frequence | Heure | Description |
|-----------|-------|-------------|
| **Quotidienne** | 3h00 AM | Sauvegarde complete de la base de donnees |
| **Bi-quotidienne** | 8h00 AM + 8h00 PM | Sauvegarde de la base de donnees |
| **Hebdomadaire** | Dimanche 4h00 AM | Sauvegarde complete (code + donnees) |

> **Note** : Les sauvegardes s'executent en arriere-plan sans affecter les performances du site.

### 2. Lancer une sauvegarde manuelle

**Quand** : Avant une operation risquee (mise a jour, migration, modification massive).

**Etapes** :
1. Cliquez sur **Sauvegarder maintenant**
2. Selectionnez le type :
   - **Base de donnees** : uniquement les donnees
   - **Complete** : donnees + fichiers (images, documents)
3. Attendez la fin du processus (barre de progression)
4. La sauvegarde apparait dans l'historique

### 3. Telecharger une sauvegarde

**Etapes** :
1. Trouvez la sauvegarde souhaitee dans l'historique
2. Cliquez sur **Telecharger**
3. Le fichier est telecharge (format compresse)
4. Conservez-le dans un endroit securise (disque externe, cloud)

### 4. Restaurer une sauvegarde

**Quand** : En cas de perte de donnees ou de corruption.

**Etapes** :
1. Trouvez la sauvegarde a restaurer
2. Cliquez sur **Restaurer**
3. Le systeme affiche un avertissement : la restauration remplace les donnees actuelles
4. Confirmez en tapant "RESTAURER"
5. Le processus demarre (peut prendre plusieurs minutes)
6. Le site sera temporairement indisponible pendant la restauration

> **Attention** : La restauration remplace TOUTES les donnees actuelles par celles de la sauvegarde. Les transactions effectuees entre la sauvegarde et la restauration seront perdues. Faites une sauvegarde des donnees actuelles AVANT de restaurer.

### 5. Verifier l'integrite

**Objectif** : S'assurer qu'une sauvegarde est lisible et complete.

**Etapes** :
1. Cliquez sur **Verifier** a cote d'une sauvegarde
2. Le systeme teste la lisibilite et l'integrite du fichier
3. Resultat : OK (sauvegarde valide) ou Erreur (sauvegarde corrompue)

---

## Bonnes pratiques

### A faire
- Verifier regulierement que les sauvegardes automatiques fonctionnent
- Telecharger une copie mensuelle sur un support externe
- Tester la restauration au moins une fois par an (sur un environnement de test)
- Sauvegarder manuellement avant toute operation majeure

### A ne pas faire
- Ne pas compter uniquement sur les sauvegardes automatiques sans verifier
- Ne pas stocker les sauvegardes uniquement sur le meme serveur que l'application
- Ne pas ignorer les alertes de sauvegarde echouee

---

## Questions frequentes (FAQ)

**Q : Combien de sauvegardes sont conservees ?**
R : Par defaut : 7 quotidiennes, 4 hebdomadaires et 3 mensuelles. Les plus anciennes sont supprimees automatiquement.

**Q : Les sauvegardes incluent-elles les fichiers uploades (images produits, etc.) ?**
R : Les sauvegardes completes (hebdomadaires) incluent tout. Les sauvegardes quotidiennes incluent uniquement la base de donnees.

**Q : La restauration affecte-t-elle les paiements Stripe ?**
R : Non. Stripe garde sa propre copie des paiements. La restauration ne remet pas les paiements Stripe a un etat precedent. Cependant, vous pourriez voir des incoherences temporaires entre Koraline et Stripe.

**Q : Puis-je restaurer partiellement (juste un client, juste une commande) ?**
R : Non, la restauration est globale. Pour recuperer des donnees specifiques, exportez-les depuis la sauvegarde et importez-les manuellement.

---

## Strategie expert : Politique de sauvegarde complete pour un e-commerce de peptides

### Regle 3-2-1 detaillee pour BioCycle Peptides

La regle 3-2-1 est le standard de l'industrie pour la protection des donnees. Voici son application concrete pour BioCycle Peptides :

**3 copies des donnees :**

| Copie | Emplacement | Type | Description |
|-------|-------------|------|-------------|
| **Copie 1 (primaire)** | Azure PostgreSQL Flexible Server | Base de donnees de production | La copie active, utilisee par le site en temps reel |
| **Copie 2 (locale)** | Serveur de backup Azure Storage (ou AWS S3) | Dump PostgreSQL chiffre | Sauvegarde automatique, meme region Azure |
| **Copie 3 (hors site)** | Support physique ou cloud secondaire (ex: Google Cloud Storage, disque externe chiffre) | Copie hors site | Protection contre la perte du centre de donnees principal |

**2 supports differents :**

| Support | Exemples | Avantage |
|---------|----------|----------|
| **Support 1** | Stockage cloud (Azure Blob Storage, AWS S3) | Haute disponibilite, acces rapide, redondance geographique |
| **Support 2** | Disque externe chiffre OU cloud secondaire d'un autre fournisseur | Protection contre la faillite/panne d'un fournisseur unique |

**1 copie hors site :**
La copie hors site doit etre dans un lieu physiquement different du datacenter principal. Pour BioCycle heberge sur Azure Canada Central (Toronto), la copie hors site peut etre :
- Azure Canada East (Quebec City)
- Un fournisseur cloud alternatif (AWS Montreal, Google Cloud Montreal)
- Un disque externe chiffre conserve dans un lieu securise hors bureau

### Frequence de sauvegarde recommandee

| Type de donnees | Frequence | Heure | Retention | Justification |
|-----------------|-----------|-------|-----------|---------------|
| **Base de donnees PostgreSQL** | 2x par jour | 8h00 + 20h00 EST | 30 jours quotidiennes + 12 mois mensuelles | Les commandes et transactions arrivent tout au long de la journee |
| **Fichiers uploades** (images produits, documents, CoA) | 1x par jour | 3h00 EST | 90 jours | Changent moins souvent que la BD, mais sont irreplacables |
| **Configuration systeme** (schema Prisma, .env, parametres) | A chaque changement | Immediate (hook git ou script) | Illimite (versionne dans git) | Un changement de config peut casser le site |
| **Code source** | Continue (git) | A chaque commit | Illimite (historique git complet) | Deja gere par GitHub |
| **Sauvegarde complete** (BD + fichiers + config) | Hebdomadaire | Dimanche 4h00 EST | 12 mois | Pour les restaurations completes |

### Test de restauration mensuel obligatoire

Une sauvegarde non testee est une sauvegarde qui n'existe pas. Chaque mois, effectuer un test de restauration complet :

**Procedure de test mensuel :**

| Etape | Action | Critere de succes |
|-------|--------|-------------------|
| 1 | Selectionner la sauvegarde la plus recente | Le fichier existe et est accessible |
| 2 | Verifier l'integrite du fichier (checksum SHA-256) | Le checksum correspond a celui enregistre lors de la sauvegarde |
| 3 | Restaurer sur un environnement de test (pas la production) | La restauration se termine sans erreur |
| 4 | Verifier les donnees : compter les commandes, clients, produits | Les compteurs correspondent aux valeurs attendues |
| 5 | Tester les fonctionnalites critiques : connexion, catalogue, panier | Le site fonctionne normalement |
| 6 | Documenter le resultat dans le registre de test | Date, duree, resultat, observations |

**Frequence des tests :**

| Type de test | Frequence | Duree estimee |
|-------------|-----------|---------------|
| Test d'integrite (checksum) | Hebdomadaire (automatise) | < 1 minute |
| Restauration partielle (BD seule sur env test) | Mensuelle | 30-60 minutes |
| Restauration complete (BD + fichiers sur env test) | Trimestrielle | 2-4 heures |
| Test de reprise apres sinistre (DR drill) | Annuelle | 1 journee |

### RTO et RPO cibles

Le RTO (Recovery Time Objective) et le RPO (Recovery Point Objective) definissent les engagements de l'entreprise en cas de sinistre.

| Metrique | Definition | Cible BioCycle | Justification |
|----------|-----------|---------------|---------------|
| **RPO** | Duree maximale de donnees perdues | < 1 heure | Avec 2 sauvegardes BD par jour (8h + 20h), le pire cas est la perte de 12 heures de donnees. Pour atteindre un RPO < 1h, activer la replication continue Azure PostgreSQL (point-in-time recovery). |
| **RTO** | Duree maximale d'indisponibilite | < 4 heures | Temps pour detecter le probleme (monitoring), decider de restaurer, executer la restauration et verifier. |

**Plan d'action par type de sinistre :**

| Sinistre | RPO reel | RTO reel | Actions |
|----------|---------|---------|---------|
| **Erreur humaine** (suppression accidentelle de donnees) | < 1h (point-in-time recovery Azure) | < 30 min | Restauration selective depuis le point-in-time recovery |
| **Corruption de base de donnees** | < 12h (derniere sauvegarde) | < 2h | Restauration complete depuis la derniere sauvegarde valide |
| **Ransomware / cyberattaque** | < 12h | < 4h | Isoler le systeme, restaurer depuis la copie hors site, changer tous les mots de passe |
| **Panne du datacenter Azure** | 0 (replication si activee) | < 1h (failover automatique) | Basculement vers la region secondaire |
| **Perte totale** (incendie, catastrophe) | < 24h (copie hors site) | < 8h | Reconstruction complete depuis la copie hors site + deploiement GitHub |

### Chiffrement des sauvegardes

Toutes les sauvegardes doivent etre chiffrees, au repos et en transit :

| Element | Methode de chiffrement | Cle |
|---------|----------------------|-----|
| Sauvegarde BD en transit | TLS 1.3 (Azure PostgreSQL force le SSL) | Certificat Azure |
| Sauvegarde BD au repos (Azure) | AES-256 (chiffrement transparent Azure) | Cle geree par Azure (ou cle client via Azure Key Vault) |
| Copie hors site | AES-256 avec cle symetrique | Cle stockee separement de la sauvegarde (jamais au meme endroit) |
| Disque externe | BitLocker (Windows) ou FileVault (macOS) | Mot de passe + cle de recuperation imprimee et stockee en coffre |

### Alertes et monitoring des sauvegardes

Ne jamais compter sur la memoire humaine pour verifier les sauvegardes. Configurer des alertes automatiques :

| Alerte | Condition | Action | Severite |
|--------|-----------|--------|----------|
| Sauvegarde echouee | Le job de sauvegarde retourne une erreur | Email + SMS au responsable technique | Critique |
| Sauvegarde manquante | Aucune sauvegarde depuis > 14h (pour les bi-quotidiennes) | Email au responsable | Haute |
| Espace de stockage faible | < 20% d'espace restant sur le stockage de sauvegardes | Email au responsable | Moyenne |
| Taille anormale | La sauvegarde est 50% plus petite que la precedente (possible corruption) | Email au responsable | Haute |
| Test de restauration en retard | Aucun test depuis > 35 jours | Email au responsable | Moyenne |

---

## Glossaire

| Terme | Definition |
|-------|-----------|
| **Sauvegarde** | Copie des donnees a un moment precis |
| **Restauration** | Remplacement des donnees actuelles par une sauvegarde |
| **Integrite** | Validite et completude d'une sauvegarde |
| **Sauvegarde incrementale** | Copie uniquement des changements depuis la derniere sauvegarde |
| **Sauvegarde complete** | Copie de toutes les donnees |
| **Regle 3-2-1** | 3 copies, 2 supports, 1 hors site |

---

## Pages reliees

- [Securite](/admin/securite) : Protection des donnees
- [Audit Logs](/admin/logs) : Tracabilite des actions
- [Parametres](/admin/parametres) : Configuration generale
- [Monitoring](/admin/monitoring) : Surveillance du systeme
