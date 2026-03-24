# Clients B2B - Tutoriel

## Resume
La page Clients B2B gere les distributeurs, employes et utilisateurs internes de la plateforme. Contrairement a la page Customers (acheteurs finaux), cette page se concentre sur les comptes professionnels avec gestion des roles, des actions administratives (envoi d'email, reset mot de passe, suspension), et l'ajustement de points de fidelite.

**Utilisateurs cibles**: Proprietaires (OWNER) principalement, Employes (EMPLOYEE) en lecture
**Prerequis**: Etre connecte avec un compte admin autorise
**URL**: `/admin/clients`

## Comment ca fonctionne
La page utilise le composant generique `ContactListPage` configure via `clientConfig`. Elle recupere les utilisateurs avec le role CLIENT depuis l'API (qui inclut aussi les CUSTOMER, EMPLOYEE et OWNER dans la meme base). Le filtrage par onglets permet de segmenter par role : Acheteur (CUSTOMER), Client (CLIENT), Employe (EMPLOYEE), Proprietaire (OWNER).

Le panneau de detail offre des actions avancees : voir les commandes de l'utilisateur, envoyer un email, reinitialiser le mot de passe, et suspendre le compte. Deux sections speciales permettent de modifier le role d'un utilisateur (gestion des droits) et d'ajuster manuellement ses points de fidelite (bonus ou deduction).

Les KPIs affichent le total des utilisateurs, le nombre de clients, le nombre d'employes, et les VIP Gold+.

## Guide etape par etape
1. **Consulter les KPIs**: 4 cartes - Total utilisateurs, Clients, Employes, VIP Gold+
2. **Filtrer par role**: Onglets pour afficher Tous, Acheteurs (CUSTOMER), Clients (CLIENT), Employes (EMPLOYEE), Proprietaires (OWNER)
3. **Rechercher**: Taper un nom ou email dans la barre de recherche
4. **Selectionner un utilisateur**: Cliquer pour voir le detail complet
5. **Voir les commandes**: Bouton "Voir les commandes" redirige vers `/admin/commandes?user={id}`
6. **Envoyer un email**: Bouton "Envoyer email" ouvre un prompt pour sujet et corps du message
7. **Reinitialiser le mot de passe**: Bouton "Reset mot de passe" envoie un email de reinitialisation
8. **Suspendre un compte**: Bouton "Suspendre" desactive le compte (avec confirmation)
9. **Modifier le role**: Section "Gestion des roles" permet de changer le role de l'utilisateur
10. **Ajuster les points**: Section "Ajustement de points" permet d'ajouter ou retirer des points de fidelite
11. **Exporter en CSV**: Action ribbon "Exporter" telecharge la liste (nom, email, role, telephone, palier, points, depenses, code referral, date inscription)

## Fonctionnalites connexes
- [Customers](/admin/customers) - Acheteurs finaux (B2C)
- [Commandes](/admin/commandes) - Commandes par utilisateur
- [Fidelite](/admin/fidelite) - Programme de fidelite
- [Permissions](/admin/permissions) - Gestion des droits d'acces
- [Employes](/admin/employes) - Gestion des employes

## Conseils & bonnes pratiques
- La suspension d'un compte est irreversible depuis cette interface ; pour reactiver, il faut modifier manuellement la base
- Changez les roles avec precaution : promouvoir un client en EMPLOYEE lui donne acces a l'admin
- L'ajustement de points de fidelite doit etre justifie (bonus commercial, compensation, etc.)
- Utilisez le filtre OWNER pour verifier rapidement qui a les droits proprietaire

## Limitations connues
- La distinction entre CLIENT et CUSTOMER dans les filtres peut etre confuse ; CLIENT designe ici les distributeurs B2B
- L'envoi d'email utilise un prompt natif du navigateur (pas de richtext)
- La suspension ne supprime pas les sessions actives immediatement

## Endpoints API utilises
- `GET /api/admin/users?role=CLIENT` - Liste des utilisateurs B2B
- `PATCH /api/admin/users/:id` - Modification du role, suspension
- `POST /api/admin/users/:id/email` - Envoi d'email
- `POST /api/admin/users/:id/reset-password` - Reinitialisation du mot de passe

## Notes techniques
- **Render mode**: Client Component (`'use client'`)
- **Composants principaux**: ContactListPage (generique), RoleManagementSection, PointAdjustmentSection
- **Config**: `src/app/admin/clients/config.ts` definit les KPIs, filtres et actions
- **Sections custom**: `src/app/admin/clients/ClientDetailSections.tsx` (gestion roles + points)
- **Modeles Prisma**: User (multi-roles), Order (via _count.purchases)
- **Securite**: CSRF token via `addCSRFHeader()` sur toutes les mutations
- **Score audit**: 90/100 (A)
- **Erreurs trouvees**: Aucune erreur bloquante
