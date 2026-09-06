import type { Metadata } from 'next';

import { GuestMenu } from '@/components/guest-menu';

export const metadata: Metadata = {
  title: 'Menu & Takeaway | Tripti — The Indian Flavour',
  description: 'Explore Tripti’s North Indian menu and order ahead for pickup in Connaught Place, New Delhi.',
};

export default function MenuPage() {
  return <GuestMenu />;
}
