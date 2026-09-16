'use client';

import {
  ArrowRight,
  BarChart3,
  Bell,
  CalendarDays,
  Check,
  ChefHat,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  CreditCard,
  Eye,
  IndianRupee,
  LayoutGrid,
  Link as LinkIcon,
  Megaphone,
  MessageCircle,
  Minus,
  PackageOpen,
  PackageCheck,
  Pencil,
  Plus,
  Printer,
  ReceiptText,
  Search,
  Settings2,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Star,
  Trash2,
  TrendingUp,
  TriangleAlert,
  Truck,
  UtensilsCrossed,
  WalletCards,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DishPhoto } from '@/components/dish-photo';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  defaultCustomerSettings,
  demoInventory,
  demoOrders,
  menu,
  type BookingRecord,
  type CustomerSettings,
  type MenuItem,
  type OrderRecord,
  type StockItem,
} from '@/lib/restaurant-data';

type View =
  | 'pos'
  | 'kitchen'
  | 'tables'
  | 'orders'
  | 'inventory'
  | 'reviews'
  | 'reports'
  | 'content';
type Cart = Record<number, number>;
type CheckoutPayload = {
  orderType: string;
  tableNumber?: string;
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  latitude?: string;
  longitude?: string;
  paymentMethod?: string;
  discount?: number;
  notes?: string;
  items: {
    menuItemId: number;
    name: string;
    quantity: number;
    unitPrice: number;
  }[];
};
type BookingPayload = Pick<
  BookingRecord,
  | 'customerName'
  | 'phone'
  | 'guests'
  | 'bookingDate'
  | 'bookingTime'
  | 'tableNumber'
> & { notes?: string };
type FeedbackRecord = {
  orderId: string;
  orderNumber: string;
  orderType: string;
  customerName: string | null;
  customerPhone: string;
  tableNumber: string | null;
  foodRating: number;
  serviceRating: number;
  notes: string | null;
  createdAt: number;
  updatedAt: number;
};

const navigation: { id: View; label: string; icon: typeof LayoutGrid }[] = [
  { id: 'pos', label: 'Point of sale', icon: LayoutGrid },
  { id: 'kitchen', label: 'Kitchen', icon: ChefHat },
  { id: 'tables', label: 'Tables', icon: UtensilsCrossed },
  { id: 'orders', label: 'Orders', icon: ClipboardList },
  { id: 'inventory', label: 'Inventory', icon: PackageOpen },
  { id: 'reviews', label: 'Reviews', icon: Star },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'content', label: 'Menu & offers', icon: Settings2 },
];

const headings: Record<View, { eyebrow: string; title: string }> = {
  pos: { eyebrow: 'Sunday · Dinner shift', title: 'New order' },
  kitchen: { eyebrow: 'Live preparation board', title: 'Kitchen display' },
  tables: { eyebrow: 'Main dining · 16 tables', title: 'Floor plan' },
  orders: { eyebrow: 'Today · All channels', title: 'Orders & billing' },
  inventory: { eyebrow: 'Last checked 10 minutes ago', title: 'Inventory' },
  reviews: { eyebrow: 'Food & service feedback', title: 'Customer reviews' },
  reports: { eyebrow: 'Sunday, 7 September', title: 'Daily performance' },
  content: { eyebrow: 'Customer website controls', title: 'Menu & promotions' },
};

const rupees = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

function elapsed(timestamp: number) {
  return `${Math.max(1, Math.round((Date.now() - timestamp) / 60000))} min`;
}

