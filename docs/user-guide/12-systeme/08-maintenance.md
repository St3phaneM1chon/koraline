# Maintenance et Outils Systeme

> **Section**: Systeme > Outils / Diagnostics
> **URL**: `/admin/diagnostics`, `/admin/uat`
> **Niveau**: Avance
> **Temps de lecture**: ~15 minutes

---

## A quoi sert cette page ?

Les outils de **Maintenance** regroupent les fonctions techniques pour diagnostiquer, tester et maintenir la plateforme Koraline en bon etat de fonctionnement.

**En tant qu'administrateur, vous pouvez :**
- Executer des diagnostics reseau et systeme
- Tester les fonctionnalites en environnement UAT
- Verifier la connectivite aux services externes
- Consulter les metriques de performance
- Gerer le cache de l'application
- Surveiller les taches de fond (crons)

---

## Les pages de maintenance

### 1. Diagnostics reseau (`/admin/diagnostics`)

Cette page teste la connectivite entre Koraline et les services externes :

| Service | Test | Statut attendu |
|---------|------|-----------------|
| **Base de donnees** | Connexion PostgreSQL | Connecte |
| **Stripe** | API de paiement | Actif |
| **Email** | Service d'envoi SMTP | Operationnel |
| **Telnyx** | Telephonie VoIP | Connecte |
| **Azure** | Hebergement | En ligne |
| **Redis** | Cache et sessions | Actif |

**Etapes** :
1. Ouvrez la page Diagnostics
2. Cliquez sur **Lancer les tests**
3. Chaque service est teste et affiche son statut :
   - Vert : operationnel
   - Jaune : lent ou degradation
   - Rouge : hors service

### 2. Tests UAT (`/admin/uat`)

**UAT** (User Acceptance Testing) est un environnement de test pour valider les nouvelles fonctionnalites avant de les mettre en production.

**Fonctionnalites** :
- Simuler des commandes sans paiement reel
- Tester les workflows CRM avec des donnees fictives
- Verifier les emails envoyes (sans les envoyer reellement)
- Tester les integrations en mode sandbox

### 3. Monitoring (`/admin/monitoring`)

Tableau de bord de surveillance continue :
| Metrique | Description | Seuil d'alerte |
|----------|-------------|-----------------|
| **CPU** | Utilisation du processeur | > 80% |
| **Memoire** | RAM utilisee | > 85% |
| **Disque** | Espace de stockage | > 90% |
| **Requetes/s** | Nombre de requetes par seconde | > 500 |
| **Temps de reponse** | Latence moyenne des pages | > 3 secondes |
| **Erreurs 5xx** | Erreurs serveur | > 0 |

### 4. Taches planifiees (`/admin/system/crons`)

Gestion des crons (taches automatiques) :
- Voir le statut de chaque tache
- Voir la derniere execution et la prochaine
- Forcer l'execution d'une tache
- Desactiver temporairement une tache

---

## Workflows courants

### Diagnostic d'un probleme
1. Un utilisateur signale un probleme (page lente, erreur)
2. Ouvrez les diagnostics : tous les services sont-ils verts ?
3. Verifiez le monitoring : y a-t-il une surcharge ?
4. Consultez les logs d'audit : y a-t-il des erreurs recentes ?
5. Si le probleme persiste, contactez le support technique

### Verification de sante quotidienne
1. Ouvrez le monitoring
2. Verifiez que tous les indicateurs sont au vert
3. Verifiez les taches planifiees : ont-elles toutes reussi ?
4. Consultez les webhooks : y a-t-il des echecs recents ?

---

## Questions frequentes (FAQ)

**Q : Que faire si un service est au rouge dans les diagnostics ?**
R : Verifiez si le service externe est en panne (page de statut du fournisseur). Si c'est un probleme de configuration (cle API expiree, URL modifiee), mettez a jour dans les parametres.

**Q : Les tests UAT affectent-ils les donnees reelles ?**
R : Non, l'environnement UAT utilise des donnees isolees. Aucune action en UAT n'affecte les vraies commandes, contacts ou finances.

**Q : A quelle frequence verifier le monitoring ?**
R : Les alertes sont envoyees automatiquement en cas de probleme. Une verification manuelle quotidienne est recommandee pour les aspects non automatises.

---

## Glossaire

| Terme | Definition |
|-------|-----------|
| **Diagnostic** | Test de connectivite et de sante des composants du systeme |
| **UAT** | User Acceptance Testing, tests de validation fonctionnelle |
| **Monitoring** | Surveillance continue des metriques de performance |
| **Cron** | Tache automatique executee a intervalle regulier |
| **Latence** | Temps de reponse d'une requete |
| **5xx** | Codes d'erreur serveur HTTP (500, 502, 503, 504) |

---

## Pages reliees

- [Diagnostics](/admin/diagnostics) : Tests de connectivite
- [Monitoring](/admin/monitoring) : Metriques temps reel
- [Audit Logs](/admin/logs) : Journal des evenements
- [Sauvegardes](/admin/backups) : Protection des donnees
- [Securite](/admin/securite) : Parametres de securite
