# Gestion des Taches CRM

> **Section**: CRM > Taches
> **URL**: `/admin/crm/tasks`
> **Niveau**: Debutant a intermediaire
> **Temps de lecture**: ~15 minutes

---

## A quoi sert cette page ?

La page **Taches** est le gestionnaire d'actions de votre equipe commerciale. Chaque action a realiser (appeler un prospect, envoyer un devis, relancer un client, preparer une presentation) est une tache dans le CRM.

**En tant que gestionnaire, vous pouvez :**
- Voir toutes les taches de votre equipe ou les votres uniquement
- Creer des taches manuellement ou par automatisation
- Assigner des taches a des membres de l'equipe
- Definir des echeances et des priorites
- Lier une tache a un contact, un deal ou une entreprise
- Marquer les taches comme completees
- Filtrer par statut (en retard, aujourd'hui, cette semaine, completees)
- Recevoir des rappels automatiques pour les echeances proches

---

## Concepts de base pour les debutants

### Pourquoi gerer les taches dans le CRM ?

Dans un systeme CRM, les taches ne sont pas de simples rappels. Elles sont **liees a des contacts et des deals**, ce qui permet de :
- Savoir exactement qui doit faire quoi, pour quel prospect
- Ne jamais oublier une relance ou un suivi
- Mesurer la productivite de l'equipe (nombre de taches completees, temps moyen)
- Automatiser la creation de taches (ex: apres un appel, creer une tache de suivi)

### Types de taches

| Type | Icone | Description |
|------|-------|-------------|
| **Appel** | Telephone | Passer un appel a un contact |
| **Email** | Enveloppe | Envoyer un email |
| **Reunion** | Calendrier | Organiser ou participer a une reunion |
| **Suivi** | Fleche | Relancer ou faire un point |
| **Document** | Fichier | Preparer ou envoyer un document |
| **Autre** | Point | Action personnalisee |

---

## Comment y acceder

1. CRM > **Taches** dans le panneau lateral
2. Ou depuis n'importe quelle fiche contact/deal : onglet **Activites**
3. URL directe : dans le panneau CRM sous le groupe principal

---

## Vue d'ensemble de l'interface

### 1. Les onglets de filtrage

| Onglet | Description |
|--------|-------------|
| **Mes taches** | Uniquement les taches qui vous sont assignees |
| **Equipe** | Toutes les taches de votre equipe |
| **En retard** | Taches dont l'echeance est passee (badge rouge) |
| **Aujourd'hui** | Taches a faire aujourd'hui |
| **Cette semaine** | Taches de la semaine en cours |
| **Completees** | Historique des taches terminees |

### 2. La liste des taches

Chaque tache affiche :
- **Titre** et description courte
- **Type** (appel, email, reunion, etc.)
- **Priorite** (haute = rouge, normale = bleu, basse = gris)
- **Echeance** (avec indicateur de retard)
- **Assignee a** : le membre de l'equipe responsable
- **Liee a** : contact et/ou deal associe (lien cliquable)
- **Statut** : a faire, en cours, completee

### 3. Le panneau de detail

Au clic sur une tache :
- Description complete
- Contact et deal associes
- Notes et commentaires
- Historique des modifications
- Bouton **Marquer terminee**

---

## Fonctionnalites detaillees

### 1. Creer une tache

**Etapes** :
1. Cliquez sur **Nouvelle tache** dans le ruban
2. Remplissez les champs :
   - **Titre** : description courte de l'action (ex: "Appeler Dr. Martin pour suivi devis")
   - **Type** : appel, email, reunion, suivi, document
   - **Echeance** : date et heure limites
   - **Priorite** : haute, normale, basse
   - **Assignee a** : le responsable (vous-meme ou un collegue)
   - **Contact** : la personne concernee (recherche par nom)
   - **Deal** : l'opportunite associee (optionnel)
   - **Description** : details complementaires
3. Cliquez sur **Creer**

> **Astuce** : Vous pouvez aussi creer une tache directement depuis la fiche d'un contact ou d'un deal, ce qui pre-remplit le lien automatiquement.

### 2. Marquer une tache comme completee

**Etapes** :
1. Cochez la case a gauche de la tache dans la liste, OU
2. Ouvrez la tache et cliquez sur **Marquer terminee**
3. Ajoutez un commentaire de completion si necessaire
4. La tache passe dans l'onglet "Completees"

### 3. Creer des taches recurrentes

**Objectif** : Pour les actions regulieres (rapport hebdomadaire, relance mensuelle).

**Etapes** :
1. Creez une tache normalement
2. Activez l'option **Recurrence**
3. Choisissez la frequence : quotidienne, hebdomadaire, mensuelle
4. Le systeme creera automatiquement une nouvelle tache a chaque echeance

### 4. Gestion d'equipe

**En tant que manager** :
- Consultez l'onglet **Equipe** pour voir toutes les taches
- Filtrez par representant pour evaluer la charge de travail
- Reassignez les taches si un membre est surcharge
- Utilisez la vue **Calendrier** pour voir les echeances visuellement

---

## Workflows courants

### Routine matinale
1. Ouvrez l'onglet **En retard** : traitez les urgences
2. Consultez **Aujourd'hui** : planifiez votre journee
3. Pour chaque tache, effectuez l'action puis marquez comme terminee
4. Si une tache necessite un suivi, creez une nouvelle tache avec la prochaine echeance

### Apres un appel commercial
1. Terminez l'appel
2. Creez une tache de suivi (ex: "Envoyer devis" echeance 2 jours)
3. Ajoutez des notes sur la conversation dans la fiche contact
4. Si un devis est promis, creez aussi une tache "Preparer devis"

---

## Questions frequentes (FAQ)

**Q : Les taches sont-elles visibles par toute l'equipe ?**
R : Les taches sont visibles par le createur, l'assignee et les administrateurs. Les autres membres de l'equipe ne voient pas vos taches individuelles, sauf si un manager consulte la vue Equipe.

**Q : Puis-je recevoir des rappels ?**
R : Oui. Le systeme envoie des notifications (dans l'interface et par email) pour les taches proches de leur echeance ou en retard. Vous pouvez configurer les preferences de notification dans vos parametres.

**Q : Les taches automatiques sont-elles differentes des manuelles ?**
R : Fonctionnellement non, elles sont identiques. La seule difference est leur origine : les taches automatiques sont creees par les workflows (ex: "Appeler le lead 24h apres son inscription"), tandis que les manuelles sont creees par vous.

**Q : Puis-je supprimer une tache ?**
R : Oui, mais il est preferable de la marquer comme terminee ou annulee pour garder un historique. La suppression est irreversible.

---

## Glossaire

| Terme | Definition |
|-------|-----------|
| **Tache** | Action a realiser, liee a un contact ou un deal |
| **Echeance** | Date et heure limites pour completer la tache |
| **Assignee** | Personne responsable de la tache |
| **Tache recurrente** | Tache qui se recree automatiquement a intervalle regulier |
| **Priorite** | Niveau d'urgence : haute, normale, basse |

---

## Pages reliees

- [Contacts](/admin/crm/contacts) : Contacts associes aux taches
- [Pipeline](/admin/crm/pipeline) : Deals associes aux taches
- [Automatisations](/admin/crm/workflows) : Workflows creant des taches automatiquement
- [Planification](/admin/crm/scheduling) : Calendrier de l'equipe commerciale
- [Rapports d'activite](/admin/crm/activity-reports) : Mesure de la productivite