function statusClass(status: string) {
  if (status === 'ready' || status === 'completed')
    return 'bg-emerald-100 text-emerald-800';
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
    const fallbackSubtotal = payload.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );
    const fallbackTax = Math.round(fallbackSubtotal * 0.05);
    return {
      id: `local-${fallbackNow}`,
      orderNumber: `TRP-${String(fallbackNow).slice(-6)}`,
      orderType: payload.orderType,
      tableNumber: payload.tableNumber ?? null,
      customerName: payload.customerName ?? null,
      customerPhone: payload.customerPhone ?? null,
      deliveryAddress: payload.deliveryAddress ?? null,
      latitude: payload.latitude ?? null,
      longitude: payload.longitude ?? null,
      status: 'new',
      paymentStatus: payload.paymentMethod ? 'paid' : 'pending',
      paymentMethod: payload.paymentMethod ?? null,
      notes: payload.notes ?? null,
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
  const [cart, setCart] = useState<Cart>({});
  const [orderType, setOrderType] = useState('Dine in');
  const [selectedTable, setSelectedTable] = useState('08');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [discount, setDiscount] = useState(0);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Pay later');
  const [notes, setNotes] = useState('');
  const [orders, setOrders] = useState<OrderRecord[]>(demoOrders);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [reviews, setReviews] = useState<FeedbackRecord[]>([]);
  const [catalog, setCatalog] = useState<MenuItem[]>(
    menu.map((item) => ({ ...item, active: true })),
  );
  const [customerSettings, setCustomerSettings] = useState<CustomerSettings>(
    defaultCustomerSettings,
  );
  const [stock, setStock] = useState<StockItem[]>(demoInventory);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    fetch('/api/orders')
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        const result = data as { orders?: OrderRecord[] } | null;
        if (Array.isArray(result?.orders)) setOrders(result.orders);
      })
      .catch(() => undefined);
    fetch('/api/inventory')
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        const result = data as { inventory?: StockItem[] } | null;
        if (result?.inventory?.length) setStock(result.inventory);
      })
      .catch(() => undefined);
    fetch('/api/bookings')
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        const result = data as { bookings?: BookingRecord[] } | null;
        if (result?.bookings) setBookings(result.bookings);
      })
      .catch(() => undefined);
    fetch('/api/menu?includeInactive=1')
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        const result = data as { items?: MenuItem[] } | null;
        if (result?.items?.length) setCatalog(result.items);
      })
      .catch(() => undefined);
    fetch('/api/settings')
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        const result = data as { settings?: CustomerSettings } | null;
        if (result?.settings) setCustomerSettings(result.settings);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 3500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (activeView !== 'reviews') return;
    let active = true;
    async function loadReviews() {
      const response = await fetch('/api/feedback');
      if (!response.ok) return;
      const data = (await response.json()) as { reviews?: FeedbackRecord[] };
      if (active && Array.isArray(data.reviews)) setReviews(data.reviews);
    }
    void loadReviews();
    const timer = window.setInterval(loadReviews, 5000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [activeView]);

  const filtered = catalog.filter(
    (item) =>
      item.active !== false &&
      (category === 'All' || item.category === category) &&
      `${item.name} ${item.note}`.toLowerCase().includes(query.toLowerCase()),
  );
  const cartItems = catalog.filter(
    (item) => item.active !== false && cart[item.id],
  );
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * cart[item.id],
    0,
  );
  const tax = Math.round(subtotal * 0.05);
  const total = Math.max(0, subtotal + tax - discount);
  const activeTickets = orders.filter((order) =>
    ['new', 'preparing', 'ready', 'served'].includes(order.status),
  );
  const categoryNames = [
    'All',
    ...new Set(
      catalog
        .filter((item) => item.active !== false)
        .map((item) => item.category),
    ),
  ];

  async function submitOrder(payload: CheckoutPayload) {
    const created = await createOrder(payload);
    setOrders((current) => [created, ...current]);
    return created;
  }

  useEffect(() => {
    const modelContext = (
      document as Document & {
        modelContext?: {
          registerTool: (
            tool: {
              name: string;
              title: string;
              description: string;
              inputSchema: object;
              annotations: {
                readOnlyHint: boolean;
                untrustedContentHint: boolean;
              };
              execute: (input: unknown) => Promise<unknown>;
            },
            options?: { signal?: AbortSignal },
          ) => void | Promise<void>;
        };
      }
    ).modelContext;
    if (!modelContext?.registerTool) return;
    const lifecycle = new AbortController();
    void Promise.resolve(
      modelContext.registerTool(
        {
          name: 'create_restaurant_order',
          title: 'Create restaurant order',
          description:
            'Create a Tripti dine-in, takeaway, or delivery order and add it to the visible kitchen queue.',
          inputSchema: {
            type: 'object',
            properties: {
              orderType: {
                type: 'string',
                enum: ['Dine in', 'Takeaway', 'Delivery'],
              },
              tableNumber: { type: 'string' },
              customerName: { type: 'string' },
              paymentMethod: {
                type: 'string',
                enum: ['Cash', 'UPI', 'Card', 'Pay later'],
              },
              notes: { type: 'string' },
              items: {
                type: 'array',
                minItems: 1,
                items: {
                  type: 'object',
                  properties: {
                    menuItemId: { type: 'integer' },
                    quantity: { type: 'integer', minimum: 1 },
                  },
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
            const input = rawInput as {
              orderType?: string;
              tableNumber?: string;
              customerName?: string;
              paymentMethod?: string;
              notes?: string;
              items?: { menuItemId: number; quantity: number }[];
            };
            if (
              !input.items?.length ||
              !['Dine in', 'Takeaway', 'Delivery'].includes(
                input.orderType ?? '',
              )
            )
              throw new Error(
                'A valid order type and at least one item are required.',
              );
            const items = input.items.map((requested) => {
              const match = menu.find(
                (item) => item.id === requested.menuItemId,
              );
              if (
                !match ||
                !Number.isInteger(requested.quantity) ||
                requested.quantity < 1
              )
                throw new Error(`Invalid menu item ${requested.menuItemId}.`);
              return {
                menuItemId: match.id,
                name: match.name,
                quantity: requested.quantity,
                unitPrice: match.price,
              };
            });
            const created = await createOrder({
              orderType: input.orderType!,
              tableNumber: input.tableNumber,
              customerName: input.customerName,
              paymentMethod:
                input.paymentMethod === 'Pay later'
                  ? undefined
                  : input.paymentMethod,
              notes: input.notes,
              items,
            });
            setOrders((current) => [created, ...current]);
            setActiveView('kitchen');
            setNotice(`${created.orderNumber} sent to the kitchen`);
            return {
              id: created.id,
              orderNumber: created.orderNumber,
              status: created.status,
              total: created.total,
            };
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch(() => undefined);
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
      customerPhone: customerPhone || undefined,
      deliveryAddress:
        orderType === 'Delivery' ? deliveryAddress || undefined : undefined,
      paymentMethod: paymentMethod === 'Pay later' ? undefined : paymentMethod,
      discount,
      notes: notes || undefined,
      items: cartItems.map((item) => ({
        menuItemId: item.id,
        name: item.name,
        quantity: cart[item.id],
        unitPrice: item.price,
      })),
    });
    setSaving(false);
    setCheckoutOpen(false);
    setCart({});
    setCustomerName('');
    setCustomerPhone('');
    setDeliveryAddress('');
    setDiscount(0);
    setNotes('');
    setActiveView('kitchen');
    setNotice(`${created.orderNumber} sent to the kitchen`);
  }

  async function advanceOrder(order: OrderRecord) {
    const next =
      order.status === 'new'
        ? 'preparing'
        : order.status === 'preparing'
          ? 'ready'
          : order.status === 'ready'
            ? 'served'
            : 'completed';
    setOrders((current) =>
      current.map((item) =>
        item.id === order.id ? { ...item, status: next } : item,
      ),
    );
    if (!order.id.startsWith('demo-') && !order.id.startsWith('local-')) {
      void fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: order.id, status: next }),
      });
    }
    setNotice(`${order.orderNumber} marked ${next}`);
  }

  function chooseTable(number: string) {
    setSelectedTable(number);
    setOrderType('Dine in');
    setActiveView('pos');
    setNotice(`Table ${number} selected for a new order`);
  }

  async function createBooking(payload: BookingPayload) {
    const response = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = (await response.json()) as {
      booking?: BookingRecord;
      error?: string;
    };
    if (!response.ok || !data.booking)
      throw new Error(data.error || 'Booking could not be saved');
    setBookings((current) => [data.booking!, ...current]);
    setNotice(
      `${data.booking.bookingNumber} booked for table ${data.booking.tableNumber}`,
    );
    return data.booking;
  }

  async function updateBookingStatus(
    booking: BookingRecord,
    status: BookingRecord['status'],
  ) {
    setBookings((current) =>
      current.map((item) =>
        item.id === booking.id
          ? { ...item, status, updatedAt: Date.now() }
          : item,
      ),
    );
    const response = await fetch('/api/bookings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: booking.id, status }),
    });
    if (!response.ok) {
      setBookings((current) =>
        current.map((item) => (item.id === booking.id ? booking : item)),
      );
      setNotice('Booking update failed. Please try again.');
      return;
    }
    setNotice(
      status === 'completed'
        ? `Table ${booking.tableNumber} is available again`
        : `${booking.bookingNumber} cancelled`,
    );
  }

  async function updateOrder(updated: OrderRecord) {
    if (updated.id.startsWith('demo-') || updated.id.startsWith('local-')) {
      setOrders((current) =>
        current.map((order) => (order.id === updated.id ? updated : order)),
      );
      setNotice(`${updated.orderNumber} updated`);
      return true;
    }
    const response = await fetch('/api/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });
    const data = (await response.json()) as {
      order?: Partial<OrderRecord>;
      error?: string;
    };
    if (!response.ok || !data.order) {
      setNotice(data.error || 'Order update failed');
      return false;
    }
    setOrders((current) =>
      current.map((order) =>
        order.id === updated.id ? { ...updated, ...data.order } : order,
      ),
    );
    setNotice(`${updated.orderNumber} updated`);
    return true;
  }

  async function deleteOrder(order: OrderRecord) {
    if (!order.id.startsWith('demo-') && !order.id.startsWith('local-')) {
      const response = await fetch('/api/orders', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: order.id }),
      });
      if (!response.ok) {
        setNotice('Order could not be deleted');
        return false;
      }
    }
    setOrders((current) => current.filter((item) => item.id !== order.id));
    setNotice(`${order.orderNumber} deleted`);
    return true;
  }

  async function deleteOrders(selectedOrders: OrderRecord[]) {
    const persistentIds = selectedOrders
      .filter(
        (order) =>
          !order.id.startsWith('demo-') && !order.id.startsWith('local-'),
      )
      .map((order) => order.id);
    if (persistentIds.length) {
      const response = await fetch('/api/orders', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: persistentIds }),
      });
      if (!response.ok) {
        setNotice('Selected orders could not be deleted');
        return false;
      }
    }
    const selectedIds = new Set(selectedOrders.map((order) => order.id));
    setOrders((current) =>
      current.filter((order) => !selectedIds.has(order.id)),
    );
    setReviews((current) =>
      current.filter((review) => !selectedIds.has(review.orderId)),
    );
    setNotice(
      `${selectedOrders.length} order${selectedOrders.length === 1 ? '' : 's'} deleted`,
    );
    return true;
  }

  async function deleteReviews(selectedReviews: FeedbackRecord[]) {
    const orderIds = selectedReviews.map((review) => review.orderId);
    const response = await fetch('/api/feedback', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderIds }),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setNotice(data.error || 'Selected reviews could not be deleted');
      return false;
    }
    const selectedIds = new Set(orderIds);
    setReviews((current) =>
      current.filter((review) => !selectedIds.has(review.orderId)),
    );
    setNotice(
      `${selectedReviews.length} review${selectedReviews.length === 1 ? '' : 's'} deleted`,
    );
    return true;
  }

  function updateStock(item: StockItem, amount: number) {
    const updated = { ...item, quantity: Math.max(0, item.quantity + amount) };
    setStock((current) =>
      current.map((entry) => (entry.id === item.id ? updated : entry)),
    );
    void fetch('/api/inventory', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });
  }

  async function addStockItem(item: Omit<StockItem, 'id'>) {
    const created: StockItem = { ...item, id: `stock-${crypto.randomUUID()}` };
    const response = await fetch('/api/inventory', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(created),
    });
    const data = (await response.json()) as {
      inventory?: StockItem;
      error?: string;
    };
    if (!response.ok || !data.inventory)
      throw new Error(data.error || 'Inventory item could not be saved');
    setStock((current) => [
      data.inventory!,
      ...current.filter((entry) => entry.id !== data.inventory!.id),
    ]);
    setNotice(`${data.inventory.name} added to inventory`);
  }

  return (
    <main className="min-h-screen bg-[#f5f2ec] text-[#201b18] lg:h-dvh lg:overflow-hidden">
      {notice && (
        <output className="fixed right-4 top-4 z-[80] flex items-center gap-2 rounded-xl bg-[#201b18] px-4 py-3 text-sm font-bold text-white shadow-2xl">
          <Check className="size-4 text-emerald-400" /> {notice}
        </output>
      )}
      <div className="grid min-h-screen lg:h-dvh lg:min-h-0 lg:grid-cols-[236px_minmax(0,1fr)]">
        <aside className="hidden border-r border-white/10 bg-[#48180f] px-4 py-5 text-white lg:flex lg:h-dvh lg:flex-col lg:overflow-y-auto [scrollbar-width:thin]">
          <Brand />
          <nav className="space-y-1" aria-label="Restaurant management">
            {navigation.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveView(id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${activeView === id ? 'bg-white text-[#48180f] shadow-lg' : 'text-orange-50/70 hover:bg-white/10 hover:text-white'}`}
              >
                <Icon className="size-[18px]" />
                <span>{label}</span>
                {id === 'kitchen' && (
                  <span className="ml-auto rounded-full bg-[#f6a622] px-2 py-0.5 text-xs text-[#48180f]">
                    {activeTickets.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
          <button
            onClick={() => {
              window.location.href = '/menu';
            }}
            className="mt-5 flex w-full items-center gap-3 rounded-xl border border-white/15 px-3 py-3 text-sm font-semibold text-orange-50/80 transition hover:bg-white/10 hover:text-white"
          >
            <Eye className="size-[18px]" /> Guest website{' '}
            <ArrowRight className="ml-auto size-4" />
          </button>
          <div className="mt-auto rounded-2xl bg-white/10 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <span className="size-2 rounded-full bg-emerald-400" /> Connaught
              Place
            </div>
            <p className="text-xs leading-5 text-orange-50/60">
              Dinner shift · 4:00 PM–12:00 AM
            </p>
          </div>
        </aside>

        <section className="min-w-0 lg:h-dvh lg:overflow-y-auto [scrollbar-width:thin]">
          <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-[#ded8ce] bg-[#faf8f4] px-4 md:px-7">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.16em] text-[#9a6d5b]">
                {headings[activeView].eyebrow}
              </p>
              <h1 className="font-serif text-2xl font-bold tracking-tight">
                {headings[activeView].title}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon-lg"
                className="rounded-full bg-white"
                aria-label="Notifications"
              >
                <Bell />
              </Button>
              <Button
                variant="outline"
                size="icon-lg"
                className="rounded-full bg-white"
                aria-label="Staff security and sign out"
                onClick={() => {
                  window.location.href = '/staff-account';
                }}
              >
                <Settings2 />
              </Button>
              <a
                href="/staff-account"
                className="hidden items-center gap-3 rounded-full border border-[#ded8ce] bg-white py-1.5 pl-2 pr-4 sm:flex"
              >
                <span className="grid size-8 place-items-center rounded-full bg-[#f6a622] text-sm font-bold text-[#48180f]">
                  AR
                </span>
                <div className="text-sm leading-tight">
                  <p className="font-bold">Abhay Raj</p>
                  <p className="text-xs text-[#876f64]">Manager</p>
                </div>
              </a>
            </div>
          </header>

          {activeView === 'pos' && (
            <POSView
              {...{
                category,
                setCategory,
                categoryNames,
                query,
                setQuery,
                filtered,
                cart,
                cartItems,
                subtotal,
                tax,
                discount,
                total,
                orderType,
                setOrderType,
                selectedTable,
                changeQuantity,
                setCheckoutOpen,
              }}
            />
          )}
          {activeView === 'kitchen' && (
            <KitchenView orders={orders} onAdvance={advanceOrder} />
          )}
          {activeView === 'tables' && (
            <TablesView
              selectedTable={selectedTable}
              orders={orders}
              bookings={bookings}
              onSelect={chooseTable}
              onCreateBooking={createBooking}
              onUpdateBooking={updateBookingStatus}
            />
          )}
          {activeView === 'orders' && (
            <OrdersView
              orders={orders}
              catalog={catalog.filter((item) => item.active !== false)}
              onUpdate={updateOrder}
              onDelete={deleteOrder}
              onDeleteMany={deleteOrders}
            />
          )}
          {activeView === 'inventory' && (
            <InventoryView
              stock={stock}
              onAdjust={updateStock}
              onAdd={addStockItem}
            />
          )}
          {activeView === 'reviews' && (
            <ReviewsView reviews={reviews} onDeleteMany={deleteReviews} />
          )}
          {activeView === 'reports' && (
            <ReportsView orders={orders} onDeleteMany={deleteOrders} />
          )}
          {activeView === 'content' && (
            <ContentManager
              items={catalog}
              settings={customerSettings}
              onItemsChange={setCatalog}
              onSettingsChange={setCustomerSettings}
            />
          )}
        </section>
      </div>

      <nav
        className="fixed inset-x-3 bottom-3 z-40 flex justify-start gap-1 overflow-x-auto rounded-2xl border border-[#ded8ce] bg-white/95 p-1.5 shadow-2xl backdrop-blur [scrollbar-width:none] lg:hidden"
        aria-label="Mobile management"
      >
        <button
          onClick={() => setActiveView('content')}
          className="flex min-w-12 shrink-0 flex-col items-center gap-1 rounded-xl bg-[#f6a622] px-2 py-2 text-[10px] font-bold text-[#48180f]"
          aria-label="Add menu item"
        >
          <Plus className="size-[18px]" />
          <span>Add</span>
        </button>
        {navigation.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveView(id)}
            className={`flex min-w-12 shrink-0 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-bold ${activeView === id ? 'bg-[#6d2416] text-white' : 'text-[#806b61]'}`}
          >
            <Icon className="size-[18px]" />
            <span className="hidden sm:block">{label}</span>
          </button>
        ))}
      </nav>

      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto rounded-[22px] p-6 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl font-bold">
              Complete order
            </DialogTitle>
            <DialogDescription>
              Confirm the guest details and choose how this bill will be
              settled.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <label
              htmlFor="guest-name"
              className="space-y-2 text-sm font-bold sm:col-span-2"
            >
              Guest name{' '}
              <span className="font-normal text-[#8b776d]">(optional)</span>
              <Input
                id="guest-name"
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                placeholder="e.g. Mr Mehra"
                className="h-11 bg-white"
              />
            </label>
            <label
              htmlFor="guest-phone"
              className="space-y-2 text-sm font-bold sm:col-span-2"
            >
              Mobile number{' '}
              <span className="font-normal text-[#8b776d]">(for tracking)</span>
              <Input
                id="guest-phone"
                value={customerPhone}
                onChange={(event) =>
                  setCustomerPhone(
                    event.target.value.replace(/[^0-9+ -]/g, '').slice(0, 16),
                  )
                }
                placeholder="Customer mobile"
                className="h-11 bg-white"
              />
            </label>
            {orderType === 'Dine in' && (
              <label
                htmlFor="table-number"
                className="space-y-2 text-sm font-bold"
              >
                Table
                <Input
                  id="table-number"
                  value={selectedTable}
                  onChange={() => undefined}
                  readOnly
                  className="h-11 bg-[#f6f1eb]"
                />
              </label>
            )}
            {orderType === 'Delivery' && (
              <label
                htmlFor="staff-delivery-address"
                className="space-y-2 text-sm font-bold sm:col-span-2"
              >
                Delivery address
                <Textarea
                  id="staff-delivery-address"
                  value={deliveryAddress}
                  onChange={(event) => setDeliveryAddress(event.target.value)}
                  placeholder="House, street, landmark and area"
                  className="min-h-20 bg-white"
                />
              </label>
            )}
            <label
              htmlFor="bill-discount"
              className="space-y-2 text-sm font-bold"
            >
              Discount (₹)
              <Input
                id="bill-discount"
                type="number"
                min="0"
                max={subtotal}
                value={discount}
                onChange={(event) =>
                  setDiscount(Math.max(0, Number(event.target.value)))
                }
                className="h-11 bg-white"
              />
            </label>
            <label
              htmlFor="kitchen-notes"
              className="space-y-2 text-sm font-bold sm:col-span-2"
            >
              Kitchen notes{' '}
              <span className="font-normal text-[#8b776d]">(optional)</span>
              <Textarea
                id="kitchen-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Less spicy, no onion, allergy note…"
                className="min-h-20 bg-white"
              />
            </label>
          </div>
          <div>
            <p className="mb-2 text-sm font-bold">Payment</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { name: 'UPI', icon: Smartphone },
                { name: 'Card', icon: CreditCard },
                { name: 'Cash', icon: IndianRupee },
                { name: 'Pay later', icon: Clock3 },
              ].map(({ name, icon: Icon }) => (
                <button
                  key={name}
                  onClick={() => setPaymentMethod(name)}
                  className={`flex flex-col items-center gap-2 rounded-xl border px-2 py-3 text-sm font-bold transition ${paymentMethod === name ? 'border-[#6d2416] bg-[#f9ece7] text-[#6d2416]' : 'border-[#ded8ce] bg-white text-[#6f5c52]'}`}
                >
                  <Icon className="size-5" />
                  {name}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-[#f6f1eb] p-4 text-sm">
            <div className="flex justify-between text-[#77645b]">
              <span>
                {cartItems.reduce((sum, item) => sum + cart[item.id], 0)} items
                · GST included
              </span>
              <span>{rupees.format(subtotal + tax)}</span>
            </div>
            {discount > 0 && (
              <div className="mt-2 flex justify-between text-emerald-700">
                <span>Discount</span>
                <span>−{rupees.format(discount)}</span>
              </div>
            )}
            <div className="mt-3 flex justify-between border-t border-[#d9cec4] pt-3 font-serif text-xl font-bold">
              <span>Amount due</span>
              <span>{rupees.format(total)}</span>
            </div>
          </div>
          <DialogFooter className="-mx-6 -mb-6 px-6">
            <Button
              onClick={completeCheckout}
              disabled={saving || !cartItems.length}
              className="h-11 w-full bg-[#6d2416] text-base hover:bg-[#55180f] sm:w-auto"
            >
              {saving
                ? 'Saving…'
                : paymentMethod === 'Pay later'
                  ? 'Send to kitchen'
                  : `Charge ${rupees.format(total)}`}
            </Button>
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
      <img
        src="/tripti-logo.png"
        alt="Tripti — The Indian Flavour"
        className="h-24 w-full object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,.28)]"
      />
    </div>
  );
}

type POSProps = {
  category: string;
  setCategory: (value: string) => void;
  categoryNames: string[];
  query: string;
  setQuery: (value: string) => void;
  filtered: MenuItem[];
  cart: Cart;
  cartItems: MenuItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  orderType: string;
  setOrderType: (value: string) => void;
  selectedTable: string;
  changeQuantity: (id: number, change: number) => void;
  setCheckoutOpen: (value: boolean) => void;
};

function POSView({
  category,
  setCategory,
  categoryNames,
  query,
  setQuery,
  filtered,
  cart,
  cartItems,
  subtotal,
  tax,
  discount,
  total,
  orderType,
  setOrderType,
  selectedTable,
  changeQuantity,
  setCheckoutOpen,
}: POSProps) {
  const itemCount = cartItems.reduce((sum, item) => sum + cart[item.id], 0);
  const [cartOpen, setCartOpen] = useState(false);
  return (
    <div className="grid min-h-[calc(100vh-76px)] xl:grid-cols-[minmax(0,1fr)_390px]">
      <section className="min-w-0 p-4 pb-28 md:p-7 xl:pb-7">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8d7c73]" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search dishes…"
              className="h-11 rounded-xl border-[#ded8ce] bg-white pl-10 text-base shadow-sm"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {['Dine in', 'Takeaway', 'Delivery'].map((type) => (
              <Button
                key={type}
                onClick={() => setOrderType(type)}
                variant={orderType === type ? 'default' : 'outline'}
                className={
                  orderType === type
                    ? 'h-10 bg-[#6d2416] px-4 hover:bg-[#55180f]'
                    : 'h-10 bg-white px-4'
                }
              >
                {type}
              </Button>
            ))}
          </div>
        </div>
        <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
          {categoryNames.map((name) => (
            <button
              key={name}
              onClick={() => setCategory(name)}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-bold transition ${category === name ? 'border-[#6d2416] bg-[#6d2416] text-white' : 'border-[#ded8ce] bg-white text-[#6e5b51] hover:border-[#b49d91]'}`}
            >
              {name}
            </button>
          ))}
        </div>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="font-serif text-2xl font-bold">Our menu</h2>
            <p className="mt-1 text-sm text-[#7a6960]">
              {filtered.length} dishes available
            </p>
          </div>
          <span className="hidden rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-800 sm:block">
            Kitchen accepting orders
          </span>
        </div>
        {filtered.length ? (
          <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
            {filtered.map((item) => (
              <MenuCard
                key={item.id}
                item={item}
                onAdd={() => changeQuantity(item.id, 1)}
              />
            ))}
          </div>
        ) : (
          <div className="grid min-h-72 place-items-center rounded-2xl border border-dashed border-[#cfc4b9] bg-white/50 text-center">
            <div>
              <Search className="mx-auto mb-3 size-7 text-[#9d897e]" />
              <p className="font-serif text-xl font-bold">No dishes found</p>
              <p className="mt-1 text-sm text-[#7a6960]">
                Try another name or category.
              </p>
            </div>
          </div>
        )}
      </section>
      <aside className="sticky top-0 hidden h-[calc(100vh-76px)] border-l border-[#ded8ce] bg-[#faf8f4] p-6 xl:block">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.14em] text-[#9a6d5b]">
              Current bill
            </p>
            <h2 className="font-serif text-2xl font-bold">
              {orderType === 'Dine in' ? `Table ${selectedTable}` : orderType}
            </h2>
          </div>
          <Badge variant="secondary">{itemCount} items</Badge>
        </div>
        <div className="min-h-40 max-h-[calc(100vh-430px)] space-y-3 overflow-y-auto pr-1">
          {!cartItems.length && (
            <div className="grid min-h-52 place-items-center rounded-2xl border border-dashed border-[#d8cec5] text-center">
              <div>
                <ShoppingBag className="mx-auto mb-2 size-6 text-[#a99388]" />
                <p className="font-bold">The bill is empty</p>
                <p className="mt-1 text-sm text-[#8b776d]">
                  Add a dish to begin.
                </p>
              </div>
            </div>
          )}
          {cartItems.map((item) => (
            <CartRow
              key={item.id}
              item={item}
              quantity={cart[item.id]}
              onChange={changeQuantity}
            />
          ))}
        </div>
        <div className="mt-5 space-y-2 border-t border-dashed border-[#cfc4b9] pt-4 text-sm">
          <div className="flex justify-between text-[#78675e]">
            <span>Subtotal</span>
            <span>{rupees.format(subtotal)}</span>
          </div>
          <div className="flex justify-between text-[#78675e]">
            <span>GST (5%)</span>
            <span>{rupees.format(tax)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span>Discount</span>
              <span>−{rupees.format(discount)}</span>
            </div>
          )}
          <div className="flex justify-between pt-2 font-serif text-xl font-bold">
            <span>Total</span>
            <span>{rupees.format(total)}</span>
          </div>
        </div>
        <Button
          onClick={() => setCheckoutOpen(true)}
          disabled={!cartItems.length}
          className="h-13 w-full rounded-xl bg-[#6d2416] text-base font-bold hover:bg-[#55180f]"
        >
          <ReceiptText className="mr-1" />
          Review bill · {rupees.format(total)}
        </Button>
      </aside>
      <button
        onClick={() => setCartOpen(true)}
        disabled={!cartItems.length}
        className="fixed inset-x-3 bottom-20 z-30 flex h-16 items-center justify-between rounded-2xl bg-[#6d2416] px-5 font-bold text-white shadow-2xl disabled:opacity-60 xl:hidden"
      >
        <span className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-full bg-white/10">
            <ShoppingBag className="size-5" />
          </span>
          {itemCount ? `${itemCount} items · Open cart` : 'Cart is empty'}
        </span>
        <span>
          {rupees.format(total)} <ArrowRight className="ml-1 inline size-4" />
        </span>
      </button>
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[86vh] rounded-t-[26px] border-[#ded8ce] bg-[#faf8f4] p-0 xl:hidden"
        >
          <SheetHeader className="border-b border-[#ded8ce] bg-white px-5 py-4">
            <SheetTitle className="font-serif text-2xl font-bold">
              Current bill
            </SheetTitle>
            <SheetDescription>
              {orderType === 'Dine in' ? `Table ${selectedTable}` : orderType} ·{' '}
              {itemCount} items
            </SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-2">
            {cartItems.map((item) => (
              <CartRow
                key={item.id}
                item={item}
                quantity={cart[item.id]}
                onChange={changeQuantity}
              />
            ))}
          </div>
          <SheetFooter className="border-t border-[#ded8ce] bg-white px-5 py-4">
            <div className="mb-2 space-y-2 text-sm">
              <div className="flex justify-between text-[#78675e]">
                <span>Subtotal + GST</span>
                <span>{rupees.format(subtotal + tax)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount</span>
                  <span>−{rupees.format(discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-serif text-xl font-bold">
                <span>Total</span>
                <span>{rupees.format(total)}</span>
              </div>
            </div>
            <Button
              onClick={() => {
                setCartOpen(false);
                setCheckoutOpen(true);
              }}
              className="h-12 w-full rounded-xl bg-[#6d2416] text-base font-bold hover:bg-[#55180f]"
            >
              Review order <ArrowRight />
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function MenuCard({ item, onAdd }: { item: MenuItem; onAdd: () => void }) {
  return (
    <article className="group overflow-hidden rounded-[20px] border border-[#dfd9cf] bg-white shadow-[0_8px_30px_rgba(66,39,25,.06)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_38px_rgba(66,39,25,.11)]">
      <div className="relative h-32 overflow-hidden">
        <DishPhoto
          item={item}
          className="h-full w-full transition duration-500 group-hover:scale-105"
        />
        <span
          className={`absolute left-3 top-3 grid size-5 place-items-center border-2 bg-white ${item.veg ? 'border-emerald-600' : 'border-red-600'}`}
        >
          <span
            className={`size-2 rounded-full ${item.veg ? 'bg-emerald-600' : 'bg-red-600'}`}
          />
        </span>
        <span className="absolute bottom-3 right-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-[#6d2416] shadow-sm">
          {item.category}
        </span>
      </div>
      <div className="p-3">
        <h3 className="line-clamp-2 min-h-10 font-serif text-base font-bold leading-5">
          {item.name}
        </h3>
        <p className="mt-1 truncate text-[13px] leading-4 text-[#7a6960]">
          {item.note}
        </p>
        <div className="mt-3 flex items-center justify-between">
          <span className="font-bold">{rupees.format(item.price)}</span>
          <Button
            onClick={onAdd}
            size="sm"
            className="h-9 rounded-full bg-[#f6a622] px-4 text-[#48180f] hover:bg-[#e89a16]"
          >
            <Plus /> Add
          </Button>
        </div>
      </div>
    </article>
  );
}

function CartRow({
  item,
  quantity,
  onChange,
}: {
  item: MenuItem;
  quantity: number;
  onChange: (id: number, amount: number) => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[#e4ded5] bg-white p-3">
      <DishPhoto item={item} className="size-10 shrink-0 rounded-lg" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold">{item.name}</p>
        <p className="text-sm text-[#7a6960]">{rupees.format(item.price)}</p>
      </div>
      <div className="flex items-center gap-2 rounded-full bg-[#f4eee7] p-1">
        <button
          onClick={() => onChange(item.id, -1)}
          className="grid size-7 place-items-center rounded-full bg-white shadow-sm"
          aria-label={`Remove one ${item.name}`}
        >
          <Minus className="size-3" />
        </button>
        <span className="min-w-4 text-center text-sm font-bold">
          {quantity}
        </span>
        <button
          onClick={() => onChange(item.id, 1)}
          className="grid size-7 place-items-center rounded-full bg-[#6d2416] text-white"
          aria-label={`Add one ${item.name}`}
        >
          <Plus className="size-3" />
        </button>
      </div>
    </div>
  );
}

function KitchenView({
  orders,
  onAdvance,
}: {
  orders: OrderRecord[];
  onAdvance: (order: OrderRecord) => void;
}) {
  const columns = [
    { id: 'new', label: 'Accepted', color: 'bg-blue-500' },
    { id: 'preparing', label: 'Preparing', color: 'bg-amber-500' },
    { id: 'ready', label: 'Ready to serve', color: 'bg-emerald-500' },
    { id: 'served', label: 'Served', color: 'bg-violet-500' },
  ];
  return (
    <section className="p-4 pb-28 md:p-7 lg:pb-7">
      <div className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {columns.map((column) => (
          <div
            key={column.id}
            className="rounded-2xl border border-[#ded8ce] bg-white p-4"
          >
            <div className="flex items-center gap-2 text-sm font-bold">
              <span className={`size-2.5 rounded-full ${column.color}`} />
              {column.label}
            </div>
            <p className="mt-2 font-serif text-3xl font-bold">
              {orders.filter((order) => order.status === column.id).length}
            </p>
          </div>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {columns.map((column) => (
          <div key={column.id} className="rounded-[22px] bg-[#ece7df] p-3">
            <div className="mb-3 flex items-center justify-between px-1">
              <h2 className="font-serif text-lg font-bold">{column.label}</h2>
              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold">
                {orders.filter((order) => order.status === column.id).length}
              </span>
            </div>
            <div className="space-y-3">
              {orders
                .filter((order) => order.status === column.id)
                .map((order) => (
                  <Ticket key={order.id} order={order} onAdvance={onAdvance} />
                ))}
              {!orders.some((order) => order.status === column.id) && (
                <div className="grid min-h-40 place-items-center rounded-2xl border border-dashed border-[#cfc5bb] text-sm text-[#8c796f]">
                  No orders here
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Ticket({
  order,
  onAdvance,
}: {
  order: OrderRecord;
  onAdvance: (order: OrderRecord) => void;
}) {
  const isDineIn = order.orderType === 'Dine in';
  const serviceInstruction = isDineIn
    ? `Serve at table ${order.tableNumber || '—'}`
    : order.orderType === 'Delivery'
      ? 'Pack for delivery'
      : 'Pack for takeaway';
  const label =
    order.status === 'new'
      ? 'Start cooking'
      : order.status === 'preparing'
        ? 'Mark ready'
        : order.status === 'ready'
          ? isDineIn
            ? 'Mark served'
            : 'Mark handed over'
          : 'Close table order';
  const ServiceIcon = isDineIn
    ? UtensilsCrossed
    : order.orderType === 'Delivery'
      ? Truck
      : PackageCheck;
  return (
    <article className="rounded-2xl border border-[#ded8ce] bg-white p-4 shadow-[0_6px_20px_rgba(55,35,22,.06)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-serif text-lg font-bold">
            {order.tableNumber
              ? `Table ${order.tableNumber}`
              : order.customerName || order.orderType}
          </p>
          <p className="mt-0.5 text-xs font-bold text-[#8f796e]">
            {order.orderNumber}
            {order.customerName ? ` · ${order.customerName}` : ''}
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-[#f3eee8] px-2.5 py-1 text-xs font-bold">
          <Clock3 className="size-3" />
          {elapsed(order.createdAt)}
        </span>
      </div>
      <div
        className={`mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold ${isDineIn ? 'bg-blue-50 text-blue-800' : order.orderType === 'Delivery' ? 'bg-violet-50 text-violet-800' : 'bg-amber-50 text-amber-800'}`}
      >
        <ServiceIcon className="size-4" />
        {serviceInstruction}
      </div>
      {order.orderType === 'Delivery' && order.deliveryAddress && (
        <div className="mt-3 rounded-xl bg-[#f4efff] px-3 py-2 text-sm text-violet-900">
          <b className="block text-xs uppercase tracking-wide">Deliver to</b>
          <span>{order.deliveryAddress}</span>
          {order.latitude && order.longitude && (
            <a
              href={`https://www.google.com/maps?q=${order.latitude},${order.longitude}`}
              target="_blank"
              rel="noreferrer"
              className="mt-1 block font-bold underline"
            >
              Open detected location
            </a>
          )}
        </div>
      )}
      <div className="my-4 space-y-2 border-y border-dashed border-[#ddd3ca] py-3">
        {order.items?.length ? (
          order.items.map((item) => (
            <div
              key={`${order.id}-${item.menuItemId}`}
              className="flex gap-3 text-sm"
            >
              <span className="font-bold text-[#6d2416]">{item.quantity}×</span>
              <span>{item.name}</span>
            </div>
          ))
        ) : (
          <p className="text-sm text-[#7e6c62]">No item details found</p>
        )}
      </div>
      {order.notes && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
          <b className="block text-xs uppercase tracking-wide">Kitchen note</b>
          <span>{order.notes}</span>
        </div>
      )}
      <Button
        onClick={() => onAdvance(order)}
        variant={
          ['ready', 'served'].includes(order.status) ? 'default' : 'outline'
        }
        className={
          order.status === 'ready'
            ? 'h-10 w-full bg-emerald-700 hover:bg-emerald-800'
            : order.status === 'served'
              ? 'h-10 w-full bg-violet-700 hover:bg-violet-800'
              : 'h-10 w-full bg-white'
        }
      >
        {label}
        <ArrowRight className="ml-1" />
      </Button>
    </article>
  );
}

function TablesView({
  selectedTable,
  orders,
  bookings,
  onSelect,
  onCreateBooking,
  onUpdateBooking,
}: {
  selectedTable: string;
  orders: OrderRecord[];
  bookings: BookingRecord[];
  onSelect: (table: string) => void;
  onCreateBooking: (payload: BookingPayload) => Promise<BookingRecord>;
  onUpdateBooking: (
    booking: BookingRecord,
    status: BookingRecord['status'],
  ) => Promise<void>;
}) {
  const [bookingOpen, setBookingOpen] = useState(false);
  const [preferredTable, setPreferredTable] = useState('01');
  const tables = Array.from({ length: 16 }, (_, index) => {
    const number = String(index + 1).padStart(2, '0');
    const activeOrder = orders.find(
      (order) =>
        order.tableNumber === number &&
        ['new', 'preparing', 'ready', 'served'].includes(order.status),
    );
    const booking = bookings.find(
      (item) => item.tableNumber === number && item.status === 'booked',
    );
    return {
      number,
      activeOrder,
      booking,
      status: activeOrder ? 'seated' : booking ? 'reserved' : 'available',
    };
  });
  const counts = tables.reduce(
    (acc, table) => ({ ...acc, [table.status]: (acc[table.status] ?? 0) + 1 }),
    {} as Record<string, number>,
  );
  function openBooking(table = '01') {
    setPreferredTable(table);
    setBookingOpen(true);
  }
  return (
    <section className="p-4 pb-28 md:p-7 lg:pb-7">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-wrap gap-3 text-sm font-bold">
          <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-emerald-800">
            {counts.available ?? 0} available
          </span>
          <span className="rounded-full bg-[#f9e8df] px-3 py-1.5 text-[#8b321d]">
            {counts.seated ?? 0} seated
          </span>
          <span className="rounded-full bg-amber-100 px-3 py-1.5 text-amber-800">
            {counts.reserved ?? 0} booked
          </span>
        </div>
        <Button
          onClick={() => openBooking()}
          className="bg-[#6d2416] hover:bg-[#55180f]"
        >
          <CalendarDays /> Book a table
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {tables.map(({ number, status, activeOrder, booking }) => (
          <article
            key={number}
            className={`min-h-56 rounded-[24px] border p-5 transition ${selectedTable === number ? 'border-[#6d2416] ring-2 ring-[#6d2416]/15' : 'border-[#ded8ce]'} ${status === 'available' ? 'bg-white' : status === 'seated' ? 'bg-[#fff3ed]' : 'bg-[#fff9e7]'}`}
          >
            <div className="flex items-start justify-between">
              <div
                className={`grid size-12 place-items-center rounded-2xl ${status === 'available' ? 'bg-emerald-100 text-emerald-800' : status === 'seated' ? 'bg-[#6d2416] text-white' : 'bg-amber-200 text-amber-900'}`}
              >
                <UtensilsCrossed className="size-5" />
              </div>
              <Badge variant="outline" className="capitalize">
                {status === 'reserved' ? 'booked' : status}
              </Badge>
            </div>
            <p className="mt-4 font-serif text-2xl font-bold">Table {number}</p>
            {activeOrder ? (
              <p className="mt-1 text-sm text-[#7c6960]">
                {activeOrder.orderNumber} · {rupees.format(activeOrder.total)}
              </p>
            ) : booking ? (
              <div className="mt-1 text-sm text-[#7c6960]">
                <p className="font-bold text-[#5d3424]">
                  {booking.customerName} · {booking.guests} guests
                </p>
                <p>
                  {booking.bookingDate} at {booking.bookingTime}
                </p>
              </div>
            ) : (
              <p className="mt-1 text-sm text-[#7c6960]">
                Ready for a new booking or order
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {status === 'available' && (
                <>
                  <Button
                    onClick={() => openBooking(number)}
                    variant="outline"
                    size="sm"
                  >
                    <CalendarDays /> Book
                  </Button>
                  <Button
                    onClick={() => onSelect(number)}
                    size="sm"
                    className="bg-[#6d2416] hover:bg-[#55180f]"
                  >
                    Start order
                  </Button>
                </>
              )}
              {status === 'reserved' && booking && (
                <>
                  <Button
                    onClick={() => onSelect(number)}
                    size="sm"
                    className="bg-[#6d2416] hover:bg-[#55180f]"
                  >
                    Seat & order
                  </Button>
                  <Button
                    onClick={() => onUpdateBooking(booking, 'completed')}
                    variant="outline"
                    size="sm"
                  >
                    <Check /> Complete
                  </Button>
                  <Button
                    onClick={() => onUpdateBooking(booking, 'cancelled')}
                    variant="ghost"
                    size="sm"
                    className="text-red-700"
                  >
                    Cancel
                  </Button>
                  <a
                    href={`https://wa.me/${booking.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello ${booking.customerName}, your Tripti table booking ${booking.bookingNumber} is confirmed for Table ${booking.tableNumber} on ${booking.bookingDate} at ${booking.bookingTime}.`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-bold text-emerald-800 hover:bg-emerald-100"
                  >
                    <MessageCircle className="size-3.5" /> WhatsApp
                  </a>
                </>
              )}
              {status === 'seated' && (
                <Button
                  onClick={() => onSelect(number)}
                  size="sm"
                  className="bg-[#6d2416] hover:bg-[#55180f]"
                >
                  Open POS
                </Button>
              )}
            </div>
          </article>
        ))}
      </div>
      <StaffBookingDialog
        open={bookingOpen}
        onOpenChange={setBookingOpen}
        preferredTable={preferredTable}
        onCreate={onCreateBooking}
      />
    </section>
  );
}

function StaffBookingDialog({
  open,
  onOpenChange,
  preferredTable,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preferredTable: string;
  onCreate: (payload: BookingPayload) => Promise<BookingRecord>;
}) {
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [guests, setGuests] = useState(2);
  const [bookingDate, setBookingDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [bookingTime, setBookingTime] = useState('19:30');
  const [tableNumber, setTableNumber] = useState(preferredTable);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => setTableNumber(preferredTable), [preferredTable]);
  async function submit() {
    setError('');
    setSaving(true);
    try {
      await onCreate({
        customerName,
        phone,
        guests,
        bookingDate,
        bookingTime,
        tableNumber: tableNumber.padStart(2, '0'),
        notes,
      });
      setCustomerName('');
      setPhone('');
      setNotes('');
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Booking could not be saved',
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-[22px] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl font-bold">
            Book a table
          </DialogTitle>
          <DialogDescription>
            Create a staff booking. The table will show as booked until it is
            completed or cancelled.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm font-bold sm:col-span-2">
            Customer name
            <Input
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              placeholder="Guest name"
            />
          </label>
          <label className="space-y-2 text-sm font-bold">
            Phone
            <Input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Mobile number"
            />
          </label>
          <label className="space-y-2 text-sm font-bold">
            Guests
            <Input
              type="number"
              min="1"
              max="20"
              value={guests}
              onChange={(event) => setGuests(Number(event.target.value))}
            />
          </label>
          <label className="space-y-2 text-sm font-bold">
            Date
            <Input
              type="date"
              min={new Date().toISOString().slice(0, 10)}
              value={bookingDate}
              onChange={(event) => setBookingDate(event.target.value)}
            />
          </label>
          <label className="space-y-2 text-sm font-bold">
            Time
            <Input
              type="time"
              value={bookingTime}
              onChange={(event) => setBookingTime(event.target.value)}
            />
          </label>
          <label className="space-y-2 text-sm font-bold sm:col-span-2">
            Table number
            <Input
              value={tableNumber}
              onChange={(event) =>
                setTableNumber(
                  event.target.value.replace(/\D/g, '').slice(0, 2),
                )
              }
              placeholder="01"
            />
          </label>
          <label className="space-y-2 text-sm font-bold sm:col-span-2">
            Booking notes{' '}
            <span className="font-normal text-[#8b776d]">(optional)</span>
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Birthday setup, high chair…"
            />
          </label>
          {error && (
            <p className="text-sm font-bold text-red-700 sm:col-span-2">
              {error}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button
            onClick={submit}
            disabled={
              saving ||
              !customerName.trim() ||
              !phone.trim() ||
              !bookingDate ||
              !bookingTime ||
              !tableNumber
            }
            className="bg-[#6d2416] hover:bg-[#55180f]"
          >
            {saving ? 'Saving…' : 'Confirm booking'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type OrdersViewProps = {
  orders: OrderRecord[];
  catalog: MenuItem[];
  onUpdate: (order: OrderRecord) => Promise<boolean>;
  onDelete: (order: OrderRecord) => Promise<boolean>;
  onDeleteMany: (orders: OrderRecord[]) => Promise<boolean>;
};

function OrdersView({
  orders,
  catalog,
  onUpdate,
  onDelete,
  onDeleteMany,
}: OrdersViewProps) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<OrderRecord | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteSelectedOpen, setDeleteSelectedOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const shown = orders.filter((order) =>
    `${order.orderNumber} ${order.customerName ?? ''} ${order.tableNumber ?? ''}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const shownIds = shown.map((order) => order.id);
  const allShownSelected =
    shownIds.length > 0 && shownIds.every((id) => selectedIds.has(id));
  const selectedOrders = orders.filter((order) => selectedIds.has(order.id));
  const sales = orders
    .filter((order) => order.status !== 'cancelled')
    .reduce((sum, order) => sum + order.total, 0);
  const pending = orders.filter((order) => order.paymentStatus === 'pending');

  function toggleOrder(id: string, checked: boolean) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function toggleAllShown(checked: boolean) {
    setSelectedIds((current) => {
      const next = new Set(current);
      for (const id of shownIds) {
        if (checked) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }

  async function removeSelected() {
    if (!selectedOrders.length) return;
    setDeleting(true);
    const removed = await onDeleteMany(selectedOrders);
    setDeleting(false);
    if (removed) {
      setSelectedIds(new Set());
      setDeleteSelectedOpen(false);
    }
  }

  return (
    <section className="p-4 pb-28 md:p-7 lg:pb-7">
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <MetricCard
          icon={ReceiptText}
          label="Orders"
          value={String(orders.length)}
          note={`${orders.filter((order) => ['new', 'preparing', 'ready'].includes(order.status)).length} active now`}
        />
        <MetricCard
          icon={CircleDollarSign}
          label="Net sales"
          value={rupees.format(sales)}
          note={
            orders.length
              ? `${rupees.format(Math.round(sales / orders.length))} average bill`
              : 'No orders yet'
          }
        />
        <MetricCard
          icon={WalletCards}
          label="Pending bills"
          value={rupees.format(
            pending.reduce((sum, order) => sum + order.total, 0),
          )}
          note={`${pending.length} awaiting payment`}
        />
      </div>
      <div className="overflow-hidden rounded-[22px] border border-[#ded8ce] bg-white p-4 shadow-sm md:p-5">
        <div className="mb-4 flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
          <div>
            <h2 className="font-serif text-xl font-bold">Order register</h2>
            <p className="text-sm text-[#7d6a60]">
              Select one or many orders, then view, print or delete them.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            {selectedOrders.length > 0 && (
              <Button
                onClick={() => setDeleteSelectedOpen(true)}
                variant="outline"
                className="border-red-200 text-red-700 hover:bg-red-50"
              >
                <Trash2 /> Delete selected ({selectedOrders.length})
              </Button>
            )}
            <div className="relative sm:w-72">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#907d73]" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search order, guest or table"
                className="h-10 pl-9"
              />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={allShownSelected}
                    onCheckedChange={(checked) =>
                      toggleAllShown(checked === true)
                    }
                    aria-label="Select all visible orders"
                  />
                </TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Guest / table</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shown.map((order) => (
                <TableRow
                  key={order.id}
                  data-state={
                    selectedIds.has(order.id) ? 'selected' : undefined
                  }
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(order.id)}
                      onCheckedChange={(checked) =>
                        toggleOrder(order.id, checked === true)
                      }
                      aria-label={`Select ${order.orderNumber}`}
                    />
                  </TableCell>
                  <TableCell>
                    <p className="font-bold">{order.orderNumber}</p>
                    <p className="text-xs text-[#8b776d]">
                      {new Date(order.createdAt).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </TableCell>
                  <TableCell>
                    {order.tableNumber
                      ? `Table ${order.tableNumber}`
                      : order.customerName || 'Walk-in'}
                  </TableCell>
                  <TableCell>{order.orderType}</TableCell>
                  <TableCell>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${statusClass(order.status)}`}
                    >
                      {order.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        order.paymentStatus === 'paid'
                          ? 'font-bold text-emerald-700'
                          : 'font-bold text-amber-700'
                      }
                    >
                      {order.paymentStatus === 'paid'
                        ? order.paymentMethod || 'Paid'
                        : 'Pending'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {rupees.format(order.total)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        onClick={() => setSelected(order)}
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`View ${order.orderNumber}`}
                      >
                        <Eye />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Print ${order.orderNumber}`}
                      >
                        <Printer />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      <OrderDetailsDialog
        order={selected}
        catalog={catalog}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        onUpdate={async (updated) => {
          const saved = await onUpdate(updated);
          if (saved) setSelected(updated);
          return saved;
        }}
        onDelete={async (deletedOrder) => {
          const deleted = await onDelete(deletedOrder);
          if (deleted) setSelected(null);
          return deleted;
        }}
      />
      <AlertDialog
        open={deleteSelectedOpen}
        onOpenChange={setDeleteSelectedOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selectedOrders.length} selected order
              {selectedOrders.length === 1 ? '' : 's'}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This removes the selected orders and all their item details. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>
              Keep orders
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={removeSelected}
              disabled={deleting}
              className="bg-red-700 hover:bg-red-800"
            >
              <Trash2 /> {deleting ? 'Deleting…' : 'Delete selected'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

function OrderDetailsDialog({
  order,
  catalog,
  onOpenChange,
  onUpdate,
  onDelete,
}: {
  order: OrderRecord | null;
  catalog: MenuItem[];
  onOpenChange: (open: boolean) => void;
  onUpdate: (order: OrderRecord) => Promise<boolean>;
  onDelete: (order: OrderRecord) => Promise<boolean>;
}) {
  const [draft, setDraft] = useState<OrderRecord | null>(order);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [addItemId, setAddItemId] = useState(
    String(catalog[0]?.id ?? menu[0].id),
  );
  useEffect(() => {
    setDraft(
      order
        ? { ...order, items: order.items?.map((item) => ({ ...item })) }
        : null,
    );
    setEditing(false);
  }, [order]);
  if (!order || !draft) return null;
  const editItems = draft.items ?? [];
  function changeItem(menuItemId: number, amount: number) {
    setDraft((current) =>
      current
        ? {
            ...current,
            items: (current.items ?? [])
              .map((item) =>
                item.menuItemId === menuItemId
                  ? { ...item, quantity: Math.max(0, item.quantity + amount) }
                  : item,
              )
              .filter((item) => item.quantity > 0),
          }
        : current,
    );
  }
  function addDish() {
    const dish = catalog.find((item) => item.id === Number(addItemId));
    if (!dish) return;
    setDraft((current) => {
      if (!current) return current;
      const items = current.items ?? [];
      const exists = items.some((item) => item.menuItemId === dish.id);
      return {
        ...current,
        items: exists
          ? items.map((item) =>
              item.menuItemId === dish.id
                ? { ...item, quantity: item.quantity + 1 }
                : item,
            )
          : [
              ...items,
              {
                menuItemId: dish.id,
                name: dish.name,
                quantity: 1,
                unitPrice: dish.price,
              },
            ],
      };
    });
  }
  async function save() {
    if (!draft) return;
    const currentDraft = draft;
    setSaving(true);
    const subtotal = editItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );
    const tax = Math.round(subtotal * 0.05);
    const discount = Math.max(0, Math.min(currentDraft.discount, subtotal));
    const updated: OrderRecord = {
      ...currentDraft,
      subtotal,
      tax,
      discount,
      total: subtotal + tax - discount,
    };
    if (await onUpdate(updated)) {
      setDraft(updated);
      setEditing(false);
    }
    setSaving(false);
  }
  return (
    <Dialog open={Boolean(order)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[94vh] overflow-y-auto rounded-[22px] sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4 pr-8">
            <div>
              <DialogTitle className="font-serif text-2xl font-bold">
                {draft.orderNumber}
              </DialogTitle>
              <DialogDescription>
                {new Date(draft.createdAt).toLocaleString('en-IN')} ·{' '}
                {draft.orderType}
              </DialogDescription>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${statusClass(draft.status)}`}
            >
              {draft.status}
            </span>
          </div>
        </DialogHeader>
        {editing ? (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <EditSelect
                label="Order type"
                value={draft.orderType}
                options={['Dine in', 'Takeaway', 'Delivery']}
                onChange={(orderType) =>
                  setDraft({
                    ...draft,
                    orderType,
                    tableNumber:
                      orderType === 'Dine in' ? draft.tableNumber : null,
                  })
                }
              />
              <EditSelect
                label="Order status"
                value={draft.status}
                options={[
                  'new',
                  'preparing',
                  'ready',
                  'served',
                  'completed',
                  'cancelled',
                ]}
                onChange={(status) => setDraft({ ...draft, status })}
              />
              {draft.orderType === 'Dine in' && (
                <label className="space-y-2 text-sm font-bold">
                  Table number
                  <Input
                    value={draft.tableNumber ?? ''}
                    onChange={(event) =>
                      setDraft({ ...draft, tableNumber: event.target.value })
                    }
                  />
                </label>
              )}
              <label className="space-y-2 text-sm font-bold">
                Customer name
                <Input
                  value={draft.customerName ?? ''}
                  onChange={(event) =>
                    setDraft({ ...draft, customerName: event.target.value })
                  }
                />
              </label>
              <label className="space-y-2 text-sm font-bold">
                Customer phone
                <Input
                  value={draft.customerPhone ?? ''}
                  onChange={(event) =>
                    setDraft({ ...draft, customerPhone: event.target.value })
                  }
                />
              </label>
              {draft.orderType === 'Delivery' && (
                <label className="space-y-2 text-sm font-bold sm:col-span-2">
                  Delivery address
                  <Textarea
                    value={draft.deliveryAddress ?? ''}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        deliveryAddress: event.target.value,
                      })
                    }
                  />
                </label>
              )}
              <EditSelect
                label="Payment status"
                value={draft.paymentStatus}
                options={['pending', 'paid', 'refunded']}
                onChange={(paymentStatus) =>
                  setDraft({ ...draft, paymentStatus })
                }
              />
              <EditSelect
                label="Payment method"
                value={draft.paymentMethod ?? 'Pay later'}
                options={['Pay later', 'Cash', 'UPI', 'Card']}
                onChange={(paymentMethod) =>
                  setDraft({
                    ...draft,
                    paymentMethod:
                      paymentMethod === 'Pay later' ? null : paymentMethod,
                  })
                }
              />
              <label className="space-y-2 text-sm font-bold">
                Discount (₹)
                <Input
                  type="number"
                  min="0"
                  value={draft.discount}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      discount: Math.max(0, Number(event.target.value)),
                    })
                  }
                />
              </label>
              <label className="space-y-2 text-sm font-bold sm:col-span-2">
                Kitchen notes
                <Textarea
                  value={draft.notes ?? ''}
                  onChange={(event) =>
                    setDraft({ ...draft, notes: event.target.value })
                  }
                />
              </label>
            </div>
            <div>
              <p className="mb-3 text-sm font-bold">Order items</p>
              <div className="mb-3 flex gap-2">
                <Select
                  value={addItemId}
                  onValueChange={(value) =>
                    value && setAddItemId(String(value))
                  }
                >
                  <SelectTrigger className="h-10 min-w-0 flex-1 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {catalog.map((dish) => (
                      <SelectItem key={dish.id} value={String(dish.id)}>
                        {dish.name} · {rupees.format(dish.price)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={addDish} variant="outline">
                  <Plus /> Add dish
                </Button>
              </div>
              <div className="space-y-2">
                {editItems.map((item) => (
                  <div
                    key={item.menuItemId}
                    className="flex items-center gap-3 rounded-xl border border-[#e3d9cf] p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold">{item.name}</p>
                      <p className="text-sm text-[#7d6a60]">
                        {rupees.format(item.unitPrice)} each
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => changeItem(item.menuItemId, -1)}
                        variant="outline"
                        size="icon-sm"
                      >
                        <Minus />
                      </Button>
                      <b>{item.quantity}</b>
                      <Button
                        onClick={() => changeItem(item.menuItemId, 1)}
                        variant="outline"
                        size="icon-sm"
                      >
                        <Plus />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid gap-3 rounded-2xl bg-[#f6f1eb] p-4 text-sm sm:grid-cols-2">
              <Detail label="Guest" value={draft.customerName || 'Walk-in'} />
              <Detail
                label="Phone"
                value={draft.customerPhone || 'Not provided'}
              />
              <Detail
                label="Table / channel"
                value={
                  draft.tableNumber
                    ? `Table ${draft.tableNumber}`
                    : draft.orderType
                }
              />
              <Detail
                label="Payment"
                value={
                  draft.paymentStatus === 'paid'
                    ? `${draft.paymentMethod || 'Paid'} · paid`
                    : draft.paymentStatus
                }
              />
              <Detail label="Order status" value={draft.status} />
              {draft.deliveryAddress && (
                <Detail
                  label="Delivery address"
                  value={draft.deliveryAddress}
                />
              )}
            </div>
            <div>
              <h3 className="mb-3 font-serif text-lg font-bold">Items</h3>
              <div className="space-y-2">
                {editItems.map((item) => (
                  <div
                    key={item.menuItemId}
                    className="flex justify-between rounded-xl border border-[#e3d9cf] px-3 py-2 text-sm"
                  >
                    <span>
                      <b className="mr-2 text-[#6d2416]">{item.quantity}×</b>
                      {item.name}
                    </span>
                    <b>{rupees.format(item.quantity * item.unitPrice)}</b>
                  </div>
                ))}
              </div>
            </div>
            {draft.notes && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm">
                <b>Kitchen note:</b> {draft.notes}
              </div>
            )}
            <div className="space-y-2 border-t border-dashed border-[#d7c9be] pt-4 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{rupees.format(draft.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>GST</span>
                <span>{rupees.format(draft.tax)}</span>
              </div>
              {draft.discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount</span>
                  <span>−{rupees.format(draft.discount)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 font-serif text-xl font-bold">
                <span>Total</span>
                <span>{rupees.format(draft.total)}</span>
              </div>
            </div>
          </div>
        )}
        <DialogFooter className="flex-row justify-between sm:justify-between">
          <Button
            onClick={() => setDeleteOpen(true)}
            variant="outline"
            className="border-red-200 text-red-700 hover:bg-red-50"
          >
            <Trash2 /> Delete
          </Button>
          <div className="flex gap-2">
            {editing ? (
              <>
                <Button
                  onClick={() => {
                    setDraft({
                      ...order,
                      items: order.items?.map((item) => ({ ...item })),
                    });
                    setEditing(false);
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={save}
                  disabled={saving || !editItems.length}
                  className="bg-[#6d2416] hover:bg-[#55180f]"
                >
                  {saving ? 'Saving…' : 'Save changes'}
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setEditing(true)}
                className="bg-[#6d2416] hover:bg-[#55180f]"
              >
                <Pencil /> Edit order
              </Button>
            )}
          </div>
        </DialogFooter>
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {draft.orderNumber}?</AlertDialogTitle>
              <AlertDialogDescription>
                This removes the order and all its item details. This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep order</AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  if (await onDelete(order)) setDeleteOpen(false);
                }}
                className="bg-red-700 hover:bg-red-800"
              >
                <Trash2 /> Delete order
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}

function EditSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-2 text-sm font-bold">
      {label}
      <Select
        value={value}
        onValueChange={(next) => next && onChange(String(next))}
      >
        <SelectTrigger className="h-9 w-full bg-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              <span className="capitalize">{option}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-[#947d71]">
        {label}
      </p>
      <p className="mt-1 font-bold capitalize">{value}</p>
    </div>
  );
}

function ContentManager({
  items,
  settings,
  onItemsChange,
  onSettingsChange,
}: {
  items: MenuItem[];
  settings: CustomerSettings;
  onItemsChange: (items: MenuItem[]) => void;
  onSettingsChange: (settings: CustomerSettings) => void;
}) {
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<MenuItem | null>(null);
  const [draftSettings, setDraftSettings] = useState(settings);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsNotice, setSettingsNotice] = useState('');
  useEffect(() => setDraftSettings(settings), [settings]);

  async function saveItem(item: MenuItem) {
    const response = await fetch('/api/menu', {
      method: creating ? 'POST' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    const data = (await response.json()) as { item?: MenuItem; error?: string };
    if (!response.ok || !data.item)
      throw new Error(data.error || 'Menu item could not be saved');
    onItemsChange(
      creating
        ? [...items, data.item]
        : items.map((entry) =>
            entry.id === data.item!.id ? data.item! : entry,
          ),
    );
    setEditing(null);
    setCreating(false);
  }

  async function removeItem(item: MenuItem) {
    const response = await fetch('/api/menu', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    if (response.ok)
      onItemsChange(
        items.map((entry) =>
          entry.id === item.id ? { ...entry, active: false } : entry,
        ),
      );
    setDeleteCandidate(null);
  }

  async function restoreItem(item: MenuItem) {
    const restored = { ...item, active: true };
    const response = await fetch('/api/menu', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(restored),
    });
    if (response.ok)
      onItemsChange(
        items.map((entry) => (entry.id === item.id ? restored : entry)),
      );
  }

  async function saveCustomerSettings() {
    setSavingSettings(true);
    setSettingsNotice('');
    const response = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draftSettings),
    });
    const data = (await response.json()) as {
      settings?: CustomerSettings;
      error?: string;
    };
    if (response.ok && data.settings) {
      onSettingsChange(data.settings);
      setSettingsNotice('Customer website updated');
    } else setSettingsNotice(data.error || 'Settings could not be saved');
    setSavingSettings(false);
  }

  async function uploadBanner(file: File) {
    const form = new FormData();
    form.append('file', file);
    form.append('folder', 'banners');
    const response = await fetch('/api/media', { method: 'POST', body: form });
    const data = (await response.json()) as { url?: string; error?: string };
    if (!response.ok || !data.url) {
      setSettingsNotice(data.error || 'Banner upload failed');
      return;
    }
    setDraftSettings((current) => ({ ...current, bannerImageUrl: data.url! }));
  }

  return (
    <section className="p-4 pb-28 md:p-7 lg:pb-7">
      <div className="grid gap-6 2xl:grid-cols-[1.2fr_.8fr]">
        <div className="rounded-[24px] border border-[#ded8ce] bg-white p-5">
          <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-serif text-2xl font-bold">Menu manager</h2>
              <p className="text-sm text-[#7d6a60]">
                Add dishes, change prices and photos, or hide items from
                customers.
              </p>
            </div>
            <Button
              onClick={() => {
                setCreating(true);
                setEditing({
                  id: 0,
                  name: '',
                  note: '',
                  price: 0,
                  category: 'Rice & Paratha',
                  veg: true,
                  photo: 0,
                  photoUrl: null,
                  badge: '',
                  active: true,
                });
              }}
              className="bg-[#6d2416] hover:bg-[#55180f]"
            >
              <Plus /> Add menu item
            </Button>
          </div>
          <div className="space-y-3">
            {items.map((item) => (
              <article
                key={item.id}
                className={`flex items-center gap-3 rounded-2xl border p-3 ${item.active === false ? 'border-[#e5ded7] bg-[#f5f1ed] opacity-70' : 'border-[#e3dbd3] bg-white'}`}
              >
                <DishPhoto
                  item={item}
                  className="size-16 shrink-0 rounded-xl"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-bold">{item.name}</p>
                    {item.active === false && (
                      <Badge variant="outline">Hidden</Badge>
                    )}
                  </div>
                  <p className="mt-1 truncate text-sm text-[#7d6a60]">
                    {item.category} · {rupees.format(item.price)}
                  </p>
                </div>
                <div className="flex gap-1">
                  {item.active === false ? (
                    <Button
                      onClick={() => restoreItem(item)}
                      variant="outline"
                      size="sm"
                    >
                      Restore
                    </Button>
                  ) : (
                    <>
                      <Button
                        onClick={() => {
                          setCreating(false);
                          setEditing(item);
                        }}
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Edit ${item.name}`}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        onClick={() => setDeleteCandidate(item)}
                        variant="ghost"
                        size="icon-sm"
                        className="text-red-700"
                        aria-label={`Hide ${item.name}`}
                      >
                        <Trash2 />
                      </Button>
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
        <div className="h-fit space-y-6">
          <div className="rounded-[24px] border border-[#ded8ce] bg-white p-5">
            <div className="flex items-start gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-[#fff0d7] text-[#8a420d]">
                <Megaphone />
              </span>
              <div>
                <h2 className="font-serif text-xl font-bold">Offer banner</h2>
                <p className="text-sm text-[#7d6a60]">
                  Show a promotion above the customer menu.
                </p>
              </div>
              <Switch
                checked={draftSettings.offerEnabled}
                onCheckedChange={(checked) =>
                  setDraftSettings({ ...draftSettings, offerEnabled: checked })
                }
                className="ml-auto"
              />
            </div>
            <div className="mt-5 space-y-4">
              <label className="block space-y-2 text-sm font-bold">
                Offer title
                <Input
                  value={draftSettings.offerTitle}
                  onChange={(event) =>
                    setDraftSettings({
                      ...draftSettings,
                      offerTitle: event.target.value,
                    })
                  }
                />
              </label>
              <label className="block space-y-2 text-sm font-bold">
                Offer details
                <Textarea
                  value={draftSettings.offerText}
                  onChange={(event) =>
                    setDraftSettings({
                      ...draftSettings,
                      offerText: event.target.value,
                    })
                  }
                />
              </label>
              <label className="block space-y-2 text-sm font-bold">
                Banner photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void uploadBanner(file);
                  }}
                  className="block w-full rounded-xl border border-[#ded8ce] p-2 text-sm"
                />
              </label>
              {draftSettings.bannerImageUrl && (
                <div
                  className="h-28 rounded-2xl bg-cover bg-center"
                  style={{
                    backgroundImage: `url('${draftSettings.bannerImageUrl}')`,
                  }}
                />
              )}
            </div>
          </div>
          <div className="rounded-[24px] border border-[#ded8ce] bg-white p-5">
            <div className="flex items-start gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-[#f6eee8] text-[#6d2416]">
                <LinkIcon />
              </span>
              <div>
                <h2 className="font-serif text-xl font-bold">
                  Social & location
                </h2>
                <p className="text-sm text-[#7d6a60]">
                  Links appear in the customer website footer.
                </p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              <SettingsInput
                label="Instagram URL"
                value={draftSettings.instagramUrl}
                onChange={(value) =>
                  setDraftSettings({ ...draftSettings, instagramUrl: value })
                }
              />
              <SettingsInput
                label="Facebook URL"
                value={draftSettings.facebookUrl}
                onChange={(value) =>
                  setDraftSettings({ ...draftSettings, facebookUrl: value })
                }
              />
              <SettingsInput
                label="YouTube URL"
                value={draftSettings.youtubeUrl}
                onChange={(value) =>
                  setDraftSettings({ ...draftSettings, youtubeUrl: value })
                }
              />
              <SettingsInput
                label="WhatsApp number"
                value={draftSettings.whatsappNumber}
                onChange={(value) =>
                  setDraftSettings({ ...draftSettings, whatsappNumber: value })
                }
              />
              <SettingsInput
                label="Restaurant address"
                value={draftSettings.restaurantAddress}
                onChange={(value) =>
                  setDraftSettings({
                    ...draftSettings,
                    restaurantAddress: value,
                  })
                }
              />
              <SettingsInput
                label="Google Maps URL"
                value={draftSettings.googleMapsUrl}
                onChange={(value) =>
                  setDraftSettings({ ...draftSettings, googleMapsUrl: value })
                }
              />
            </div>
            <Button
              onClick={saveCustomerSettings}
              disabled={savingSettings}
              className="mt-5 w-full bg-[#6d2416] hover:bg-[#55180f]"
            >
              {savingSettings ? 'Saving…' : 'Save customer website'}
            </Button>
            {settingsNotice && (
              <p className="mt-3 text-center text-sm font-bold text-[#6d2416]">
                {settingsNotice}
              </p>
            )}
          </div>
        </div>
      </div>
      <MenuItemDialog
        item={editing}
        onOpenChange={(open) => {
          if (!open) {
            setEditing(null);
            setCreating(false);
          }
        }}
        onSave={saveItem}
      />
      <AlertDialog
        open={Boolean(deleteCandidate)}
        onOpenChange={(open) => {
          if (!open) setDeleteCandidate(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hide {deleteCandidate?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This dish will disappear from the customer menu and POS. You can
              restore it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep item</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteCandidate) void removeItem(deleteCandidate);
              }}
              className="bg-red-700 hover:bg-red-800"
            >
              Hide item
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

function SettingsInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block space-y-2 text-sm font-bold">
      {label}
      <Input value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function MenuItemDialog({
  item,
  onOpenChange,
  onSave,
}: {
  item: MenuItem | null;
  onOpenChange: (open: boolean) => void;
  onSave: (item: MenuItem) => Promise<void>;
}) {
  const [draft, setDraft] = useState<MenuItem | null>(item);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  useEffect(() => {
    setDraft(item ? { ...item } : null);
    setError('');
  }, [item]);
  if (!draft) return null;
  async function uploadPhoto(file: File) {
    setUploading(true);
    setError('');
    const form = new FormData();
    form.append('file', file);
    form.append('folder', 'menu');
    const response = await fetch('/api/media', { method: 'POST', body: form });
    const data = (await response.json()) as { url?: string; error?: string };
    if (!response.ok || !data.url)
      setError(data.error || 'Photo upload failed');
    else
      setDraft((current) =>
        current ? { ...current, photoUrl: data.url } : current,
      );
    setUploading(false);
  }
  async function submit() {
    if (!draft) return;
    const currentDraft = draft;
    setSaving(true);
    setError('');
    try {
      await onSave(currentDraft);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Menu item could not be saved',
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <Dialog open={Boolean(item)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-[22px] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl font-bold">
            {draft.id ? 'Edit menu item' : 'Add menu item'}
          </DialogTitle>
          <DialogDescription>
            Changes appear in both the staff POS and customer menu.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm font-bold sm:col-span-2">
            Dish name
            <Input
              value={draft.name}
              onChange={(event) =>
                setDraft({ ...draft, name: event.target.value })
              }
            />
          </label>
          <label className="space-y-2 text-sm font-bold sm:col-span-2">
            Description
            <Textarea
              value={draft.note}
              onChange={(event) =>
                setDraft({ ...draft, note: event.target.value })
              }
            />
          </label>
          <label className="space-y-2 text-sm font-bold">
            Price (₹)
            <Input
              type="number"
              min="1"
              value={draft.price}
              onChange={(event) =>
                setDraft({ ...draft, price: Number(event.target.value) })
              }
            />
          </label>
          <label className="space-y-2 text-sm font-bold">
            Category
            <Input
              value={draft.category}
              onChange={(event) =>
                setDraft({ ...draft, category: event.target.value })
              }
            />
          </label>
          <label className="space-y-2 text-sm font-bold sm:col-span-2">
            Badge <span className="font-normal text-[#8b776d]">(optional)</span>
            <Input
              value={draft.badge ?? ''}
              onChange={(event) =>
                setDraft({ ...draft, badge: event.target.value })
              }
              placeholder="Bestseller, New, Special…"
            />
          </label>
          <div className="flex items-center justify-between rounded-xl border border-[#ded8ce] p-3 text-sm font-bold">
            <span>Vegetarian</span>
            <Switch
              checked={draft.veg}
              onCheckedChange={(checked) =>
                setDraft({ ...draft, veg: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-[#ded8ce] p-3 text-sm font-bold">
            <span>Visible on menu</span>
            <Switch
              checked={draft.active !== false}
              onCheckedChange={(checked) =>
                setDraft({ ...draft, active: checked })
              }
            />
          </div>
          <label className="space-y-2 text-sm font-bold sm:col-span-2">
            Dish photo
            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void uploadPhoto(file);
              }}
              className="block w-full rounded-xl border border-[#ded8ce] p-2 text-sm"
            />
          </label>
          {draft.photoUrl && (
            <div className="sm:col-span-2">
              <DishPhoto item={draft} className="h-40 w-full rounded-2xl" />
            </div>
          )}
          {uploading && (
            <p className="text-sm font-bold text-[#6d2416] sm:col-span-2">
              Uploading photo…
            </p>
          )}
          {error && (
            <p className="text-sm font-bold text-red-700 sm:col-span-2">
              {error}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button
            onClick={submit}
            disabled={
              saving ||
              uploading ||
              !draft.name.trim() ||
              !draft.note.trim() ||
              draft.price < 1
            }
            className="bg-[#6d2416] hover:bg-[#55180f]"
          >
            {saving ? 'Saving…' : 'Save menu item'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InventoryView({
  stock,
  onAdjust,
  onAdd,
}: {
  stock: StockItem[];
  onAdjust: (item: StockItem, amount: number) => void;
  onAdd: (item: Omit<StockItem, 'id'>) => Promise<void>;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const lowCount = stock.filter(
    (item) => item.quantity <= item.reorderAt,
  ).length;
  return (
    <section className="p-4 pb-28 md:p-7 lg:pb-7">
      <div className="mb-5 flex flex-col justify-between gap-3 rounded-[22px] bg-[#48180f] p-5 text-white sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <span className="grid size-12 place-items-center rounded-2xl bg-[#f6a622] text-[#48180f]">
            <TriangleAlert />
          </span>
          <div>
            <p className="font-serif text-xl font-bold">
              {lowCount} items need attention
            </p>
            <p className="text-sm text-orange-50/65">
              Update received stock as it reaches the kitchen.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setAddOpen(true)}
            className="bg-[#f6a622] text-[#48180f] hover:bg-[#ffbd45]"
          >
            <Plus /> Add item
          </Button>
          <Button className="bg-white text-[#48180f] hover:bg-orange-50">
            <ClipboardList /> Purchase list
          </Button>
        </div>
      </div>
      <div className="rounded-[22px] border border-[#ded8ce] bg-white p-4 md:p-5">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2 className="font-serif text-xl font-bold">Ingredient stock</h2>
            <p className="text-sm text-[#7d6a60]">
              Quantities save automatically
            </p>
          </div>
          <Badge variant="outline">{stock.length} items</Badge>
        </div>
        <div className="space-y-3">
          {stock.map((item) => {
            const percent = Math.min(
              100,
              Math.round(
                (item.quantity / Math.max(item.reorderAt * 2, 1)) * 100,
              ),
            );
            const low = item.quantity <= item.reorderAt;
            return (
              <div
                key={item.id}
                className="grid items-center gap-4 rounded-2xl border border-[#e5ded5] p-4 md:grid-cols-[minmax(160px,1.2fr)_minmax(140px,1fr)_100px_140px]"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold">{item.name}</p>
                    {low && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
                        Low
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[#9b877c]">
                    {item.category}
                  </p>
                </div>
                <div>
                  <div className="mb-2 flex justify-between text-xs font-bold text-[#7d6b61]">
                    <span>Stock level</span>
                    <span>{percent}%</span>
                  </div>
                  <Progress
                    value={percent}
                    className={
                      low
                        ? '[&_[data-slot=progress-indicator]]:bg-red-500'
                        : '[&_[data-slot=progress-indicator]]:bg-emerald-600'
                    }
                  />
                </div>
                <p className="font-serif text-xl font-bold">
                  {item.quantity}{' '}
                  <span className="font-sans text-sm font-medium text-[#87746a]">
                    {item.unit}
                  </span>
                </p>
                <div className="flex items-center justify-end gap-2">
                  <Button
                    onClick={() => onAdjust(item, -1)}
                    variant="outline"
                    size="icon"
                    aria-label={`Reduce ${item.name}`}
                  >
                    <Minus />
                  </Button>
                  <Button
                    onClick={() => onAdjust(item, 1)}
                    variant="outline"
                    size="icon"
                    aria-label={`Increase ${item.name}`}
                  >
                    <Plus />
                  </Button>
                  <Button
                    onClick={() => onAdjust(item, 5)}
                    size="sm"
                    className="bg-[#6d2416] hover:bg-[#55180f]"
                  >
                    +5
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <AddInventoryDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onAdd={onAdd}
      />
    </section>
  );
}

function AddInventoryDialog({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (item: Omit<StockItem, 'id'>) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Produce');
  const [unit, setUnit] = useState('kg');
  const [quantity, setQuantity] = useState(0);
  const [reorderAt, setReorderAt] = useState(5);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  async function submit() {
    setSaving(true);
    setError('');
    try {
      await onAdd({
        name: name.trim(),
        category: category.trim(),
        unit: unit.trim(),
        quantity,
        reorderAt,
      });
      setName('');
      setCategory('Produce');
      setUnit('kg');
      setQuantity(0);
      setReorderAt(5);
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Inventory item could not be saved',
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[22px] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl font-bold">
            Add inventory item
          </DialogTitle>
          <DialogDescription>
            Add a new ingredient with its current quantity and low-stock alert
            level.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm font-bold sm:col-span-2">
            Item name
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Example: Cooking oil"
            />
          </label>
          <label className="space-y-2 text-sm font-bold">
            Category
            <Input
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              placeholder="Dry goods"
            />
          </label>
          <label className="space-y-2 text-sm font-bold">
            Unit
            <Input
              value={unit}
              onChange={(event) => setUnit(event.target.value)}
              placeholder="kg, L, pack"
            />
          </label>
          <label className="space-y-2 text-sm font-bold">
            Current quantity
            <Input
              type="number"
              min="0"
              value={quantity}
              onChange={(event) =>
                setQuantity(Math.max(0, Number(event.target.value)))
              }
            />
          </label>
          <label className="space-y-2 text-sm font-bold">
            Low-stock alert at
            <Input
              type="number"
              min="0"
              value={reorderAt}
              onChange={(event) =>
                setReorderAt(Math.max(0, Number(event.target.value)))
              }
            />
          </label>
          {error && (
            <p className="text-sm font-bold text-red-700 sm:col-span-2">
              {error}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button
            onClick={submit}
            disabled={
              saving || !name.trim() || !category.trim() || !unit.trim()
            }
            className="bg-[#6d2416] hover:bg-[#55180f]"
          >
            {saving ? 'Adding…' : 'Add inventory item'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReviewsView({
  reviews,
  onDeleteMany,
}: {
  reviews: FeedbackRecord[];
  onDeleteMany: (reviews: FeedbackRecord[]) => Promise<boolean>;
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pendingDelete, setPendingDelete] = useState<FeedbackRecord[]>([]);
  const [deleting, setDeleting] = useState(false);
  const selectedReviews = reviews.filter((review) =>
    selectedIds.has(review.orderId),
  );
  const allSelected =
    reviews.length > 0 &&
    reviews.every((review) => selectedIds.has(review.orderId));
  const averageFood = reviews.length
    ? reviews.reduce((sum, review) => sum + review.foodRating, 0) /
      reviews.length
    : 0;
  const averageService = reviews.length
    ? reviews.reduce((sum, review) => sum + review.serviceRating, 0) /
      reviews.length
    : 0;

  function toggleReview(orderId: string, checked: boolean) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (checked) next.add(orderId);
      else next.delete(orderId);
      return next;
    });
  }

  function toggleAll() {
    setSelectedIds(
      allSelected
        ? new Set()
        : new Set(reviews.map((review) => review.orderId)),
    );
  }

  async function removeReviews() {
    if (!pendingDelete.length) return;
    setDeleting(true);
    const removed = await onDeleteMany(pendingDelete);
    setDeleting(false);
    if (removed) {
      const removedIds = new Set(pendingDelete.map((review) => review.orderId));
      setSelectedIds((current) => {
        const next = new Set(current);
        for (const id of removedIds) next.delete(id);
        return next;
      });
      setPendingDelete([]);
    }
  }

  return (
    <section className="p-4 pb-28 md:p-7 lg:pb-7">
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <MetricCard
          icon={Star}
          label="Total reviews"
          value={String(reviews.length)}
          note="Saved customer feedback"
        />
        <MetricCard
          icon={UtensilsCrossed}
          label="Food rating"
          value={averageFood ? `${averageFood.toFixed(1)} / 5` : '—'}
          note="Average food score"
        />
        <MetricCard
          icon={MessageCircle}
          label="Service rating"
          value={averageService ? `${averageService.toFixed(1)} / 5` : '—'}
          note="Average restaurant service"
        />
      </div>
      {reviews.length ? (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-[#ded8ce] bg-white p-3 shadow-sm">
            <label className="flex items-center gap-3 text-sm font-bold">
              <Checkbox
                checked={allSelected}
                onCheckedChange={toggleAll}
                aria-label="Select all reviews"
              />
              {selectedReviews.length
                ? `${selectedReviews.length} selected`
                : 'Select reviews'}
            </label>
            <div className="flex gap-2">
              {selectedReviews.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedIds(new Set())}
                >
                  Clear
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                disabled={!selectedReviews.length}
                onClick={() => setPendingDelete(selectedReviews)}
                className="border-red-200 text-red-700 hover:bg-red-50"
              >
                <Trash2 /> Delete selected ({selectedReviews.length})
              </Button>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {reviews.map((review) => (
              <article
                key={review.orderId}
                className={`rounded-[22px] border bg-white p-5 shadow-[0_8px_30px_rgba(66,39,25,.06)] ${selectedIds.has(review.orderId) ? 'border-[#9b3b28] ring-2 ring-[#9b3b28]/10' : 'border-[#ded8ce]'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <Checkbox
                      checked={selectedIds.has(review.orderId)}
                      onCheckedChange={(checked) =>
                        toggleReview(review.orderId, checked === true)
                      }
                      aria-label={`Select review for ${review.orderNumber}`}
                    />
                    <div>
                      <p className="font-serif text-xl font-bold">
                        {review.tableNumber
                          ? `Table ${review.tableNumber}`
                          : review.customerName || review.orderType}
                      </p>
                      <p className="mt-1 text-sm font-bold text-[#8d7569]">
                        {review.orderNumber} · {review.orderType}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <span className="rounded-full bg-[#fff0d4] px-3 py-1 text-xs font-bold text-[#7c310e]">
                      {new Date(review.updatedAt).toLocaleDateString('en-IN')}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setPendingDelete([review])}
                      className="text-red-700 hover:bg-red-50 hover:text-red-800"
                      aria-label={`Delete review for ${review.orderNumber}`}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <RatingSummary label="Food" value={review.foodRating} />
                  <RatingSummary label="Service" value={review.serviceRating} />
                </div>
                {review.notes ? (
                  <blockquote className="mt-4 rounded-2xl bg-[#f7f2ec] p-4 text-sm leading-6 text-[#604d44]">
                    “{review.notes}”
                  </blockquote>
                ) : (
                  <p className="mt-4 text-sm text-[#8a766c]">
                    No written note.
                  </p>
                )}
                <p className="mt-4 border-t border-dashed border-[#ded3c8] pt-3 text-xs text-[#8a766c]">
                  {review.customerName || 'Restaurant guest'} ·{' '}
                  {review.customerPhone}
                </p>
              </article>
            ))}
          </div>
          <AlertDialog
            open={pendingDelete.length > 0}
            onOpenChange={(open) => {
              if (!open && !deleting) setPendingDelete([]);
            }}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Delete {pendingDelete.length} review
                  {pendingDelete.length === 1 ? '' : 's'}?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  The selected food rating, service rating and customer note
                  will be permanently removed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleting}>
                  Keep reviews
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={removeReviews}
                  disabled={deleting}
                  className="bg-red-700 hover:bg-red-800"
                >
                  <Trash2 /> {deleting ? 'Deleting…' : 'Delete reviews'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      ) : (
        <div className="grid min-h-72 place-items-center rounded-[24px] border border-dashed border-[#d3c6bb] bg-white text-center">
          <div>
            <Star className="mx-auto size-10 text-[#c2aa9e]" />
            <h2 className="mt-3 font-serif text-2xl font-bold">
              No reviews yet
            </h2>
            <p className="mt-2 text-[#7d6a60]">
              Served table orders will show the food and service review form.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

function RatingSummary({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-[#fff8eb] p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-[#8a6b4e]">
        {label}
      </p>
      <div
        className="mt-2 flex items-center gap-1"
        aria-label={`${label}: ${value} out of 5`}
      >
        {[1, 2, 3, 4, 5].map((rating) => (
          <Star
            key={rating}
            className={`size-4 ${rating <= value ? 'fill-[#f6a81b] text-[#d68708]' : 'text-[#d5c8bd]'}`}
          />
        ))}
        <b className="ml-1 text-sm">{value}/5</b>
      </div>
    </div>
  );
}

function ReportsView({
  orders,
  onDeleteMany,
}: {
  orders: OrderRecord[];
  onDeleteMany: (orders: OrderRecord[]) => Promise<boolean>;
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pendingDelete, setPendingDelete] = useState<OrderRecord[]>([]);
  const [deleting, setDeleting] = useState(false);
  const reportOrders = orders.slice(0, 100);
  const selectedOrders = reportOrders.filter((order) =>
    selectedIds.has(order.id),
  );
  const allSelected =
    reportOrders.length > 0 &&
    reportOrders.every((order) => selectedIds.has(order.id));
  const currentSales = orders.reduce((sum, order) => sum + order.total, 0);
  const bars = [48, 58, 44, 72, 66, 86, 78];

  function toggleOrder(id: string, checked: boolean) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function toggleAll() {
    setSelectedIds(
      allSelected ? new Set() : new Set(reportOrders.map((order) => order.id)),
    );
  }

  async function removeReportOrders() {
    if (!pendingDelete.length) return;
    setDeleting(true);
    const removed = await onDeleteMany(pendingDelete);
    setDeleting(false);
    if (removed) {
      const removedIds = new Set(pendingDelete.map((order) => order.id));
      setSelectedIds((current) => {
        const next = new Set(current);
        for (const id of removedIds) next.delete(id);
        return next;
      });
      setPendingDelete([]);
    }
  }

  return (
    <section className="p-4 pb-28 md:p-7 lg:pb-7">
      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={IndianRupee}
          label="Gross sales"
          value={rupees.format(72480 + currentSales)}
          note="+14.2% vs last week"
        />
        <MetricCard
          icon={ReceiptText}
          label="Average bill"
          value="₹843"
          note="86 completed orders"
        />
        <MetricCard
          icon={UtensilsCrossed}
          label="Table turns"
          value="2.8×"
          note="68 minute avg. seating"
        />
        <MetricCard
          icon={TrendingUp}
          label="Food cost"
          value="29.4%"
          note="1.6% below target"
        />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.65fr_1fr]">
        <div className="rounded-[22px] border border-[#ded8ce] bg-white p-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-serif text-xl font-bold">
                Revenue this week
              </h2>
              <p className="mt-1 text-sm text-[#7d6a60]">
                Net sales after discounts
              </p>
            </div>
            <Badge className="bg-emerald-100 text-emerald-800">+11.8%</Badge>
          </div>
          <div className="mt-8 flex h-64 items-end gap-3 border-b border-[#ded8ce] px-1">
            {bars.map((height, index) => (
              <div
                key={height + index}
                className="flex flex-1 flex-col items-center gap-2"
              >
                <div className="group relative flex h-52 w-full items-end justify-center">
                  <div
                    className={`w-full max-w-12 rounded-t-xl transition-all hover:opacity-80 ${index === 6 ? 'bg-[#f6a622]' : 'bg-[#6d2416]'}`}
                    style={{ height: `${height}%` }}
                  >
                    <span className="sr-only">{height} percent</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#8a766c]">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[22px] border border-[#ded8ce] bg-white p-5">
          <h2 className="font-serif text-xl font-bold">Sales channels</h2>
          <p className="mt-1 text-sm text-[#7d6a60]">
            Share of today’s revenue
          </p>
          <div
            className="mx-auto my-7 grid size-44 place-items-center rounded-full"
            style={{
              background:
                'conic-gradient(#6d2416 0 61%, #f6a622 61% 83%, #dc8a72 83% 100%)',
            }}
          >
            <div className="grid size-28 place-items-center rounded-full bg-white text-center">
              <div>
                <p className="font-serif text-2xl font-bold">₹72.5k</p>
                <p className="text-xs text-[#806d63]">total sales</p>
              </div>
            </div>
          </div>
          <div className="space-y-3 text-sm">
            {[
              ['Dine in', '61%', '#6d2416'],
              ['Takeaway', '22%', '#f6a622'],
              ['Delivery', '17%', '#dc8a72'],
            ].map(([name, value, color]) => (
              <div key={name} className="flex items-center">
                <span
                  className="mr-2 size-2.5 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span>{name}</span>
                <span className="ml-auto font-bold">{value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[22px] border border-[#ded8ce] bg-white p-5 xl:col-span-2">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <h2 className="font-serif text-xl font-bold">Best sellers</h2>
              <p className="mt-1 text-sm text-[#7d6a60]">
                Top dishes by revenue today
              </p>
            </div>
            <Sparkles className="text-[#d18112]" />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {[
              { name: 'Butter Chicken', sold: 42, revenue: 16590 },
              { name: 'Hyderabadi Biryani', sold: 31, revenue: 13175 },
              { name: 'Paneer Tikka', sold: 36, revenue: 10620 },
            ].map((dish, index) => (
              <div
                key={dish.name}
                className="flex items-center gap-4 rounded-2xl bg-[#f6f1eb] p-4"
              >
                <span className="grid size-10 place-items-center rounded-full bg-white font-serif text-lg font-bold text-[#6d2416]">
                  {index + 1}
                </span>
                <div>
                  <p className="font-bold">{dish.name}</p>
                  <p className="text-sm text-[#7e6b61]">
                    {dish.sold} sold · {rupees.format(dish.revenue)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-5 overflow-hidden rounded-[22px] border border-[#ded8ce] bg-white p-4 shadow-sm md:p-5">
        <div className="mb-4 flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
          <div>
            <h2 className="font-serif text-xl font-bold">Manage report data</h2>
            <p className="mt-1 text-sm text-[#7d6a60]">
              Reports use these order records. Select one or many records to
              remove them.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={toggleAll}>
              {allSelected ? 'Clear all' : 'Select all'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!selectedOrders.length}
              onClick={() => setPendingDelete(selectedOrders)}
              className="border-red-200 text-red-700 hover:bg-red-50"
            >
              <Trash2 /> Delete selected ({selectedOrders.length})
            </Button>
          </div>
        </div>
        {reportOrders.length ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={toggleAll}
                      aria-label="Select all report records"
                    />
                  </TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Guest / table</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-12 text-right">Delete</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportOrders.map((order) => (
                  <TableRow
                    key={order.id}
                    data-state={
                      selectedIds.has(order.id) ? 'selected' : undefined
                    }
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(order.id)}
                        onCheckedChange={(checked) =>
                          toggleOrder(order.id, checked === true)
                        }
                        aria-label={`Select ${order.orderNumber}`}
                      />
                    </TableCell>
                    <TableCell>
                      <p className="font-bold">{order.orderNumber}</p>
                      <p className="text-xs text-[#8b776d]">
                        {new Date(order.createdAt).toLocaleDateString('en-IN')}
                      </p>
                    </TableCell>
                    <TableCell>
                      {order.tableNumber
                        ? `Table ${order.tableNumber}`
                        : order.customerName || 'Walk-in'}
                    </TableCell>
                    <TableCell>{order.orderType}</TableCell>
                    <TableCell>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${statusClass(order.status)}`}
                      >
                        {order.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {rupees.format(order.total)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setPendingDelete([order])}
                        className="text-red-700 hover:bg-red-50 hover:text-red-800"
                        aria-label={`Delete ${order.orderNumber} from reports`}
                      >
                        <Trash2 />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#d3c6bb] px-4 py-10 text-center text-sm text-[#7d6a60]">
            No order records are available for reports.
          </div>
        )}
      </div>
      <AlertDialog
        open={pendingDelete.length > 0}
        onOpenChange={(open) => {
          if (!open && !deleting) setPendingDelete([]);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {pendingDelete.length} report record
              {pendingDelete.length === 1 ? '' : 's'}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the selected orders, their item details
              and any linked customer reviews. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>
              Keep records
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={removeReportOrders}
              disabled={deleting}
              className="bg-red-700 hover:bg-red-800"
            >
              <Trash2 /> {deleting ? 'Deleting…' : 'Delete records'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: typeof LayoutGrid;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-[20px] border border-[#ded8ce] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-[#79665c]">{label}</p>
        <span className="grid size-9 place-items-center rounded-xl bg-[#f6eee8] text-[#6d2416]">
          <Icon className="size-[18px]" />
        </span>
      </div>
      <p className="mt-3 font-serif text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-[#8d796f]">{note}</p>
    </div>
  );
}
