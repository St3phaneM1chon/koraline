# Import et Export de Donnees CRM

> **Section**: CRM > Import/Export
> **URL**: `/admin/crm/import`, `/admin/crm/export`
> **Niveau**: Debutant a intermediaire
> **Temps de lecture**: ~15 minutes

---

## A quoi sert cette page ?

Les outils d'**Import et Export** permettent de faire entrer des donnees dans le CRM depuis des sources externes (fichiers CSV, Excel, autres systemes) et d'en extraire pour les utiliser ailleurs (comptabilite, rapports, autres outils).

**En tant que gestionnaire, vous pouvez :**
- Importer des contacts, leads ou entreprises depuis un fichier CSV/Excel
- Mapper les colonnes de votre fichier aux champs du CRM
- Detecter et gerer les doublons pendant l'import
- Exporter des contacts, deals ou rapports en CSV/Excel/PDF
- Programmer des exports automatiques
- Migrer des donnees depuis un autre CRM

---

## Concepts de base pour les debutants

### Pourquoi importer des donnees ?

Plusieurs situations courantes :
- Vous **migrez** d'un autre CRM (Salesforce, HubSpot, Excel maison)
- Vous avez collecte des **contacts a un salon** (scanner de badges → CSV)
- Un partenaire vous envoie une **liste de leads** referres
- Vous avez un fichier Excel de clients existants a integrer

### Pourquoi exporter des donnees ?

- **Comptabilite** : envoyer la liste des clients a votre comptable
- **Marketing** : utiliser les donnees dans un outil externe (Mailchimp)
- **Analyse** : travailler les donnees dans Excel ou Google Sheets
- **Sauvegarde** : garder une copie de vos donnees CRM
- **Rapport** : presentation a la direction

---

## Comment y acceder

- **Import** : depuis le ruban de la page Contacts/Leads, bouton **Importer**
- **Export** : depuis le ruban de n'importe quelle page avec des donnees, bouton **Exporter**
- Via le panneau CRM, sous la section appropriee

---

## Fonctionnalites detaillees

### 1. Importer des contacts

**Formats acceptes** :
- CSV (virgule, point-virgule ou tabulation)
- Excel (.xlsx)
- vCard (.vcf)

**Etapes** :
1. Cliquez sur **Importer** dans le ruban
2. Selectionnez votre fichier
3. Le systeme analyse les colonnes et propose un **mappage automatique** :

| Colonne du fichier | Champ CRM detecte | Statut |
|--------------------|--------------------|--------|
| Nom | Nom de famille | Automatique |
| Prenom | Prenom | Automatique |
| Courriel | Email | Automatique |
| Tel | Telephone | Automatique |
| Ville | Ville | Automatique |
| Colonne inconnue | ??? | A mapper manuellement |

4. Verifiez et ajustez le mappage si necessaire
5. Configurez les options :
   - **Doublons** : ignorer, mettre a jour, creer quand meme
   - **Tags** : tag a appliquer a tous les imports (ex: "Import salon 2026")
   - **Assignation** : representant par defaut
   - **Source** : d'ou viennent ces contacts
6. Cliquez sur **Previsualiser** pour verifier les 5 premieres lignes
7. Cliquez sur **Importer**
8. Le systeme traite le fichier et affiche un rapport :
   - X contacts crees
   - X mis a jour (doublons)
   - X ignores (erreurs)

> **Astuce** : Pour les gros fichiers (plus de 10 000 lignes), l'import se fait en arriere-plan et vous recevrez une notification a la fin.

### 2. Gerer les doublons a l'import

**Detection des doublons** :

Le systeme compare les contacts importes avec la base existante sur :
- **Email** (critere principal)
- **Telephone** (critere secondaire)
- **Nom + Prenom** (critere complementaire)

**Options en cas de doublon** :

| Option | Comportement |
|--------|-------------|
| **Ignorer** | Le contact du fichier est ignore, l'existant est conserve tel quel |
| **Mettre a jour** | Les champs vides de l'existant sont completes avec les donnees du fichier |
| **Ecraser** | Les donnees du fichier remplacent celles de l'existant |
| **Creer quand meme** | Un nouveau contact est cree (doublon volontaire) |

### 3. Exporter des contacts

**Etapes** :
1. Allez sur la page dont vous voulez exporter les donnees
2. Appliquez les filtres souhaites (ne pas tout exporter si vous n'avez besoin que d'un segment)
3. Cliquez sur **Exporter** dans le ruban
4. Choisissez le format :
   - **CSV** : compatible avec tout (Excel, Google Sheets, etc.)
   - **Excel** (.xlsx) : format natif Microsoft Excel
   - **PDF** : pour impression ou partage
