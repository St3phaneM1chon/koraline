# Integrations et Webhooks

> **Section**: Systeme > Outils > Webhooks / Monitoring
> **URL**: `/admin/webhooks`, `/admin/monitoring`
> **Niveau**: Avance
> **Temps de lecture**: ~15 minutes

---

## A quoi sert cette page ?

La page **Webhooks** et les outils d'integration permettent de connecter Koraline a des services externes. Les webhooks envoient des notifications automatiques a d'autres systemes quand des evenements se produisent dans Koraline.

**En tant qu'administrateur, vous pouvez :**
- Configurer des webhooks pour notifier des services externes
- Suivre les deliveries (envois) et les erreurs
- Connecter Koraline a des outils tiers (Zapier, Make, etc.)
- Surveiller l'etat de sante du systeme (monitoring)
- Gerer les taches planifiees (crons)

---

## Concepts de base pour les debutants

### Qu'est-ce qu'un webhook ?

Un **webhook** est un message automatique envoye par Koraline vers un autre service quand quelque chose se passe. C'est comme une notification push entre systemes.

**Exemple** : Quand une nouvelle commande est passee, Koraline envoie un webhook a Slack pour notifier l'equipe. Ou quand un paiement est recu, Koraline notifie votre systeme comptable externe.

### Quand utiliser les webhooks ?

| Evenement Koraline | Service cible | Action |
|--------------------|---------------|--------|
| Nouvelle commande | Slack | Notification dans un canal |
| Paiement recu | Logiciel comptable | Synchronisation |
| Nouveau lead | CRM externe | Creation de fiche |
| Stock bas | Email/SMS | Alerte approvisionnement |
| Commande expediee | Service de tracking | Mise a jour du suivi |

---

## Comment y acceder

| Page | URL | Description |
|------|-----|-------------|
| **Webhooks** | `/admin/webhooks` | Configuration des webhooks |
| **Monitoring** | `/admin/monitoring` | Etat de sante du systeme |
| **Crons** | `/admin/system/crons` | Taches planifiees |
| **Analytics** | `/admin/analytics` | Analytics du site |
| **Cross-Module** | `/admin/analytics/cross-module` | Analytics transversales |

---

## Fonctionnalites detaillees

### 1. Creer un webhook

**Etapes** :
1. Cliquez sur **Nouveau webhook**
2. Configurez :
   - **Nom** : description du webhook (ex: "Notification Slack commandes")
   - **URL cible** : l'adresse ou envoyer les donnees
   - **Evenement** : quel evenement declenche le webhook
   - **Methode** : POST (par defaut)
   - **Headers** : en-tetes supplementaires (authentification)
   - **Secret** : cle de verification (optionnel mais recommande)
3. Cliquez sur **Creer**
4. Testez avec **Envoyer un test**

### 2. Surveiller les deliveries

Chaque webhook affiche un historique :
- Date et heure de l'envoi
- Code de reponse (200 = succes, 4xx/5xx = erreur)
- Contenu envoye (payload)
- Temps de reponse

### 3. Monitoring systeme

**URL** : `/admin/monitoring`

Tableau de bord de sante :
| Metrique | Description |
|----------|-------------|
| **Uptime** | Temps de disponibilite du site |
| **Temps de reponse** | Vitesse des pages |
| **Erreurs** | Nombre d'erreurs serveur |
| **Base de donnees** | Etat de la connexion PostgreSQL |
| **Stripe** | Etat de la connexion Stripe |
| **Emails** | Etat du service d'envoi d'emails |

### 4. Taches planifiees (Crons)

**URL** : `/admin/system/crons`

Liste des taches automatiques :
| Tache | Frequence | Description |
|-------|-----------|-------------|
| Nettoyage sessions | Quotidien | Supprime les sessions expirees |
| Rappels echeances | Quotidien | Envoie les rappels de paiement |
| Mise a jour taux change | Quotidien | Met a jour les taux de devises |
| Sauvegarde DB | Bi-quotidien | Sauvegarde de la base de donnees |
| Rapports automatiques | Hebdomadaire | Genere et envoie les rapports planifies |

---

## Questions frequentes (FAQ)

**Q : Les webhooks sont-ils securises ?**
R : Oui, chaque webhook peut etre signe avec un secret. Le service cible peut verifier la signature pour s'assurer que le message vient bien de Koraline.

**Q : Que se passe-t-il si le service cible est indisponible ?**
R : Koraline retente l'envoi automatiquement (3 tentatives avec delai croissant). Si toutes echouent, l'evenement est marque en erreur dans le journal.

**Q : Combien de webhooks puis-je configurer ?**
R : Pas de limite. Vous pouvez avoir plusieurs webhooks pour le meme evenement.

---

## Glossaire

| Terme | Definition |
|-------|-----------|
| **Webhook** | Notification HTTP automatique envoyee lors d'un evenement |
| **Payload** | Contenu des donnees envoyees par le webhook (format JSON) |
| **Cron** | Tache planifiee executee automatiquement a intervalle regulier |
| **Monitoring** | Surveillance de l'etat de sante du systeme |
| **Uptime** | Pourcentage de temps ou le systeme est disponible |

---

## Pages reliees

- [Parametres](/admin/parametres) : Configuration generale
- [Securite](/admin/securite) : Securite des connexions
- [Audit Logs](/admin/logs) : Journal des evenements
- [Sauvegardes](/admin/backups) : Sauvegarde des donnees
