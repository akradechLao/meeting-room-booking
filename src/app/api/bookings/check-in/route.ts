import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const checkInSchema = z.object({
  qrToken: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = checkInSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'กรุณาใส่ QR token' }, { status: 400 });
    }

    const { qrToken } = validation.data;

    const booking = await prisma.booking.findUnique({
      where: { qrToken },
    });

    if (!booking) {
      return NextResponse.json({ error: 'ไม่พบ QR นี้' }, { status: 404 });
    }

    if (booking.status !== 'approved') {
      return NextResponse.json({ error: 'การจองยังไม่ได้รับการอนุมัติ' }, { status: 400 });
    }

    if (booking.checkInAt) {
      return NextResponse.json({ error: 'เช็คอินไปแล้ว' }, { status: 400 });
    }

    const now = new Date().toISOString();
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: 'checked_in',
        checkInAt: now,
        updatedAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: booking.userId,
        action: 'CHECK_IN',
        target: booking.id,
      },
    });

    return NextResponse.json({ id: booking.id, title: booking.title });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
