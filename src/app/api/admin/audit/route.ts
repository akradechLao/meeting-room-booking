import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '200'), 1000);

    const logs = await prisma.auditLog.findMany({
      take: limit,
      orderBy: { ts: 'desc' },
    });

    // Get user names
    const users = await prisma.user.findMany({
      select: { id: true, name: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u.name]));

    const enriched = logs.map((log) => ({
      ...log,
      userName: log.userId ? userMap.get(log.userId) || log.userId : log.userId,
    }));

    return NextResponse.json(enriched);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
