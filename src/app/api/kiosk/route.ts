import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface BookingInfo {
  id: string;
  title: string;
  status: string;
  startAt: string;
  endAt: string;
  userName: string;
}

interface UpcomingDay {
  date: string;
  label: string;
  bookings: BookingInfo[];
}

interface RoomResult {
  id: string;
  name: string;
  location: string | null;
  capacity: number;
  color: string;
  isOccupied: boolean;
  current: BookingInfo | null;
  next: BookingInfo | null;
  upcomingCount: number;
  upcoming3Days: UpcomingDay[];
}

export async function GET() {
  try {
    const rooms = await prisma.room.findMany({
      where: { active: true },
    });

    const now = new Date();
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const result: RoomResult[] = rooms.map((room) => ({
      id: room.id,
      name: room.name,
      location: room.location,
      capacity: room.capacity,
      color: room.color,
      isOccupied: false,
      current: null,
      next: null,
      upcomingCount: 0,
      upcoming3Days: [],
    }));

    // Get all bookings for these rooms today
    const bookings = await prisma.booking.findMany({
      where: {
        roomId: { in: rooms.map((r) => r.id) },
        status: { notIn: ['cancelled', 'rejected'] },
        startAt: { lt: todayEnd },
        endAt: { gt: now },
      },
      include: {
        user: { select: { name: true } },
      },
      orderBy: { startAt: 'asc' },
    });

    // Populate room data
    for (const room of result) {
      const roomBookings = bookings.filter((b) => b.roomId === room.id);

      room.upcomingCount = roomBookings.length;

      // Current booking (started before now, ends after now)
      const current = roomBookings.find(
        (b) => new Date(b.startAt) <= now && new Date(b.endAt) > now
      );
      if (current) {
        room.isOccupied = true;
        room.current = {
          id: current.id,
          title: current.title,
          status: current.status,
          startAt: current.startAt.toISOString(),
          endAt: current.endAt.toISOString(),
          userName: current.user?.name || '',
        };
      }

      // Next booking (starts after now)
      const next = roomBookings.find((b) => new Date(b.startAt) > now);
      if (next) {
        room.next = {
          id: next.id,
          title: next.title,
          status: next.status,
          startAt: next.startAt.toISOString(),
          endAt: next.endAt.toISOString(),
          userName: next.user?.name || '',
        };
      }

      // Fetch upcoming bookings for next 3 days
      const next3DaysBookings = await prisma.booking.findMany({
        where: {
          roomId: room.id,
          status: { notIn: ['cancelled', 'rejected'] },
          startAt: { gte: now },
          startAt: { lte: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000) },
        },
        include: {
          user: { select: { name: true } },
        },
        orderBy: { startAt: 'asc' },
      });

      // Group by date
      const dayNames = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
      const upcomingMap = new Map<string, BookingInfo[]>();

      for (let i = 1; i <= 3; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        const dayLabel = `วัน${dayNames[date.getDay()]}ที่ ${date.getDate()}`;
        upcomingMap.set(dateStr, { date: dateStr, label: dayLabel, bookings: [] });
      }

      for (const booking of next3DaysBookings) {
        const bookingDate = new Date(booking.startAt).toISOString().split('T')[0];
        const dayData = upcomingMap.get(bookingDate);
        if (dayData) {
          dayData.bookings.push({
            id: booking.id,
            title: booking.title,
            status: booking.status,
            startAt: booking.startAt.toISOString(),
            endAt: booking.endAt.toISOString(),
            userName: booking.user?.name || '',
          });
        }
      }

      room.upcoming3Days = Array.from(upcomingMap.values());
    }

    return NextResponse.json({ rooms: result, ts: now.toISOString() });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
