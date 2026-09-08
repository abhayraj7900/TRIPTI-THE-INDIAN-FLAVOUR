'use client';

import {
  ArrowLeft,
  Check,
  Clock3,
  MapPin,
  PackageCheck,
  Search,
  UtensilsCrossed,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { OrderFeedback } from '@/components/order-feedback';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { OrderRecord } from '@/lib/restaurant-data';

const stages = ['new', 'preparing', 'ready', 'served'];
const rupees = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export function OrderTracker() {
  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setOrderNumber(params.get('order') ?? '');
    setPhone(params.get('phone') ?? '');
  }, []);
  const refreshOrder = useCallback(
    async (number: string, mobile: string, showLoading = false) => {
      if (showLoading) setLoading(true);
      if (showLoading) setError('');
      const response = await fetch(
        `/api/track?order=${encodeURIComponent(number)}&phone=${encodeURIComponent(mobile)}`,
      );
      const data = (await response.json()) as {
        order?: OrderRecord;
        error?: string;
      };
      if (!response.ok || !data.order) {
        if (showLoading) setError(data.error || 'Order not found');
      } else setOrder(data.order);
      if (showLoading) setLoading(false);
    },
    [],
  );
  async function track() {
    setOrder(null);
    await refreshOrder(orderNumber, phone, true);
  }
  useEffect(() => {
    if (
      !order?.orderNumber ||
      order.status === 'cancelled' ||
      order.status === 'completed'
    )
      return;
    const timer = window.setInterval(() => {
      void refreshOrder(order.orderNumber, phone);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [order?.orderNumber, order?.status, phone, refreshOrder]);
  const current = order
    ? order.status === 'completed'
      ? stages.length - 1
      : stages.indexOf(order.status)
    : -1;
  return (
    <main className="min-h-screen bg-[#f5f1ea] text-[#251713]">
      <header className="border-b border-[#e4d9cf] bg-white">
        <div className="mx-auto flex h-20 max-w-4xl items-center justify-between px-4">
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
      <section className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-[28px] border border-[#e0d4ca] bg-white p-6 shadow-sm sm:p-8">
          <span className="grid size-12 place-items-center rounded-2xl bg-[#f7e9de] text-[#6a2116]">
            <Search />
          </span>
          <h1 className="mt-4 font-serif text-3xl font-black">
            Track your order
          </h1>
          <p className="mt-2 text-[#786158]">
            No login needed. Enter the order number and the same mobile number
            used at checkout.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <Input
              value={orderNumber}
              onChange={(event) =>
                setOrderNumber(event.target.value.toUpperCase())
              }
              placeholder="TRP-123456"
              className="h-12"
            />
            <Input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              inputMode="tel"
              placeholder="Mobile number"
              className="h-12"
            />
            <Button
              onClick={track}
              disabled={
                loading || !orderNumber || phone.replace(/\D/g, '').length < 8
              }
              className="h-12 bg-[#6a2116] hover:bg-[#521008]"
            >
              {loading ? 'Checking…' : 'Track'}
            </Button>
          </div>
          {error && (
            <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">
              {error}
            </p>
          )}
        </div>
        {order && (
          <article className="mt-6 rounded-[28px] border border-[#e0d4ca] bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-[#9a6a58]">
                  {order.orderType}
                </p>
                <h2 className="font-serif text-2xl font-black">
                  {order.orderNumber}
                </h2>
              </div>
              <b className="text-xl">{rupees.format(order.total)}</b>
            </div>
            {order.status === 'cancelled' ? (
              <p className="mt-5 rounded-xl bg-red-50 p-3 font-bold text-red-700">
                This order was cancelled.
              </p>
            ) : (
              <div className="mt-7 grid grid-cols-4 gap-2">
                {stages.map((stage, index) => (
                  <div key={stage} className="text-center">
                    <span
                      className={`mx-auto grid size-10 place-items-center rounded-full ${index <= current ? 'bg-[#6a2116] text-white' : 'bg-[#ece3db] text-[#9b867b]'}`}
                    >
                      {index < current ? (
                        <Check />
                      ) : index === 0 ? (
                        <Clock3 />
                      ) : index === 2 ? (
                        <PackageCheck />
                      ) : index === 3 ? (
                        <UtensilsCrossed />
                      ) : (
                        index + 1
                      )}
                    </span>
                    <p className="mt-2 text-xs font-bold capitalize">
                      {stage === 'new' ? 'Accepted' : stage}
                    </p>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-7 space-y-2 border-t border-dashed border-[#d8cabe] pt-5">
              {order.items?.map((item) => (
                <div key={item.menuItemId} className="flex justify-between">
                  <span>
                    {item.quantity}× {item.name}
                  </span>
                  <b>{rupees.format(item.quantity * item.unitPrice)}</b>
                </div>
              ))}
            </div>
            {order.deliveryAddress && (
              <p className="mt-5 flex gap-2 rounded-xl bg-[#f6f1eb] p-3 text-sm">
                <MapPin className="size-4 shrink-0" />
                {order.deliveryAddress}
              </p>
            )}
            {['served', 'completed'].includes(order.status) && (
              <OrderFeedback
                orderNumber={order.orderNumber}
                phone={order.customerPhone}
              />
            )}
          </article>
        )}
      </section>
    </main>
  );
}
