'use client';

import {
  ArrowRight,
  BarChart3,
  Bell,
  Check,
  ChefHat,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  CreditCard,
  Eye,
  IndianRupee,
  LayoutGrid,
  Minus,
  PackageOpen,
  Plus,
  Printer,
  ReceiptText,
  Search,
  ShoppingBag,
  Smartphone,
  Sparkles,
  TrendingUp,
  TriangleAlert,
  UtensilsCrossed,
  WalletCards,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  categories,
  demoInventory,
  demoOrders,
  menu,
  type MenuItem,
  type OrderRecord,
  type StockItem,
} from '@/lib/restaurant-data';

type View = 'pos' | 'kitchen' | 'tables' | 'orders' | 'inventory' | 'reports';
type Cart = Record<number, number>;
type CheckoutPayload = {
  orderType: string;
  tableNumber?: string;
  customerName?: string;
  paymentMethod?: string;
  discount?: number;
  items: { menuItemId: number; name: string; quantity: number; unitPrice: number }[];
};

const navigation: { id: View; label: string; icon: typeof LayoutGrid }[] = [
  { id: 'pos', label: 'Point of sale', icon: LayoutGrid },
  { id: 'kitchen', label: 'Kitchen', icon: ChefHat },
  { id: 'tables', label: 'Tables', icon: UtensilsCrossed },
  { id: 'orders', label: 'Orders', icon: ClipboardList },
  { id: 'inventory', label: 'Inventory', icon: PackageOpen },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
];

const headings: Record<View, { eyebrow: string; title: string }> = {
  pos: { eyebrow: 'Sunday · Dinner shift', title: 'New order' },
  kitchen: { eyebrow: 'Live preparation board', title: 'Kitchen display' },
  tables: { eyebrow: 'Main dining · 16 tables', title: 'Floor plan' },
  orders: { eyebrow: 'Today · All channels', title: 'Orders & billing' },
  inventory: { eyebrow: 'Last checked 10 minutes ago', title: 'Inventory' },
  reports: { eyebrow: 'Sunday, 7 September', title: 'Daily performance' },
};

const tableState = [
  'seated', 'available', 'seated', 'reserved', 'seated', 'available', 'available', 'seated',
  'available', 'reserved', 'seated', 'available', 'available', 'seated', 'available', 'reserved',
] as const;

const rupees = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

function elapsed(timestamp: number) {
  return `${Math.max(1, Math.round((Date.now() - timestamp) / 60000))} min`;
}

function statusClass(status: string) {
  if (status === 'ready' || status === 'completed') return 'bg-emerald-100 text-emerald-800';
  if (status === 'preparing') return 'bg-amber-100 text-amber-800';
  if (status === 'cancelled') return 'bg-red-100 text-red-800';
  return 'bg-blue-100 text-blue-800';
}

async function createOrder(payload: CheckoutPayload): Promise<OrderRecord> {
  const fallbackNow = Date.now();
  try {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Save failed');
    const data = (await response.json()) as { order: OrderRecord };
    return { ...data.order, items: payload.items };
  } catch {
    const fallbackSubtotal = payload.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const fallbackTax = Math.round(fallbackSubtotal * 0.05);
    return {
      id: `local-${fallbackNow}`,
      orderNumber: `TRP-${String(fallbackNow).slice(-6)}`,
      orderType: payload.orderType,
      tableNumber: payload.tableNumber ?? null,
      customerName: payload.customerName ?? null,
      status: 'new',
      paymentStatus: payload.paymentMethod ? 'paid' : 'pending',
      paymentMethod: payload.paymentMethod ?? null,
      subtotal: fallbackSubtotal,
      tax: fallbackTax,
      discount: payload.discount ?? 0,
      total: fallbackSubtotal + fallbackTax - (payload.discount ?? 0),
      createdAt: fallbackNow,
      items: payload.items,
    };
  }
}

