'use client';

import { useState, useEffect } from 'react';
import { AuthLayout } from '@/components/AuthLayout';
import { formatDateTH } from '@/lib/utils';

interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  telegramChatId: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState({
    username: '',
    name: '',
    email: '',
    role: 'user',
    password: '',
    telegramChatId: '',
    active: true,
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) setUsers(await res.json());
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const body: any = { ...form };
      if (editingUser) body.id = editingUser.id;
      if (!form.password && editingUser) delete body.password;

      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setShowForm(false);
        setEditingUser(null);
        loadUsers();
      } else {
        const error = await res.json();
        alert(error.error);
      }
    } catch (error) {
      alert('เกิดข้อผิดพลาด');
    }
  };

  const handleDelete = async (id: string, username: string) => {
    if (!confirm(`ลบผู้ใช้ "${username}" ?`)) return;
    try {
      await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' });
      loadUsers();
    } catch (error) {
      alert('เกิดข้อผิดพลาด');
    }
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setForm({
      username: user.username,
      name: user.name,
      email: user.email || '',
      role: user.role,
      password: '',
      telegramChatId: user.telegramChatId || '',
      active: user.active,
    });
    setShowForm(true);
  };

  const openNew = () => {
    setEditingUser(null);
    setForm({
      username: '',
      name: '',
      email: '',
      role: 'user',
      password: '',
      telegramChatId: '',
      active: true,
    });
    setShowForm(true);
  };

  if (loading) {
    return (
      <AuthLayout>
        <div className="skeleton h-64"></div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-3">
        <h2 className="text-base sm:text-lg font-semibold">จัดการผู้ใช้</h2>
        <button className="btn btn-primary text-xs sm:text-sm" onClick={openNew}>
          + เพิ่มผู้ใช้
        </button>
      </div>

      <div className="card overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th className="text-xs sm:text-sm">ชื่อ</th>
              <th className="text-xs sm:text-sm">Username</th>
              <th className="text-xs sm:text-sm hidden sm:table-cell">Email</th>
              <th className="text-xs sm:text-sm">Role</th>
              <th className="text-xs sm:text-sm">สถานะ</th>
              <th className="text-xs sm:text-sm"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td className="text-xs sm:text-sm">{u.name}</td>
                <td className="text-xs sm:text-sm">{u.username}</td>
                <td className="hidden sm:table-cell text-xs sm:text-sm">{u.email || ''}</td>
                <td>
                  <span
                    className={`badge ${u.role === 'admin' ? 'badge-approved' : 'badge-cancelled'}`}
                  >
                    {u.role}
                  </span>
                </td>
                <td>
                  <span className={`badge ${u.active ? 'badge-approved' : 'badge-rejected'}`}>
                    {u.active ? 'active' : 'disabled'}
                  </span>
                </td>
                <td className="whitespace-nowrap text-right">
                  <button className="btn btn-ghost p-2" onClick={() => openEdit(u)}>
                    ✎
                  </button>
                  <button
                    className="btn btn-ghost p-2 text-red-500"
                    onClick={() => handleDelete(u.id, u.username)}
                  >
                    🗑
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/55 z-50 flex items-center justify-center p-4">
          <div className="card p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-3">
              {editingUser ? 'แก้ไข' : 'เพิ่ม'}ผู้ใช้
            </h3>
            <form onSubmit={handleSave} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm">ชื่อ</label>
                  <input
                    className="input"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm">Username</label>
                  <input
                    className="input"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-sm">Email</label>
                <input
                  type="email"
                  className="input"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm">Role</label>
                  <select
                    className="input"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                  >
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm">Telegram Chat ID</label>
                  <input
                    className="input"
                    value={form.telegramChatId}
                    onChange={(e) => setForm({ ...form, telegramChatId: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm">
                  รหัสผ่าน {editingUser ? '(เว้นว่างถ้าไม่เปลี่ยน)' : ''}
                </label>
                <input
                  type="password"
                  className="input"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  {...(!editingUser ? { required: true, minLength: 4 } : {})}
                />
              </div>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                />{' '}
                Active
              </label>
              <div className="flex gap-2">
                <button className="btn btn-primary flex-1" type="submit">
                  บันทึก
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowForm(false)}
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AuthLayout>
  );
}
