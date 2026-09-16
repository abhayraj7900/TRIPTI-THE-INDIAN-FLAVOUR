'use client';

import { ArrowLeft, KeyRound, LogOut, ShieldCheck } from 'lucide-react';
import { FormEvent, useState } from 'react';

export function StaffAccount({ phone }: { phone: string }) {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function digits(value: string) {
    return value.replace(/\D/g, '').slice(0, 6);
  }

  async function changePin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice('');
    setError('');
    if (newPin !== confirmPin) {
      setError('New PIN and confirmation do not match.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/auth/staff', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPin, newPin }),
      });
      const result = (await response.json()) as {
        changed?: boolean;
        error?: string;
      };
      if (!response.ok || !result.changed) {
        setError(result.error || 'PIN could not be changed.');
        return;
      }
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      setNotice('Staff PIN changed successfully.');
    } catch {
      setError('Unable to reach the server. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    await fetch('/api/auth/staff', { method: 'DELETE' });
    window.location.href = '/staff-login';
  }

  return (
    <main className="min-h-screen bg-[#f5f2ec] px-4 py-8 text-[#251713]">
      <section className="mx-auto w-full max-w-xl rounded-[28px] border border-[#e1d5ca] bg-white p-6 shadow-xl sm:p-9">
        <a
          href="/"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#6a2116]"
        >
          <ArrowLeft className="size-4" /> Back to dashboard
        </a>
        <span className="mt-7 grid size-14 place-items-center rounded-2xl bg-[#f8e7d9] text-[#6a2116]">
          <KeyRound className="size-7" />
        </span>
        <h1 className="mt-5 font-serif text-3xl font-black">Staff security</h1>
        <p className="mt-2 text-[#776158]">
          Change the private 6-digit manager PIN for {phone || 'this account'}.
        </p>

        <form onSubmit={changePin} className="mt-7 space-y-4">
          {[
            ['Current PIN', currentPin, setCurrentPin],
            ['New 6-digit PIN', newPin, setNewPin],
            ['Confirm new PIN', confirmPin, setConfirmPin],
          ].map(([label, value, setter]) => (
            <label key={label as string} className="block text-sm font-bold">
              {label as string}
              <input
                type="password"
                inputMode="numeric"
                value={value as string}
                onChange={(event) =>
                  (setter as (value: string) => void)(digits(event.target.value))
                }
                minLength={6}
                maxLength={6}
                pattern="[0-9]{6}"
                placeholder="••••••"
                className="mt-2 h-12 w-full rounded-xl border border-[#dbc8bc] px-4 text-center text-xl tracking-[0.45em] outline-none focus:border-[#7b291b]"
                required
              />
            </label>
          ))}

          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-800">
              {error}
            </p>
          )}
          {notice && (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-800">
              {notice}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#6a2116] font-bold text-white hover:bg-[#521008] disabled:opacity-50"
          >
            <ShieldCheck className="size-4" />
            {loading ? 'Changing PIN…' : 'Change staff PIN'}
          </button>
        </form>

        <button
          type="button"
          onClick={signOut}
          className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#dbc8bc] font-bold text-[#6a2116] hover:bg-[#fff7f0]"
        >
          <LogOut className="size-4" /> Sign out
        </button>
      </section>
    </main>
  );
}
