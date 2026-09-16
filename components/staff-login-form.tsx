'use client';

import { ArrowRight, ChefHat, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

export function StaffLoginForm({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch('/api/auth/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, pin }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(result.error || 'Sign in failed');
        return;
      }
      router.replace('/');
      router.refresh();
    } catch {
      setError('Unable to reach the server. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#3f140d] px-4 text-[#251713]">
      <section className="w-full max-w-md rounded-[28px] bg-[#fffdf9] p-7 shadow-2xl sm:p-9">
        <div className="mb-5 flex items-center justify-center gap-3">
          {/* oxlint-disable-next-line next/no-img-element */}
          <img
            src="/tripti-logo.png"
            alt="Tripti — The Indian Flavour"
            className="size-20 object-contain"
          />
          <div>
            <p className="font-serif text-2xl font-black text-[#5a1b12]">Tripti</p>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9a4b2f]">
              The Indian Flavour
            </p>
          </div>
        </div>
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#f8e7d9] text-[#6a2116]">
          <ChefHat className="size-7" />
        </span>
        <h1 className="mt-5 text-center font-serif text-3xl font-black">
          Staff sign in
        </h1>
        <p className="mt-2 text-center leading-6 text-[#776158]">
          Enter the manager phone number and private 6-digit PIN.
        </p>

        {!configured && (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center text-sm font-bold text-amber-900">
            Staff credentials are not configured on the server yet.
          </div>
        )}

        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block text-sm font-bold text-[#5a1b12]">
            Phone number
            <input
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Enter phone number"
              className="mt-2 h-12 w-full rounded-xl border border-[#dbc8bc] bg-white px-4 text-base outline-none focus:border-[#7b291b]"
              required
            />
          </label>
          <label className="block text-sm font-bold text-[#5a1b12]">
            6-digit PIN
            <input
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              value={pin}
              onChange={(event) =>
                setPin(event.target.value.replace(/\D/g, '').slice(0, 6))
              }
              placeholder="••••••"
              minLength={6}
              maxLength={6}
              pattern="[0-9]{6}"
              className="mt-2 h-12 w-full rounded-xl border border-[#dbc8bc] bg-white px-4 text-center text-xl tracking-[0.45em] outline-none focus:border-[#7b291b]"
              required
            />
          </label>
          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-center text-sm font-bold text-red-800">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={!configured || loading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#6a2116] font-bold text-white transition hover:bg-[#521008] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Open dashboard'}
            {!loading && <ArrowRight className="size-4" />}
          </button>
        </form>
        <p className="mt-5 flex items-center justify-center gap-2 text-xs font-semibold text-[#8b776d]">
          <ShieldCheck className="size-4" /> Manager access only
        </p>
        <a
          href="/menu"
          className="mt-4 block text-center text-sm font-bold text-[#6a2116] underline underline-offset-4"
        >
          Go to customer menu
        </a>
      </section>
    </main>
  );
}
