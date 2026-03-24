# Journal d'Audit (Audit Logs)

> **Section**: Systeme > Logs d'audit
> **URL**: `/admin/logs`
> **Niveau**: Intermediaire a avance
> **Temps de lecture**: ~15 minutes

---

## A quoi sert cette page ?

Le **Journal d'audit** enregistre automatiquement toutes les actions effectuees par les utilisateurs dans Koraline. C'est une trace complete et inalterable de qui a fait quoi, quand et sur quoi.

**En tant qu'administrateur, vous pouvez :**
- Consulter l'historique complet des actions
- Filtrer par utilisateur, action, date ou section
- Rechercher une action specifique
- Exporter le journal pour audit externe
- Identifier les comportements suspects
- Verifier la conformite aux politiques internes

---

## Concepts de base pour les debutants

### Pourquoi un journal d'audit ?

- **Securite** : detecter les actions non autorisees ou suspectes
- **Conformite** : la Loi 25 (Quebec) exige la tracabilite des acces aux donnees personnelles
- **Depannage** : comprendre ce qui s'est passe en cas de probleme
- **Responsabilite** : savoir qui a modifie quoi

### Ce qui est enregistre

| Type d'action | Exemples |
|---------------|----------|
| **Connexion** | Login, logout, tentatives echouees |
| **Creation** | Nouvelle commande, nouveau contact, nouvelle facture |
| **Modification** | Changement de prix, modification de statut, mise a jour de role |
| **Suppression** | Suppression de produit, suppression de contact |
| **Export** | Telechargement de CSV, export de rapports |
| **Configuration** | Changement de parametres, modification de permissions |

---

## Comment y acceder

1. Systeme > **Logs d'audit** dans le panneau lateral
2. URL directe : `/admin/logs`

---

## Vue d'ensemble de l'interface

### La liste des evenements

| Colonne | Description |
|---------|-------------|
| **Date/Heure** | Moment exact de l'action |
| **Utilisateur** | Qui a effectue l'action |
| **Action** | Ce qui a ete fait (creation, modification, suppression) |
| **Section** | Ou l'action a eu lieu (Commerce, CRM, Comptabilite, etc.) |
| **Objet** | L'element affecte (commande #1234, contact Jean Martin) |
| **Details** | Information complementaire (ancien et nouveau valeur si modification) |
| **IP** | Adresse IP de l'utilisateur |

### Les filtres

| Filtre | Description |
|--------|-------------|
| **Utilisateur** | Voir les actions d'un utilisateur specifique |
| **Action** | Filtrer par type (creation, modification, suppression, export) |
| **Section** | Filtrer par module (Commerce, CRM, Systeme, etc.) |
| **Periode** | Date de debut et de fin |
| **Recherche** | Recherche textuelle dans les details |

---

## Fonctionnalites detaillees

### 1. Investiguer un evenement

**Etapes** :
1. Utilisez les filtres pour trouver l'evenement
2. Cliquez sur la ligne pour voir les details complets
3. Pour les modifications, vous voyez l'**avant** et l'**apres** :
   ```
   Modification du produit "BPC-157 Oral 60 caps"
   Champ : prix
   Avant : 89,95 $
   Apres : 94,95 $
   Par : Marie Lavoie
   Le : 2026-03-15 14:32:18
   IP : 192.168.1.42
   ```

### 2. Detecter les anomalies

**Signaux d'alerte** :
- Connexions en dehors des heures de bureau
- Nombreuses tentatives de connexion echouees
- Exports massifs de donnees
- Modifications de permissions par un non-administrateur
- Suppressions en masse

### 3. Exporter le journal

**Etapes** :
1. Appliquez les filtres souhaites
2. Cliquez sur **Exporter**
3. Choisissez le format (CSV, PDF)
4. Le journal filtre est telecharge

> **Note** : L'export du journal d'audit est lui-meme enregistre dans le journal.

---

## Questions frequentes (FAQ)

**Q : Le journal peut-il etre modifie ou supprime ?**
R : Non. Le journal d'audit est en lecture seule et ne peut pas etre altere. C'est une exigence de securite et de conformite.

**Q : Combien de temps les logs sont-ils conserves ?**
R : Par defaut, 2 ans. Cette duree est configurable dans les parametres systeme.

**Q : Les actions des clients de la boutique sont-elles aussi enregistrees ?**
R : Les connexions des clients et les actions sensibles (changement de mot de passe, modification d'adresse) sont enregistrees. Les actions de navigation standard (consultation de produits) ne le sont pas.

---

## Glossaire

| Terme | Definition |
|-------|-----------|
| **Audit log** | Journal chronologique de toutes les actions dans le systeme |
| **Tracabilite** | Capacite de reconstituer l'historique d'une action |
| **IP** | Adresse Internet identifiant l'ordinateur de l'utilisateur |
| **Conformite** | Respect des lois et reglementations (Loi 25, LPRPDE) |

---

## Pages reliees

- [Utilisateurs](/admin/employes) : Qui effectue les actions
- [Roles](/admin/permissions) : Permissions des utilisateurs
- [Securite](/admin/securite) : Parametres de securite
- [Sauvegardes](/admin/backups) : Protection des donnees
