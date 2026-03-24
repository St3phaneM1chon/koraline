# Parametres Generaux

> **Section**: Systeme > Parametres
> **URL**: `/admin/parametres`, `/admin/parametres/modules`
> **Niveau**: Intermediaire
> **Temps de lecture**: ~15 minutes

---

## A quoi sert cette page ?

La page **Parametres** centralise la configuration globale de la plateforme Koraline pour BioCycle Peptides : informations de l'entreprise, devises, taxes, emails, et activation des modules.

**En tant qu'administrateur, vous pouvez :**
- Modifier les informations de l'entreprise (nom, adresse, logo)
- Configurer la devise par defaut et les taux de taxe
- Gerer les numeros de TPS et TVQ
- Configurer les parametres d'email (expediteur, serveur SMTP)
- Activer ou desactiver les modules de l'application
- Configurer les parametres regionaux (langue, fuseau horaire)

---

## Comment y acceder

1. Systeme > **Parametres** dans le panneau lateral
2. URL directe : `/admin/parametres`
3. Pour les modules : `/admin/parametres/modules`

---

## Sections de configuration

### 1. Informations de l'entreprise

| Champ | Description | Valeur BioCycle |
|-------|-------------|-----------------|
| **Nom** | Raison sociale | BioCycle Peptides Inc. |
| **Adresse** | Adresse du siege | Montreal, QC, Canada |
| **Telephone** | Numero principal | +1 (514) xxx-xxxx |
| **Email** | Email de contact | contact@biocyclepeptides.com |
| **Site web** | URL du site | biocyclepeptides.com |
| **Logo** | Logo de l'entreprise | (image uploadee) |
| **Numero TPS** | Numero d'inscription TPS/TVH | Rxxxxx xxxx RTxxxx |
| **Numero TVQ** | Numero d'inscription TVQ | xxxx xxxx xxxx TQxxxx |

### 2. Parametres regionaux

| Parametre | Description | Valeur |
|-----------|-------------|--------|
| **Langue par defaut** | Langue de l'interface admin | Francais |
| **Fuseau horaire** | Zone horaire | America/Toronto (EST) |
| **Format de date** | Format d'affichage | AAAA-MM-JJ |
| **Format de nombre** | Separateur decimal | Virgule (1 234,56) |
| **Devise principale** | Devise de base | CAD ($CA) |

### 3. Parametres de taxes

| Parametre | Description | Valeur |
|-----------|-------------|--------|
| **TPS** | Taux federal | 5% |
| **TVQ** | Taux provincial (Quebec) | 9.975% |
| **Taxe incluse** | Prix affiches TTC ou HT | HT (standard au Canada) |
| **Arrondi** | Methode d'arrondi | Au cent pres |

### 4. Gestion des modules

**URL** : `/admin/parametres/modules`

Activez ou desactivez les grandes sections de Koraline :

| Module | Description | Statut |
|--------|-------------|--------|
| **Commerce** | Commandes, clients, inventaire | Actif |
| **Catalogue** | Produits, categories | Actif |
| **CRM** | Contacts, pipeline, appels | Actif |
| **Comptabilite** | Ecritures, factures, rapports | Actif |
| **Marketing** | Campagnes, promotions, newsletters | Actif |
| **Fidelite** | Points, recompenses, webinaires | Actif |
| **Telephonie** | VoIP, appels, IVR | Actif |
| **Media** | Galerie, fichiers | Actif |
| **Communaute** | Avis, chat, forum, ambassadeurs | Actif |
| **Emails** | Gestion des emails | Actif |

> **Note** : Desactiver un module le cache de la navigation mais ne supprime pas les donnees. Vous pouvez le reactiver a tout moment.

---

## Questions frequentes (FAQ)

**Q : Modifier les parametres affecte-t-il les donnees existantes ?**
R : Non. Changer le taux de TVQ par exemple n'affecte que les nouvelles transactions. Les factures existantes conservent le taux applique au moment de leur creation.

**Q : Puis-je avoir plusieurs devises ?**
R : Oui. La devise principale est le CAD, mais vous pouvez configurer le USD et d'autres devises dans Comptabilite > Devises.

**Q : Comment changer le logo qui apparait sur les factures ?**
R : Uploadez le nouveau logo dans la section "Informations de l'entreprise". Il sera automatiquement utilise sur les factures, emails et documents generes.

---

## Pages reliees

- [Utilisateurs](/admin/employes) : Gestion des comptes
- [Roles](/admin/permissions) : Permissions des utilisateurs
- [Integrations](/admin/webhooks) : Connexions externes
- [Apparence](/admin/contenu) : Personnalisation visuelle
- [Securite](/admin/securite) : Parametres de securite
