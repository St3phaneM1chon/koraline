import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedCrmPipeline() {
  // Check if default pipeline already exists
  const existing = await prisma.crmPipeline.findFirst({ where: { isDefault: true } });
  if (existing) {
    console.log('  ✓ Default CRM pipeline already exists, skipping');
    return;
  }

  console.log('  → Seeding default CRM pipeline...');

  const pipeline = await prisma.crmPipeline.create({
    data: {
      name: 'Sales Pipeline',
      isDefault: true,
      stages: {
        create: [
          { name: 'Qualification', position: 1, probability: 0.10, color: '#6B7280', isWon: false, isLost: false },
          { name: 'Discovery', position: 2, probability: 0.20, color: '#3B82F6', isWon: false, isLost: false },
          { name: 'Proposal', position: 3, probability: 0.40, color: '#8B5CF6', isWon: false, isLost: false },
          { name: 'Negotiation', position: 4, probability: 0.60, color: '#F59E0B', isWon: false, isLost: false },
          { name: 'Closed Won', position: 5, probability: 1.00, color: '#10B981', isWon: true, isLost: false },
          { name: 'Closed Lost', position: 6, probability: 0.00, color: '#EF4444', isWon: false, isLost: true },
        ],
      },
    },
  });

  console.log(`  ✓ Default pipeline created: ${pipeline.id} with 6 stages`);

  // Seed default SLA policies
  const existingSla = await prisma.slaPolicy.findFirst({ where: { isActive: true } });
  if (!existingSla) {
    console.log('  → Seeding default SLA policies...');
    await prisma.slaPolicy.createMany({
      data: [
        { name: 'Urgent SLA', firstResponseMinutes: 15, resolutionMinutes: 120, priority: 'URGENT', isActive: true, channels: ['PHONE', 'CHAT'] },
        { name: 'High SLA', firstResponseMinutes: 60, resolutionMinutes: 480, priority: 'HIGH', isActive: true, channels: ['PHONE', 'EMAIL', 'CHAT'] },
        { name: 'Medium SLA', firstResponseMinutes: 240, resolutionMinutes: 1440, priority: 'MEDIUM', isActive: true, channels: ['EMAIL', 'SMS'] },
        { name: 'Low SLA', firstResponseMinutes: 1440, resolutionMinutes: 4320, priority: 'LOW', isActive: true, channels: ['EMAIL'] },
      ],
    });
    console.log('  ✓ SLA policies created');
  }
}
