import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1, 'กรุณากรอก username'),
  password: z.string().min(1, 'กรุณากรอกรหัสผ่าน'),
});

export const bookingSchema = z.object({
  roomId: z.string().min(1, 'กรุณาเลือกห้อง'),
  title: z.string().min(1, 'กรุณาใส่หัวข้อ'),
  description: z.string().optional(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
});

export const recurringSchema = z.object({
  roomId: z.string().min(1),
  title: z.string().min(1),
  pattern: z.enum(['daily', 'weekly', 'monthly']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  durationMin: z.number().min(15).max(480),
  daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
});

export const userSchema = z.object({
  id: z.string().optional(),
  username: z.string().min(1, 'กรอก username'),
  name: z.string().min(1, 'กรอกชื่อ'),
  email: z.string().email().optional().or(z.literal('')),
  role: z.enum(['admin', 'user']).default('user'),
  password: z.string().min(4, 'รหัสผ่านอย่างน้อย 4 ตัวอักษร').optional(),
  telegramChatId: z.string().optional(),
  active: z.boolean().default(true),
});

export const roomSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'กรอกชื่อห้อง'),
  description: z.string().optional(),
  location: z.string().optional(),
  floor: z.string().optional(),
  building: z.string().optional(),
  capacity: z.number().min(0).default(0),
  equipment: z.string().optional(),
  color: z.string().default('#6366f1'),
  active: z.boolean().default(true),
});

export const blackoutSchema = z.object({
  id: z.string().optional(),
  roomId: z.string().default('*'),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  reason: z.string().optional(),
});

export const settingSchema = z.object({
  items: z.array(
    z.object({
      key: z.string(),
      value: z.string(),
    })
  ),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type BookingInput = z.infer<typeof bookingSchema>;
export type RecurringInput = z.infer<typeof recurringSchema>;
export type UserInput = z.infer<typeof userSchema>;
export type RoomInput = z.infer<typeof roomSchema>;
export type BlackoutInput = z.infer<typeof blackoutSchema>;
export type SettingInput = z.infer<typeof settingSchema>;
