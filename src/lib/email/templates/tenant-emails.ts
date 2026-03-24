/**
 * Tenant Email Templates — Koraline SaaS Platform
 *
 * Emails sent to tenant owners for subscription lifecycle events.
 */

interface TenantWelcomeData {
  tenantName: string;
  ownerName: string;
  ownerEmail: string;
  plan: string;
  planName: string;
  domainKoraline: string;
  adminUrl: string;
}

interface ModuleActivatedData {
  tenantName: string;
  ownerName: string;
  moduleName: string;
  monthlyPrice: number;
  adminUrl: string;
}

interface PlanUpgradeData {
  tenantName: string;
  ownerName: string;
  oldPlanName: string;
  newPlanName: string;
  newMonthlyPrice: number;
  adminUrl: string;
}

interface ModuleAccumulationData {
  tenantName: string;
  ownerName: string;
  moduleName: string;
  freeUntil: string;
  adminUrl: string;
}

function tenantBaseTemplate(content: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; color: #1a1a1a; }
    .container { max-width: 600px; margin: 0 auto; padding: 24px; }
    .card { background: #ffffff; border-radius: 16px; padding: 32px; margin-bottom: 16px; }
    .header { text-align: center; margin-bottom: 24px; }
    .logo { font-size: 24px; font-weight: 700; color: #0066CC; }
    .logo span { color: #003366; }
    h1 { font-size: 22px; font-weight: 700; color: #1a1a1a; margin: 0 0 8px 0; }
    h2 { font-size: 18px; font-weight: 600; color: #1a1a1a; margin: 16px 0 8px 0; }
    p { font-size: 15px; line-height: 1.6; color: #4a4a4a; margin: 0 0 12px 0; }
    .info-box { background: #f0f7ff; border-radius: 12px; padding: 16px; margin: 16px 0; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e5e5; font-size: 14px; }
    .info-row:last-child { border-bottom: none; }
    .info-label { color: #6a6a6a; }
    .info-value { font-weight: 600; color: #1a1a1a; }
    .btn { display: inline-block; padding: 14px 28px; background: #0066CC; color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 15px; text-align: center; }
    .btn-container { text-align: center; margin: 24px 0; }
    .footer { text-align: center; padding: 24px 0; font-size: 12px; color: #999; }
    .highlight { color: #0066CC; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Kor@line <span>by Attitudes VIP</span></div>
    </div>
    <div class="card">
      ${content}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Attitudes VIP Inc. Tous droits r&eacute;serv&eacute;s.</p>
      <p>Cet email a &eacute;t&eacute; envoy&eacute; par la plateforme Koraline.</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Welcome email sent after tenant provisioning.
 */
export function tenantWelcomeEmail(data: TenantWelcomeData): { subject: string; html: string } {
  const content = `
    <h1>Bienvenue sur Koraline !</h1>
    <p>Bonjour ${data.ownerName},</p>
    <p>Votre boutique <strong>${data.tenantName}</strong> est maintenant active et pr&ecirc;te &agrave; utiliser.</p>

    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Plan</span>
        <span class="info-value">${data.planName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Adresse</span>
        <span class="info-value">${data.domainKoraline}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Courriel</span>
        <span class="info-value">${data.ownerEmail}</span>
      </div>
    </div>

    <h2>Prochaines &eacute;tapes</h2>
    <p>1. <strong>Personnalisez</strong> votre boutique (logo, couleurs, branding)</p>
    <p>2. <strong>Ajoutez</strong> vos produits et cat&eacute;gories</p>
    <p>3. <strong>Configurez</strong> vos modes de paiement et livraison</p>
    <p>4. <strong>Lancez</strong> votre boutique en ligne !</p>

    <div class="btn-container">
      <a href="${data.adminUrl}" class="btn">Acc&eacute;der &agrave; mon admin</a>
    </div>

    <p style="font-size: 13px; color: #666;">
      Besoin d'aide ? Notre &eacute;quipe est disponible pour vous accompagner.
      R&eacute;pondez simplement &agrave; cet email.
    </p>
  `;

  return {
    subject: `Bienvenue sur Koraline — ${data.tenantName} est prêt !`,
    html: tenantBaseTemplate(content),
  };
}

/**
 * Email sent when a module is activated.
 */
export function tenantModuleActivatedEmail(data: ModuleActivatedData): { subject: string; html: string } {
  const content = `
    <h1>Module activ&eacute;</h1>
    <p>Bonjour ${data.ownerName},</p>
    <p>Le module <span class="highlight">${data.moduleName}</span> a &eacute;t&eacute; activ&eacute; sur votre boutique <strong>${data.tenantName}</strong>.</p>

    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Module</span>
        <span class="info-value">${data.moduleName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Tarif mensuel</span>
        <span class="info-value">${(data.monthlyPrice / 100).toFixed(2)} $ CAD/mois</span>
      </div>
    </div>

    <p>Ce montant sera ajout&eacute; &agrave; votre prochaine facture.</p>

    <div class="btn-container">
      <a href="${data.adminUrl}" class="btn">G&eacute;rer mes modules</a>
    </div>
  `;

  return {
    subject: `Module activé : ${data.moduleName} — ${data.tenantName}`,
    html: tenantBaseTemplate(content),
  };
}

/**
 * Email sent when a plan is upgraded/downgraded.
 */
export function tenantPlanUpgradeEmail(data: PlanUpgradeData): { subject: string; html: string } {
  const content = `
    <h1>Plan mis &agrave; jour</h1>
    <p>Bonjour ${data.ownerName},</p>
    <p>Votre plan a &eacute;t&eacute; modifi&eacute; avec succ&egrave;s.</p>

    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Ancien plan</span>
        <span class="info-value">${data.oldPlanName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Nouveau plan</span>
        <span class="info-value">${data.newPlanName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Nouveau tarif</span>
        <span class="info-value">${(data.newMonthlyPrice / 100).toFixed(2)} $ CAD/mois</span>
      </div>
    </div>

    <p>La modification est effective imm&eacute;diatement. Tout montant au prorata sera appliqu&eacute; &agrave; votre prochaine facture.</p>

    <div class="btn-container">
      <a href="${data.adminUrl}" class="btn">Voir mon abonnement</a>
    </div>
  `;

  return {
    subject: `Plan mis à jour : ${data.newPlanName} — ${data.tenantName}`,
    html: tenantBaseTemplate(content),
  };
}

/**
 * Email sent when data accumulation starts on a module.
 */
export function tenantModuleAccumulationEmail(data: ModuleAccumulationData): { subject: string; html: string } {
  const content = `
    <h1>Accumulation de donn&eacute;es activ&eacute;e</h1>
    <p>Bonjour ${data.ownerName},</p>
    <p>L'accumulation de donn&eacute;es pour le module <span class="highlight">${data.moduleName}</span> est maintenant active sur votre boutique <strong>${data.tenantName}</strong>.</p>

    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Module</span>
        <span class="info-value">${data.moduleName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Gratuit jusqu'au</span>
        <span class="info-value">${data.freeUntil}</span>
      </div>
    </div>

    <p>Les donn&eacute;es li&eacute;es &agrave; ce module se collectent en arri&egrave;re-plan. Quand vous activerez le module, toutes vos donn&eacute;es accumul&eacute;es seront imm&eacute;diatement disponibles.</p>

    <p><strong>Bon &agrave; savoir :</strong> Si vous activez ce module dans les 12 premiers mois, vous b&eacute;n&eacute;ficiez d'un forfait fid&eacute;lit&eacute; 24 mois &agrave; prix r&eacute;duit !</p>

    <div class="btn-container">
      <a href="${data.adminUrl}" class="btn">G&eacute;rer mes modules</a>
    </div>
  `;

  return {
    subject: `Accumulation de données activée : ${data.moduleName}`,
    html: tenantBaseTemplate(content),
  };
}
