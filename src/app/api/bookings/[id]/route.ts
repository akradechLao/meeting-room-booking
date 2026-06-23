import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { action, reason } = body;

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) {
      return NextResponse.json({ error: 'ไม่พบรายการ' }, { status: 404 });
    }

    const userId = (session.user as any).id;
    const isAdmin = (session.user as any).role === 'admin';

    // Cancel booking
    if (action === 'cancel') {
      if (!isAdmin && booking.userId !== userId) {
        return NextResponse.json({ error: 'ไม่มีสิทธิ์' }, { status: 403 });
      }
      if (['cancelled', 'completed'].includes(booking.status)) {
        return NextResponse.json({ error: 'สถานะไม่อนุญาต' }, { status: 400 });
      }

      await prisma.booking.update({
        where: { id },
        data: { status: 'cancelled', updatedAt: new Date() },
      });

      await prisma.auditLog.create({
        data: { userId, action: 'CANCEL_BOOKING', target: id },
      });

      return NextResponse.json({ success: true });
    }

    // Approve booking (admin only)
    if (action === 'approve') {
      if (!isAdmin) {
        return NextResponse.json({ error: 'ต้องเป็น admin' }, { status: 403 });
      }
      if (booking.status !== 'pending') {
        return NextResponse.json({ error: 'สถานะไม่อนุญาต' }, { status: 400 });
      }

      // Check conflict again
      const conflict = await prisma.booking.findFirst({
        where: {
          roomId: booking.roomId,
          id: { not: id },
          status: { notIn: ['cancelled', 'rejected'] },
          startAt: { lt: booking.endAt },
          endAt: { gt: booking.startAt },
        },
      });

      if (conflict && conflict.status === 'approved') {
        return NextResponse.json({ error: 'มีการจองที่อนุมัติแล้วทับซ้อน' }, { status: 409 });
      }

      await prisma.booking.update({
        where: { id },
        data: { status: 'approved', updatedAt: new Date() },
      });

      await prisma.auditLog.create({
        data: { userId, action: 'APPROVE_BOOKING', target: id },
      });

      return NextResponse.json({ success: true });
    }

    // Reject booking (admin only)
    if (action === 'reject') {
      if (!isAdmin) {
        return NextResponse.json({ error: 'ต้องเป็น admin' }, { status: 403 });
      }
      if (booking.status !== 'pending') {
        return NextResponse.json({ error: 'สถานะไม่อนุญาต' }, { status: 400 });
      }

      await prisma.booking.update({
        where: { id },
        data: { status: 'rejected', updatedAt: new Date() },
      });

      await prisma.auditLog.create({
        data: {
          userId,
          action: 'REJECT_BOOKING',
          target: id,
          details: reason ? JSON.stringify({ reason }) : undefined,
        },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Action ไม่ถูกต้อง' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const userId = (session.user as any).id;
    const isAdmin = (session.user as any).role === 'admin';

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) {
      return NextResponse.json({ error: 'ไม่พบรายการ' }, { status: 404 });
    }

    if (!isAdmin && booking.userId !== userId) {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์' }, { status: 403 });
    }

    if (['cancelled', 'completed'].includes(booking.status)) {
      return NextResponse.json({ error: 'สถานะไม่อนุญาต' }, { status: 400 });
    }

    await prisma.booking.update({
      where: { id },
      data: { status: 'cancelled', updatedAt: new Date() },
    });

    await prisma.auditLog.create({
      data: { userId, action: 'CANCEL_BOOKING', target: id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
