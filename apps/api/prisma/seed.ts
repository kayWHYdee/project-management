import { ItemCategory, PrismaClient, Role } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

/**
 * Global item catalog. Items are NOT scoped to a system type — any item can be
 * used in any system. Order here defines the default `sortOrder` used by the
 * autocomplete picker.
 *
 * NOTE: `____Head` is a placeholder the owner will rename in Settings → Items.
 */
const SEED_ITEMS: ReadonlyArray<{ name: string; category: ItemCategory }> = [
  { name: 'Pipe', category: ItemCategory.FITTINGS },
  { name: 'Valve', category: ItemCategory.FITTINGS },
  { name: 'Wire', category: ItemCategory.ELECTRICAL },
  { name: 'MS Pipe', category: ItemCategory.MECHANICAL },
  { name: 'Fittings Pipe', category: ItemCategory.FITTINGS },
  { name: 'Rubber Sheet', category: ItemCategory.MECHANICAL },
  { name: 'Pump', category: ItemCategory.MECHANICAL },
  { name: 'Sewage Pump', category: ItemCategory.MECHANICAL },
  { name: 'Settler', category: ItemCategory.MECHANICAL },
  { name: 'Filter', category: ItemCategory.MECHANICAL },
  { name: 'Diffuser', category: ItemCategory.MECHANICAL },
  { name: 'Panel', category: ItemCategory.ELECTRICAL },
  { name: 'Settler Sheet', category: ItemCategory.MECHANICAL },
  { name: 'Air Blower', category: ItemCategory.MECHANICAL },
  { name: 'Filter Press', category: ItemCategory.MECHANICAL },
  { name: 'Nozzle', category: ItemCategory.FITTINGS },
  { name: 'Pool Pump', category: ItemCategory.MECHANICAL },
  { name: '____Head', category: ItemCategory.OTHER },
  { name: 'Lights', category: ItemCategory.ELECTRICAL },
  { name: 'Pool Controller', category: ItemCategory.ELECTRICAL },
  { name: 'Ladder', category: ItemCategory.FITTINGS },
  { name: 'Trolley Pump', category: ItemCategory.MECHANICAL },
  { name: 'Membrane', category: ItemCategory.MEDIA },
  { name: 'Pump Spares', category: ItemCategory.MECHANICAL },
  { name: 'Panel Spares', category: ItemCategory.ELECTRICAL },
  { name: 'TCCA', category: ItemCategory.CHEMICAL },
  { name: 'Open Well Pump', category: ItemCategory.MECHANICAL },
  { name: 'Controller', category: ItemCategory.ELECTRICAL },
  { name: 'Vertical Pump', category: ItemCategory.MECHANICAL },
  { name: 'Skid', category: ItemCategory.MECHANICAL },
];

async function seedItems(): Promise<void> {
  for (const [index, item] of SEED_ITEMS.entries()) {
    const sortOrder = index * 10;
    // Match on the unique name. Existing rows are left untouched so that renames
    // or category changes made in the UI are never clobbered by a re-run.
    await prisma.item.upsert({
      where: { name: item.name },
      update: {},
      create: { name: item.name, category: item.category, sortOrder },
    });
  }
}

async function seedFirstOwner(): Promise<void> {
  const existingUsers = await prisma.user.count();
  if (existingUsers > 0) {
    return;
  }

  const name = process.env.BOOTSTRAP_OWNER_NAME;
  const email = process.env.BOOTSTRAP_OWNER_EMAIL;
  const password = process.env.BOOTSTRAP_OWNER_PASSWORD;

  if (!name || !email || !password) {
    console.warn(
      '[seed] No users exist and BOOTSTRAP_OWNER_* env vars are not fully set; ' +
        'skipping owner creation. Set them and re-run the seed to bootstrap login.',
    );
    return;
  }

  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
  await prisma.user.create({
    data: { name, email: email.toLowerCase(), passwordHash, role: Role.OWNER },
  });
  console.warn(`[seed] Created bootstrap OWNER ${email}. Change this password after first login.`);
}

async function main(): Promise<void> {
  await seedItems();
  await seedFirstOwner();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error('[seed] failed', error);
    await prisma.$disconnect();
    process.exitCode = 1;
  });
