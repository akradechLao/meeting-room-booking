import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { bookingSchema } from '@/lib/validations';

function generateToken(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 12);
}

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
    const all = searchParams.get('all') === 'true';

    const where: any = {};

    // Non-admin users can only see their own bookings
    if (!all || (session.user as any).role !== 'admin') {
      where.userId = (session.user as any).id;
    }

    if (roomId) where.roomId = roomId;
    if (status) where.status = status;

    if (from || to) {
      where.startAt = {};
      if (from) where.startAt.gte = new Date(from);
      if (to) where.startAt.lte = new Date(to);
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
      ...b,
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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = bookingSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { roomId, title, description, startAt, endAt } = validation.data;
    const userId = (session.user as any).id;

    // Check room exists
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room || !room.active) {
      return NextResponse.json({ error: 'ห้องไม่พร้อมใช้งาน' }, { status: 400 });
    }

    // Check time validity
    const startDate = new Date(startAt);
    const endDate = new Date(endAt);
    if (endDate <= startDate) {
      return NextResponse.json({ error: 'เวลาสิ้นสุดต้องมากกว่าเริ่ม' }, { status: 400 });
    }

    // Check duration limits
    const durationMs = endDate.getTime() - startDate.getTime();
    const durationMin = durationMs / 60000;

    const minDurationSetting = await prisma.setting.findUnique({ where: { key: 'min_duration_min' } });
    const maxDurationSetting = await prisma.setting.findUnique({ where: { key: 'max_duration_min' } });
    const minDuration = parseInt(minDurationSetting?.value || '15');
    const maxDuration = parseInt(maxDurationSetting?.value || '480');

    if (durationMin < minDuration) {
      return NextResponse.json({ error: `ระยะเวลาขั้นต่ำ ${minDuration} นาที` }, { status: 400 });
    }
    if (durationMin > maxDuration) {
      return NextResponse.json({ error: `ระยะเวลาสูงสุด ${maxDuration} นาที` }, { status: 400 });
    }

    // Check booking days ahead limit
    const aheadSetting = await prisma.setting.findUnique({ where: { key: 'allow_booking_days_ahead' } });
    const maxAheadDays = parseInt(aheadSetting?.value || '60');
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + maxAheadDays);
    if (startDate > maxDate) {
      return NextResponse.json({ error: `จองล่วงหน้าได้ไม่เกิน ${maxAheadDays} วัน` }, { status: 400 });
    }

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
      return NextResponse.json(
        { error: `ช่วงเวลานี้มีการจองอื่นอยู่แล้ว: ${conflict.title}` },
        { status: 409 }
      );
    }

    // Check blackout
    const blackout = await prisma.blackout.findFirst({
      where: {
        OR: [
          { roomId: '*' },
          { roomId },
        ],
        startAt: { lt: endDate },
        endAt: { gt: startDate },
      },
    });

    if (blackout) {
      return NextResponse.json(
        { error: 'ห้องไม่พร้อมใช้งานในช่วงเวลานี้ (Blackout)' },
        { status: 400 }
      );
    }

    // Auto approve setting
    const autoApproveSetting = await prisma.setting.findUnique({ where: { key: 'auto_approve' } });
    const isAutoApprove = autoApproveSetting?.value === 'true';
    const isAdmin = (session.user as any).role === 'admin';
    const bookingStatus = isAutoApprove || isAdmin ? 'approved' : 'pending';

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        roomId,
        userId,
        title,
        description: description || '',
        startAt: startDate,
        endAt: endDate,
        status: bookingStatus,
        qrToken: generateToken(),
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'CREATE_BOOKING',
        target: booking.id,
        details: JSON.stringify({ title, roomId }),
      },
    });

    return NextResponse.json({ id: booking.id, status: bookingStatus });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
