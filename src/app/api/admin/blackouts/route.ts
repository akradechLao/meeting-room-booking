import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { blackoutSchema } from '@/lib/validations';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const blackouts = await prisma.blackout.findMany({
      orderBy: { startAt: 'desc' },
    });

    // Get room names
    const rooms = await prisma.room.findMany();
    const roomMap = new Map(rooms.map((r) => [r.id, r.name]));

    const enriched = blackouts.map((b) => ({
      ...b,
      roomName: b.roomId === '*' ? '(ทุกห้อง)' : roomMap.get(b.roomId) || '(ไม่พบ)',
    }));

    return NextResponse.json(enriched);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = blackoutSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { id, roomId, startAt, endAt, reason } = validation.data;
    const startDate = new Date(startAt);
    const endDate = new Date(endAt);

    if (endDate <= startDate) {
      return NextResponse.json({ error: 'เวลาไม่ถูกต้อง' }, { status: 400 });
    }

    if (id) {
      // Update existing blackout
      const existing = await prisma.blackout.findUnique({ where: { id } });
      if (!existing) {
        return NextResponse.json({ error: 'ไม่พบ' }, { status: 404 });
      }

      await prisma.blackout.update({
        where: { id },
        data: { roomId, startAt: startDate, endAt: endDate, reason },
      });

      await prisma.auditLog.create({
        data: {
          userId: (session.user as any).id,
          action: 'UPDATE_BLACKOUT',
          target: id,
        },
      });

      return NextResponse.json({ id });
    } else {
      // Create new blackout
      const newBlackout = await prisma.blackout.create({
        data: { roomId, startAt: startDate, endAt: endDate, reason },
      });

      await prisma.auditLog.create({
        data: {
          userId: (session.user as any).id,
          action: 'CREATE_BLACKOUT',
          target: newBlackout.id,
        },
      });

      return NextResponse.json({ id: newBlackout.id });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'กรุณาระบุ id' }, { status: 400 });
    }

    const blackout = await prisma.blackout.findUnique({ where: { id } });
    if (!blackout) {
      return NextResponse.json({ error: 'ไม่พบ' }, { status: 404 });
    }

    await prisma.blackout.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: (session.user as any).id,
        action: 'DELETE_BLACKOUT',
        target: id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
