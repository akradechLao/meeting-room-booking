import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Seed Users
  const adminPasswordHash = await bcrypt.hash('1234', 12);
  const akradechPasswordHash = await bcrypt.hash('akradech1975', 12);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: adminPasswordHash,
      role: 'admin',
      name: 'ผู้ดูแลระบบ',
      email: 'admin@example.com',
      active: true,
    },
  });

  const akradech = await prisma.user.upsert({
    where: { username: 'akradech' },
    update: {},
    create: {
      username: 'akradech',
      passwordHash: akradechPasswordHash,
      role: 'user',
      name: 'akradech',
      email: 'akradech@example.com',
      active: true,
    },
  });

  console.log('Users seeded:', { admin: admin.id, akradech: akradech.id });

  // Seed Rooms
  const roomsData = [
    { name: 'ห้องประชุม A', location: 'ชั้น 1', capacity: 8, equipment: 'TV, Whiteboard', color: '#6366f1' },
    { name: 'ห้องประชุม B', location: 'ชั้น 1', capacity: 12, equipment: 'Projector, Conference Phone', color: '#10b981' },
    { name: 'ห้องประชุม C', location: 'ชั้น 2', capacity: 4, equipment: 'TV', color: '#f59e0b' },
    { name: 'ห้อง Brainstorm', location: 'ชั้น 2', capacity: 6, equipment: 'Whiteboard, Sticky Notes', color: '#ec4899' },
    { name: 'ห้อง Auditorium', location: 'ชั้น 3', capacity: 50, equipment: 'Stage, Microphone, Projector', color: '#ef4444' },
  ];

  for (const room of roomsData) {
    await prisma.room.create({ data: room });
  }
  console.log('Rooms seeded:', roomsData.length);

  // Seed Settings
  const settingsData = [
    { key: 'system_name', value: 'Meeting Room' },
    { key: 'org_name', value: 'My Organization' },
    { key: 'auto_approve', value: 'false' },
    { key: 'min_duration_min', value: '15' },
    { key: 'max_duration_min', value: '480' },
    { key: 'allow_booking_days_ahead', value: '60' },
    { key: 'enable_telegram', value: 'false' },
    { key: 'telegram_token', value: '' },
    { key: 'telegram_chat_id', value: '' },
    { key: 'theme_default', value: 'light' },
  ];

  for (const setting of settingsData) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }
  console.log('Settings seeded:', settingsData.length);

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
