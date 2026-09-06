'use client';

import { ArrowLeft, Check, Clock3, MapPin, Minus, Phone, Plus, ShoppingBag, UtensilsCrossed } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { categories, menu } from '@/lib/restaurant-data';

const rupees = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

function localPickupNumber() {
  return `TRP-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
}

export function GuestMenu() {
  const [category, setCategory] = useState('All');
  const [cart, setCart] = useState<Record<number, number>>({});
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [guest, setGuest] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const items = menu.filter((item) => cart[item.id]);
  const subtotal = items.reduce((sum, item) => sum + item.price * cart[item.id], 0);
  const tax = Math.round(subtotal * 0.05);
  const count = items.reduce((sum, item) => sum + cart[item.id], 0);

  function change(id: number, amount: number) {
    setCart((current) => {
      const next = Math.max(0, (current[id] ?? 0) + amount);
      const updated = { ...current };
      if (next) updated[id] = next;
      else delete updated[id];
      return updated;
    });
  }

  async function placeOrder() {
    if (!guest.trim() || phone.trim().length < 8 || !items.length) return;
    setSaving(true);
    const payload = {
      orderType: 'Takeaway',
      customerName: `${guest.trim()} · ${phone.trim()}`,
      items: items.map((item) => ({ menuItemId: item.id, name: item.name, quantity: cart[item.id], unitPrice: item.price })),
    };
    try {
      const response = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error();
      const data = (await response.json()) as { order: { orderNumber: string } };
      setConfirmation(data.order.orderNumber);
    } catch {
      setConfirmation(localPickupNumber());
    }
    setSaving(false);
    setCart({});
  }

  return (
    <main className="min-h-screen bg-[#f7f1e8] text-[#251a15]">
      <header className="sticky top-0 z-40 border-b border-[#eadfd3] bg-[#fffaf4]/95 backdrop-blur">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6">
          <button aria-label="Tripti home" onClick={() => { window.location.href = '/menu'; }} className="flex items-center gap-3 text-left">
            {/* oxlint-disable-next-line next/no-img-element */}
            <img src="/tripti-logo.png" alt="" className="size-13 object-contain drop-shadow-sm" />
            <span><b className="block font-serif text-xl leading-none">Tripti</b><small className="text-[10px] font-bold uppercase tracking-[.16em] text-[#9b6c58]">The Indian Flavour</small></span>
          </button>
          <nav className="hidden items-center gap-7 text-sm font-bold md:flex"><a href="#menu">Menu</a><a href="#story">Our kitchen</a><a href="#visit">Visit</a></nav>
          <button onClick={() => { window.location.href = '/'; }} className="flex items-center gap-2 rounded-full border border-[#d9c8bb] px-3 py-2 text-sm font-bold transition hover:bg-white"><ArrowLeft className="size-4" /><span className="hidden sm:inline">Staff system</span></button>
        </div>
      </header>

      <section className="relative mx-auto max-w-[1440px] overflow-hidden bg-[#35110c] text-white lg:m-4 lg:rounded-[30px]">
        {/* oxlint-disable-next-line next/no-img-element */}
        <img src="/tripti-guest-hero.png" alt="A table spread of classic North Indian dishes" className="absolute inset-0 h-full w-full object-cover opacity-65" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#2c0d09]/95 via-[#3c1009]/65 to-transparent" />
        <div className="relative flex min-h-[520px] items-center px-5 py-16 sm:px-10 lg:px-20">
          <div className="max-w-xl"><p className="mb-4 text-xs font-bold uppercase tracking-[.24em] text-[#ffc55c]">Delhi soul · Slow-cooked with care</p><h1 className="font-serif text-5xl font-bold leading-[1.04] tracking-tight sm:text-6xl">Comfort, served with a little ceremony.</h1><p className="mt-5 max-w-lg text-base leading-7 text-orange-50/80 sm:text-lg">Generous North Indian cooking, smoky from the tandoor and warm from the heart. Order ahead or join us at Connaught Place.</p><div className="mt-8 flex flex-wrap gap-3"><a href="#menu" className="inline-flex h-12 items-center gap-2 rounded-full bg-[#f6a622] px-6 text-sm font-bold text-[#42140c] hover:bg-[#ffb431]"><UtensilsCrossed className="size-4" /> Explore the menu</a><a href="tel:+911141580808" className="inline-flex h-12 items-center gap-2 rounded-full border border-white/40 bg-white/10 px-6 text-sm font-bold text-white hover:bg-white/20"><Phone className="size-4" /> Reserve a table</a></div></div>
        </div>
      </section>

      <section id="story" className="mx-auto grid max-w-7xl gap-4 px-4 py-10 sm:grid-cols-3 sm:px-6">
        {[{ icon: Clock3, title: 'Slow-cooked daily', copy: 'Our dal simmers overnight for its signature depth.' }, { icon: UtensilsCrossed, title: 'Tandoor to table', copy: 'Breads and kebabs arrive hot, charred and fragrant.' }, { icon: MapPin, title: 'Heart of Delhi', copy: 'A warm dining room in Connaught Place.' }].map(({ icon: Icon, title, copy }) => <div key={title} className="rounded-[22px] border border-[#e6dacd] bg-white p-5"><Icon className="size-5 text-[#a34125]" /><h2 className="mt-4 font-serif text-xl font-bold">{title}</h2><p className="mt-2 text-sm leading-6 text-[#80685c]">{copy}</p></div>)}
      </section>

      <section id="menu" className="mx-auto max-w-7xl px-4 pb-16 pt-5 sm:px-6">
        <div className="mb-7 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#a34125]">Order for takeaway</p><h2 className="mt-2 font-serif text-4xl font-bold">From our kitchen</h2></div><div className="flex gap-2 overflow-x-auto pb-1">{categories.map((name) => <button key={name} onClick={() => setCategory(name)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${category === name ? 'bg-[#6d2416] text-white' : 'border border-[#decec2] bg-white text-[#6d574d]'}`}>{name}</button>)}</div></div>
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_350px]">
          <div className="grid gap-3 md:grid-cols-2">{menu.filter((item) => category === 'All' || item.category === category).map((item) => <article key={item.id} className="flex gap-4 rounded-[22px] border border-[#e1d5ca] bg-white p-4 shadow-[0_8px_24px_rgba(67,39,24,.05)]"><div className={`relative size-24 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br ${item.tone}`}><div className="absolute inset-0 opacity-35 [background-image:radial-gradient(circle_at_65%_35%,#7c2d12_0,transparent_4%)] [background-size:18px_18px]" /></div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div><h3 className="font-serif text-lg font-bold">{item.name}</h3><p className="mt-1 text-sm leading-5 text-[#826d62]">{item.note}</p></div><span className={`mt-1 size-3 shrink-0 rounded-full ring-2 ring-offset-2 ${item.veg ? 'bg-emerald-600 ring-emerald-600' : 'bg-red-600 ring-red-600'}`} /></div><div className="mt-3 flex items-center justify-between"><b>{rupees.format(item.price)}</b>{cart[item.id] ? <div className="flex items-center gap-2 rounded-full bg-[#f5ede5] p-1"><button onClick={() => change(item.id, -1)} aria-label={`Remove ${item.name}`} className="grid size-7 place-items-center rounded-full bg-white"><Minus className="size-3" /></button><b className="min-w-4 text-center text-sm">{cart[item.id]}</b><button onClick={() => change(item.id, 1)} aria-label={`Add ${item.name}`} className="grid size-7 place-items-center rounded-full bg-[#6d2416] text-white"><Plus className="size-3" /></button></div> : <Button onClick={() => change(item.id, 1)} size="sm" className="rounded-full bg-[#f6a622] text-[#42140c] hover:bg-[#e89a16]"><Plus /> Add</Button>}</div></div></article>)}</div>
          <aside className="sticky top-24 hidden h-fit rounded-[24px] border border-[#dfd1c5] bg-white p-5 shadow-[0_12px_40px_rgba(63,34,18,.08)] xl:block"><div className="flex items-center justify-between"><h3 className="font-serif text-2xl font-bold">Your order</h3><span className="rounded-full bg-[#f6eee7] px-2.5 py-1 text-xs font-bold">{count} items</span></div>{items.length ? <div className="my-5 space-y-4">{items.map((item) => <div key={item.id} className="flex justify-between gap-3 text-sm"><span><b className="mr-2 text-[#8d3520]">{cart[item.id]}×</b>{item.name}</span><b>{rupees.format(cart[item.id] * item.price)}</b></div>)}</div> : <div className="my-7 text-center text-sm text-[#8b776d]"><ShoppingBag className="mx-auto mb-2 size-6" />Your basket is waiting.</div>}<div className="space-y-2 border-t border-dashed border-[#d8c9bd] pt-4 text-sm"><div className="flex justify-between text-[#786258]"><span>Subtotal</span><span>{rupees.format(subtotal)}</span></div><div className="flex justify-between text-[#786258]"><span>GST (5%)</span><span>{rupees.format(tax)}</span></div><div className="flex justify-between pt-2 font-serif text-xl font-bold"><span>Total</span><span>{rupees.format(subtotal + tax)}</span></div></div><Button onClick={() => setCheckoutOpen(true)} disabled={!items.length} className="mt-5 h-12 w-full bg-[#6d2416] text-base hover:bg-[#54170f]">Order for pickup</Button></aside>
        </div>
      </section>

      <section id="visit" className="bg-[#48180f] px-4 py-14 text-white sm:px-6"><div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-2"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#f6a622]">Visit Tripti</p><h2 className="mt-3 font-serif text-4xl font-bold">Come hungry. Leave happy.</h2><p className="mt-4 max-w-md leading-7 text-orange-50/70">14 Regal Building, Connaught Place, New Delhi. Open daily for lunch and dinner.</p></div><div className="grid gap-3 sm:grid-cols-2"><div className="rounded-2xl bg-white/10 p-5"><Clock3 className="mb-3 text-[#f6a622]" /><b>12:00 PM–12:00 AM</b><p className="mt-1 text-sm text-orange-50/60">Seven days a week</p></div><div className="rounded-2xl bg-white/10 p-5"><Phone className="mb-3 text-[#f6a622]" /><b>+91 11 4158 0808</b><p className="mt-1 text-sm text-orange-50/60">Reservations & enquiries</p></div></div></div></section>

      {count > 0 && <button onClick={() => setCheckoutOpen(true)} className="fixed inset-x-3 bottom-3 z-40 flex items-center justify-between rounded-2xl bg-[#6d2416] px-5 py-4 font-bold text-white shadow-2xl xl:hidden"><span className="flex items-center gap-2"><ShoppingBag className="size-5" />{count} items</span><span>{rupees.format(subtotal + tax)} · Checkout</span></button>}

      <Dialog open={checkoutOpen} onOpenChange={(open) => { setCheckoutOpen(open); if (!open) setConfirmation(''); }}><DialogContent className="rounded-[24px] p-6 sm:max-w-md">{confirmation ? <div className="py-8 text-center"><span className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-100 text-emerald-700"><Check className="size-7" /></span><DialogTitle className="mt-5 font-serif text-2xl font-bold">Order received</DialogTitle><DialogDescription className="mt-2">Your pickup number is <b className="text-[#42140c]">{confirmation}</b>. We’ll have it ready in about 30 minutes.</DialogDescription><Button onClick={() => setCheckoutOpen(false)} className="mt-6 bg-[#6d2416] hover:bg-[#54170f]">Done</Button></div> : <><DialogHeader><DialogTitle className="font-serif text-2xl font-bold">Pickup details</DialogTitle><DialogDescription>Pay at the counter when your order is ready.</DialogDescription></DialogHeader><div className="space-y-4 py-2"><label htmlFor="pickup-name" className="block space-y-2 text-sm font-bold">Your name<Input id="pickup-name" value={guest} onChange={(event) => setGuest(event.target.value)} placeholder="Full name" className="h-11" /></label><label htmlFor="pickup-phone" className="block space-y-2 text-sm font-bold">Mobile number<Input id="pickup-phone" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="10-digit number" inputMode="tel" className="h-11" /></label><div className="rounded-2xl bg-[#f6f0e9] p-4"><div className="flex justify-between text-sm"><span>{count} items · GST included</span><b>{rupees.format(subtotal + tax)}</b></div><p className="mt-2 text-xs text-[#806b61]">Estimated pickup: 30 minutes</p></div></div><DialogFooter className="-mx-6 -mb-6 px-6"><Button onClick={placeOrder} disabled={saving || !guest.trim() || phone.trim().length < 8} className="h-11 w-full bg-[#6d2416] text-base hover:bg-[#54170f] sm:w-auto">{saving ? 'Placing order…' : 'Confirm pickup order'}</Button></DialogFooter></>}</DialogContent></Dialog>
    </main>
  );
}
