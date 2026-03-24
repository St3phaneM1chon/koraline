import { PrismaClient, LeadTemperature, FollowUpStatus } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seeds CRM data for the Rep 360° Dashboard:
 * - 3 sales rep users (EMPLOYEE role)
 * - 20 leads assigned to reps
 * - 12 deals (various stages)
 * - 90 days of AgentDailyStats
 * - CrmQuotas per rep
 * - CrmActivities (calls, emails, meetings)
 * - RepBonusTiers (3 tiers)
 * - RepFollowUpSchedules
 */
export async function seedCrmReps() {
  // Check if seed data already exists
  const existingReps = await prisma.user.count({ where: { role: 'EMPLOYEE' } });
  if (existingReps >= 3) {
    console.log('  ✓ CRM rep seed data already exists, skipping');
    return;
  }

  console.log('  → Seeding CRM Rep 360° Dashboard data...');

  // --- 1. Create 3 sales reps ---
  const reps = await Promise.all([
    prisma.user.create({
      data: {
        email: 'marie.tremblay@biocyclepeptides.com',
        name: 'Marie Tremblay',
        role: 'EMPLOYEE',
        password: '$2b$10$dummyhashnotusedforlogin000000000000000000000000000',
        locale: 'fr',
        timezone: 'America/Toronto',
      },
    }),
    prisma.user.create({
      data: {
        email: 'jean.dupont@biocyclepeptides.com',
        name: 'Jean Dupont',
        role: 'EMPLOYEE',
        password: '$2b$10$dummyhashnotusedforlogin000000000000000000000000000',
        locale: 'fr',
        timezone: 'America/Toronto',
      },
    }),
    prisma.user.create({
      data: {
        email: 'alex.chen@biocyclepeptides.com',
        name: 'Alex Chen',
        role: 'EMPLOYEE',
        password: '$2b$10$dummyhashnotusedforlogin000000000000000000000000000',
        locale: 'en',
        timezone: 'America/Toronto',
      },
    }),
  ]);

  console.log(`  ✓ Created ${reps.length} sales reps`);

  // --- 2. Get pipeline stage IDs ---
  const stages = await prisma.crmPipelineStage.findMany({ orderBy: { position: 'asc' } });
  const stageMap: Record<string, string> = {};
  for (const s of stages) {
    stageMap[s.name] = s.id;
  }
  const pipeline = await prisma.crmPipeline.findFirst({ where: { isDefault: true } });
  if (!pipeline) {
    console.log('  ✗ No default pipeline found, skipping deals');
    return;
  }

  // --- 3. Create 20 leads ---
  const leadNames = [
    { contactName: 'Sophie Martin', companyName: 'PharmaNord Inc.', email: 'sophie.m@pharmanord.ca', score: 85, temperature: 'HOT' as LeadTemperature },
    { contactName: 'Pierre Lavoie', companyName: 'BioLab Québec', email: 'plavoie@biolab.qc.ca', score: 72, temperature: 'WARM' as LeadTemperature },
    { contactName: 'Julie Côté', companyName: 'MedResearch Co', email: 'j.cote@medresearch.com', score: 60, temperature: 'WARM' as LeadTemperature },
    { contactName: 'Marc Beaulieu', companyName: 'PeptideX Labs', email: 'marc@peptidex.ca', score: 45, temperature: 'COLD' as LeadTemperature },
    { contactName: 'Isabelle Roy', companyName: 'NutriScience Plus', email: 'iroy@nutriscience.ca', score: 90, temperature: 'HOT' as LeadTemperature },
    { contactName: 'François Gagnon', companyName: 'SynthBio Inc.', email: 'fgagnon@synthbio.com', score: 55, temperature: 'WARM' as LeadTemperature },
    { contactName: 'Nathalie Bouchard', companyName: 'CanadaPharma', email: 'n.bouchard@canadapharma.ca', score: 30, temperature: 'COLD' as LeadTemperature },
    { contactName: 'David Morin', companyName: 'BioTech Solutions', email: 'dmorin@biotechsol.com', score: 78, temperature: 'HOT' as LeadTemperature },
    { contactName: 'Caroline Fortin', companyName: 'PeptidePure Ltd', email: 'cfortin@peptidepure.com', score: 65, temperature: 'WARM' as LeadTemperature },
    { contactName: 'Éric Bergeron', companyName: 'LaboMontréal', email: 'ebergeron@labomtl.ca', score: 40, temperature: 'COLD' as LeadTemperature },
    { contactName: 'Anne-Marie Leclerc', companyName: 'ResearchPlus', email: 'amleclerc@researchplus.ca', score: 82, temperature: 'HOT' as LeadTemperature },
    { contactName: 'Simon Pelletier', companyName: 'PharmaVie', email: 'spelletier@pharmavie.com', score: 58, temperature: 'WARM' as LeadTemperature },
    { contactName: 'Valérie Cloutier', companyName: 'BioGenix', email: 'vcloutier@biogenix.ca', score: 73, temperature: 'HOT' as LeadTemperature },
    { contactName: 'Patrick Ouellet', companyName: 'ScienceFirst', email: 'pouellet@sciencefirst.com', score: 35, temperature: 'COLD' as LeadTemperature },
    { contactName: 'Mélanie Paquette', companyName: 'NovaPeptide', email: 'mpaquette@novapeptide.ca', score: 88, temperature: 'HOT' as LeadTemperature },
    { contactName: 'Yves Deschamps', companyName: 'LaboQuébec', email: 'ydeschamps@laboquebec.ca', score: 50, temperature: 'WARM' as LeadTemperature },
    { contactName: 'Catherine Lepage', companyName: 'MedBio Corp', email: 'clepage@medbio.ca', score: 67, temperature: 'WARM' as LeadTemperature },
    { contactName: 'Robert Bélanger', companyName: 'PharmaLink', email: 'rbelanger@pharmalink.com', score: 42, temperature: 'COLD' as LeadTemperature },
    { contactName: 'Marie-Ève Gauthier', companyName: 'BioChem Lab', email: 'megauthier@biochem.ca', score: 80, temperature: 'HOT' as LeadTemperature },
    { contactName: 'Luc Tanguay', companyName: 'PeptideSolutions', email: 'ltanguay@peptidesol.com', score: 70, temperature: 'WARM' as LeadTemperature },
  ];

  const statuses = ['NEW', 'CONTACTED', 'QUALIFIED', 'UNQUALIFIED', 'CONVERTED'] as const;
  const sources = ['WEB', 'REFERRAL', 'CAMPAIGN', 'PARTNER', 'EMAIL'] as const;

  const leads = [];
  for (let i = 0; i < leadNames.length; i++) {
    const rep = reps[i % 3]; // Distribute across 3 reps
    const ld = leadNames[i];
    const daysAgo = Math.floor(Math.random() * 90) + 10;
    const lead = await prisma.crmLead.create({
      data: {
        contactName: ld.contactName,
        companyName: ld.companyName,
        email: ld.email,
        score: ld.score,
        temperature: ld.temperature,
        status: statuses[i % statuses.length],
        source: sources[i % sources.length],
        assignedToId: rep.id,
        lastContactedAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
        nextFollowUpAt: new Date(Date.now() + (7 + i) * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - (daysAgo + 30) * 24 * 60 * 60 * 1000),
      },
    });
    leads.push(lead);
  }
  console.log(`  ✓ Created ${leads.length} leads`);

  // --- 4. Create 12 deals ---
  const dealData = [
    { name: 'BPC-157 Bulk Order', value: 15000, stageName: 'Closed Won', repIdx: 0 },
    { name: 'TB-500 Research Supply', value: 8500, stageName: 'Negotiation', repIdx: 1 },
    { name: 'PT-141 Annual Contract', value: 25000, stageName: 'Closed Won', repIdx: 0 },
    { name: 'CJC-1295 Lab Kit', value: 3200, stageName: 'Proposal', repIdx: 2 },
    { name: 'Ipamorelin Subscription', value: 12000, stageName: 'Discovery', repIdx: 1 },
    { name: 'GHK-Cu Premium Pack', value: 6800, stageName: 'Closed Won', repIdx: 2 },
    { name: 'Thymosin Alpha Research', value: 9500, stageName: 'Closed Lost', repIdx: 0 },
    { name: 'LL-37 Clinical Supply', value: 18000, stageName: 'Negotiation', repIdx: 1 },
    { name: 'Semax Nootropic Bulk', value: 4200, stageName: 'Qualification', repIdx: 2 },
    { name: 'Selank Research Order', value: 7300, stageName: 'Closed Won', repIdx: 0 },
    { name: 'DSIP Sleep Research', value: 5600, stageName: 'Proposal', repIdx: 1 },
    { name: 'KPV Anti-inflammatory', value: 11000, stageName: 'Closed Won', repIdx: 2 },
  ];

  const deals: { id: string; actualCloseDate: Date | null; createdAt: Date }[] = [];
  for (let i = 0; i < dealData.length; i++) {
    const dd = dealData[i];
    const stageId = stageMap[dd.stageName];
    if (!stageId) continue;
    const isWon = dd.stageName === 'Closed Won';
    const isLost = dd.stageName === 'Closed Lost';
    const daysAgo = Math.floor(Math.random() * 60) + 5;

    const deal = await prisma.crmDeal.create({
      data: {
        title: dd.name,
        value: dd.value,
        currency: 'CAD',
        pipelineId: pipeline.id,
        stageId,
        assignedToId: reps[dd.repIdx].id,
        leadId: leads[i % leads.length].id,
        expectedCloseDate: isWon || isLost
          ? new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
          : new Date(Date.now() + (15 + i * 5) * 24 * 60 * 60 * 1000),
        actualCloseDate: isWon || isLost ? new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000) : null,
        isRecurring: i % 4 === 0,
        mrrValue: i % 4 === 0 ? Math.round(dd.value / 12) : null,
        createdAt: new Date(Date.now() - (daysAgo + 30) * 24 * 60 * 60 * 1000),
      },
    });
    deals.push(deal);
  }
  console.log(`  ✓ Created ${deals.length} deals`);

  // --- 5. Create AgentDailyStats (last 90 days per rep) ---
  const statsData = [];
  for (const rep of reps) {
    for (let d = 0; d < 90; d++) {
      const date = new Date();
      date.setDate(date.getDate() - d);
      date.setHours(0, 0, 0, 0);
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;

      const callsMade = 15 + Math.floor(Math.random() * 25);
      const callsAnswered = Math.floor(callsMade * (0.4 + Math.random() * 0.3));
      const conversions = Math.floor(callsAnswered * (0.05 + Math.random() * 0.15));
      const revenue = conversions * (800 + Math.floor(Math.random() * 5000));

      statsData.push({
        agentId: rep.id,
        date,
        callsMade,
        callsAnswered,
        totalTalkTime: callsAnswered * (120 + Math.floor(Math.random() * 300)),
        avgHandleTime: 180 + Math.floor(Math.random() * 200),
        conversions,
        revenue,
        breakTime: 30 + Math.floor(Math.random() * 30),
      });
    }
  }
  // Batch insert
  await prisma.agentDailyStats.createMany({ data: statsData });
  console.log(`  ✓ Created ${statsData.length} daily stats records`);

  // --- 6. Create CrmQuotas ---
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  const quarterEnd = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0);

  for (const rep of reps) {
    await prisma.crmQuota.createMany({
      data: [
        { agentId: rep.id, period: 'MONTHLY', targetType: 'calls', target: 400, actual: 250 + Math.floor(Math.random() * 200), periodStart: monthStart, periodEnd: monthEnd },
        { agentId: rep.id, period: 'MONTHLY', targetType: 'revenue', target: 50000, actual: 30000 + Math.floor(Math.random() * 30000), periodStart: monthStart, periodEnd: monthEnd },
        { agentId: rep.id, period: 'MONTHLY', targetType: 'deals', target: 8, actual: 3 + Math.floor(Math.random() * 8), periodStart: monthStart, periodEnd: monthEnd },
        { agentId: rep.id, period: 'MONTHLY', targetType: 'conversions', target: 25, actual: 10 + Math.floor(Math.random() * 20), periodStart: monthStart, periodEnd: monthEnd },
        { agentId: rep.id, period: 'QUARTERLY', targetType: 'revenue', target: 150000, actual: 80000 + Math.floor(Math.random() * 100000), periodStart: quarterStart, periodEnd: quarterEnd },
      ],
    });
  }
  console.log(`  ✓ Created ${reps.length * 5} quotas`);

  // --- 7. Create CrmActivities ---
  const activityTypes = ['CALL', 'EMAIL', 'SMS', 'MEETING', 'NOTE'] as const;
  const activityData = [];
  for (const rep of reps) {
    for (let i = 0; i < 30; i++) {
      const daysAgo = Math.floor(Math.random() * 60);
      const type = activityTypes[i % activityTypes.length];
      activityData.push({
        type,
        title: type === 'CALL' ? 'Appel de suivi client'
          : type === 'EMAIL' ? 'Email proposition commerciale'
          : type === 'SMS' ? 'SMS rappel rendez-vous'
          : type === 'MEETING' ? 'Réunion présentation produit'
          : 'Note de suivi interne',
        description: `Activité ${type} du ${new Date(Date.now() - daysAgo * 86400000).toLocaleDateString('fr-CA')}`,
        performedById: rep.id,
        leadId: leads[Math.floor(Math.random() * leads.length)].id,
        dealId: deals.length > 0 ? deals[Math.floor(Math.random() * deals.length)].id : null,
        createdAt: new Date(Date.now() - daysAgo * 86400000),
      });
    }
  }
  await prisma.crmActivity.createMany({ data: activityData });
  console.log(`  ✓ Created ${activityData.length} activities`);

  // --- 8. Create RepBonusTiers ---
  const tiers = await Promise.all([
    prisma.repBonusTier.create({
      data: {
        name: 'Bronze',
        commissionType: 'HYBRID',
        revenueThreshold: 10000,
        commissionRate: 0.03,
        activityType: 'CALLS',
        minVolume: 200,
        minPrequalScore: 40,
        ratePerCall: 1.50,
        ratePerAppointment: 25.00,
        maxPayout: 5000,
        period: 'monthly',
        priority: 0,
      },
    }),
    prisma.repBonusTier.create({
      data: {
        name: 'Silver',
        commissionType: 'HYBRID',
        revenueThreshold: 25000,
        commissionRate: 0.05,
        activityType: 'BOTH',
        minVolume: 350,
        minPrequalScore: 55,
        ratePerCall: 2.00,
        ratePerAppointment: 40.00,
        maxPayout: 10000,
        period: 'monthly',
        priority: 1,
      },
    }),
    prisma.repBonusTier.create({
      data: {
        name: 'Gold',
        commissionType: 'SALES',
        revenueThreshold: 50000,
        commissionRate: 0.08,
        activityType: null,
        minVolume: null,
        minPrequalScore: 70,
        ratePerCall: null,
        ratePerAppointment: null,
        maxPayout: null,
        period: 'monthly',
        priority: 2,
      },
    }),
  ]);
  console.log(`  ✓ Created ${tiers.length} bonus tiers`);

  // --- 9. Create RepFollowUpSchedules ---
  const followUpData = [];
  const intervals = [3, 6, 12, 18, 24];
  const followUpTypes = ['RETENTION', 'UPSELL', 'RENEWAL', 'CHECK_IN', 'ANNIVERSARY'] as const;

  for (const rep of reps) {
    // Create follow-ups for won deals
    const wonDeals = deals.filter(
      (d) => dealData[deals.indexOf(d)]?.stageName === 'Closed Won' && dealData[deals.indexOf(d)]?.repIdx === reps.indexOf(rep)
    );
    for (const deal of wonDeals) {
      for (let j = 0; j < intervals.length; j++) {
        const scheduledDate = new Date(deal.actualCloseDate || deal.createdAt);
        scheduledDate.setMonth(scheduledDate.getMonth() + intervals[j]);
        const isPast = scheduledDate < now;

        followUpData.push({
          agentId: rep.id,
          dealId: deal.id,
          type: followUpTypes[j],
          intervalMonths: intervals[j],
          scheduledDate,
          completedDate: isPast && Math.random() > 0.3 ? new Date(scheduledDate.getTime() + 86400000 * Math.floor(Math.random() * 5)) : null,
          status: (isPast ? (Math.random() > 0.3 ? 'COMPLETED' : 'OVERDUE') : 'PENDING') as FollowUpStatus,
          notes: isPast ? 'Client satisfait, renouvellement discuté' : null,
          outcome: isPast && Math.random() > 0.3 ? 'Positive - client intéressé' : null,
        });
      }
    }
  }
  await prisma.repFollowUpSchedule.createMany({ data: followUpData });
  console.log(`  ✓ Created ${followUpData.length} follow-up schedules`);

  console.log('  ✓ CRM Rep 360° seed data complete!');
}

// Allow direct execution
if (require.main === module) {
  seedCrmReps()
    .then(() => {
      console.log('Done!');
      process.exit(0);
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
