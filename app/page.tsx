'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      router.push('/players');
    } catch (error: unknown) {
      console.error('Error:', error);
      setError('Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B1120]">
      <div className="max-w-md w-full space-y-8 p-8 bg-[#1A2333] rounded-xl shadow-2xl">
        <div className="flex flex-col items-center justify-center">
          <div className="w-full flex justify-center">
            <Image
              src="/images/GGPW_logo_transparent.png"
              alt="GGPW Logo"
              width={300}
              height={150}
              className="mb-8"
              priority
            />
          </div>
          <p className="text-gray-400 text-sm">Sistema de Gerenciamento de Guild - Perfect World</p>
          <div className="h-px bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-75 my-6 w-full"></div>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 rounded-md p-3 text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-[#0B1120] border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300">
              Senha
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-[#0B1120] border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 max-w-[384px] w-full flex justify-center py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 rounded-md"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#1A2333] text-gray-400">Guild Manager</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
