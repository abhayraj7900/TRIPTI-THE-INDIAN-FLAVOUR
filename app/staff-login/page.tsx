import { ArrowRight, ChefHat, ShieldCheck } from 'lucide-react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { isStaffIdentity } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function StaffLoginPage() {
  const requestHeaders = await headers();
  const userId = requestHeaders.get('oai-authenticated-user-id');
  const email = requestHeaders.get('oai-authenticated-user-email');
  if (isStaffIdentity(userId, email)) redirect('/');
  return <main className="grid min-h-screen place-items-center bg-[#3f140d] px-4 text-[#251713]"><section className="w-full max-w-md rounded-[28px] bg-[#fffdf9] p-7 shadow-2xl sm:p-9"><div className="mb-6 flex justify-center">{/* oxlint-disable-next-line next/no-img-element */}<img src="/tripti-logo.png" alt="Tripti — The Indian Flavour" className="h-28 w-64 object-contain" /></div><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#f8e7d9] text-[#6a2116]"><ChefHat className="size-7" /></span><h1 className="mt-5 text-center font-serif text-3xl font-black">Staff sign in</h1><p className="mt-2 text-center leading-6 text-[#776158]">Management, billing, kitchen and customer-page controls are protected for restaurant staff.</p>{userId ? <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-center text-sm font-bold text-red-800">This account is not approved as Tripti staff.</div> : <a href="/signin-with-chatgpt?return_to=%2F" target="_top" className="mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#6a2116] font-bold text-white hover:bg-[#521008]">Sign in securely <ArrowRight className="size-4" /></a>}<p className="mt-5 flex items-center justify-center gap-2 text-xs font-semibold text-[#8b776d]"><ShieldCheck className="size-4" /> Authorized staff only</p><a href="/menu" className="mt-4 block text-center text-sm font-bold text-[#6a2116] underline underline-offset-4">Go to customer menu</a></section></main>;
}
