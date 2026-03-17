/**
 * Setup VoIP Credentials - Configure real Telnyx SIP credentials in the database.
 *
 * This script:
 * 1. Encrypts the real Telnyx SIP username/password with AES-256-GCM
 * 2. Updates all SipExtension records with real credentials
 * 3. Updates PhoneNumber records with real Telnyx DIDs
 * 4. Verifies the Telnyx connection record
 *
 * Usage: npx tsx scripts/setup-voip-credentials.ts
 */

import { PrismaClient } from '@prisma/client';
import { createCipheriv, randomBytes } from 'crypto';
// Load .env manually
import { readFileSync } from 'fs';
import { resolve } from 'path';
try {
  const envPath = resolve(process.cwd(), '.env');
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex > 0) {
      const key = trimmed.substring(0, eqIndex).trim();
      const value = trimmed.substring(eqIndex + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  }
} catch { /* .env not found, rely on existing env vars */ }

const prisma = new PrismaClient();

// ── Encryption (same as src/lib/platform/crypto.ts) ──────────────
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY || process.env.PLATFORM_ENCRYPTION_KEY;
  if (!key) throw new Error('ENCRYPTION_KEY not set in .env');
  if (key.length === 64) return Buffer.from(key, 'hex');
  if (key.length === 32) return Buffer.from(key, 'utf-8');
  throw new Error('ENCRYPTION_KEY must be 32 bytes (64 hex chars or 32 raw chars)');
}

function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf-8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
}

// ── Configuration ────────────────────────────────────────────────
const TELNYX_SIP_USERNAME = process.env.TELNYX_SIP_USERNAME || 'biocyclepbx';
const TELNYX_SIP_PASSWORD = process.env.TELNYX_SIP_PASSWORD || 'BcPbx2026Sipx';
const TELNYX_CONNECTION_ID = process.env.TELNYX_CONNECTION_ID || '2907808239930311884';
const SIP_DOMAIN = 'sip.telnyx.com';

// Real Telnyx DIDs
const REAL_DIDS = [
  { number: '+14388030370', displayName: 'BioCycle Peptides - MTL', type: 'LOCAL' as const, country: 'CA' },
  { number: '+18735860370', displayName: 'BioCycle Peptides - QC', type: 'LOCAL' as const, country: 'CA' },
  { number: '+14378880370', displayName: 'BioCycle Peptides - TOR', type: 'LOCAL' as const, country: 'CA' },
  { number: '+18443040370', displayName: 'BioCycle Peptides - Toll-Free', type: 'TOLL_FREE' as const, country: 'CA' },
];

async function main() {
  console.log('🔧 Setting up VoIP credentials...\n');

  // 1. Encrypt SIP credentials
  console.log('1. Encrypting Telnyx SIP credentials...');
  const encryptedUsername = encrypt(TELNYX_SIP_USERNAME);
  const encryptedPassword = encrypt(TELNYX_SIP_PASSWORD);
  console.log(`   Username encrypted: ${encryptedUsername.substring(0, 20)}...`);
  console.log(`   Password encrypted: ${encryptedPassword.substring(0, 20)}...`);

  // 2. Update Telnyx VoipConnection
  console.log('\n2. Verifying Telnyx VoipConnection...');
  const telnyxConn = await prisma.voipConnection.upsert({
    where: { id: 'telnyx-voip-conn-001' },
    create: {
      id: 'telnyx-voip-conn-001',
      provider: 'telnyx',
      isEnabled: true,
      pbxHost: 'sip.telnyx.com',
      accountSid: TELNYX_CONNECTION_ID,
      apiKey: encrypt(process.env.TELNYX_API_KEY || ''),
    },
    update: {
      isEnabled: true,
      pbxHost: 'sip.telnyx.com',
      accountSid: TELNYX_CONNECTION_ID,
    },
  });
  console.log(`   Connection: ${telnyxConn.id} (${telnyxConn.provider}) - enabled: ${telnyxConn.isEnabled}`);

  // 3. Update all SipExtensions with real encrypted credentials
  console.log('\n3. Updating SIP extensions with real Telnyx credentials...');
  const extensions = await prisma.sipExtension.findMany({
    include: { user: { select: { name: true, email: true } } },
  });

  for (const ext of extensions) {
    await prisma.sipExtension.update({
      where: { id: ext.id },
      data: {
        sipUsername: encryptedUsername,
        sipPassword: encryptedPassword,
        sipDomain: SIP_DOMAIN,
        // Reset registration status (will re-register on next login)
        isRegistered: false,
        status: 'OFFLINE',
      },
    });
    console.log(`   Extension ${ext.extension} (${ext.user?.name || ext.user?.email}) -> sip.telnyx.com`);
  }

  // 4. Update PhoneNumbers with real Telnyx DIDs
  console.log('\n4. Setting up real Telnyx DIDs...');

  // Delete old fake numbers
  const deleted = await prisma.phoneNumber.deleteMany({
    where: {
      number: { in: ['+15145550100', '+18005550200', '+12125550300'] },
    },
  });
  console.log(`   Removed ${deleted.count} demo phone numbers`);

  // Insert real DIDs
  for (const did of REAL_DIDS) {
    const phoneNum = await prisma.phoneNumber.upsert({
      where: { number: did.number },
      create: {
        number: did.number,
        displayName: did.displayName,
        type: did.type,
        country: did.country,
        isActive: true,
        connectionId: 'telnyx-voip-conn-001',
      },
      update: {
        displayName: did.displayName,
        type: did.type,
        isActive: true,
        connectionId: 'telnyx-voip-conn-001',
      },
    });
    console.log(`   DID ${phoneNum.number} (${phoneNum.displayName})`);
  }

  // 5. Summary
  console.log('\n========================================');
  console.log('VoIP Setup Complete!');
  console.log('========================================');
  console.log(`  Telnyx Connection: ${TELNYX_CONNECTION_ID}`);
  console.log(`  SIP Domain: ${SIP_DOMAIN}`);
  console.log(`  SIP Username: ${TELNYX_SIP_USERNAME}`);
  console.log(`  Extensions updated: ${extensions.length}`);
  console.log(`  DIDs configured: ${REAL_DIDS.length}`);
  console.log('\nNext steps:');
  console.log('  1. Open admin dashboard -> softphone should auto-register');
  console.log('  2. Check browser console for JsSIP registration events');
  console.log('  3. Try calling your cell phone from the softphone');
  console.log('  4. Test incoming call by calling +14388030370');
}

main()
  .catch((e) => {
    console.error('Setup failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
