'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@supabase/auth-helpers-react';
import { supabase } from '../../lib/supabaseClient';

export default function GleedzAdminAccess() {
  const user = useUser(); // ✅ Fix: this comes from @supabase/auth-helpers-react
  const router = useRouter();

  const [accessCode, setAccessCode] = useState('');
  const [message, setMessage] = useState('');
  const [attempts, setAttempts] = useState(3);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user === null) {
      setMessage('You only have 3 attempts.');
    }
    setLoading(false);
  }, [user]);

  const verifyAccessCode = async (e) => {
    e.preventDefault();

    if (!user) {
      setMessage('Kindly log in to access this page.');
      return;
    }

    if (attempts <= 0) {
      setMessage('You are blocked from accessing this page. Call +2348153093402');
      return;
    }

    try {
      // ✅ Match against the correct column type
      const { data: hero, error: heroError } = await supabase
        .from('gleedz_hero')
        .select('id')
        .eq('id', accessCode) // don’t force parseInt unless IDs are integers
        .single();

      if (heroError || !hero) {
        const newAttempts = attempts - 1;
        setAttempts(newAttempts);

        // ✅ Update attempts in user table
        await supabase
          .from('users')
          .update({ attempts: newAttempts })
          .eq('id', user.id);

        if (newAttempts === 2) {
          setMessage('2 more attempts left');
        } else if (newAttempts === 1) {
          setMessage('1 attempt left');
        } else {
          setMessage('You are blocked from accessing this page. Call +2348153093402');
          await supabase
            .from('users')
            .update({ attempts: 0, is_blocked: true })
            .eq('id', user.id);
        }
      } else {
        // ✅ Reset attempts on success
        await supabase
          .from('users')
          .update({ attempts: 3 }) // reset to 3 instead of 0
          .eq('id', user.id);

        router.push('/gleedzadmin/dashboard');
      }
    } catch (err) {
      console.error('Error verifying access code:', err);
      setMessage('Error verifying access code');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-yellow-50 flex items-center justify-center">
        <div className="text-yellow-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-yellow-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md border border-yellow-200">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-yellow-800 mb-2">
            Admin Access
          </h1>
          <p className="text-yellow-600">Enter admin access code</p>
        </div>

        <form onSubmit={verifyAccessCode} className="space-y-6">
          <div>
            <input
              type="password"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              placeholder="Enter access code"
              className="w-full px-4 py-3 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-yellow-800 placeholder-yellow-400"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 transform hover:scale-105 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
          >
            Verify Access
          </button>
        </form>

        {message && (
          <div
            className={`mt-6 p-4 rounded-lg text-center ${
              message.includes('blocked')
                ? 'bg-red-100 text-red-700 border border-red-300'
                : message.includes('login')
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'bg-yellow-100 text-yellow-700 border border-yellow-300'
            }`}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
