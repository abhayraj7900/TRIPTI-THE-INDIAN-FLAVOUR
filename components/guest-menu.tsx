'use client';

import {
  ArrowLeft,
  Banknote,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  CreditCard,
  LocateFixed,
  MapPin,
  MessageCircle,
  Minus,
  Plus,
  ReceiptText,
  Search,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Sparkles,
  UserRound,
  UtensilsCrossed,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { DishPhoto } from '@/components/dish-photo';
import { OrderFeedback } from '@/components/order-feedback';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  defaultCustomerSettings,
  menu,
  type CustomerSettings,
  type MenuItem,
  type OrderRecord,
} from '@/lib/restaurant-data';

const rupees = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});
const paymentOptions = [
  {
    name: 'Pay at counter',
    note: 'Cash or card after ordering',
    icon: Banknote,
  },
  { name: 'UPI', note: 'Pay by UPI when served', icon: Smartphone },
  { name: 'Card', note: 'Pay on the restaurant terminal', icon: CreditCard },
] as const;

type TableOrderTicket = {
  orderNumber: string;
  phone: string;
  tableNumber: string;
};

function VegMark({ veg }: { veg: boolean }) {
  return (
    <span
      className={`grid size-5 shrink-0 place-items-center border-2 bg-white ${veg ? 'border-emerald-600' : 'border-red-600'}`}
      title={veg ? 'Vegetarian' : 'Non-vegetarian'}
    >
      <span
        className={`size-2 rounded-full ${veg ? 'bg-emerald-600' : 'bg-red-600'}`}
      />
    </span>
  );
}

