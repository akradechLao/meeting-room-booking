import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const checkAvailabilitySchema = z.object({
  roomId: z.string().min(1),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = checkAvailabilitySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'ข้อมูลไม่ครบ' }, { status: 400 });
    }

    const { roomId, startAt, endAt } = validation.data;
    const startDate = new Date(startAt);
    const endDate = new Date(endAt);

    // Check conflict
    const conflict = await prisma.booking.findFirst({
      where: {
        roomId,
        status: { notIn: ['cancelled', 'rejected'] },
        startAt: { lt: endDate },
        endAt: { gt: startDate },
      },
    });

    if (conflict) {
      return NextResponse.json({
        available: false,
        conflictTitle: conflict.title,
      });
    }

    // Check blackout
    const blackout = await prisma.blackout.findFirst({
      where: {
        OR: [{ roomId: '*' }, { roomId }],
        startAt: { lt: endDate },
        endAt: { gt: startDate },
      },
    });

    if (blackout) {
      return NextResponse.json({ available: false, blackout: true });
    }

    return NextResponse.json({ available: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
