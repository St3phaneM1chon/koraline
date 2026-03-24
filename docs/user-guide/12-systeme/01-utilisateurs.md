# Gestion des Utilisateurs et Employes

> **Section**: Systeme > Utilisateurs / Employes
> **URL**: `/admin/employes`
> **Niveau**: Debutant a intermediaire
> **Temps de lecture**: ~15 minutes

---

## A quoi sert cette page ?

La page **Employes** gere les comptes utilisateurs de l'equipe BioCycle Peptides qui ont acces a l'interface d'administration Koraline. Chaque personne de l'equipe a un compte avec un role et des permissions specifiques.

**En tant qu'administrateur, vous pouvez :**
- Creer des comptes pour les nouveaux membres de l'equipe
- Attribuer des roles (administrateur, gestionnaire, agent, etc.)
- Activer ou desactiver des comptes
- Reinitialiser les mots de passe
- Consulter l'activite de chaque utilisateur
- Gerer les informations personnelles des employes

---

## Concepts de base pour les debutants

### Qui a besoin d'un compte ?

Toute personne qui doit acceder a l'interface d'administration (`/admin`) a besoin d'un compte utilisateur. Les clients de la boutique en ligne ont des comptes separes (geres dans Commerce > Clients).

### Roles typiques chez BioCycle

| Role | Acces | Qui |
|------|-------|-----|
| **Administrateur** | Acces total a toutes les sections | Proprietaire, directeur |
| **Gestionnaire commerce** | Commerce, catalogue, inventaire | Responsable e-commerce |
| **Agent CRM** | CRM, contacts, pipeline, appels | Representant commercial |
| **Comptable** | Comptabilite uniquement | Comptable interne |
| **Agent support** | CRM (tickets, chat) | Agent de service client |
| **Marketing** | Marketing, newsletters, campagnes | Responsable marketing |
| **Observateur** | Lecture seule sur tout | Consultant, auditeur |

---

## Comment y acceder

1. Systeme > **Employes** dans le panneau lateral
2. URL directe : `/admin/employes`

---

## Fonctionnalites detaillees

### 1. Creer un utilisateur

**Etapes** :
1. Cliquez sur **Nouvel employe**
2. Remplissez les informations :
   - **Prenom** et **Nom**
   - **Email** (servira d'identifiant de connexion)
   - **Role** : selectionnez dans la liste (voir Roles & Permissions)
   - **Telephone** (optionnel)
   - **Departement** (optionnel)
3. Le systeme envoie un email d'invitation avec un lien pour definir le mot de passe
4. Cliquez sur **Creer**

### 2. Modifier un utilisateur

**Etapes** :
1. Trouvez l'utilisateur dans la liste
2. Cliquez sur son nom
3. Modifiez les informations ou le role
4. Cliquez sur **Sauvegarder**

### 3. Desactiver un compte

**Quand** : Un employe quitte l'entreprise ou n'a plus besoin d'acces.

**Etapes** :
1. Ouvrez la fiche de l'employe
2. Basculez le commutateur **Actif** a **Inactif**
3. Le compte est desactive immediatement (la session en cours est terminee)

> **Bonne pratique** : Ne supprimez jamais un compte utilisateur. Desactivez-le pour conserver l'historique de ses actions dans les logs d'audit.

### 4. Reinitialiser un mot de passe

**Etapes** :
1. Ouvrez la fiche de l'employe
2. Cliquez sur **Reinitialiser le mot de passe**
3. Un email est envoye a l'employe avec un lien de reinitialisation

---

## Questions frequentes (FAQ)

**Q : Combien d'utilisateurs puis-je creer ?**
R : Il n'y a pas de limite dans Koraline.

**Q : Un employe peut-il avoir plusieurs roles ?**
R : Non directement, mais vous pouvez creer un role personnalise combinant les permissions de plusieurs roles (voir Roles & Permissions).

**Q : Que se passe-t-il si un employe oublie son mot de passe ?**
R : Il peut utiliser "Mot de passe oublie" sur la page de connexion, ou vous pouvez forcer la reinitialisation depuis sa fiche.

---

## Glossaire

| Terme | Definition |
|-------|-----------|
| **Utilisateur** | Personne ayant un compte d'acces a l'administration |
| **Role** | Ensemble de permissions attribuees a un utilisateur |
| **Compte actif** | Compte qui peut se connecter |
| **Compte desactive** | Compte existant mais ne pouvant plus se connecter |

---

## Pages reliees

- [Roles & Permissions](/admin/permissions) : Configuration des roles
- [Audit Logs](/admin/logs) : Historique des actions des utilisateurs
- [Securite](/admin/securite) : Parametres de securite des comptes
- [Parametres](/admin/parametres) : Configuration generale
