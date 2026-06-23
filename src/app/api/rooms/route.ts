import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rooms = await prisma.room.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        location: true,
        capacity: true,
        equipment: true,
        color: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(rooms);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
