# Coaching des agents

> **Section**: Telephonie > Coaching

---

## Concepts pour debutants

Le module **Coaching** permet aux superviseurs de former et d'evaluer les agents du centre
d'appels en temps reel. Trois modes d'intervention sont disponibles pendant un appel en cours :

- **Ecoute (Listen)** : Le superviseur ecoute l'appel sans que l'agent ou le client ne le sache
- **Chuchotement (Whisper)** : Le superviseur parle a l'agent sans que le client n'entende
- **Intervention (Barge)** : Le superviseur rejoint la conversation a trois voix

Chaque session de coaching est documentee avec un sujet, des objectifs, et une evaluation
par criteres ponderes. Cela permet de suivre la progression des agents dans le temps.

---

## Comment y acceder

1. Dans le panneau d'administration, cliquez sur l'icone **Telephone** dans la barre laterale gauche.
2. Dans le panneau de navigation, sous **Operations**, cliquez sur **Coaching**.
3. L'URL directe est : `/admin/telephonie/coaching`

---

## Apercu de l'interface

### Classement des agents
En haut de page, des cartes affichent le classement des agents par score moyen :
- Position (1, 2, 3...)
- Nom de l'agent
- Nombre de sessions completees
- Score moyen sur 10
- Etoiles de notation (1 a 5)

Le premier du classement a un arriere-plan dore.

### Sessions actives
La section suivante liste les sessions de coaching en cours ou planifiees :
- **Coach** : Nom du superviseur
- **Agent** : Nom de l'agent coache
- **Statut** : Planifie, En cours, Termine
- **Duree** : Temps ecoule depuis le debut
- **Sujet** : Theme de la session
- **Actions** : Boutons Ecoute, Chuchotement, Intervention, Terminer

### Historique des sessions
Un tableau liste les sessions terminees avec :
- Coach et Agent
- Sujet aborde
- Score obtenu (sur 10)
- Date de la session

### Bouton "Nouvelle session"
Lance la creation d'une session de coaching.

---

## Fonctions detaillees

### Modes de coaching

| Mode | Icone | Description | Utilisation |
|------|-------|-------------|-------------|
| **Ecoute** | Casque | Ecouter sans etre detecte | Evaluation silencieuse |
| **Chuchotement** | Bulle | Parler a l'agent uniquement | Guider pendant un appel difficile |
| **Intervention** | Telephone | Rejoindre la conversation | Prendre le relais sur un probleme |

### Creation d'une session
Le formulaire de nouvelle session demande :
- **Agent** : Selection dans la liste des employes
- **Sujet** : Theme de la session (ex: "Techniques de vente", "Gestion des plaintes")
- **Objectifs** : Ce que l'agent doit pratiquer
- **Date/Heure** : Planification de la session

### Notation par criteres
Apres la session, le coach attribue des scores par critere :
- Chaque critere a un **poids** (importance relative)
- Le score va de 1 a 10
- Un commentaire optionnel accompagne chaque note
- Certains criteres peuvent etre notes automatiquement par l'IA (**auto-scored**)
- Le score moyen pondere est calcule automatiquement

### Progression des agents
Le classement des agents permet de suivre l'evolution dans le temps. Un agent avec un
score moyen en progression constante valide l'efficacite du programme de coaching.

---

## Workflows courants

### Workflow 1 : Session d'ecoute silencieuse
1. Cliquez sur **Nouvelle session**.
2. Selectionnez l'agent a evaluer.
3. Definissez le sujet (ex: "Evaluation trimestrielle").
4. Quand l'agent est en appel, cliquez sur **Ecoute**.
5. Prenez des notes pendant l'appel.
6. Apres l'appel, cliquez sur **Terminer la session**.
7. Completez la grille d'evaluation.

### Workflow 2 : Coaching en temps reel
1. Creez une session avec l'agent.
2. Quand l'agent recoit un appel difficile, activez le mode **Chuchotement**.
3. Guidez l'agent avec des suggestions que le client n'entend pas.
4. Si la situation l'exige, passez en mode **Intervention**.
5. Terminez la session et evaluez les points d'amelioration.

---

## FAQ

**Q : L'agent sait-il qu'il est en mode ecoute ?**
R : Non, le mode ecoute est invisible pour l'agent et le client.

**Q : Le chuchotement est-il audible par le client ?**
R : Non, seul l'agent entend le superviseur en mode chuchotement.

**Q : Puis-je coacher plusieurs agents simultanement ?**
R : Un superviseur ne peut etre en session active qu'avec un seul agent a la fois.

---

## Strategie expert : Techniques de vente consultative pour les peptides

### Approche consultative vs. vente agressive

Dans le marche des peptides de recherche, la vente agressive (hard sell) est contre-productive et potentiellement dangereuse sur le plan reglementaire. L'approche consultative -- ou l'agent se positionne comme un conseiller technique plutot qu'un vendeur -- est la seule strategie viable.

**Principes fondamentaux :**

| Principe | Vente agressive (a eviter) | Vente consultative (a adopter) |
|----------|---------------------------|-------------------------------|
| Posture | "Achetez notre BPC-157, c'est le meilleur" | "Quel type de recherche menez-vous ? Je peux vous orienter vers le produit adapte" |
| Objectif | Fermer la vente rapidement | Comprendre le besoin et proposer la solution optimale |
| Argumentation | Centree sur le prix et les promotions | Centree sur la qualite, la purete et la documentation |
| Resultat long terme | Vente unique, pas de fidelisation | Client recurrent, referrals naturels |

### Ecoute active et questions ouvertes

L'agent doit guider la conversation avec des questions ouvertes qui revelent le besoin reel du client :

**Questions de decouverte (dans cet ordre) :**

