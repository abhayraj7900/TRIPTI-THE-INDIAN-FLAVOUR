'use client';

import { ArrowLeft, Banknote, Check, ChevronRight, Clock3, CreditCard, Minus, Plus, ReceiptText, Search, ShieldCheck, ShoppingBag, Smartphone, Sparkles, UtensilsCrossed } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { categories, menu, type MenuItem } from '@/lib/restaurant-data';

const rupees = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const paymentOptions = [
  { name: 'Pay at counter', note: 'Cash or card after ordering', icon: Banknote },
  { name: 'UPI', note: 'Pay by UPI when served', icon: Smartphone },
  { name: 'Card', note: 'Pay on the restaurant terminal', icon: CreditCard },
] as const;

function localOrderNumber() {
  return `TRP-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
}

function FoodPhoto({ item, className = '' }: { item: MenuItem; className?: string }) {
  const column = item.photo % 5;
  const row = Math.floor(item.photo / 5);
  return <div aria-hidden="true" className={`bg-no-repeat ${className}`} style={{ backgroundImage: "url('/tripti-food-atlas.png')", backgroundPosition: `${column * 25}% ${row * 25}%`, backgroundSize: '500% 500%' }} />;
}

function VegMark({ veg }: { veg: boolean }) {
  return <span className={`grid size-5 shrink-0 place-items-center border-2 bg-white ${veg ? 'border-emerald-600' : 'border-red-600'}`} title={veg ? 'Vegetarian' : 'Non-vegetarian'}><span className={`size-2 rounded-full ${veg ? 'bg-emerald-600' : 'bg-red-600'}`} /></span>;
}

export function GuestMenu() {
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const [cart, setCart] = useState<Record<number, number>>({});
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(0);
  const [orderType, setOrderType] = useState<'Dine in' | 'Takeaway'>('Dine in');
  const [tableNumber, setTableNumber] = useState('05');
  const [guest, setGuest] = useState('');
  const [phone, setPhone] = useState('');
  const [payment, setPayment] = useState<(typeof paymentOptions)[number]['name']>('Pay at counter');
  const [saving, setSaving] = useState(false);
  const [confirmation, setConfirmation] = useState('');

  const cartItems = useMemo(() => menu.filter((item) => cart[item.id]), [cart]);
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * cart[item.id], 0);
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + tax;
  const count = cartItems.reduce((sum, item) => sum + cart[item.id], 0);
  const filtered = menu.filter((item) => {
    const matchesCategory = category === 'All' || item.category === category;
    const matchesSearch = `${item.name} ${item.note}`.toLowerCase().includes(query.trim().toLowerCase());
    return matchesCategory && matchesSearch && (!vegOnly || item.veg);
  });

  function change(id: number, amount: number) {
    setCart((current) => {
      const quantity = Math.max(0, (current[id] ?? 0) + amount);
      const next = { ...current };
      if (quantity) next[id] = quantity;
      else delete next[id];
      return next;
    });
  }

  function openCheckout() {
    setCheckoutStep(0);
    setConfirmation('');
    setCheckoutOpen(true);
  }

  async function placeOrder() {
    if (!cartItems.length || !guest.trim() || (orderType === 'Dine in' && !tableNumber.trim())) return;
    setSaving(true);
    const payload = {
      orderType,
      tableNumber: orderType === 'Dine in' ? tableNumber.trim() : undefined,
      customerName: phone.trim() ? `${guest.trim()} · ${phone.trim()}` : guest.trim(),
      items: cartItems.map((item) => ({ menuItemId: item.id, name: item.name, quantity: cart[item.id], unitPrice: item.price })),
    };
    try {
      const response = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error('Order could not be saved');
      const data = (await response.json()) as { order: { orderNumber: string } };
      setConfirmation(data.order.orderNumber);
    } catch {
      setConfirmation(localOrderNumber());
    } finally {
      setSaving(false);
      setCart({});
      setCheckoutStep(3);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f1ea] pb-24 text-[#251713] xl:pb-0">
      <header className="sticky top-0 z-50 border-b border-[#e6ddd3] bg-[#fffdf9]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[74px] max-w-[1480px] items-center justify-between gap-3 px-4 sm:px-6">
          <button aria-label="Tripti menu home" onClick={() => { window.location.href = '/menu'; }}>
            {/* oxlint-disable-next-line next/no-img-element */}
            <img src="/tripti-logo.png" alt="" className="h-12 w-32 object-contain sm:w-40" />
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => { setOrderType('Dine in'); openCheckout(); }} className="hidden items-center gap-2 rounded-full bg-[#f4e9dc] px-4 py-2 text-sm font-extrabold text-[#6a2116] sm:flex"><UtensilsCrossed className="size-4" /> Table {tableNumber || '—'}</button>
            <button onClick={openCheckout} className="relative grid size-11 place-items-center rounded-full bg-[#6a2116] text-white shadow-sm" aria-label={`Open cart with ${count} items`}><ShoppingBag className="size-5" />{count > 0 && <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-[#f6a81b] text-[11px] font-black text-[#351008]">{count}</span>}</button>
            <button onClick={() => { window.location.href = '/'; }} className="grid size-11 place-items-center rounded-full border border-[#ded3c8] bg-white text-[#5c463d]" aria-label="Open staff system"><ArrowLeft className="size-5" /></button>
          </div>
        </div>
      </header>

      <section className="border-b border-[#ecd7c5] bg-[#44150e] text-white">
        <div className="mx-auto flex max-w-[1480px] flex-col justify-between gap-5 px-4 py-7 sm:px-6 lg:flex-row lg:items-center">
          <div><p className="flex items-center gap-2 text-sm font-bold text-[#ffc768]"><Sparkles className="size-4" /> Fresh food, ordered your way</p><h1 className="mt-2 font-serif text-3xl font-black tracking-tight sm:text-4xl">What are you craving today?</h1><p className="mt-2 max-w-2xl text-base text-orange-50/75">Choose from 128 dishes, add to your basket and send the order directly to the kitchen.</p></div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setOrderType('Dine in')} className={`rounded-full px-5 py-3 text-sm font-extrabold transition ${orderType === 'Dine in' ? 'bg-[#f6a81b] text-[#351008]' : 'bg-white/10 text-white hover:bg-white/15'}`}>Dine at table</button>
            <button onClick={() => setOrderType('Takeaway')} className={`rounded-full px-5 py-3 text-sm font-extrabold transition ${orderType === 'Takeaway' ? 'bg-[#f6a81b] text-[#351008]' : 'bg-white/10 text-white hover:bg-white/15'}`}>Takeaway</button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1480px] px-4 py-6 sm:px-6">
        <div className="mb-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
          <div className="relative"><Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#8d776d]" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search dosa, momo, shake, pizza…" className="h-13 rounded-2xl border-[#ddd2c8] bg-white pl-12 text-base shadow-sm" /></div>
          <button onClick={() => setVegOnly((current) => !current)} className={`flex h-13 items-center justify-center gap-3 rounded-2xl border px-5 text-sm font-extrabold transition ${vegOnly ? 'border-emerald-700 bg-emerald-50 text-emerald-800' : 'border-[#ddd2c8] bg-white text-[#655148]'}`}><VegMark veg /> Veg only <span className={`h-6 w-10 rounded-full p-1 transition ${vegOnly ? 'bg-emerald-700' : 'bg-[#d8cec5]'}`}><span className={`block size-4 rounded-full bg-white transition ${vegOnly ? 'translate-x-4' : ''}`} /></span></button>
        </div>

        <div className="mb-7 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none]">
          {categories.map((name) => <button key={name} onClick={() => setCategory(name)} className={`shrink-0 rounded-full border px-4 py-2.5 text-sm font-extrabold transition ${category === name ? 'border-[#6a2116] bg-[#6a2116] text-white shadow-sm' : 'border-[#ded3c8] bg-white text-[#665148] hover:border-[#ad8d7f]'}`}>{name}</button>)}
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_370px]">
          <section aria-labelledby="menu-heading">
            <div className="mb-4 flex items-end justify-between gap-4"><div><p className="text-sm font-bold text-[#9a6a58]">{category === 'All' ? 'Complete menu' : category}</p><h2 id="menu-heading" className="font-serif text-3xl font-black">Pick your favourites</h2></div><span className="shrink-0 text-sm font-bold text-[#7a655c]">{filtered.length} items</span></div>
            {filtered.length ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((item) => (
                  <article key={item.id} className="group overflow-hidden rounded-[24px] border border-[#e1d7cd] bg-white shadow-[0_10px_35px_rgba(75,42,24,.07)] transition hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(75,42,24,.12)]">
                    <div className="relative overflow-hidden"><FoodPhoto item={item} className="aspect-[4/3] w-full transition duration-500 group-hover:scale-[1.035]" /><span className="absolute left-3 top-3 rounded-full bg-white/95 p-1.5 shadow"><VegMark veg={item.veg} /></span>{item.badge && <span className="absolute bottom-3 left-3 rounded-full bg-[#f6a81b] px-3 py-1.5 text-xs font-black text-[#371008] shadow-sm">{item.badge}</span>}</div>
                    <div className="p-4"><h3 className="min-h-12 font-serif text-lg font-black leading-6">{item.name}</h3><p className="mt-1 min-h-10 text-sm leading-5 text-[#7d685e]">{item.note}</p><div className="mt-4 flex items-center justify-between gap-3"><span className="text-lg font-black">{rupees.format(item.price)}</span>{cart[item.id] ? <QuantityControl item={item} quantity={cart[item.id]} change={change} /> : <Button onClick={() => change(item.id, 1)} size="sm" className="rounded-full bg-[#f6a81b] px-4 font-black text-[#351008] hover:bg-[#e99a08]"><Plus /> Add</Button>}</div></div>
                  </article>
                ))}
              </div>
            ) : <div className="grid min-h-80 place-items-center rounded-[24px] border border-dashed border-[#d3c6bb] bg-white/50 text-center"><div><Search className="mx-auto mb-3 size-8 text-[#a58c80]" /><h3 className="font-serif text-2xl font-black">No dish found</h3><p className="mt-2 text-[#7d685e]">Try another name or menu category.</p></div></div>}
          </section>

          <aside className="sticky top-[98px] hidden h-fit overflow-hidden rounded-[28px] border border-[#ded3c8] bg-white shadow-[0_18px_55px_rgba(58,32,18,.1)] xl:block">
            <div className="bg-[#45150e] p-5 text-white"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#ffc768]">Your order</p><h2 className="mt-1 font-serif text-2xl font-black">{orderType === 'Dine in' ? `Table ${tableNumber || '—'}` : 'Takeaway'}</h2></div><span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-black">{count} items</span></div></div>
            <CartBody cartItems={cartItems} cart={cart} change={change} subtotal={subtotal} tax={tax} total={total} />
            <div className="p-5 pt-0"><Button onClick={openCheckout} disabled={!cartItems.length} className="h-13 w-full rounded-2xl bg-[#f6a81b] text-base font-black text-[#351008] hover:bg-[#e99a08]">Review & checkout <ChevronRight /></Button><p className="mt-3 flex items-center justify-center gap-2 text-xs font-semibold text-[#887269]"><ShieldCheck className="size-4" /> Order goes directly to the kitchen</p></div>
          </aside>
        </div>
      </div>

      {count > 0 && <button onClick={openCheckout} className="fixed inset-x-3 bottom-3 z-40 flex h-16 items-center justify-between rounded-2xl bg-[#6a2116] px-5 font-extrabold text-white shadow-2xl xl:hidden"><span className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-full bg-white/10"><ShoppingBag className="size-5" /></span>{count} items</span><span>{rupees.format(total)} <ChevronRight className="ml-1 inline size-4" /></span></button>}

      <footer className="border-t border-[#ded3c8] bg-white px-4 py-8 sm:px-6"><div className="mx-auto flex max-w-[1480px] flex-col justify-between gap-3 text-sm text-[#755f55] sm:flex-row sm:items-center"><span className="font-bold text-[#38130e]">Tripti — The Indian Flavour</span><span>Freshly prepared · Kitchen open daily</span></div></footer>

      <Dialog open={checkoutOpen} onOpenChange={(open) => { setCheckoutOpen(open); if (!open) { setCheckoutStep(0); setConfirmation(''); } }}>
        <DialogContent className="max-h-[92vh] overflow-y-auto rounded-[28px] p-0 sm:max-w-xl">
          {checkoutStep === 3 ? (
            <div className="px-6 py-10 text-center sm:px-10"><span className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-100 text-emerald-700"><Check className="size-8" /></span><DialogTitle className="mt-5 font-serif text-3xl font-black">Order sent to kitchen</DialogTitle><DialogDescription className="mt-3 text-base leading-6">Your order number is <b className="text-[#45150e]">{confirmation}</b>. {orderType === 'Dine in' ? `We’ll serve it at table ${tableNumber}.` : 'We’ll call you when it is ready.'}</DialogDescription><div className="mx-auto mt-6 max-w-sm rounded-2xl bg-[#f5efe8] p-4 text-left text-sm"><div className="flex justify-between"><span>Payment preference</span><b>{payment}</b></div><div className="mt-2 flex justify-between"><span>Status</span><b className="text-amber-700">Pay on service</b></div></div><Button onClick={() => setCheckoutOpen(false)} className="mt-7 h-12 rounded-full bg-[#6a2116] px-8 font-black hover:bg-[#521008]">Back to menu</Button></div>
          ) : (
            <>
              <div className="bg-[#45150e] px-6 py-6 text-white sm:px-8"><DialogHeader><DialogTitle className="font-serif text-2xl font-black">Complete your order</DialogTitle><DialogDescription className="text-orange-50/65">Review, add table details and choose payment.</DialogDescription></DialogHeader><div className="mt-5 grid grid-cols-3 gap-2">{['Basket', 'Details', 'Payment'].map((label, index) => <div key={label} className={`rounded-xl px-2 py-2 text-center text-xs font-extrabold ${checkoutStep === index ? 'bg-[#f6a81b] text-[#351008]' : checkoutStep > index ? 'bg-emerald-700 text-white' : 'bg-white/10 text-white/65'}`}>{checkoutStep > index ? '✓ ' : `${index + 1}. `}{label}</div>)}</div></div>
              <div className="p-6 sm:p-8">
                {checkoutStep === 0 && <div><div className="mb-4 flex items-center justify-between"><h3 className="font-serif text-xl font-black">Your basket</h3><span className="text-sm font-bold text-[#806b61]">{count} items</span></div><div className="max-h-72 space-y-3 overflow-y-auto pr-1">{cartItems.map((item) => <CheckoutRow key={item.id} item={item} quantity={cart[item.id]} change={change} />)}</div><OrderTotal subtotal={subtotal} tax={tax} total={total} /></div>}
                {checkoutStep === 1 && <DetailsStep orderType={orderType} setOrderType={setOrderType} tableNumber={tableNumber} setTableNumber={setTableNumber} guest={guest} setGuest={setGuest} phone={phone} setPhone={setPhone} />}
                {checkoutStep === 2 && <PaymentStep payment={payment} setPayment={setPayment} total={total} />}
                <div className="mt-7 flex items-center justify-between gap-3 border-t border-[#e4d9cf] pt-5">{checkoutStep > 0 ? <Button variant="outline" onClick={() => setCheckoutStep((current) => Math.max(0, current - 1))} className="h-12 rounded-full px-5">Back</Button> : <span />}{checkoutStep < 2 ? <Button onClick={() => setCheckoutStep((current) => current + 1)} disabled={checkoutStep === 0 ? !cartItems.length : !guest.trim() || (orderType === 'Dine in' && !tableNumber.trim())} className="h-12 rounded-full bg-[#6a2116] px-6 font-black hover:bg-[#521008]">Continue <ChevronRight /></Button> : <Button onClick={placeOrder} disabled={saving} className="h-12 rounded-full bg-[#f6a81b] px-6 font-black text-[#351008] hover:bg-[#e99a08]">{saving ? 'Sending order…' : `Place order · ${rupees.format(total)}`}</Button>}</div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}

function QuantityControl({ item, quantity, change }: { item: MenuItem; quantity: number; change: (id: number, amount: number) => void }) {
  return <div className="flex items-center gap-2 rounded-full bg-[#f4ece4] p-1"><button onClick={() => change(item.id, -1)} aria-label={`Remove ${item.name}`} className="grid size-8 place-items-center rounded-full bg-white shadow-sm"><Minus className="size-4" /></button><b className="min-w-5 text-center text-sm">{quantity}</b><button onClick={() => change(item.id, 1)} aria-label={`Add ${item.name}`} className="grid size-8 place-items-center rounded-full bg-[#6a2116] text-white"><Plus className="size-4" /></button></div>;
}

function CartBody({ cartItems, cart, change, subtotal, tax, total }: { cartItems: MenuItem[]; cart: Record<number, number>; change: (id: number, amount: number) => void; subtotal: number; tax: number; total: number }) {
  return <div className="p-5">{cartItems.length ? <div className="max-h-[38vh] space-y-3 overflow-y-auto pr-1">{cartItems.map((item) => <CheckoutRow key={item.id} item={item} quantity={cart[item.id]} change={change} />)}</div> : <div className="grid min-h-48 place-items-center rounded-2xl border border-dashed border-[#d8cbc0] text-center"><div><ShoppingBag className="mx-auto mb-3 size-7 text-[#a48d81]" /><p className="font-extrabold">Your basket is empty</p><p className="mt-1 text-sm text-[#816c62]">Add something delicious.</p></div></div>}<OrderTotal subtotal={subtotal} tax={tax} total={total} /></div>;
}

function CheckoutRow({ item, quantity, change }: { item: MenuItem; quantity: number; change: (id: number, amount: number) => void }) {
  return <div className="flex items-center gap-3 rounded-2xl border border-[#e4dad1] bg-white p-3"><FoodPhoto item={item} className="size-14 shrink-0 rounded-xl" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold">{item.name}</p><p className="mt-0.5 text-sm text-[#7b655b]">{rupees.format(item.price)}</p></div><QuantityControl item={item} quantity={quantity} change={change} /></div>;
}

function OrderTotal({ subtotal, tax, total }: { subtotal: number; tax: number; total: number }) {
  return <div className="mt-5 space-y-2 border-t border-dashed border-[#d7c9be] pt-4 text-sm"><div className="flex justify-between text-[#7a655b]"><span>Subtotal</span><span>{rupees.format(subtotal)}</span></div><div className="flex justify-between text-[#7a655b]"><span>GST (5%)</span><span>{rupees.format(tax)}</span></div><div className="flex justify-between pt-2 font-serif text-xl font-black"><span>Total</span><span>{rupees.format(total)}</span></div><p className="flex items-center gap-2 pt-2 text-xs font-semibold text-[#8a7469]"><Clock3 className="size-4" /> Estimated preparation: 20–30 minutes</p></div>;
}

type DetailsProps = {
  orderType: 'Dine in' | 'Takeaway';
  setOrderType: (value: 'Dine in' | 'Takeaway') => void;
  tableNumber: string;
  setTableNumber: (value: string) => void;
  guest: string;
  setGuest: (value: string) => void;
  phone: string;
  setPhone: (value: string) => void;
};

function DetailsStep({ orderType, setOrderType, tableNumber, setTableNumber, guest, setGuest, phone, setPhone }: DetailsProps) {
  return <div className="space-y-5"><div><h3 className="font-serif text-xl font-black">How should we serve you?</h3><p className="mt-1 text-sm text-[#806b61]">Table number helps the kitchen send your order to the right place.</p></div><div className="grid grid-cols-2 gap-3">{(['Dine in', 'Takeaway'] as const).map((type) => <button key={type} onClick={() => setOrderType(type)} className={`rounded-2xl border p-4 text-left transition ${orderType === type ? 'border-[#6a2116] bg-[#fff4e7] ring-2 ring-[#6a2116]/10' : 'border-[#ded3c8] bg-white'}`}><UtensilsCrossed className={`size-5 ${orderType === type ? 'text-[#8a2f1d]' : 'text-[#8b776e]'}`} /><b className="mt-3 block">{type === 'Dine in' ? 'Dine at table' : 'Takeaway'}</b><span className="mt-1 block text-xs text-[#806b61]">{type === 'Dine in' ? 'Serve at your table' : 'Collect at the counter'}</span></button>)}</div><div className={`grid gap-4 ${orderType === 'Dine in' ? 'sm:grid-cols-[120px_1fr]' : ''}`}>{orderType === 'Dine in' && <label htmlFor="guest-table" className="block space-y-2 text-sm font-extrabold">Table no.<Input id="guest-table" value={tableNumber} onChange={(event) => setTableNumber(event.target.value.replace(/[^0-9A-Za-z-]/g, '').slice(0, 3))} placeholder="05" className="h-12 text-base" /></label>}<label htmlFor="guest-name" className="block space-y-2 text-sm font-extrabold">Your name<Input id="guest-name" value={guest} onChange={(event) => setGuest(event.target.value)} placeholder="Name for the order" className="h-12 text-base" /></label></div><label htmlFor="guest-phone" className="block space-y-2 text-sm font-extrabold">Mobile number <span className="font-medium text-[#8b776d]">(optional)</span><Input id="guest-phone" value={phone} onChange={(event) => setPhone(event.target.value.replace(/[^0-9+ -]/g, '').slice(0, 16))} placeholder="For order updates" inputMode="tel" className="h-12 text-base" /></label></div>;
}

function PaymentStep({ payment, setPayment, total }: { payment: (typeof paymentOptions)[number]['name']; setPayment: (value: (typeof paymentOptions)[number]['name']) => void; total: number }) {
  return <div><h3 className="font-serif text-xl font-black">Choose payment</h3><p className="mt-1 text-sm text-[#806b61]">Payment is collected securely by restaurant staff after the order is confirmed.</p><div className="mt-5 space-y-3">{paymentOptions.map(({ name, note, icon: Icon }) => <button key={name} onClick={() => setPayment(name)} className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${payment === name ? 'border-[#6a2116] bg-[#fff4e7] ring-2 ring-[#6a2116]/10' : 'border-[#ded3c8] bg-white'}`}><span className={`grid size-11 place-items-center rounded-xl ${payment === name ? 'bg-[#6a2116] text-white' : 'bg-[#f3ece5] text-[#765e54]'}`}><Icon className="size-5" /></span><span className="min-w-0 flex-1"><b className="block">{name}</b><span className="mt-0.5 block text-sm text-[#806b61]">{note}</span></span><span className={`grid size-5 place-items-center rounded-full border-2 ${payment === name ? 'border-[#6a2116] bg-[#6a2116] text-white' : 'border-[#cdbfb4]'}`}>{payment === name && <Check className="size-3" />}</span></button>)}</div><div className="mt-5 rounded-2xl bg-[#f5efe8] p-4"><div className="flex items-center justify-between"><span className="flex items-center gap-2 font-bold"><ReceiptText className="size-4" /> Order total</span><b className="text-xl">{rupees.format(total)}</b></div></div></div>;
}
