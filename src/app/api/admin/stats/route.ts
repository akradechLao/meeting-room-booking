import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bookings = await prisma.booking.findMany();
    const rooms = await prisma.room.findMany();
    const users = await prisma.user.findMany();

    // Stats by status
    const byStatus: Record<string, number> = {};
    bookings.forEach((b) => {
      byStatus[b.status] = (byStatus[b.status] || 0) + 1;
    });

    // Stats by room
    const byRoom: Record<string, number> = {};
    rooms.forEach((r) => {
      byRoom[r.name] = 0;
    });
    bookings.forEach((b) => {
      const room = rooms.find((r) => r.id === b.roomId);
      if (room) byRoom[room.name]++;
    });

    // Last 30 days
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days: { label: string; key: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      days.push({
        label: d.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit' }),
        key: d.toISOString().split('T')[0],
        count: 0,
      });
    }

    bookings.forEach((b) => {
      const k = new Date(b.startAt).toISOString().split('T')[0];
      const day = days.find((d) => d.key === k);
      if (day) day.count++;
    });

    // Top users
    const userCount: Record<string, number> = {};
    bookings.forEach((b) => {
      userCount[b.userId] = (userCount[b.userId] || 0) + 1;
    });

    const topUsers = Object.keys(userCount)
      .map((uid) => {
        const u = users.find((x) => x.id === uid);
        return { name: u ? u.name : '(?)', count: userCount[uid] };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return NextResponse.json({
      totalBookings: bookings.length,
      totalUsers: users.length,
      totalRooms: rooms.filter((r) => r.active).length,
      pending: byStatus['pending'] || 0,
      byStatus,
      byRoom,
      days,
      topUsers,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