1. "Quel type de recherche ou d'application visez-vous ?" (comprendre le contexte)
2. "Avez-vous deja travaille avec ce type de peptide ?" (evaluer le niveau d'expertise)
3. "Quel degre de purete est requis pour votre protocole ?" (orienter vers le bon produit)
4. "Quelle quantite estimez-vous necessaire pour votre projet ?" (dimensionner la commande)
5. "Avez-vous des contraintes particulieres de stockage ou de livraison ?" (anticiper la logistique)

**Techniques d'ecoute active :**
- Reformuler : "Si je comprends bien, vous cherchez un peptide de purete >98% pour une etude de stabilite..."
- Valider : "C'est tout a fait pertinent. Beaucoup de nos clients en recherche dermatologique choisissent ce produit pour les memes raisons."
- Approfondir : "Pouvez-vous m'en dire plus sur les volumes que vous anticipez sur les 6 prochains mois ?"

### Education du client (le levier de vente le plus puissant)

Dans le marche des peptides, eduquer le client EST vendre. Un client qui comprend la difference entre un peptide a 85% de purete et un peptide a 99% de purete achete systematiquement le produit premium.

**Points d'education a integrer dans la conversation :**

| Sujet | Message cle | Impact sur la vente |
|-------|-------------|---------------------|
| **Purete** | "Notre BPC-157 est teste par HPLC et spectrometrie de masse avec un CoA par lot" | Justifie le prix premium |
| **Stockage** | "Les peptides lyophilises se conservent 24 mois a -20C. Une fois reconstitues, 30 jours au refrigerateur" | Montre l'expertise, cree confiance |
| **Reconstitution** | "Nous fournissons un guide de reconstitution avec chaque commande" | Reduit l'anxiete du premier achat |
| **Documentation** | "Le CoA est disponible avant achat sur simple demande" | Transparence = confiance |
| **Conformite** | "Tous nos produits sont etiquetes 'pour usage de recherche uniquement', conformement a la reglementation" | Protege l'entreprise et rassure le client |

### Gestion des objections courantes

| Objection | Mauvaise reponse | Bonne reponse |
|-----------|-----------------|---------------|
| **"C'est cher par rapport a [concurrent]"** | "On peut faire un rabais" | "Je comprends. Notre prix reflète la purete verifiee par analyse independante et la traçabilite complete du lot. Beaucoup de nos clients ont compare et sont revenus chez nous apres avoir eu des resultats inconsistants avec des produits moins chers. Souhaitez-vous voir le CoA de notre dernier lot ?" |
| **"Est-ce legal au Canada ?"** | "Oui, c'est legal" (trop vague) | "Les peptides de recherche sont legaux a l'achat au Canada pour usage de recherche, et non pour consommation humaine. Nous vendons exclusivement des produits etiquetes 'recherche uniquement' et nous nous conformons a toutes les reglementations applicables de Sante Canada." |
| **"Comment etre sur de la purete ?"** | "Faites-nous confiance" | "Chaque lot est teste par HPLC et spectrometrie de masse dans un laboratoire tiers independant. Le certificat d'analyse est disponible sur la fiche produit et je peux vous l'envoyer par email immediatement. Notre purete garantie est de 98% minimum, et la plupart de nos lots depassent 99%." |
| **"Je peux avoir un echantillon ?"** | "Non" | "Pour les commandes institutionnelles ou les projets de recherche de volume, nous offrons des echantillons aux clients du palier Argent et plus. Si vous etes un nouveau client, je peux vous proposer une remise de premiere commande de 10% pour que vous puissiez tester notre qualite." |
| **"La livraison est trop longue"** | "C'est la poste" | "Je comprends que les delais sont importants pour vos travaux. Nous proposons l'expedition Xpresspost (2-3 jours ouvrables) et Prioritaire (lendemain, grandes villes). Pour les commandes urgentes, je peux verifier la disponibilite de l'expedition le jour meme si la commande est passee avant 14h EST." |

### Criteres d'evaluation specifiques au coaching peptides

Pour les sessions de coaching, utiliser ces criteres ponderes adaptes au marche des peptides :

| Critere | Poids | Description | Score 1-10 |
|---------|-------|-------------|------------|
| **Conformite reglementaire** | 25% | L'agent ne fait jamais de claims medicaux/therapeutiques | Critique -- score < 7 = echec |
| **Connaissance produit** | 20% | L'agent maitrise purete, stockage, reconstitution, CoA | |
| **Ecoute et decouverte** | 20% | L'agent pose des questions ouvertes avant de proposer | |
| **Gestion des objections** | 15% | L'agent repond aux objections avec des faits, sans pression | |
| **Upsell pertinent** | 10% | L'agent propose des produits complementaires logiques (eau bacteriostatique, seringues, etc.) | |
| **Cloture naturelle** | 10% | L'agent guide vers la commande sans forcer | |

**Score de passage :** 7/10 minimum. Tout agent en dessous de 7 doit suivre un programme de formation supplementaire.

---

## Glossaire

| Terme | Definition |
|-------|-----------|
| **Coaching** | Accompagnement et formation d'un agent par un superviseur |
| **Listen (Ecoute)** | Mode d'ecoute silencieuse d'un appel en cours |
| **Whisper (Chuchotement)** | Mode ou le coach parle uniquement a l'agent |
| **Barge (Intervention)** | Mode ou le coach rejoint la conversation a trois |
| **Score pondere** | Note globale calculee en tenant compte de l'importance de chaque critere |

---

## Pages associees

- [Wallboard](./05-wallboard.md) : Identifier les agents actifs pour le coaching
- [Analytics agents](./16-analytics-agents.md) : Performance individuelle des agents
- [Journal d'appels](./02-journal.md) : Retrouver les appels pour la revue qualite