export function RestaurantSystem() {
  const [activeView, setActiveView] = useState<View>('pos');
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [cart, setCart] = useState<Cart>({ 3: 1, 7: 2 });
  const [orderType, setOrderType] = useState('Dine in');
  const [selectedTable, setSelectedTable] = useState('08');
  const [customerName, setCustomerName] = useState('');
  const [discount, setDiscount] = useState(0);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Pay later');
  const [orders, setOrders] = useState<OrderRecord[]>(demoOrders);
  const [stock, setStock] = useState<StockItem[]>(demoInventory);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    fetch('/api/orders')
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        const result = data as { orders?: OrderRecord[] } | null;
        if (result?.orders?.length) setOrders((current) => [...result.orders!, ...current.filter((order) => order.id.startsWith('demo-'))]);
      })
      .catch(() => undefined);
    fetch('/api/inventory')
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        const result = data as { inventory?: StockItem[] } | null;
        if (result?.inventory?.length) {
          const saved = new Map(result.inventory.map((item) => [item.id, item]));
          setStock((current) => current.map((item) => saved.get(item.id) ?? item));
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 3500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const filtered = menu.filter((item) =>
    (category === 'All' || item.category === category) &&
    `${item.name} ${item.note}`.toLowerCase().includes(query.toLowerCase()),
  );
  const cartItems = menu.filter((item) => cart[item.id]);
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * cart[item.id], 0);
  const tax = Math.round(subtotal * 0.05);
  const total = Math.max(0, subtotal + tax - discount);
  const activeTickets = orders.filter((order) => ['new', 'preparing', 'ready'].includes(order.status));

  async function submitOrder(payload: CheckoutPayload) {
    const created = await createOrder(payload);
    setOrders((current) => [created, ...current]);
    return created;
  }

  useEffect(() => {
    const modelContext = (document as Document & {
      modelContext?: {
        registerTool: (tool: {
          name: string;
          title: string;
          description: string;
          inputSchema: object;
          annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
          execute: (input: unknown) => Promise<unknown>;
        }, options?: { signal?: AbortSignal }) => void | Promise<void>;
      };
    }).modelContext;
    if (!modelContext?.registerTool) return;
    const lifecycle = new AbortController();
    void Promise.resolve(modelContext.registerTool({
      name: 'create_restaurant_order',
      title: 'Create restaurant order',
      description: 'Create a Tripti dine-in, takeaway, or delivery order and add it to the visible kitchen queue.',
      inputSchema: {
        type: 'object',
        properties: {
          orderType: { type: 'string', enum: ['Dine in', 'Takeaway', 'Delivery'] },
          tableNumber: { type: 'string' },
          customerName: { type: 'string' },
          paymentMethod: { type: 'string', enum: ['Cash', 'UPI', 'Card', 'Pay later'] },
          items: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              properties: { menuItemId: { type: 'integer' }, quantity: { type: 'integer', minimum: 1 } },
              required: ['menuItemId', 'quantity'],
              additionalProperties: false,
            },
          },
        },
        required: ['orderType', 'items'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      async execute(rawInput) {
        const input = rawInput as { orderType?: string; tableNumber?: string; customerName?: string; paymentMethod?: string; items?: { menuItemId: number; quantity: number }[] };
        if (!input.items?.length || !['Dine in', 'Takeaway', 'Delivery'].includes(input.orderType ?? '')) throw new Error('A valid order type and at least one item are required.');
        const items = input.items.map((requested) => {
          const match = menu.find((item) => item.id === requested.menuItemId);
          if (!match || !Number.isInteger(requested.quantity) || requested.quantity < 1) throw new Error(`Invalid menu item ${requested.menuItemId}.`);
          return { menuItemId: match.id, name: match.name, quantity: requested.quantity, unitPrice: match.price };
        });
        const created = await createOrder({ orderType: input.orderType!, tableNumber: input.tableNumber, customerName: input.customerName, paymentMethod: input.paymentMethod === 'Pay later' ? undefined : input.paymentMethod, items });
        setOrders((current) => [created, ...current]);
        setActiveView('kitchen');
        setNotice(`${created.orderNumber} sent to the kitchen`);
        return { id: created.id, orderNumber: created.orderNumber, status: created.status, total: created.total };
      },
    }, { signal: lifecycle.signal })).catch(() => undefined);
    return () => lifecycle.abort();
  }, []);

  function changeQuantity(id: number, change: number) {
    setCart((current) => {
      const next = Math.max(0, (current[id] ?? 0) + change);
      const updated = { ...current };
      if (next === 0) delete updated[id];
      else updated[id] = next;
      return updated;
    });
  }

  async function completeCheckout() {
    if (!cartItems.length) return;
    setSaving(true);
    const created = await submitOrder({
      orderType,
      tableNumber: orderType === 'Dine in' ? selectedTable : undefined,
      customerName: customerName || undefined,
      paymentMethod: paymentMethod === 'Pay later' ? undefined : paymentMethod,
      discount,
      items: cartItems.map((item) => ({ menuItemId: item.id, name: item.name, quantity: cart[item.id], unitPrice: item.price })),
    });
    setSaving(false);
    setCheckoutOpen(false);
    setCart({});
    setCustomerName('');
    setDiscount(0);
    setActiveView('kitchen');
    setNotice(`${created.orderNumber} sent to the kitchen`);
  }

  async function advanceOrder(order: OrderRecord) {
    const next = order.status === 'new' ? 'preparing' : order.status === 'preparing' ? 'ready' : 'completed';
    setOrders((current) => current.map((item) => item.id === order.id ? { ...item, status: next } : item));
    if (!order.id.startsWith('demo-') && !order.id.startsWith('local-')) {
      void fetch('/api/orders', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: order.id, status: next }) });
    }
    setNotice(`${order.orderNumber} marked ${next}`);
  }

  function chooseTable(number: string) {
    setSelectedTable(number);
    setOrderType('Dine in');
    setActiveView('pos');
    setNotice(`Table ${number} selected for a new order`);
  }

  function updateStock(item: StockItem, amount: number) {
    const updated = { ...item, quantity: Math.max(0, item.quantity + amount) };
    setStock((current) => current.map((entry) => entry.id === item.id ? updated : entry));
    void fetch('/api/inventory', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) });
  }

  return (
    <main className="min-h-screen bg-[#f5f2ec] text-[#201b18]">
      {notice && (
        <output className="fixed right-4 top-4 z-[80] flex items-center gap-2 rounded-xl bg-[#201b18] px-4 py-3 text-sm font-bold text-white shadow-2xl">
          <Check className="size-4 text-emerald-400" /> {notice}
        </output>
      )}
      <div className="grid min-h-screen lg:grid-cols-[236px_minmax(0,1fr)]">
        <aside className="hidden border-r border-white/10 bg-[#48180f] px-4 py-5 text-white lg:flex lg:flex-col">
          <Brand />
          <nav className="space-y-1" aria-label="Restaurant management">
            {navigation.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActiveView(id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${activeView === id ? 'bg-white text-[#48180f] shadow-lg' : 'text-orange-50/70 hover:bg-white/10 hover:text-white'}`}>
                <Icon className="size-[18px]" /><span>{label}</span>
                {id === 'kitchen' && <span className="ml-auto rounded-full bg-[#f6a622] px-2 py-0.5 text-xs text-[#48180f]">{activeTickets.length}</span>}
              </button>
            ))}
          </nav>
          <button onClick={() => { window.location.href = '/menu'; }} className="mt-5 flex w-full items-center gap-3 rounded-xl border border-white/15 px-3 py-3 text-sm font-semibold text-orange-50/80 transition hover:bg-white/10 hover:text-white">
            <Eye className="size-[18px]" /> Guest website <ArrowRight className="ml-auto size-4" />
          </button>
          <div className="mt-auto rounded-2xl bg-white/10 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold"><span className="size-2 rounded-full bg-emerald-400" /> Connaught Place</div>
            <p className="text-xs leading-5 text-orange-50/60">Dinner shift · 4:00 PM–12:00 AM</p>
          </div>
        </aside>

        <section className="min-w-0">
          <header className="flex h-[76px] items-center justify-between border-b border-[#ded8ce] bg-[#faf8f4] px-4 md:px-7">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.16em] text-[#9a6d5b]">{headings[activeView].eyebrow}</p>
              <h1 className="font-serif text-2xl font-bold tracking-tight">{headings[activeView].title}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon-lg" className="rounded-full bg-white" aria-label="Notifications"><Bell /></Button>
              <div className="hidden items-center gap-3 rounded-full border border-[#ded8ce] bg-white py-1.5 pl-2 pr-4 sm:flex">
                <span className="grid size-8 place-items-center rounded-full bg-[#f6a622] text-sm font-bold text-[#48180f]">AR</span>
                <div className="text-sm leading-tight"><p className="font-bold">Abhay Raj</p><p className="text-xs text-[#876f64]">Manager</p></div>
              </div>
            </div>
          </header>

          {activeView === 'pos' && <POSView {...{ category, setCategory, query, setQuery, filtered, cart, cartItems, subtotal, tax, discount, total, orderType, setOrderType, selectedTable, changeQuantity, setCheckoutOpen }} />}
          {activeView === 'kitchen' && <KitchenView orders={orders} onAdvance={advanceOrder} />}
          {activeView === 'tables' && <TablesView selectedTable={selectedTable} onSelect={chooseTable} />}
          {activeView === 'orders' && <OrdersView orders={orders} />}
          {activeView === 'inventory' && <InventoryView stock={stock} onAdjust={updateStock} />}
          {activeView === 'reports' && <ReportsView orders={orders} />}
        </section>
      </div>

      <nav className="fixed inset-x-3 bottom-3 z-40 flex justify-around rounded-2xl border border-[#ded8ce] bg-white/95 p-1.5 shadow-2xl backdrop-blur lg:hidden" aria-label="Mobile management">
        {navigation.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveView(id)} className={`flex min-w-12 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-bold ${activeView === id ? 'bg-[#6d2416] text-white' : 'text-[#806b61]'}`}><Icon className="size-[18px]" /><span className="hidden sm:block">{label}</span></button>
        ))}
      </nav>

      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto rounded-[22px] p-6 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl font-bold">Complete order</DialogTitle>
            <DialogDescription>Confirm the guest details and choose how this bill will be settled.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <label htmlFor="guest-name" className="space-y-2 text-sm font-bold sm:col-span-2">Guest name <span className="font-normal text-[#8b776d]">(optional)</span><Input id="guest-name" value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="e.g. Mr Mehra" className="h-11 bg-white" /></label>
            {orderType === 'Dine in' && <label htmlFor="table-number" className="space-y-2 text-sm font-bold">Table<Input id="table-number" value={selectedTable} onChange={() => undefined} readOnly className="h-11 bg-[#f6f1eb]" /></label>}
            <label htmlFor="bill-discount" className="space-y-2 text-sm font-bold">Discount (₹)<Input id="bill-discount" type="number" min="0" max={subtotal} value={discount} onChange={(event) => setDiscount(Math.max(0, Number(event.target.value)))} className="h-11 bg-white" /></label>
          </div>
          <div>
            <p className="mb-2 text-sm font-bold">Payment</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[{ name: 'UPI', icon: Smartphone }, { name: 'Card', icon: CreditCard }, { name: 'Cash', icon: IndianRupee }, { name: 'Pay later', icon: Clock3 }].map(({ name, icon: Icon }) => (
                <button key={name} onClick={() => setPaymentMethod(name)} className={`flex flex-col items-center gap-2 rounded-xl border px-2 py-3 text-sm font-bold transition ${paymentMethod === name ? 'border-[#6d2416] bg-[#f9ece7] text-[#6d2416]' : 'border-[#ded8ce] bg-white text-[#6f5c52]'}`}><Icon className="size-5" />{name}</button>
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-[#f6f1eb] p-4 text-sm">
            <div className="flex justify-between text-[#77645b]"><span>{cartItems.reduce((sum, item) => sum + cart[item.id], 0)} items · GST included</span><span>{rupees.format(subtotal + tax)}</span></div>
            {discount > 0 && <div className="mt-2 flex justify-between text-emerald-700"><span>Discount</span><span>−{rupees.format(discount)}</span></div>}
            <div className="mt-3 flex justify-between border-t border-[#d9cec4] pt-3 font-serif text-xl font-bold"><span>Amount due</span><span>{rupees.format(total)}</span></div>
          </div>
          <DialogFooter className="-mx-6 -mb-6 px-6">
            <Button onClick={completeCheckout} disabled={saving || !cartItems.length} className="h-11 w-full bg-[#6d2416] text-base hover:bg-[#55180f] sm:w-auto">{saving ? 'Saving…' : paymentMethod === 'Pay later' ? 'Send to kitchen' : `Charge ${rupees.format(total)}`}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function Brand() {
  return (
    <div className="mb-6 flex justify-center border-b border-white/10 px-2 pb-5">
      {/* oxlint-disable-next-line next/no-img-element */}
      <img src="/tripti-logo.png" alt="Tripti — The Indian Flavour" className="h-24 w-full object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,.28)]" />
    </div>
  );
}

type POSProps = {
  category: string; setCategory: (value: string) => void; query: string; setQuery: (value: string) => void;
  filtered: typeof menu; cart: Cart; cartItems: typeof menu; subtotal: number; tax: number; discount: number; total: number;
  orderType: string; setOrderType: (value: string) => void; selectedTable: string;
  changeQuantity: (id: number, change: number) => void; setCheckoutOpen: (value: boolean) => void;
};

function POSView({ category, setCategory, query, setQuery, filtered, cart, cartItems, subtotal, tax, discount, total, orderType, setOrderType, selectedTable, changeQuantity, setCheckoutOpen }: POSProps) {
  const itemCount = cartItems.reduce((sum, item) => sum + cart[item.id], 0);
  return (
    <div className="grid min-h-[calc(100vh-76px)] xl:grid-cols-[minmax(0,1fr)_390px]">
      <section className="min-w-0 p-4 pb-28 md:p-7 xl:pb-7">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-sm"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8d7c73]" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search dishes…" className="h-11 rounded-xl border-[#ded8ce] bg-white pl-10 text-base shadow-sm" /></div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {['Dine in', 'Takeaway', 'Delivery'].map((type) => <Button key={type} onClick={() => setOrderType(type)} variant={orderType === type ? 'default' : 'outline'} className={orderType === type ? 'h-10 bg-[#6d2416] px-4 hover:bg-[#55180f]' : 'h-10 bg-white px-4'}>{type}</Button>)}
          </div>
        </div>
        <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
          {categories.map((name) => <button key={name} onClick={() => setCategory(name)} className={`shrink-0 rounded-full border px-4 py-2 text-sm font-bold transition ${category === name ? 'border-[#6d2416] bg-[#6d2416] text-white' : 'border-[#ded8ce] bg-white text-[#6e5b51] hover:border-[#b49d91]'}`}>{name}</button>)}
        </div>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div><h2 className="font-serif text-2xl font-bold">Our menu</h2><p className="mt-1 text-sm text-[#7a6960]">{filtered.length} dishes available</p></div>
          <span className="hidden rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-800 sm:block">Kitchen accepting orders</span>
        </div>
        {filtered.length ? <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">{filtered.map((item) => <MenuCard key={item.id} item={item} onAdd={() => changeQuantity(item.id, 1)} />)}</div> : <div className="grid min-h-72 place-items-center rounded-2xl border border-dashed border-[#cfc4b9] bg-white/50 text-center"><div><Search className="mx-auto mb-3 size-7 text-[#9d897e]" /><p className="font-serif text-xl font-bold">No dishes found</p><p className="mt-1 text-sm text-[#7a6960]">Try another name or category.</p></div></div>}
      </section>
      <aside className="border-l border-[#ded8ce] bg-[#faf8f4] p-5 max-xl:fixed max-xl:inset-x-3 max-xl:bottom-20 max-xl:z-30 max-xl:rounded-2xl max-xl:border max-xl:shadow-2xl md:p-6 xl:sticky xl:top-0 xl:h-[calc(100vh-76px)]">
        <div className="mb-5 flex items-center justify-between max-xl:hidden"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#9a6d5b]">Current bill</p><h2 className="font-serif text-2xl font-bold">{orderType === 'Dine in' ? `Table ${selectedTable}` : orderType}</h2></div><Badge variant="secondary">{itemCount} items</Badge></div>
        <div className="max-h-[calc(100vh-430px)] space-y-3 overflow-y-auto pr-1 max-xl:hidden xl:min-h-40">
          {!cartItems.length && <div className="grid min-h-52 place-items-center rounded-2xl border border-dashed border-[#d8cec5] text-center"><div><ShoppingBag className="mx-auto mb-2 size-6 text-[#a99388]" /><p className="font-bold">The bill is empty</p><p className="mt-1 text-sm text-[#8b776d]">Add a dish to begin.</p></div></div>}
          {cartItems.map((item) => <CartRow key={item.id} item={item} quantity={cart[item.id]} onChange={changeQuantity} />)}
        </div>
        <div className="mt-5 space-y-2 border-t border-dashed border-[#cfc4b9] pt-4 text-sm max-xl:hidden">
          <div className="flex justify-between text-[#78675e]"><span>Subtotal</span><span>{rupees.format(subtotal)}</span></div><div className="flex justify-between text-[#78675e]"><span>GST (5%)</span><span>{rupees.format(tax)}</span></div>{discount > 0 && <div className="flex justify-between text-emerald-700"><span>Discount</span><span>−{rupees.format(discount)}</span></div>}<div className="flex justify-between pt-2 font-serif text-xl font-bold"><span>Total</span><span>{rupees.format(total)}</span></div>
        </div>
        <Button onClick={() => setCheckoutOpen(true)} disabled={!cartItems.length} className="h-13 w-full rounded-xl bg-[#6d2416] text-base font-bold hover:bg-[#55180f]"><ReceiptText className="mr-1" /><span className="max-xl:hidden">Review bill · </span>{rupees.format(total)}</Button>
      </aside>
    </div>
  );
}

function MenuCard({ item, onAdd }: { item: (typeof menu)[number]; onAdd: () => void }) {
  return (
    <article className="group overflow-hidden rounded-[20px] border border-[#dfd9cf] bg-white shadow-[0_8px_30px_rgba(66,39,25,.06)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_38px_rgba(66,39,25,.11)]">
      <div className="relative h-32 overflow-hidden"><FoodThumb item={item} className="h-full w-full transition duration-500 group-hover:scale-105" /><span className={`absolute left-3 top-3 grid size-5 place-items-center border-2 bg-white ${item.veg ? 'border-emerald-600' : 'border-red-600'}`}><span className={`size-2 rounded-full ${item.veg ? 'bg-emerald-600' : 'bg-red-600'}`} /></span><span className="absolute bottom-3 right-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-[#6d2416] shadow-sm">{item.category}</span></div>
      <div className="p-4"><h3 className="font-serif text-lg font-bold">{item.name}</h3><p className="mt-1 min-h-10 text-sm leading-5 text-[#7a6960]">{item.note}</p><div className="mt-4 flex items-center justify-between"><span className="font-bold">{rupees.format(item.price)}</span><Button onClick={onAdd} size="sm" className="h-9 rounded-full bg-[#f6a622] px-4 text-[#48180f] hover:bg-[#e89a16]"><Plus /> Add</Button></div></div>
    </article>
  );
}

function CartRow({ item, quantity, onChange }: { item: (typeof menu)[number]; quantity: number; onChange: (id: number, amount: number) => void }) {
  return <div className="flex items-center gap-3 rounded-2xl border border-[#e4ded5] bg-white p-3"><FoodThumb item={item} className="size-12 shrink-0 rounded-xl" /><div className="min-w-0 flex-1"><p className="truncate font-bold">{item.name}</p><p className="text-sm text-[#7a6960]">{rupees.format(item.price)}</p></div><div className="flex items-center gap-2 rounded-full bg-[#f4eee7] p-1"><button onClick={() => onChange(item.id, -1)} className="grid size-7 place-items-center rounded-full bg-white shadow-sm" aria-label={`Remove one ${item.name}`}><Minus className="size-3" /></button><span className="min-w-4 text-center text-sm font-bold">{quantity}</span><button onClick={() => onChange(item.id, 1)} className="grid size-7 place-items-center rounded-full bg-[#6d2416] text-white" aria-label={`Add one ${item.name}`}><Plus className="size-3" /></button></div></div>;
}

function FoodThumb({ item, className }: { item: MenuItem; className: string }) {
  const column = item.photo % 5;
  const row = Math.floor(item.photo / 5);
  return <div aria-hidden="true" className={`bg-no-repeat ${className}`} style={{ backgroundImage: "url('/tripti-food-atlas.png')", backgroundPosition: `${column * 25}% ${row * 25}%`, backgroundSize: '500% 500%' }} />;
}

function KitchenView({ orders, onAdvance }: { orders: OrderRecord[]; onAdvance: (order: OrderRecord) => void }) {
  const columns = [{ id: 'new', label: 'New orders', color: 'bg-blue-500' }, { id: 'preparing', label: 'Preparing', color: 'bg-amber-500' }, { id: 'ready', label: 'Ready to serve', color: 'bg-emerald-500' }];
  return <section className="p-4 pb-28 md:p-7 lg:pb-7"><div className="mb-5 grid grid-cols-3 gap-3">{columns.map((column) => <div key={column.id} className="rounded-2xl border border-[#ded8ce] bg-white p-4"><div className="flex items-center gap-2 text-sm font-bold"><span className={`size-2.5 rounded-full ${column.color}`} />{column.label}</div><p className="mt-2 font-serif text-3xl font-bold">{orders.filter((order) => order.status === column.id).length}</p></div>)}</div><div className="grid gap-4 xl:grid-cols-3">{columns.map((column) => <div key={column.id} className="rounded-[22px] bg-[#ece7df] p-3"><div className="mb-3 flex items-center justify-between px-1"><h2 className="font-serif text-lg font-bold">{column.label}</h2><span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold">{orders.filter((order) => order.status === column.id).length}</span></div><div className="space-y-3">{orders.filter((order) => order.status === column.id).map((order) => <Ticket key={order.id} order={order} onAdvance={onAdvance} />)}{!orders.some((order) => order.status === column.id) && <div className="grid min-h-40 place-items-center rounded-2xl border border-dashed border-[#cfc5bb] text-sm text-[#8c796f]">No orders here</div>}</div></div>)}</div></section>;
}

function Ticket({ order, onAdvance }: { order: OrderRecord; onAdvance: (order: OrderRecord) => void }) {
  const label = order.status === 'new' ? 'Start cooking' : order.status === 'preparing' ? 'Mark ready' : 'Serve order';
  return <article className="rounded-2xl border border-[#ded8ce] bg-white p-4 shadow-[0_6px_20px_rgba(55,35,22,.06)]"><div className="flex items-start justify-between"><div><p className="font-serif text-lg font-bold">{order.tableNumber ? `Table ${order.tableNumber}` : order.customerName || order.orderType}</p><p className="mt-0.5 text-xs font-bold text-[#8f796e]">{order.orderNumber} · {order.orderType}</p></div><span className="flex items-center gap-1 rounded-full bg-[#f3eee8] px-2.5 py-1 text-xs font-bold"><Clock3 className="size-3" />{elapsed(order.createdAt)}</span></div><div className="my-4 space-y-2 border-y border-dashed border-[#ddd3ca] py-3">{order.items?.map((item) => <div key={`${order.id}-${item.menuItemId}`} className="flex gap-3 text-sm"><span className="font-bold text-[#6d2416]">{item.quantity}×</span><span>{item.name}</span></div>) ?? <p className="text-sm text-[#7e6c62]">Order details available at the pass</p>}</div><Button onClick={() => onAdvance(order)} variant={order.status === 'ready' ? 'default' : 'outline'} className={order.status === 'ready' ? 'h-10 w-full bg-emerald-700 hover:bg-emerald-800' : 'h-10 w-full bg-white'}>{label}<ArrowRight className="ml-1" /></Button></article>;
}

function TablesView({ selectedTable, onSelect }: { selectedTable: string; onSelect: (table: string) => void }) {
  const counts = tableState.reduce((acc, value) => ({ ...acc, [value]: (acc[value] ?? 0) + 1 }), {} as Record<string, number>);
  return <section className="p-4 pb-28 md:p-7 lg:pb-7"><div className="mb-6 flex flex-wrap gap-3 text-sm font-bold"><span className="rounded-full bg-emerald-100 px-3 py-1.5 text-emerald-800">{counts.available} available</span><span className="rounded-full bg-[#f9e8df] px-3 py-1.5 text-[#8b321d]">{counts.seated} seated</span><span className="rounded-full bg-amber-100 px-3 py-1.5 text-amber-800">{counts.reserved} reserved</span></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">{tableState.map((status, index) => { const number = String(index + 1).padStart(2, '0'); const seatedOrder = demoOrders.find((order) => order.tableNumber === number && order.status !== 'completed'); return <button key={number} onClick={() => onSelect(number)} className={`min-h-44 rounded-[24px] border p-5 text-left transition hover:-translate-y-0.5 hover:shadow-lg ${selectedTable === number ? 'border-[#6d2416] ring-2 ring-[#6d2416]/15' : 'border-[#ded8ce]'} ${status === 'available' ? 'bg-white' : status === 'seated' ? 'bg-[#fff3ed]' : 'bg-[#fff9e7]'}`}><div className="flex items-start justify-between"><div className={`grid size-12 place-items-center rounded-2xl ${status === 'available' ? 'bg-emerald-100 text-emerald-800' : status === 'seated' ? 'bg-[#6d2416] text-white' : 'bg-amber-200 text-amber-900'}`}><UtensilsCrossed className="size-5" /></div><Badge variant="outline" className="capitalize">{status}</Badge></div><p className="mt-5 font-serif text-2xl font-bold">Table {number}</p><p className="mt-1 text-sm text-[#7c6960]">{seatedOrder ? `${seatedOrder.orderNumber} · ${rupees.format(seatedOrder.total)}` : status === 'reserved' ? 'Reserved for 8:30 PM' : status === 'seated' ? 'Guest bill in progress' : 'Tap to start an order'}</p></button>; })}</div></section>;
}

function OrdersView({ orders }: { orders: OrderRecord[] }) {
  const [search, setSearch] = useState('');
  const shown = orders.filter((order) => `${order.orderNumber} ${order.customerName ?? ''} ${order.tableNumber ?? ''}`.toLowerCase().includes(search.toLowerCase()));
  return <section className="p-4 pb-28 md:p-7 lg:pb-7"><div className="mb-5 grid gap-3 sm:grid-cols-3"><MetricCard icon={ReceiptText} label="Orders today" value="86" note="+12% from last Sunday" /><MetricCard icon={CircleDollarSign} label="Net sales" value="₹72,480" note="₹843 average bill" /><MetricCard icon={WalletCards} label="Pending bills" value={rupees.format(orders.filter((order) => order.paymentStatus === 'pending').reduce((sum, order) => sum + order.total, 0))} note={`${orders.filter((order) => order.paymentStatus === 'pending').length} open tables`} /></div><div className="rounded-[22px] border border-[#ded8ce] bg-white p-4 shadow-sm md:p-5"><div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h2 className="font-serif text-xl font-bold">Order register</h2><p className="text-sm text-[#7d6a60]">Payments and service status in one place</p></div><div className="relative sm:w-72"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#907d73]" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search order, guest or table" className="h-10 pl-9" /></div></div><Table><TableHeader><TableRow><TableHead>Order</TableHead><TableHead>Guest / table</TableHead><TableHead>Channel</TableHead><TableHead>Status</TableHead><TableHead>Payment</TableHead><TableHead className="text-right">Total</TableHead><TableHead className="text-right">Bill</TableHead></TableRow></TableHeader><TableBody>{shown.map((order) => <TableRow key={order.id}><TableCell><p className="font-bold">{order.orderNumber}</p><p className="text-xs text-[#8b776d]">{new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p></TableCell><TableCell>{order.tableNumber ? `Table ${order.tableNumber}` : order.customerName || 'Walk-in'}</TableCell><TableCell>{order.orderType}</TableCell><TableCell><span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${statusClass(order.status)}`}>{order.status}</span></TableCell><TableCell><span className={order.paymentStatus === 'paid' ? 'font-bold text-emerald-700' : 'font-bold text-amber-700'}>{order.paymentStatus === 'paid' ? order.paymentMethod || 'Paid' : 'Pending'}</span></TableCell><TableCell className="text-right font-bold">{rupees.format(order.total)}</TableCell><TableCell className="text-right"><Button variant="ghost" size="icon-sm" aria-label={`Print ${order.orderNumber}`}><Printer /></Button></TableCell></TableRow>)}</TableBody></Table></div></section>;
}

