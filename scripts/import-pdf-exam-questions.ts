/**
 * Import PDF-extracted exam questions into QuestionBank
 * Source: 8 PDF exam papers (194 questions)
 * Run: npx tsx scripts/import-pdf-exam-questions.ts
 */
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient({ log: ['error', 'warn'] });

async function main() {
  const tenant = await prisma.tenant.findFirst({ where: { status: 'ACTIVE' } });
  if (!tenant) { console.error('No active tenant'); process.exit(1); }
  const tenantId = tenant.id;

  const data = JSON.parse(fs.readFileSync('scripts/exam-questions-pdf-extracted.json', 'utf-8'));

  const domainMap: Record<string, string> = {
    'deontologie_final': 'deontologie_qc',
    'deontologie_ch1-2_exam': 'deontologie_qc',
    'deontologie_ch3-4_exam': 'deontologie_qc',
    'accma_final': 'acc_maladie',
    'accma_ch5-8': 'acc_maladie',
    'accma_ch5-8_reprise': 'acc_maladie',
    'accma_ch1-4_final': 'acc_maladie',
    'accma_ch1-4_reponses': 'acc_maladie',
  };

  let totalCreated = 0;

  for (const [key, set] of Object.entries(data) as [string, any][]) {
    const domain = domainMap[key] ?? key;
    const bankName = `PQAP ${set.manual} Examen — ${set.source.replace('.pdf', '')}`;

    const existing = await prisma.questionBank.findFirst({ where: { tenantId, name: bankName } });
    if (existing) { console.log(`  Skip: ${bankName}`); continue; }

    const bank = await prisma.questionBank.create({
      data: { tenantId, name: bankName, description: `Questions extraites de l'examen PDF: ${set.source}`, domain },
    });

    for (const q of set.questions) {
      const options = q.options.map((text: string, i: number) => ({
        id: String.fromCharCode(97 + i),
        text,
        isCorrect: false,
      }));

      await prisma.questionBankItem.create({
        data: {
          bankId: bank.id,
          type: 'MULTIPLE_CHOICE',
          question: q.question,
          options,
          bloomLevel: 3, // Application level (exam questions)
          difficulty: 'hard',
          tags: [set.manual, domain, 'exam'],
        },
      });
      totalCreated++;
    }
    console.log(`  Created: ${bankName} (${set.count} questions)`);
  }

  console.log(`\nDone: ${totalCreated} questions imported`);
  await prisma.$disconnect();
}

main().catch(console.error);
