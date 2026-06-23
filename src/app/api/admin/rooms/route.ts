import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { roomSchema } from '@/lib/validations';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rooms = await prisma.room.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(rooms);
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
    const validation = roomSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { id, name, location, capacity, equipment, color, active } = validation.data;

    if (id) {
      // Update existing room
      const existing = await prisma.room.findUnique({ where: { id } });
      if (!existing) {
        return NextResponse.json({ error: 'ไม่พบห้อง' }, { status: 404 });
      }

      await prisma.room.update({
        where: { id },
        data: { name, location, capacity, equipment, color, active },
      });

      await prisma.auditLog.create({
        data: {
          userId: (session.user as any).id,
          action: 'UPDATE_ROOM',
          target: id,
          details: JSON.stringify({ name }),
        },
      });

      return NextResponse.json({ id });
    } else {
      // Create new room
      const newRoom = await prisma.room.create({
        data: { name, location, capacity, equipment, color, active },
      });

      await prisma.auditLog.create({
        data: {
          userId: (session.user as any).id,
          action: 'CREATE_ROOM',
          target: newRoom.id,
          details: JSON.stringify({ name }),
        },
      });

      return NextResponse.json({ id: newRoom.id });
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

    const room = await prisma.room.findUnique({ where: { id } });
    if (!room) {
      return NextResponse.json({ error: 'ไม่พบห้อง' }, { status: 404 });
    }

    await prisma.room.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: (session.user as any).id,
        action: 'DELETE_ROOM',
        target: id,
        details: JSON.stringify({ name: room.name }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
