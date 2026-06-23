import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateCsvContent } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'Bookings';

    if (!['Bookings', 'Users', 'Rooms', 'Blackouts'].includes(type)) {
      return NextResponse.json({ error: 'ไม่รู้จัก type' }, { status: 400 });
    }

    let headers: string[] = [];
    let rows: any[][] = [];

    if (type === 'Bookings') {
      headers = ['id', 'roomId', 'userId', 'title', 'description', 'startAt', 'endAt', 'status', 'checkInAt', 'checkOutAt', 'createdAt'];
      const data = await prisma.booking.findMany({ orderBy: { createdAt: 'desc' } });
      rows = data.map((r) => headers.map((h) => (r as any)[h]));
    } else if (type === 'Users') {
      headers = ['id', 'username', 'role', 'name', 'email', 'active', 'createdAt'];
      const data = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
      rows = data.map((r) => headers.map((h) => (r as any)[h]));
    } else if (type === 'Rooms') {
      headers = ['id', 'name', 'location', 'capacity', 'equipment', 'color', 'active', 'createdAt'];
      const data = await prisma.room.findMany({ orderBy: { createdAt: 'desc' } });
      rows = data.map((r) => headers.map((h) => (r as any)[h]));
    } else if (type === 'Blackouts') {
      headers = ['id', 'roomId', 'startAt', 'endAt', 'reason', 'createdAt'];
      const data = await prisma.blackout.findMany({ orderBy: { createdAt: 'desc' } });
      rows = data.map((r) => headers.map((h) => (r as any)[h]));
    }

    const csv = generateCsvContent(headers, rows);
    const now = new Date();
    const filename = `${type}_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}.csv`;

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