5. Selectionnez les colonnes a inclure (ou laissez tout)
6. Cliquez sur **Telecharger**

### 4. Exporter des rapports

**Etapes** :
1. Ouvrez le rapport souhaite (analytics, funnel, CLV, etc.)
2. Cliquez sur l'icone **Exporter** en haut a droite du rapport
3. Choisissez le format (PDF pour presentation, CSV pour analyse)
4. Le fichier est telecharge

### 5. Exports programmes

**Objectif** : Recevoir automatiquement un export par email a intervalle regulier.

**Etapes** :
1. Configurez un export normalement
2. Au lieu de telecharger, cliquez sur **Programmer**
3. Choisissez la frequence : quotidien, hebdomadaire, mensuel
4. Indiquez l'adresse email de destination
5. Le systeme enverra le fichier automatiquement

### 6. Migration depuis un autre CRM

**Objectif** : Transferer toutes vos donnees depuis un CRM existant.

**CRM supportes** :
- Salesforce (export CSV standard)
- HubSpot (export CSV standard)
- Zoho CRM (export CSV)
- Tout CRM exportant en CSV

**Processus recommande** :
1. Exportez les donnees de l'ancien CRM en CSV
2. Nettoyez le fichier (supprimez les colonnes inutiles, corrigez les erreurs)
3. Preparez un fichier de mappage (quelles colonnes correspondent a quoi)
4. Importez d'abord les **entreprises**
5. Puis importez les **contacts** (en les associant aux entreprises)
6. Enfin, importez les **deals** (en les associant aux contacts)
7. Verifiez les donnees importees

> **Important** : Faites toujours un test avec un petit echantillon (10-20 lignes) avant d'importer la totalite.

---

## Modele de fichier CSV pour l'import

Pour un import optimal, structurez votre fichier ainsi :

```csv
prenom,nom,email,telephone,entreprise,poste,ville,province,source,notes
Marie,Tremblay,marie@clinique.ca,514-555-0101,Clinique Sante Plus,Directrice,Montreal,QC,Salon Bio 2026,Interessee par BPC-157
Jean,Martin,jmartin@pharma.ca,418-555-0202,Pharmacie Martin,Proprietaire,Quebec,QC,Referral,Deja client peptides
```

**Conseils pour un fichier propre** :
- Une seule ligne d'en-tete
- Pas de lignes vides
- Encodage UTF-8 (pour les caracteres accentues)
- Un contact par ligne
- Pas de formules Excel, uniquement des valeurs

---

## Questions frequentes (FAQ)

**Q : Combien de contacts puis-je importer a la fois ?**
R : Il n'y a pas de limite stricte, mais au-dela de 50 000 contacts, l'import se fait en arriere-plan par lots pour eviter les timeouts.

**Q : L'import peut-il creer des doublons ?**
R : Oui, si la detection de doublons est desactivee ou si les criteres ne correspondent pas. Il est recommande de toujours activer la detection sur l'email.

**Q : Puis-je annuler un import ?**
R : Pas directement. Cependant, si vous avez applique un tag a l'import (ex: "Import test"), vous pouvez filtrer et supprimer tous les contacts ayant ce tag.

**Q : L'export inclut-il les donnees sensibles ?**
R : L'export respecte les permissions de l'utilisateur. Seuls les champs auxquels vous avez acces sont inclus. Les donnees de paiement (numeros de carte) ne sont jamais exportees.

**Q : Quel format est le plus fiable pour l'import ?**
R : CSV avec encodage UTF-8 et separateur virgule. C'est le format le plus universel et le moins sujet a des erreurs d'interpretation.

---

## Glossaire

| Terme | Definition |
|-------|-----------|
| **CSV** | Comma-Separated Values, format de fichier texte avec separateur |
| **Mappage** | Association entre les colonnes d'un fichier et les champs du CRM |
| **Doublon** | Deux fiches representant la meme personne/entreprise |
| **Migration** | Transfert de donnees d'un systeme a un autre |
| **Export programme** | Export automatique envoye par email a intervalle regulier |
| **UTF-8** | Encodage de caracteres supportant les accents et caracteres speciaux |

---

## Pages reliees

- [Contacts](/admin/crm/contacts) : Destination principale des imports
- [Leads](/admin/crm/leads) : Import de prospects
- [Entreprises](/admin/crm/companies) : Import d'organisations
- [Doublons](/admin/crm/duplicates) : Gestion post-import des doublons
- [Rapports](/admin/crm/analytics) : Source des exports de rapports
