import type { Metadata } from 'next';

import { CustomerAccount } from '@/components/customer-account';

export const metadata: Metadata = { title: 'My Orders & Table Booking | Tripti' };

export default function AccountPage() {
  return <CustomerAccount />;
}
