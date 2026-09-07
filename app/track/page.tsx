import type { Metadata } from 'next';

import { OrderTracker } from '@/components/order-tracker';

export const metadata: Metadata = { title: 'Track Your Order | Tripti' };

export default function TrackPage() {
  return <OrderTracker />;
}
