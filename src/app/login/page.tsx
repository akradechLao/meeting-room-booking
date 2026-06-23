'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { CalendarCheck, User, Lock, Loader2, Moon, Sun } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from 'next-themes';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        router.push('/home');
        router.refresh();
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 login-gradient">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex w-20 h-20 rounded-3xl bg-white/90 backdrop-blur items-center justify-center shadow-2xl mb-5">
            <CalendarCheck className="w-10 h-10 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-white drop-shadow-lg">Meeting Room</h1>
          <p className="text-white/80 text-sm mt-2 font-medium">ระบบจองห้องประชุมออนไลน์</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-medium flex items-center gap-2">
                <span className="text-red-500">!</span> {error}
              </div>
            )}

            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-2">ชื่อผู้ใช้</label>
              <div className="relative">
                <User className="w-5 h-5 absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  className="input input-icon py-3.5 rounded-2xl"
                  placeholder="กรอก username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-2">รหัสผ่าน</label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  className="input input-icon py-3.5 rounded-2xl"
                  placeholder="กรอกรหัสผ่าน"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full py-4 text-base rounded-2xl"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <CalendarCheck className="w-5 h-5" />
                  เข้าสู่ระบบ
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="text-xs text-slate-500 text-center">
              <span className="font-semibold text-slate-600">บัญชีทดสอบ:</span>
              <div className="mt-2 flex justify-center gap-4">
                <span className="bg-slate-100 px-3 py-1 rounded-lg font-mono text-slate-700">admin / 1234</span>
                <span className="bg-slate-100 px-3 py-1 rounded-lg font-mono text-slate-700">akradech / akradech1975</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer links */}
        <div className="flex justify-between mt-6 text-sm">
          <Link href="/kiosk" className="text-white/80 hover:text-white font-medium inline-flex items-center gap-1 transition-colors">
            Kiosk
          </Link>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="text-white/80 hover:text-white font-medium inline-flex items-center gap-1 transition-colors"
          >
            {mounted && theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {mounted ? (theme === 'dark' ? 'Light' : 'Dark') : 'Theme'}
          </button>
        </div>
      </div>
    </div>
  );
}