export function GuestMenu() {
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const [catalog, setCatalog] = useState<MenuItem[]>(menu);
  const [settings, setSettings] = useState<CustomerSettings>(
    defaultCustomerSettings,
  );
  const [cart, setCart] = useState<Record<number, number>>({});
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(0);
  const [orderType, setOrderType] = useState<
    'Dine in' | 'Takeaway' | 'Delivery'
  >('Dine in');
  const [tableNumber, setTableNumber] = useState('05');
  const [guest, setGuest] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [customerVerified, setCustomerVerified] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [kitchenNotes, setKitchenNotes] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [payment, setPayment] =
    useState<(typeof paymentOptions)[number]['name']>('Pay at counter');
  const [saving, setSaving] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [orderError, setOrderError] = useState('');
  const [tableOrderTicket, setTableOrderTicket] =
    useState<TableOrderTicket | null>(null);

  useEffect(() => {
    fetch('/api/menu')
      .then(async (response) =>
        response.ok
          ? ((await response.json()) as { items?: MenuItem[] })
          : null,
      )
      .then((data) => {
        if (data?.items?.length) setCatalog(data.items);
      })
      .catch(() => undefined);
    fetch('/api/settings')
      .then(async (response) =>
        response.ok
          ? ((await response.json()) as { settings?: CustomerSettings })
          : null,
      )
      .then((data) => {
        if (data?.settings) setSettings(data.settings);
      })
      .catch(() => undefined);
    fetch('/api/auth/customer')
      .then(async (response) =>
        response.ok
          ? ((await response.json()) as {
              customer?: { name: string; phone: string };
            })
          : null,
      )
      .then((data) => {
        if (data?.customer) {
          setGuest(data.customer.name);
          setPhone(data.customer.phone);
          setCustomerVerified(true);
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('tripti:table-order');
      if (!saved) return;
      const ticket = JSON.parse(saved) as Partial<TableOrderTicket>;
      if (ticket.orderNumber && ticket.phone && ticket.tableNumber) {
        setTableOrderTicket(ticket as TableOrderTicket);
      }
    } catch {
      window.localStorage.removeItem('tripti:table-order');
    }
  }, []);

  const cartItems = useMemo(
    () => catalog.filter((item) => cart[item.id]),
    [cart, catalog],
  );
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * cart[item.id],
    0,
  );
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + tax;
  const count = cartItems.reduce((sum, item) => sum + cart[item.id], 0);
  const menuCategories = useMemo(
    () => ['All', ...new Set(catalog.map((item) => item.category))],
    [catalog],
  );
  const filtered = catalog.filter((item) => {
    const matchesCategory = category === 'All' || item.category === category;
    const matchesSearch = `${item.name} ${item.note}`
      .toLowerCase()
      .includes(query.trim().toLowerCase());
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
    setOrderError('');
    setCheckoutOpen(true);
  }

  async function verifyCustomer() {
    setVerificationError('');
    setVerificationLoading(true);
    const response = await fetch('/api/auth/customer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, pin }),
    });
    const data = (await response.json()) as {
      customer?: { name: string; phone: string };
      error?: string;
    };
    setVerificationLoading(false);
    if (!response.ok || !data.customer) {
      setCustomerVerified(false);
      setVerificationError(
        data.error || 'Mobile number or PIN could not be verified',
      );
      return;
    }
    setGuest(data.customer.name);
    setPhone(data.customer.phone);
    setCustomerVerified(true);
    setPin('');
  }

  async function placeOrder() {
    if (
      !cartItems.length ||
      !guest.trim() ||
      phone.replace(/\D/g, '').length < 8 ||
      (orderType === 'Delivery' && !customerVerified) ||
      (orderType === 'Dine in' && !tableNumber.trim()) ||
      (orderType === 'Delivery' && !deliveryAddress.trim())
    )
      return;
    setSaving(true);
    setOrderError('');
    const payload = {
      orderType,
      tableNumber: orderType === 'Dine in' ? tableNumber.trim() : undefined,
      customerName: guest.trim(),
      customerPhone: phone.trim(),
      deliveryAddress:
        orderType === 'Delivery' ? deliveryAddress.trim() : undefined,
      latitude: latitude || undefined,
      longitude: longitude || undefined,
      notes: kitchenNotes.trim() || undefined,
      items: cartItems.map((item) => ({
        menuItemId: item.id,
        name: item.name,
        quantity: cart[item.id],
        unitPrice: item.price,
      })),
    };
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Order could not be saved');
      const data = (await response.json()) as {
        order: { orderNumber: string };
      };
      setConfirmation(data.order.orderNumber);
      if (orderType === 'Dine in') {
        const ticket = {
          orderNumber: data.order.orderNumber,
          phone: phone.trim(),
          tableNumber: tableNumber.trim().padStart(2, '0'),
        };
        setTableOrderTicket(ticket);
        window.localStorage.setItem(
          'tripti:table-order',
          JSON.stringify(ticket),
        );
      }
      setCart({});
      setKitchenNotes('');
      setCheckoutStep(3);
    } catch {
      setOrderError(
        'Order could not be sent. Please check your connection and try again.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f1ea] pb-24 text-[#251713] xl:pb-0">
      <header className="sticky top-0 z-50 border-b border-[#e6ddd3] bg-[#fffdf9]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[74px] max-w-[1480px] items-center justify-between gap-3 px-4 sm:px-6">
          <button
            aria-label="Tripti menu home"
            onClick={() => {
              window.location.href = '/menu';
            }}
            className="flex items-center gap-3 text-left"
          >
            {/* oxlint-disable-next-line next/no-img-element */}
            <img
              src="/tripti-logo.png"
              alt=""
              className="size-12 rounded-full object-contain"
            />
            <span className="hidden leading-tight sm:block">
              <b className="block font-serif text-xl text-[#3d130d]">Tripti</b>
              <span className="text-xs font-bold uppercase tracking-[.16em] text-[#9b6a32]">
                The Indian Flavour
              </span>
            </span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                window.location.href = '/account';
              }}
              className="flex items-center gap-2 rounded-full border border-[#ded3c8] bg-white px-3 py-2 text-sm font-extrabold text-[#6a2116] sm:px-4"
            >
              <CalendarDays className="size-4" />
              <span className="hidden sm:inline">Book a table</span>
            </button>
            <button
              onClick={() => {
                setOrderType('Dine in');
                openCheckout();
              }}
              className="hidden items-center gap-2 rounded-full bg-[#f4e9dc] px-4 py-2 text-sm font-extrabold text-[#6a2116] sm:flex"
            >
              <UtensilsCrossed className="size-4" /> Table {tableNumber || '—'}
            </button>
            <button
              onClick={openCheckout}
              className="relative grid size-11 place-items-center rounded-full bg-[#6a2116] text-white shadow-sm"
              aria-label={`Open cart with ${count} items`}
            >
              <ShoppingBag className="size-5" />
              {count > 0 && (
                <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-[#f6a81b] text-[11px] font-black text-[#351008]">
                  {count}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                window.location.href = '/account';
              }}
              className="grid size-11 place-items-center rounded-full border border-[#ded3c8] bg-white text-[#5c463d]"
              aria-label="Customer account"
            >
              <UserRound className="size-5" />
            </button>
            <button
              onClick={() => {
                window.location.href = '/';
              }}
              className="grid size-11 place-items-center rounded-full border border-[#ded3c8] bg-white text-[#5c463d]"
              aria-label="Open staff system"
            >
              <ArrowLeft className="size-5" />
            </button>
          </div>
        </div>
      </header>

      <section className="border-b border-[#ecd7c5] bg-[#44150e] text-white">
        <div className="mx-auto flex max-w-[1480px] flex-col justify-between gap-5 px-4 py-7 sm:px-6 lg:flex-row lg:items-center">
          <div>
            <p className="flex items-center gap-2 text-sm font-bold text-[#ffc768]">
              <Sparkles className="size-4" /> Fresh food, ordered your way
            </p>
            <h1 className="mt-2 font-serif text-3xl font-black tracking-tight sm:text-4xl">
              What are you craving today?
            </h1>
            <p className="mt-2 max-w-2xl text-base text-orange-50/75">
              Choose from 128 dishes, add to your basket and send the order
              directly to the kitchen.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setOrderType('Dine in')}
              className={`rounded-full px-5 py-3 text-sm font-extrabold transition ${orderType === 'Dine in' ? 'bg-[#f6a81b] text-[#351008]' : 'bg-white/10 text-white hover:bg-white/15'}`}
            >
              Dine at table
            </button>
            <button
              onClick={() => setOrderType('Takeaway')}
              className={`rounded-full px-5 py-3 text-sm font-extrabold transition ${orderType === 'Takeaway' ? 'bg-[#f6a81b] text-[#351008]' : 'bg-white/10 text-white hover:bg-white/15'}`}
            >
              Takeaway
            </button>
            <button
              onClick={() => setOrderType('Delivery')}
              className={`rounded-full px-5 py-3 text-sm font-extrabold transition ${orderType === 'Delivery' ? 'bg-[#f6a81b] text-[#351008]' : 'bg-white/10 text-white hover:bg-white/15'}`}
            >
              Delivery
            </button>
            <a
              href="/track"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-white/20"
            >
              <ReceiptText className="size-4" /> Track order
            </a>
          </div>
        </div>
      </section>

      {settings.offerEnabled && (
        <section className="border-b border-[#e4d6ca] bg-[#fff7e8]">
          <div className="mx-auto flex max-w-[1480px] items-center gap-5 px-4 py-4 sm:px-6">
            {settings.bannerImageUrl && (
              <div
                className="hidden h-20 w-32 shrink-0 rounded-2xl bg-cover bg-center sm:block"
                style={{ backgroundImage: `url('${settings.bannerImageUrl}')` }}
              />
            )}
            <div>
              <p className="text-xs font-black uppercase tracking-[.16em] text-[#9a4d16]">
                Special offer
              </p>
              <h2 className="font-serif text-xl font-black">
                {settings.offerTitle}
              </h2>
              <p className="mt-1 text-sm text-[#74594c]">
                {settings.offerText}
              </p>
            </div>
            <Sparkles className="ml-auto hidden size-8 text-[#d18413] sm:block" />
          </div>
        </section>
      )}

      <div className="mx-auto max-w-[1480px] px-4 py-6 sm:px-6">
        <div className="mb-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#8d776d]" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search dosa, momo, shake, pizza…"
              className="h-13 rounded-2xl border-[#ddd2c8] bg-white pl-12 text-base shadow-sm"
            />
          </div>
          <button
            onClick={() => setVegOnly((current) => !current)}
            className={`flex h-13 items-center justify-center gap-3 rounded-2xl border px-5 text-sm font-extrabold transition ${vegOnly ? 'border-emerald-700 bg-emerald-50 text-emerald-800' : 'border-[#ddd2c8] bg-white text-[#655148]'}`}
          >
            <VegMark veg /> Veg only{' '}
            <span
              className={`h-6 w-10 rounded-full p-1 transition ${vegOnly ? 'bg-emerald-700' : 'bg-[#d8cec5]'}`}
            >
              <span
                className={`block size-4 rounded-full bg-white transition ${vegOnly ? 'translate-x-4' : ''}`}
              />
            </span>
          </button>
        </div>

        <div className="mb-7 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none]">
          {menuCategories.map((name) => (
            <button
              key={name}
              onClick={() => setCategory(name)}
              className={`shrink-0 rounded-full border px-4 py-2.5 text-sm font-extrabold transition ${category === name ? 'border-[#6a2116] bg-[#6a2116] text-white shadow-sm' : 'border-[#ded3c8] bg-white text-[#665148] hover:border-[#ad8d7f]'}`}
            >
              {name}
            </button>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_370px]">
          <section aria-labelledby="menu-heading">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-[#9a6a58]">
                  {category === 'All' ? 'Complete menu' : category}
                </p>
                <h2
                  id="menu-heading"
                  className="font-serif text-3xl font-black"
                >
                  Pick your favourites
                </h2>
              </div>
              <span className="shrink-0 text-sm font-bold text-[#7a655c]">
                {filtered.length} items
              </span>
            </div>
            {filtered.length ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((item) => (
                  <article
                    key={item.id}
                    className="group overflow-hidden rounded-[24px] border border-[#e1d7cd] bg-white shadow-[0_10px_35px_rgba(75,42,24,.07)] transition hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(75,42,24,.12)]"
                  >
                    <div className="relative overflow-hidden">
                      <DishPhoto
                        item={item}
                        className="aspect-[4/3] w-full transition duration-500 group-hover:scale-[1.035]"
                      />
                      <span className="absolute left-3 top-3 rounded-full bg-white/95 p-1.5 shadow">
                        <VegMark veg={item.veg} />
                      </span>
                      {item.badge && (
                        <span className="absolute bottom-3 left-3 rounded-full bg-[#f6a81b] px-3 py-1.5 text-xs font-black text-[#371008] shadow-sm">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="line-clamp-2 min-h-10 font-serif text-base font-black leading-5">
                        {item.name}
                      </h3>
                      <p className="mt-1 truncate text-[13px] leading-4 text-[#7d685e]">
                        {item.note}
                      </p>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <span className="font-black">
                          {rupees.format(item.price)}
                        </span>
                        {cart[item.id] ? (
                          <QuantityControl
                            item={item}
                            quantity={cart[item.id]}
                            change={change}
                          />
                        ) : (
                          <Button
                            onClick={() => change(item.id, 1)}
                            size="sm"
                            className="rounded-full bg-[#f6a81b] px-4 font-black text-[#351008] hover:bg-[#e99a08]"
                          >
                            <Plus /> Add
                          </Button>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="grid min-h-80 place-items-center rounded-[24px] border border-dashed border-[#d3c6bb] bg-white/50 text-center">
                <div>
                  <Search className="mx-auto mb-3 size-8 text-[#a58c80]" />
                  <h3 className="font-serif text-2xl font-black">
                    No dish found
                  </h3>
                  <p className="mt-2 text-[#7d685e]">
                    Try another name or menu category.
                  </p>
                </div>
              </div>
            )}
          </section>

          <aside className="sticky top-[98px] hidden h-fit space-y-4 xl:block">
            <section className="overflow-hidden rounded-[28px] border border-[#ded3c8] bg-white shadow-[0_18px_55px_rgba(58,32,18,.1)]">
              <div className="bg-[#f6a81b] p-5 text-[#351008]">
                <p className="text-xs font-black uppercase tracking-[.16em]">
                  Table order status
                </p>
                <h2 className="mt-1 font-serif text-2xl font-black">
                  {tableOrderTicket
                    ? `Table ${tableOrderTicket.tableNumber}`
                    : 'No active table order'}
                </h2>
              </div>
              {tableOrderTicket ? (
                <div className="p-4">
                  <p className="text-sm font-bold text-[#765f55]">
                    {tableOrderTicket.orderNumber}
                  </p>
                  <LiveOrderStatus
                    orderNumber={tableOrderTicket.orderNumber}
                    phone={tableOrderTicket.phone}
                    embedded
                  />
                </div>
              ) : (
                <div className="p-5 text-sm leading-6 text-[#765f55]">
                  Restaurant mein table se order karne ke baad yahan Accepted,
                  Preparing, Ready aur Served status dikhega.
                </div>
              )}
            </section>

            <section className="overflow-hidden rounded-[28px] border border-[#ded3c8] bg-white shadow-[0_18px_55px_rgba(58,32,18,.1)]">
              <div className="bg-[#45150e] p-5 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[.16em] text-[#ffc768]">
                      Your order
                    </p>
                    <h2 className="mt-1 font-serif text-2xl font-black">
                      {orderType === 'Dine in'
                        ? `Table ${tableNumber || '—'}`
                        : orderType}
                    </h2>
                  </div>
                  <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-black">
                    {count} items
                  </span>
                </div>
              </div>
              <CartBody
                cartItems={cartItems}
                cart={cart}
                change={change}
                subtotal={subtotal}
                tax={tax}
                total={total}
              />
              <div className="p-5 pt-0">
                <Button
                  onClick={openCheckout}
                  disabled={!cartItems.length}
                  className="h-13 w-full rounded-2xl bg-[#f6a81b] text-base font-black text-[#351008] hover:bg-[#e99a08]"
                >
                  Review & checkout <ChevronRight />
                </Button>
                <p className="mt-3 flex items-center justify-center gap-2 text-xs font-semibold text-[#887269]">
                  <ShieldCheck className="size-4" /> Order goes directly to the
                  kitchen
                </p>
              </div>
            </section>
          </aside>
        </div>
      </div>

      {count > 0 && (
        <button
          onClick={openCheckout}
          className="fixed inset-x-3 bottom-3 z-40 flex h-16 items-center justify-between rounded-2xl bg-[#6a2116] px-5 font-extrabold text-white shadow-2xl xl:hidden"
        >
          <span className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-full bg-white/10">
              <ShoppingBag className="size-5" />
            </span>
            {count} items
          </span>
          <span>
            {rupees.format(total)}{' '}
            <ChevronRight className="ml-1 inline size-4" />
          </span>
        </button>
      )}

      <footer className="border-t border-[#ded3c8] bg-white px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-[1480px] flex-col justify-between gap-5 text-sm text-[#755f55] sm:flex-row sm:items-center">
          <div>
            <span className="font-bold text-[#38130e]">
              Tripti — The Indian Flavour
            </span>
            <p className="mt-1 flex items-center gap-2">
              <MapPin className="size-4" />
              {settings.restaurantAddress || 'Connaught Place, New Delhi'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href="/track"
              className="rounded-full border border-[#ded3c8] px-3 py-2 font-bold text-[#6a2116]"
            >
              Track order
            </a>
            <a
              href="/account"
              className="rounded-full border border-[#ded3c8] px-3 py-2 font-bold text-[#6a2116]"
            >
              My account
            </a>
            {settings.instagramUrl && (
              <a
                href={settings.instagramUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="grid size-9 place-items-center rounded-full bg-[#f4ebe4] text-xs font-black"
              >
                IG
              </a>
            )}
            {settings.facebookUrl && (
              <a
                href={settings.facebookUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="grid size-9 place-items-center rounded-full bg-[#f4ebe4] text-base font-black"
              >
                f
              </a>
            )}
            {settings.youtubeUrl && (
              <a
                href={settings.youtubeUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="YouTube"
                className="grid size-9 place-items-center rounded-full bg-[#f4ebe4] text-xs font-black"
              >
                YT
              </a>
            )}
            {settings.whatsappNumber && (
              <a
                href={`https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                aria-label="WhatsApp"
                className="grid size-9 place-items-center rounded-full bg-[#f4ebe4]"
              >
                <MessageCircle className="size-4" />
              </a>
            )}
            {settings.googleMapsUrl && (
              <a
                href={settings.googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="Location"
                className="grid size-9 place-items-center rounded-full bg-[#f4ebe4]"
              >
                <MapPin className="size-4" />
              </a>
            )}
          </div>
        </div>
      </footer>

      <Dialog
        open={checkoutOpen}
        onOpenChange={(open) => {
          setCheckoutOpen(open);
          if (!open) {
            setCheckoutStep(0);
            setConfirmation('');
          }
        }}
      >
        <DialogContent className="max-h-[92vh] overflow-y-auto rounded-[28px] p-0 sm:max-w-xl">
          {checkoutStep === 3 ? (
            <div className="px-6 py-10 text-center sm:px-10">
              <span className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                <Check className="size-8" />
              </span>
              <DialogTitle className="mt-5 font-serif text-3xl font-black">
                Order sent to kitchen
              </DialogTitle>
              <DialogDescription className="mt-3 text-base leading-6">
                Your order number is{' '}
                <b className="text-[#45150e]">{confirmation}</b>.{' '}
                {orderType === 'Dine in'
                  ? `We’ll serve it at table ${tableNumber}.`
                  : orderType === 'Delivery'
                    ? 'The kitchen will prepare it for delivery.'
                    : 'We’ll call you when it is ready.'}
              </DialogDescription>
              <div className="mx-auto mt-6 max-w-sm rounded-2xl bg-[#f5efe8] p-4 text-left text-sm">
                <div className="flex justify-between">
                  <span>Payment preference</span>
                  <b>{payment}</b>
                </div>
                <div className="mt-2 flex justify-between">
                  <span>Status</span>
                  <b className="text-amber-700">Accepted</b>
                </div>
              </div>
              <LiveOrderStatus orderNumber={confirmation} phone={phone} />
              <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
                <a
                  href={`/track?order=${encodeURIComponent(confirmation)}&phone=${encodeURIComponent(phone)}`}
                  className="inline-flex h-12 items-center justify-center rounded-full bg-[#f6a81b] px-7 font-black text-[#351008]"
                >
                  Track order
                </a>
                <Button
                  onClick={() => setCheckoutOpen(false)}
                  variant="outline"
                  className="h-12 rounded-full px-7 font-black"
                >
                  Back to menu
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-[#45150e] px-6 py-6 text-white sm:px-8">
                <DialogHeader>
                  <DialogTitle className="font-serif text-2xl font-black">
                    Complete your order
                  </DialogTitle>
                  <DialogDescription className="text-orange-50/65">
                    Review, add table details and choose payment.
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-5 grid grid-cols-3 gap-2">
                  {['Basket', 'Details', 'Payment'].map((label, index) => (
                    <div
                      key={label}
                      className={`rounded-xl px-2 py-2 text-center text-xs font-extrabold ${checkoutStep === index ? 'bg-[#f6a81b] text-[#351008]' : checkoutStep > index ? 'bg-emerald-700 text-white' : 'bg-white/10 text-white/65'}`}
                    >
                      {checkoutStep > index ? '✓ ' : `${index + 1}. `}
                      {label}
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-6 sm:p-8">
                {checkoutStep === 0 && (
                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="font-serif text-xl font-black">
                        Your basket
                      </h3>
                      <span className="text-sm font-bold text-[#806b61]">
                        {count} items
                      </span>
                    </div>
                    <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
                      {cartItems.map((item) => (
                        <CheckoutRow
                          key={item.id}
                          item={item}
                          quantity={cart[item.id]}
                          change={change}
                        />
                      ))}
                    </div>
                    <OrderTotal subtotal={subtotal} tax={tax} total={total} />
                  </div>
                )}
                {checkoutStep === 1 && (
                  <DetailsStep
                    orderType={orderType}
                    setOrderType={setOrderType}
                    tableNumber={tableNumber}
                    setTableNumber={setTableNumber}
                    guest={guest}
                    setGuest={setGuest}
                    phone={phone}
                    setPhone={(value) => {
                      setPhone(value);
                      setCustomerVerified(false);
                      setVerificationError('');
                    }}
                    pin={pin}
                    setPin={(value) => {
                      setPin(value);
                      setCustomerVerified(false);
                      setVerificationError('');
                    }}
                    customerVerified={customerVerified}
                    verificationLoading={verificationLoading}
                    verificationError={verificationError}
                    verifyCustomer={verifyCustomer}
                    kitchenNotes={kitchenNotes}
                    setKitchenNotes={setKitchenNotes}
                    deliveryAddress={deliveryAddress}
                    setDeliveryAddress={setDeliveryAddress}
                    latitude={latitude}
                    setLatitude={setLatitude}
                    longitude={longitude}
                    setLongitude={setLongitude}
                  />
                )}
                {checkoutStep === 2 && (
                  <PaymentStep
                    payment={payment}
                    setPayment={setPayment}
                    total={total}
                  />
                )}
                <div className="mt-7 flex items-center justify-between gap-3 border-t border-[#e4d9cf] pt-5">
                  {checkoutStep > 0 ? (
                    <Button
                      variant="outline"
                      onClick={() =>
                        setCheckoutStep((current) => Math.max(0, current - 1))
                      }
                      className="h-12 rounded-full px-5"
                    >
                      Back
                    </Button>
                  ) : (
                    <span />
                  )}
                  {checkoutStep < 2 ? (
                    <Button
                      onClick={() => setCheckoutStep((current) => current + 1)}
                      disabled={
                        checkoutStep === 0
                          ? !cartItems.length
                          : !guest.trim() ||
                            phone.replace(/\D/g, '').length < 8 ||
                            (orderType === 'Delivery' && !customerVerified) ||
                            (orderType === 'Dine in' && !tableNumber.trim()) ||
                            (orderType === 'Delivery' &&
                              !deliveryAddress.trim())
                      }
                      className="h-12 rounded-full bg-[#6a2116] px-6 font-black hover:bg-[#521008]"
                    >
                      Continue <ChevronRight />
                    </Button>
                  ) : (
                    <Button
                      onClick={placeOrder}
                      disabled={saving}
                      className="h-12 rounded-full bg-[#f6a81b] px-6 font-black text-[#351008] hover:bg-[#e99a08]"
                    >
                      {saving
                        ? 'Sending order…'
                        : `Place order · ${rupees.format(total)}`}
                    </Button>
                  )}
                </div>
                {orderError && (
                  <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">
                    {orderError}
                  </p>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}

const liveStages = ['new', 'preparing', 'ready', 'served'];

function LiveOrderStatus({
  orderNumber,
  phone,
  embedded = false,
}: {
  orderNumber: string;
  phone: string;
  embedded?: boolean;
}) {
  const [order, setOrder] = useState<OrderRecord | null>(null);

  useEffect(() => {
    let active = true;
    async function refresh() {
      try {
        const response = await fetch(
          `/api/track?order=${encodeURIComponent(orderNumber)}&phone=${encodeURIComponent(phone)}`,
        );
        const data = (await response.json()) as { order?: OrderRecord };
        if (active && response.ok && data.order) setOrder(data.order);
      } catch {
        // A temporary polling failure should not hide the confirmed order.
      }
    }
    void refresh();
    const timer = window.setInterval(refresh, 5000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [orderNumber, phone]);

  const status = order?.status ?? 'new';
  const current =
    status === 'completed'
      ? liveStages.length - 1
      : Math.max(0, liveStages.indexOf(status));

  return (
    <div
      className={
        embedded
          ? 'mt-3 text-left'
          : 'mx-auto mt-5 max-w-sm rounded-2xl border border-[#e2d6cb] bg-white p-4 text-left'
      }
    >
      <div className="flex items-center justify-between gap-3">
        <b>Live order progress</b>
        <span className="text-xs font-bold text-emerald-700">Auto updates</span>
      </div>
      {status === 'cancelled' ? (
        <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">
          This order was cancelled. Please speak with our staff.
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-4 gap-1">
          {liveStages.map((stage, index) => (
            <div key={stage} className="text-center">
              <span
                className={`mx-auto grid size-8 place-items-center rounded-full text-xs font-black ${index <= current ? 'bg-[#6a2116] text-white' : 'bg-[#eee5dd] text-[#9a877d]'}`}
              >
                {index < current ? <Check className="size-4" /> : index + 1}
              </span>
              <p className="mt-2 text-[10px] font-bold capitalize text-[#765f55]">
                {stage === 'new' ? 'Accepted' : stage}
              </p>
            </div>
          ))}
        </div>
      )}
      {order?.items?.length ? (
        <div className="mt-4 space-y-1 border-t border-dashed border-[#ded1c6] pt-3 text-sm">
          {order.items.map((item) => (
            <div key={item.menuItemId} className="flex justify-between gap-3">
              <span className="truncate">
                {item.quantity}× {item.name}
              </span>
              <b>{rupees.format(item.quantity * item.unitPrice)}</b>
            </div>
          ))}
          <div className="mt-2 flex justify-between border-t border-[#eadfd5] pt-2 font-black">
            <span>Total</span>
            <span>{rupees.format(order.total)}</span>
          </div>
        </div>
      ) : null}
      {['served', 'completed'].includes(status) && (
        <OrderFeedback orderNumber={orderNumber} phone={phone} />
      )}
    </div>
  );
}

function QuantityControl({
  item,
  quantity,
  change,
}: {
  item: MenuItem;
  quantity: number;
  change: (id: number, amount: number) => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-[#f4ece4] p-1">
      <button
        onClick={() => change(item.id, -1)}
        aria-label={`Remove ${item.name}`}
        className="grid size-8 place-items-center rounded-full bg-white shadow-sm"
      >
        <Minus className="size-4" />
      </button>
      <b className="min-w-5 text-center text-sm">{quantity}</b>
      <button
        onClick={() => change(item.id, 1)}
        aria-label={`Add ${item.name}`}
        className="grid size-8 place-items-center rounded-full bg-[#6a2116] text-white"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}

function CartBody({
  cartItems,
  cart,
  change,
  subtotal,
  tax,
  total,
}: {
  cartItems: MenuItem[];
  cart: Record<number, number>;
  change: (id: number, amount: number) => void;
  subtotal: number;
  tax: number;
  total: number;
}) {
  return (
    <div className="p-5">
      {cartItems.length ? (
        <div className="max-h-[38vh] space-y-3 overflow-y-auto pr-1">
          {cartItems.map((item) => (
            <CheckoutRow
              key={item.id}
              item={item}
              quantity={cart[item.id]}
              change={change}
            />
          ))}
        </div>
      ) : (
        <div className="grid min-h-48 place-items-center rounded-2xl border border-dashed border-[#d8cbc0] text-center">
          <div>
            <ShoppingBag className="mx-auto mb-3 size-7 text-[#a48d81]" />
            <p className="font-extrabold">Your basket is empty</p>
            <p className="mt-1 text-sm text-[#816c62]">
              Add something delicious.
            </p>
          </div>
        </div>
      )}
      <OrderTotal subtotal={subtotal} tax={tax} total={total} />
    </div>
  );
}

function CheckoutRow({
  item,
  quantity,
  change,
}: {
  item: MenuItem;
  quantity: number;
  change: (id: number, amount: number) => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[#e4dad1] bg-white p-3">
      <DishPhoto item={item} className="size-12 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-extrabold">{item.name}</p>
        <p className="mt-0.5 text-sm text-[#7b655b]">
          {rupees.format(item.price)}
        </p>
      </div>
      <QuantityControl item={item} quantity={quantity} change={change} />
    </div>
  );
}

function OrderTotal({
  subtotal,
  tax,
  total,
}: {
  subtotal: number;
  tax: number;
  total: number;
}) {
  return (
    <div className="mt-5 space-y-2 border-t border-dashed border-[#d7c9be] pt-4 text-sm">
      <div className="flex justify-between text-[#7a655b]">
        <span>Subtotal</span>
        <span>{rupees.format(subtotal)}</span>
      </div>
      <div className="flex justify-between text-[#7a655b]">
        <span>GST (5%)</span>
        <span>{rupees.format(tax)}</span>
      </div>
      <div className="flex justify-between pt-2 font-serif text-xl font-black">
        <span>Total</span>
        <span>{rupees.format(total)}</span>
      </div>
      <p className="flex items-center gap-2 pt-2 text-xs font-semibold text-[#8a7469]">
        <Clock3 className="size-4" /> Estimated preparation: 20–30 minutes
      </p>
    </div>
  );
}

type DetailsProps = {
  orderType: 'Dine in' | 'Takeaway' | 'Delivery';
  setOrderType: (value: 'Dine in' | 'Takeaway' | 'Delivery') => void;
  tableNumber: string;
  setTableNumber: (value: string) => void;
  guest: string;
  setGuest: (value: string) => void;
  phone: string;
  setPhone: (value: string) => void;
  pin: string;
  setPin: (value: string) => void;
  customerVerified: boolean;
  verificationLoading: boolean;
  verificationError: string;
  verifyCustomer: () => Promise<void>;
  kitchenNotes: string;
  setKitchenNotes: (value: string) => void;
  deliveryAddress: string;
  setDeliveryAddress: (value: string) => void;
  latitude: string;
  setLatitude: (value: string) => void;
  longitude: string;
  setLongitude: (value: string) => void;
};

function DetailsStep({
  orderType,
  setOrderType,
  tableNumber,
  setTableNumber,
  guest,
  setGuest,
  phone,
  setPhone,
  pin,
  setPin,
  customerVerified,
  verificationLoading,
  verificationError,
  verifyCustomer,
  kitchenNotes,
  setKitchenNotes,
  deliveryAddress,
  setDeliveryAddress,
  latitude,
  setLatitude,
  longitude,
  setLongitude,
}: DetailsProps) {
  const [locationStatus, setLocationStatus] = useState('');
  function detectLocation() {
    if (!navigator.geolocation) {
      setLocationStatus('Location is not supported on this device.');
      return;
    }
    setLocationStatus('Finding your location…');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(6));
        setLongitude(position.coords.longitude.toFixed(6));
        setLocationStatus('Location attached to this delivery.');
      },
      () => setLocationStatus('Location permission was not granted.'),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }
  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-serif text-xl font-black">
          How should we serve you?
        </h3>
        <p className="mt-1 text-sm text-[#806b61]">
          Choose dine-in, counter pickup or delivery.
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {(['Dine in', 'Takeaway', 'Delivery'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setOrderType(type)}
            className={`rounded-2xl border p-3 text-left transition ${orderType === type ? 'border-[#6a2116] bg-[#fff4e7] ring-2 ring-[#6a2116]/10' : 'border-[#ded3c8] bg-white'}`}
          >
            <UtensilsCrossed
              className={`size-5 ${orderType === type ? 'text-[#8a2f1d]' : 'text-[#8b776e]'}`}
            />
            <b className="mt-2 block text-sm">{type}</b>
          </button>
        ))}
      </div>
      {orderType === 'Delivery' && (
        <div
          className={`rounded-2xl border p-4 ${customerVerified ? 'border-emerald-200 bg-emerald-50' : 'border-[#e2d6cb] bg-[#faf6f1]'}`}
        >
          <div className="flex items-start gap-3">
            <ShieldCheck
              className={`mt-0.5 size-5 shrink-0 ${customerVerified ? 'text-emerald-700' : 'text-[#6a2116]'}`}
            />
            <div>
              <p className="font-extrabold">
                {customerVerified
                  ? 'Customer details verified'
                  : 'Sign in required for delivery'}
              </p>
              <p className="mt-1 text-sm leading-5 text-[#765f55]">
                Use your mobile number and saved 6 digit PIN. First-time PIN
                setup and forgotten PIN reset both use OTP verification.
              </p>
            </div>
          </div>
          {!customerVerified && (
            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_150px]">
              <label
                htmlFor="guest-phone"
                className="space-y-2 text-sm font-extrabold"
              >
                Mobile number
                <Input
                  id="guest-phone"
                  value={phone}
                  onChange={(event) =>
                    setPhone(
                      event.target.value.replace(/[^0-9+ -]/g, '').slice(0, 16),
                    )
                  }
                  placeholder="Your mobile number"
                  inputMode="tel"
                  className="h-12 bg-white text-base"
                />
              </label>
              <label
                htmlFor="guest-pin"
                className="space-y-2 text-sm font-extrabold"
              >
                6 digit PIN
                <Input
                  id="guest-pin"
                  value={pin}
                  onChange={(event) =>
                    setPin(event.target.value.replace(/\D/g, '').slice(0, 6))
                  }
                  placeholder="••••••"
                  type="password"
                  inputMode="numeric"
                  className="h-12 bg-white text-base"
                />
              </label>
              <Button
                type="button"
                onClick={verifyCustomer}
                disabled={
                  verificationLoading ||
                  phone.replace(/\D/g, '').length < 8 ||
                  pin.length !== 6
                }
                className="h-11 bg-[#6a2116] font-bold hover:bg-[#521008] sm:col-span-2"
              >
                {verificationLoading
                  ? 'Checking…'
                  : 'Verify & use saved details'}
              </Button>
              {verificationError && (
                <p className="text-sm font-bold text-red-700 sm:col-span-2">
                  {verificationError}
                </p>
              )}
              <a
                href="/account"
                className="text-center text-sm font-bold text-[#6a2116] underline sm:col-span-2"
              >
                First time or forgot PIN? Verify with SMS OTP
              </a>
            </div>
          )}
        </div>
      )}
      <div
        className={`grid gap-4 ${orderType === 'Dine in' ? 'sm:grid-cols-[120px_1fr]' : ''}`}
      >
        {orderType === 'Dine in' && (
          <label
            htmlFor="guest-table"
            className="block space-y-2 text-sm font-extrabold"
          >
            Table no.
            <Input
              id="guest-table"
              value={tableNumber}
              onChange={(event) =>
                setTableNumber(
                  event.target.value.replace(/[^0-9A-Za-z-]/g, '').slice(0, 3),
                )
              }
              placeholder="05"
              className="h-12 text-base"
            />
          </label>
        )}
        <label
          htmlFor="guest-name"
          className="block space-y-2 text-sm font-extrabold"
        >
          Your name
          <Input
            id="guest-name"
            value={guest}
            onChange={(event) => setGuest(event.target.value)}
            placeholder="Name for the order"
            className="h-12 text-base"
          />
        </label>
      </div>
      {orderType !== 'Delivery' && (
        <label
          htmlFor="guest-phone"
          className="block space-y-2 text-sm font-extrabold"
        >
          Mobile number{' '}
          <span className="font-medium text-[#8b776d]">
            (no login—used only for live tracking)
          </span>
          <Input
            id="guest-phone"
            value={phone}
            onChange={(event) =>
              setPhone(
                event.target.value.replace(/[^0-9+ -]/g, '').slice(0, 16),
              )
            }
            placeholder="For order updates"
            inputMode="tel"
            className="h-12 text-base"
          />
        </label>
      )}
      {orderType === 'Delivery' && (
        <>
          <div className="rounded-2xl border border-[#e2d6cb] bg-[#faf6f1] p-4">
            <label
              htmlFor="delivery-address"
              className="block space-y-2 text-sm font-extrabold"
            >
              Delivery address
              <Textarea
                id="delivery-address"
                value={deliveryAddress}
                onChange={(event) => setDeliveryAddress(event.target.value)}
                placeholder="House, street, landmark and area"
                className="min-h-20 bg-white text-base"
              />
            </label>
            <Button
              type="button"
              onClick={detectLocation}
              variant="outline"
              className="mt-3 w-full bg-white"
            >
              <LocateFixed /> Use my current location
            </Button>
            {locationStatus && (
              <p className="mt-2 text-xs font-bold text-[#735e54]">
                {locationStatus}
                {latitude && longitude ? ` (${latitude}, ${longitude})` : ''}
              </p>
            )}
          </div>
        </>
      )}
      <label
        htmlFor="guest-kitchen-note"
        className="block space-y-2 text-sm font-extrabold"
      >
        Note for the kitchen{' '}
        <span className="font-medium text-[#8b776d]">(optional)</span>
        <Textarea
          id="guest-kitchen-note"
          value={kitchenNotes}
          onChange={(event) => setKitchenNotes(event.target.value)}
          placeholder="Less spicy, no onion, allergy note…"
          className="min-h-20 text-base"
        />
      </label>
    </div>
  );
}

function PaymentStep({
  payment,
  setPayment,
  total,
}: {
  payment: (typeof paymentOptions)[number]['name'];
  setPayment: (value: (typeof paymentOptions)[number]['name']) => void;
  total: number;
}) {
  return (
    <div>
      <h3 className="font-serif text-xl font-black">Choose payment</h3>
      <p className="mt-1 text-sm text-[#806b61]">
        Payment is collected securely by restaurant staff after the order is
        confirmed.
      </p>
      <div className="mt-5 space-y-3">
        {paymentOptions.map(({ name, note, icon: Icon }) => (
          <button
            key={name}
            onClick={() => setPayment(name)}
            className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${payment === name ? 'border-[#6a2116] bg-[#fff4e7] ring-2 ring-[#6a2116]/10' : 'border-[#ded3c8] bg-white'}`}
          >
            <span
              className={`grid size-11 place-items-center rounded-xl ${payment === name ? 'bg-[#6a2116] text-white' : 'bg-[#f3ece5] text-[#765e54]'}`}
            >
              <Icon className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <b className="block">{name}</b>
              <span className="mt-0.5 block text-sm text-[#806b61]">
                {note}
              </span>
            </span>
            <span
              className={`grid size-5 place-items-center rounded-full border-2 ${payment === name ? 'border-[#6a2116] bg-[#6a2116] text-white' : 'border-[#cdbfb4]'}`}
            >
              {payment === name && <Check className="size-3" />}
            </span>
          </button>
        ))}
      </div>
      <div className="mt-5 rounded-2xl bg-[#f5efe8] p-4">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 font-bold">
            <ReceiptText className="size-4" /> Order total
          </span>
          <b className="text-xl">{rupees.format(total)}</b>
        </div>
      </div>
    </div>
  );
}
