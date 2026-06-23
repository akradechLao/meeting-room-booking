import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { userSchema } from '@/lib/validations';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        name: true,
        email: true,
        telegramChatId: true,
        active: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(users);
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
    const validation = userSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { id, username, name, email, role, password, telegramChatId, active } = validation.data;

    if (id) {
      // Update existing user
      const existing = await prisma.user.findUnique({ where: { id } });
      if (!existing) {
        return NextResponse.json({ error: 'ไม่พบผู้ใช้' }, { status: 404 });
      }

      const updateData: any = {
        username,
        name,
        email: email || null,
        role,
        telegramChatId: telegramChatId || null,
        active,
      };

      if (password) {
        updateData.passwordHash = await bcrypt.hash(password, 12);
      }

      await prisma.user.update({ where: { id }, data: updateData });

      await prisma.auditLog.create({
        data: {
          userId: (session.user as any).id,
          action: 'UPDATE_USER',
          target: id,
          details: JSON.stringify({ username }),
        },
      });

      return NextResponse.json({ id });
    } else {
      // Create new user
      const existing = await prisma.user.findUnique({
        where: { username: username.toLowerCase() },
      });

      if (existing) {
        return NextResponse.json({ error: 'Username นี้มีอยู่แล้ว' }, { status: 409 });
      }

      if (!password || password.length < 4) {
        return NextResponse.json({ error: 'รหัสผ่านอย่างน้อย 4 ตัวอักษร' }, { status: 400 });
      }

      const newUser = await prisma.user.create({
        data: {
          username: username.toLowerCase(),
          passwordHash: await bcrypt.hash(password, 12),
          name,
          email: email || null,
          role,
          telegramChatId: telegramChatId || null,
          active,
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: (session.user as any).id,
          action: 'CREATE_USER',
          target: newUser.id,
          details: JSON.stringify({ username }),
        },
      });

      return NextResponse.json({ id: newUser.id });
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

    if (id === (session.user as any).id) {
      return NextResponse.json({ error: 'ลบบัญชีตัวเองไม่ได้' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: 'ไม่พบผู้ใช้' }, { status: 404 });
    }

    await prisma.user.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: (session.user as any).id,
        action: 'DELETE_USER',
        target: id,
        details: JSON.stringify({ username: user.username }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
