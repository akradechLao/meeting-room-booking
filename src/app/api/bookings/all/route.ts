import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');
    const status = searchParams.get('status');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const where: any = {};

    if (roomId) where.roomId = roomId;
    if (status) where.status = status;
    if (from || to) {
      where.startAt = {};
      if (from) where.startAt.gte = new Date(from);
      if (to) where.startAt.lte = new Date(to + 'T23:59:59');
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        room: { select: { name: true, color: true } },
        user: { select: { name: true, username: true } },
      },
      orderBy: { startAt: 'asc' },
    });

    const enriched = bookings.map((b) => ({
      id: b.id,
      title: b.title,
      description: b.description,
      startAt: b.startAt,
      endAt: b.endAt,
      status: b.status,
      roomId: b.roomId,
      roomName: b.room?.name || '(ไม่พบ)',
      roomColor: b.room?.color || '#888',
      userName: b.user?.name || '(ไม่พบ)',
      username: b.user?.username || '',
    }));

    return NextResponse.json(enriched);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
