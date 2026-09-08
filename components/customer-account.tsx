'use client';

import {
  ArrowLeft,
  CalendarDays,
  Check,
  Clock3,
  LogOut,
  PackageCheck,
  UserRound,
  Users,
  UtensilsCrossed,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { OrderFeedback } from '@/components/order-feedback';
import { Textarea } from '@/components/ui/textarea';
import type { BookingRecord, OrderRecord } from '@/lib/restaurant-data';

const rupees = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});
const stages = ['new', 'preparing', 'ready', 'served'];

type Customer = { name: string; phone: string };

export function CustomerAccount() {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [otpMode, setOtpMode] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPin, setNewPin] = useState('');
  const [authBusy, setAuthBusy] = useState(false);

  async function loadAccount() {
    const response = await fetch('/api/customer');
    if (!response.ok) {
      setCustomer(null);
      setLoading(false);
      return;
    }
    const data = (await response.json()) as {
      customer: Customer;
      orders: OrderRecord[];
      bookings: BookingRecord[];
    };
    setCustomer(data.customer);
    setOrders(data.orders);
    setBookings(data.bookings);
    setLoading(false);
  }
  useEffect(() => {
    void loadAccount();
  }, []);
  useEffect(() => {
    if (!customer) return;
    const timer = window.setInterval(() => void loadAccount(), 5000);
    return () => window.clearInterval(timer);
  }, [customer?.phone]);

  async function login() {
    setError('');
    setAuthBusy(true);
    const response = await fetch('/api/auth/customer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, pin }),
    });
    const data = (await response.json()) as {
      customer?: Customer;
      error?: string;
      requiresOtp?: boolean;
    };
    if (!response.ok || !data.customer) {
      setError(data.error || 'Sign in failed');
      if (data.requiresOtp) setOtpMode(true);
      setAuthBusy(false);
      return;
    }
    setCustomer(data.customer);
    await loadAccount();
    setAuthBusy(false);
  }

  async function requestOtp() {
    setError('');
    setAuthBusy(true);
    const response = await fetch('/api/auth/customer/otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'request', phone }),
    });
    const data = (await response.json()) as { sent?: boolean; error?: string };
    if (!response.ok || !data.sent)
      setError(data.error || 'OTP could not be sent');
    else setOtpSent(true);
    setAuthBusy(false);
  }

  async function verifyOtpAndSetPin() {
    setError('');
    setAuthBusy(true);
    const response = await fetch('/api/auth/customer/otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'verify_and_set_pin',
        phone,
        otp,
        pin: newPin,
      }),
    });
    const data = (await response.json()) as {
      customer?: Customer;
      error?: string;
    };
    if (!response.ok || !data.customer) {
      setError(data.error || 'OTP verification failed');
      setAuthBusy(false);
      return;
    }
    setPin(newPin);
    setCustomer(data.customer);
    await loadAccount();
    setAuthBusy(false);
  }

  async function logout() {
    await fetch('/api/auth/customer', { method: 'DELETE' });
    setCustomer(null);
    setOrders([]);
    setBookings([]);
  }

  return (
    <main className="min-h-screen bg-[#f5f1ea] text-[#251713]">
      <header className="border-b border-[#e4d9cf] bg-white">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4 sm:px-6">
          <a href="/menu">
            {/* oxlint-disable-next-line next/no-img-element */}
            <img
              src="/tripti-logo.png"
              alt="Tripti"
              className="h-14 w-40 object-contain"
            />
          </a>
          <a
            href="/menu"
            className="flex items-center gap-2 text-sm font-bold text-[#6a2116]"
          >
            <ArrowLeft className="size-4" /> Menu
          </a>
        </div>
      </header>
      {loading ? (
        <div className="grid min-h-[60vh] place-items-center font-bold text-[#796258]">
          Loading your account…
        </div>
      ) : !customer ? (
        <section className="mx-auto grid max-w-6xl place-items-center px-4 py-14">
          <div className="w-full max-w-md rounded-[28px] border border-[#e1d5ca] bg-white p-7 shadow-xl">
            <span className="grid size-12 place-items-center rounded-2xl bg-[#f7e9de] text-[#6a2116]">
              <UserRound />
            </span>
            <h1 className="mt-5 font-serif text-3xl font-black">
              Customer sign in
            </h1>
            <p className="mt-2 leading-6 text-[#776158]">
              Online table booking and delivery use your mobile number and 6
              digit PIN. Restaurant table orders do not need a login.
            </p>
            <div className="mt-6 space-y-4">
              <label className="block space-y-2 text-sm font-bold">
                Mobile number
                <Input
                  value={phone}
                  onChange={(event) =>
                    setPhone(
                      event.target.value.replace(/[^0-9+ -]/g, '').slice(0, 16),
                    )
                  }
                  inputMode="tel"
                  placeholder="Used for your orders"
                  className="h-12"
                />
              </label>
              {!otpMode ? (
                <>
                  <label className="block space-y-2 text-sm font-bold">
                    6 digit PIN
                    <Input
                      value={pin}
                      onChange={(event) =>
                        setPin(
                          event.target.value.replace(/\D/g, '').slice(0, 6),
                        )
                      }
                      type="password"
                      inputMode="numeric"
                      placeholder="Enter exactly 6 digits"
                      className="h-12"
                    />
                  </label>
                  <Button
                    onClick={login}
                    disabled={
                      authBusy ||
                      phone.replace(/\D/g, '').length < 8 ||
                      pin.length !== 6
                    }
                    className="h-12 w-full bg-[#6a2116] font-bold hover:bg-[#521008]"
                  >
                    {authBusy ? 'Signing in…' : 'Continue with PIN'}
                  </Button>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpMode(true);
                      setError('');
                    }}
                    className="w-full text-sm font-bold text-[#6a2116] underline"
                  >
                    First time or forgot PIN? Verify OTP
                  </button>
                </>
              ) : (
                <>
                  {!otpSent ? (
                    <Button
                      onClick={requestOtp}
                      disabled={authBusy || phone.replace(/\D/g, '').length < 8}
                      className="h-12 w-full bg-[#6a2116] font-bold hover:bg-[#521008]"
                    >
                      {authBusy ? 'Sending SMS…' : 'Send OTP by SMS'}
                    </Button>
                  ) : (
                    <>
                      <label className="block space-y-2 text-sm font-bold">
                        6 digit OTP
                        <Input
                          value={otp}
                          onChange={(event) =>
                            setOtp(
                              event.target.value.replace(/\D/g, '').slice(0, 6),
                            )
                          }
                          inputMode="numeric"
                          placeholder="OTP received by phone SMS"
                          className="h-12"
                        />
                      </label>
                      <label className="block space-y-2 text-sm font-bold">
                        Set new 6 digit PIN
                        <Input
                          value={newPin}
                          onChange={(event) =>
                            setNewPin(
                              event.target.value.replace(/\D/g, '').slice(0, 6),
                            )
                          }
                          type="password"
                          inputMode="numeric"
                          placeholder="Create a PIN for future login"
                          className="h-12"
                        />
                      </label>
                      <Button
                        onClick={verifyOtpAndSetPin}
                        disabled={
                          authBusy || otp.length !== 6 || newPin.length !== 6
                        }
                        className="h-12 w-full bg-[#6a2116] font-bold hover:bg-[#521008]"
                      >
                        {authBusy ? 'Verifying…' : 'Verify OTP & save PIN'}
                      </Button>
                      <button
                        type="button"
                        onClick={() => {
                          setOtpSent(false);
                          setOtp('');
                          setError('');
                        }}
                        className="w-full text-xs font-bold text-[#6a2116] underline"
                      >
                        Send a new OTP
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setOtpMode(false);
                      setOtpSent(false);
                      setError('');
                    }}
                    className="w-full text-sm font-bold text-[#6a2116] underline"
                  >
                    Back to PIN login
                  </button>
                </>
              )}
              {error && (
                <p className="text-sm font-bold text-red-700">{error}</p>
              )}
            </div>
          </div>
        </section>
      ) : (
        <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="mb-7 flex flex-col justify-between gap-4 rounded-[24px] bg-[#45150e] p-6 text-white sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-bold text-[#ffc768]">Welcome back</p>
              <h1 className="font-serif text-3xl font-black">
                {customer.name}
              </h1>
              <p className="mt-1 text-sm text-orange-50/70">{customer.phone}</p>
            </div>
            <Button
              onClick={logout}
              variant="outline"
              className="border-white/20 bg-white/10 text-white hover:bg-white/20"
            >
              <LogOut /> Sign out
            </Button>
          </div>
          <div className="grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
            <BookingCard onBooked={loadAccount} />
            <div>
              <h2 className="font-serif text-2xl font-black">
                Your order tracking
              </h2>
              <p className="mt-1 text-[#7b655b]">
                Orders placed with this mobile number appear here.
              </p>
              <div className="mt-4 space-y-4">
                {orders.length ? (
                  orders.map((order) => (
                    <CustomerOrderCard key={order.id} order={order} />
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-[#d4c6ba] bg-white/60 p-8 text-center">
                    <PackageCheck className="mx-auto size-8 text-[#9d877c]" />
                    <p className="mt-3 font-bold">No linked orders yet</p>
                    <a
                      href="/menu"
                      className="mt-2 inline-block text-sm font-bold text-[#6a2116] underline"
                    >
                      Order from the menu
                    </a>
                  </div>
                )}
              </div>
              <h2 className="mt-8 font-serif text-2xl font-black">
                Table bookings
              </h2>
              <div className="mt-4 space-y-3">
                {bookings.length ? (
                  bookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between rounded-2xl border border-[#e0d5cb] bg-white p-4"
                    >
                      <div>
                        <p className="font-bold">
                          Table {booking.tableNumber} · {booking.guests} guests
                        </p>
                        <p className="mt-1 text-sm text-[#7b655b]">
                          {booking.bookingDate} at {booking.bookingTime}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${booking.status === 'booked' ? 'bg-amber-100 text-amber-800' : booking.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'}`}
                      >
                        {booking.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="rounded-2xl bg-white p-4 text-sm text-[#7b655b]">
                    No table bookings yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

function BookingCard({ onBooked }: { onBooked: () => Promise<void> }) {
  const [customerName, setCustomerName] = useState('');
  const [guests, setGuests] = useState(2);
  const [bookingDate, setBookingDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [bookingTime, setBookingTime] = useState('19:30');
  const [tableNumber, setTableNumber] = useState('01');
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  async function book() {
    setSaving(true);
    setMessage('');
    const response = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName,
        guests,
        bookingDate,
        bookingTime,
        tableNumber,
        notes,
      }),
    });
    const data = (await response.json()) as {
      booking?: BookingRecord;
      error?: string;
    };
    if (!response.ok || !data.booking)
      setMessage(data.error || 'Booking could not be saved');
    else {
      setMessage(
        data.booking.whatsappStatus === 'sent'
          ? `${data.booking.bookingNumber} confirmed for table ${data.booking.tableNumber}. WhatsApp confirmation sent.`
          : `${data.booking.bookingNumber} confirmed for table ${data.booking.tableNumber}. Staff can send the WhatsApp confirmation.`,
      );
      setNotes('');
      await onBooked();
    }
    setSaving(false);
  }
  return (
    <div className="h-fit rounded-[26px] border border-[#dfd3c9] bg-white p-6 shadow-sm">
      <span className="grid size-12 place-items-center rounded-2xl bg-[#fff0d4] text-[#7c310e]">
        <CalendarDays />
      </span>
      <h2 className="mt-4 font-serif text-2xl font-black">Book a table</h2>
      <p className="mt-1 text-sm leading-5 text-[#7b655b]">
        Your booking and order history stays attached to your signed-in mobile
        number.
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <label className="space-y-2 text-sm font-bold sm:col-span-2 lg:col-span-1 xl:col-span-2">
          Booking name
          <Input
            value={customerName}
            onChange={(event) => setCustomerName(event.target.value)}
            placeholder="Name for the table"
          />
        </label>
        <label className="space-y-2 text-sm font-bold">
          Guests
          <div className="relative">
            <Users className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8b776d]" />
            <Input
              type="number"
              min="1"
              max="20"
              value={guests}
              onChange={(event) => setGuests(Number(event.target.value))}
              className="pl-9"
            />
          </div>
        </label>
        <label className="space-y-2 text-sm font-bold">
          Table 01–16
          <Input
            value={tableNumber}
            onChange={(event) =>
              setTableNumber(event.target.value.replace(/\D/g, '').slice(0, 2))
            }
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
        <label className="space-y-2 text-sm font-bold sm:col-span-2 lg:col-span-1 xl:col-span-2">
          Special request
          <Textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Birthday, high chair, accessibility…"
          />
        </label>
      </div>
      {message && (
        <p
          className={`mt-4 rounded-xl p-3 text-sm font-bold ${message.includes('confirmed') ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}
        >
          {message}
        </p>
      )}
      <Button
        onClick={book}
        disabled={
          saving ||
          !customerName.trim() ||
          !bookingDate ||
          !bookingTime ||
          !tableNumber
        }
        className="mt-5 h-11 w-full bg-[#6a2116] font-bold hover:bg-[#521008]"
      >
        {saving ? 'Booking…' : 'Confirm table booking'}
      </Button>
    </div>
  );
}

function CustomerOrderCard({ order }: { order: OrderRecord }) {
  const current =
    order.status === 'cancelled'
      ? -1
      : order.status === 'completed'
        ? stages.length - 1
        : Math.max(0, stages.indexOf(order.status));
  return (
    <article className="rounded-[22px] border border-[#e0d5cb] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-serif text-xl font-black">{order.orderNumber}</p>
          <p className="mt-1 text-sm text-[#7b655b]">
            {order.orderType} ·{' '}
            {new Date(order.createdAt).toLocaleString('en-IN')}
          </p>
        </div>
        <b>{rupees.format(order.total)}</b>
      </div>
      {order.status === 'cancelled' ? (
        <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">
          This order was cancelled.
        </p>
      ) : (
        <div className="mt-5 grid grid-cols-4 gap-1">
          {stages.map((stage, index) => (
            <div key={stage} className="text-center">
              <span
                className={`mx-auto grid size-8 place-items-center rounded-full ${index <= current ? 'bg-[#6a2116] text-white' : 'bg-[#ede5dd] text-[#9a877d]'}`}
              >
                {index < current ? (
                  <Check className="size-4" />
                ) : index === 0 ? (
                  <Clock3 className="size-4" />
                ) : index === 3 ? (
                  <UtensilsCrossed className="size-4" />
                ) : (
                  index + 1
                )}
              </span>
              <p className="mt-2 text-[11px] font-bold capitalize text-[#765f55]">
                {stage === 'new' ? 'Accepted' : stage}
              </p>
            </div>
          ))}
        </div>
      )}
      <div className="mt-4 border-t border-dashed border-[#ded1c6] pt-3 text-sm">
        {order.items?.map((item) => (
          <div key={item.menuItemId} className="flex justify-between py-1">
            <span>
              {item.quantity}× {item.name}
            </span>
            <span>{rupees.format(item.quantity * item.unitPrice)}</span>
          </div>
        ))}
      </div>
      {order.deliveryAddress && (
        <p className="mt-3 text-sm text-[#6f5a50]">
          <b>Delivery:</b> {order.deliveryAddress}
        </p>
      )}
      {['served', 'completed'].includes(order.status) && (
        <OrderFeedback
          orderNumber={order.orderNumber}
          phone={order.customerPhone}
        />
      )}
    </article>
  );
}