function InventoryView({ stock, onAdjust }: { stock: StockItem[]; onAdjust: (item: StockItem, amount: number) => void }) {
  const lowCount = stock.filter((item) => item.quantity <= item.reorderAt).length;
  return <section className="p-4 pb-28 md:p-7 lg:pb-7"><div className="mb-5 flex flex-col justify-between gap-3 rounded-[22px] bg-[#48180f] p-5 text-white sm:flex-row sm:items-center"><div className="flex items-center gap-4"><span className="grid size-12 place-items-center rounded-2xl bg-[#f6a622] text-[#48180f]"><TriangleAlert /></span><div><p className="font-serif text-xl font-bold">{lowCount} items need attention</p><p className="text-sm text-orange-50/65">Update received stock as it reaches the kitchen.</p></div></div><Button className="bg-white text-[#48180f] hover:bg-orange-50"><ClipboardList /> Purchase list</Button></div><div className="rounded-[22px] border border-[#ded8ce] bg-white p-4 md:p-5"><div className="mb-5 flex items-end justify-between"><div><h2 className="font-serif text-xl font-bold">Ingredient stock</h2><p className="text-sm text-[#7d6a60]">Quantities save automatically</p></div><Badge variant="outline">{stock.length} items</Badge></div><div className="space-y-3">{stock.map((item) => { const percent = Math.min(100, Math.round(item.quantity / Math.max(item.reorderAt * 2, 1) * 100)); const low = item.quantity <= item.reorderAt; return <div key={item.id} className="grid items-center gap-4 rounded-2xl border border-[#e5ded5] p-4 md:grid-cols-[minmax(160px,1.2fr)_minmax(140px,1fr)_100px_140px]"><div><div className="flex items-center gap-2"><p className="font-bold">{item.name}</p>{low && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">Low</span>}</div><p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[#9b877c]">{item.category}</p></div><div><div className="mb-2 flex justify-between text-xs font-bold text-[#7d6b61]"><span>Stock level</span><span>{percent}%</span></div><Progress value={percent} className={low ? '[&_[data-slot=progress-indicator]]:bg-red-500' : '[&_[data-slot=progress-indicator]]:bg-emerald-600'} /></div><p className="font-serif text-xl font-bold">{item.quantity} <span className="font-sans text-sm font-medium text-[#87746a]">{item.unit}</span></p><div className="flex items-center justify-end gap-2"><Button onClick={() => onAdjust(item, -1)} variant="outline" size="icon" aria-label={`Reduce ${item.name}`}><Minus /></Button><Button onClick={() => onAdjust(item, 1)} variant="outline" size="icon" aria-label={`Increase ${item.name}`}><Plus /></Button><Button onClick={() => onAdjust(item, 5)} size="sm" className="bg-[#6d2416] hover:bg-[#55180f]">+5</Button></div></div>; })}</div></div></section>;
}

function ReportsView({ orders }: { orders: OrderRecord[] }) {
  const currentSales = orders.reduce((sum, order) => sum + order.total, 0);
  const bars = [48, 58, 44, 72, 66, 86, 78];
  return <section className="p-4 pb-28 md:p-7 lg:pb-7"><div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><MetricCard icon={IndianRupee} label="Gross sales" value={rupees.format(72480 + currentSales)} note="+14.2% vs last week" /><MetricCard icon={ReceiptText} label="Average bill" value="₹843" note="86 completed orders" /><MetricCard icon={UtensilsCrossed} label="Table turns" value="2.8×" note="68 minute avg. seating" /><MetricCard icon={TrendingUp} label="Food cost" value="29.4%" note="1.6% below target" /></div><div className="grid gap-5 xl:grid-cols-[1.65fr_1fr]"><div className="rounded-[22px] border border-[#ded8ce] bg-white p-5"><div className="flex items-start justify-between"><div><h2 className="font-serif text-xl font-bold">Revenue this week</h2><p className="mt-1 text-sm text-[#7d6a60]">Net sales after discounts</p></div><Badge className="bg-emerald-100 text-emerald-800">+11.8%</Badge></div><div className="mt-8 flex h-64 items-end gap-3 border-b border-[#ded8ce] px-1">{bars.map((height, index) => <div key={height + index} className="flex flex-1 flex-col items-center gap-2"><div className="group relative flex h-52 w-full items-end justify-center"><div className={`w-full max-w-12 rounded-t-xl transition-all hover:opacity-80 ${index === 6 ? 'bg-[#f6a622]' : 'bg-[#6d2416]'}`} style={{ height: `${height}%` }}><span className="sr-only">{height} percent</span></div></div><span className="text-xs font-bold text-[#8a766c]">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]}</span></div>)}</div></div><div className="rounded-[22px] border border-[#ded8ce] bg-white p-5"><h2 className="font-serif text-xl font-bold">Sales channels</h2><p className="mt-1 text-sm text-[#7d6a60]">Share of today’s revenue</p><div className="mx-auto my-7 grid size-44 place-items-center rounded-full" style={{ background: 'conic-gradient(#6d2416 0 61%, #f6a622 61% 83%, #dc8a72 83% 100%)' }}><div className="grid size-28 place-items-center rounded-full bg-white text-center"><div><p className="font-serif text-2xl font-bold">₹72.5k</p><p className="text-xs text-[#806d63]">total sales</p></div></div></div><div className="space-y-3 text-sm">{[['Dine in', '61%', '#6d2416'], ['Takeaway', '22%', '#f6a622'], ['Delivery', '17%', '#dc8a72']].map(([name, value, color]) => <div key={name} className="flex items-center"><span className="mr-2 size-2.5 rounded-full" style={{ backgroundColor: color }} /><span>{name}</span><span className="ml-auto font-bold">{value}</span></div>)}</div></div><div className="rounded-[22px] border border-[#ded8ce] bg-white p-5 xl:col-span-2"><div className="mb-5 flex items-end justify-between"><div><h2 className="font-serif text-xl font-bold">Best sellers</h2><p className="mt-1 text-sm text-[#7d6a60]">Top dishes by revenue today</p></div><Sparkles className="text-[#d18112]" /></div><div className="grid gap-3 md:grid-cols-3">{[{ name: 'Butter Chicken', sold: 42, revenue: 16590 }, { name: 'Hyderabadi Biryani', sold: 31, revenue: 13175 }, { name: 'Paneer Tikka', sold: 36, revenue: 10620 }].map((dish, index) => <div key={dish.name} className="flex items-center gap-4 rounded-2xl bg-[#f6f1eb] p-4"><span className="grid size-10 place-items-center rounded-full bg-white font-serif text-lg font-bold text-[#6d2416]">{index + 1}</span><div><p className="font-bold">{dish.name}</p><p className="text-sm text-[#7e6b61]">{dish.sold} sold · {rupees.format(dish.revenue)}</p></div></div>)}</div></div></div></section>;
}

function MetricCard({ icon: Icon, label, value, note }: { icon: typeof LayoutGrid; label: string; value: string; note: string }) {
  return <div className="rounded-[20px] border border-[#ded8ce] bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><p className="text-sm font-bold text-[#79665c]">{label}</p><span className="grid size-9 place-items-center rounded-xl bg-[#f6eee8] text-[#6d2416]"><Icon className="size-[18px]" /></span></div><p className="mt-3 font-serif text-2xl font-bold">{value}</p><p className="mt-1 text-xs text-[#8d796f]">{note}</p></div>;
}
