# Roles et Permissions

> **Section**: Systeme > Permissions
> **URL**: `/admin/permissions`
> **Niveau**: Intermediaire a avance
> **Temps de lecture**: ~20 minutes

---

## A quoi sert cette page ?

La page **Permissions** permet de definir les roles et les droits d'acces de chaque membre de l'equipe. Un role determine ce qu'un utilisateur peut voir et faire dans Koraline.

**En tant qu'administrateur, vous pouvez :**
- Consulter les roles existants et leurs permissions
- Creer des roles personnalises
- Modifier les permissions d'un role
- Attribuer un role a un ou plusieurs utilisateurs
- Definir des restrictions par section, par action, ou par donnee

---

## Concepts de base pour les debutants

### Qu'est-ce qu'une permission ?

Une **permission** est un droit specifique : voir les commandes, modifier un produit, supprimer un contact, exporter des donnees, etc. Un **role** est un ensemble de permissions regroupees sous un nom (ex: "Agent CRM" = peut voir les contacts + creer des deals + passer des appels).

### Principe du moindre privilege

Chaque utilisateur ne doit avoir acces qu'a ce dont il a besoin pour son travail. Un agent de support n'a pas besoin de voir la comptabilite. Un comptable n'a pas besoin de modifier les produits. C'est une question de **securite** et de **simplicite**.

---

## Comment y acceder

1. Systeme > **Permissions** dans le panneau lateral
2. URL directe : `/admin/permissions`

---

## Les roles pre-configures

| Role | Description | Sections accessibles |
|------|-------------|---------------------|
| **Super Admin** | Acces total, ne peut pas etre restreint | Tout |
| **Administrateur** | Acces a toutes les sections sauf les parametres systeme critiques | Quasi tout |
| **Gestionnaire commerce** | Gestion des commandes, produits, inventaire, clients | Commerce, Catalogue |
| **Agent CRM** | Gestion des contacts, leads, deals, appels | CRM |
| **Comptable** | Acces a la comptabilite complete | Comptabilite |
| **Marketing** | Gestion des campagnes, newsletters, promotions | Marketing, CRM (campagnes) |
| **Support** | Gestion des tickets, chat, base de connaissances | CRM (tickets, chat) |
| **Observateur** | Lecture seule sur toutes les sections | Tout (lecture seule) |

---

## Fonctionnalites detaillees

### 1. Matrice des permissions

La page affiche une **matrice** croisant les sections et les actions :

| Section / Action | Voir | Creer | Modifier | Supprimer | Exporter |
|-----------------|------|-------|----------|-----------|----------|
| **Commerce - Commandes** | X | X | X | | X |
| **Commerce - Produits** | X | X | X | X | X |
| **CRM - Contacts** | X | X | X | | X |
| **CRM - Deals** | X | X | X | X | |
| **Comptabilite** | | | | | |
| **Systeme** | | | | | |

Pour chaque case, cochez ou decochez pour accorder ou retirer la permission.

### 2. Creer un role personnalise

**Etapes** :
1. Cliquez sur **Nouveau role**
2. Nommez le role (ex: "Responsable B2B")
3. Decrivez-le (ex: "Gestion des clients distributeurs et pipeline B2B")
4. Dans la matrice, cochez les permissions necessaires :
   - Commerce : voir commandes, voir clients
   - CRM : tout (contacts, deals, pipeline, appels)
   - Comptabilite : voir factures clients uniquement
5. Cliquez sur **Creer**

### 3. Modifier un role existant

**Etapes** :
1. Selectionnez le role dans la liste
2. Modifiez les permissions dans la matrice
3. Cliquez sur **Sauvegarder**

> **Attention** : Les modifications s'appliquent immediatement a tous les utilisateurs ayant ce role. Ils verront les changements a leur prochaine navigation.

### 4. Permissions speciales

Certaines permissions meritent une attention particuliere :

| Permission | Description | Risque |
|------------|-------------|--------|
| **Supprimer** | Supprimer des enregistrements | Haut - perte de donnees |
| **Exporter** | Telecharger des donnees en CSV/Excel | Moyen - fuite de donnees |
| **Parametres systeme** | Modifier la configuration globale | Haut - impact sur tout le systeme |
| **Gestion des utilisateurs** | Creer/modifier des comptes | Haut - escalade de privileges |
| **Voir les prix** | Voir les prix d'achat et marges | Moyen - information confidentielle |

---

## Questions frequentes (FAQ)

**Q : Puis-je creer un role avec acces a seulement une page specifique ?**
R : Oui, la granularite va jusqu'a la section individuelle. Vous pouvez creer un role n'ayant acces qu'a la gestion des commandes par exemple.

**Q : Que voit un utilisateur sans permission sur une section ?**
R : La section n'apparait tout simplement pas dans son menu. S'il essaie d'acceder a l'URL directement, il verra un message "Acces refuse".

**Q : Le role Super Admin peut-il etre modifie ?**
R : Non, le Super Admin a toujours un acces total. C'est une securite pour eviter de se verrouiller hors du systeme.

**Q : Puis-je voir qui a quel role ?**
R : Oui, chaque role affiche la liste des utilisateurs qui y sont assignes. Et chaque fiche employe montre son role actuel.

---

## Glossaire

| Terme | Definition |
|-------|-----------|
| **Role** | Ensemble nomme de permissions |
| **Permission** | Droit specifique d'effectuer une action |
| **Matrice** | Tableau croisant sections et actions pour definir les permissions |
| **Moindre privilege** | Principe de n'accorder que les acces strictement necessaires |
| **Escalade de privileges** | Quand un utilisateur obtient plus de droits que prevu |

---

## Pages reliees

- [Utilisateurs](/admin/employes) : Attribution des roles aux utilisateurs
- [Audit Logs](/admin/logs) : Suivi de qui fait quoi
- [Securite](/admin/securite) : Parametres de securite complementaires
- [Parametres](/admin/parametres) : Configuration generale du systeme
