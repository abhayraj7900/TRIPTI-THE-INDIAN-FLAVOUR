import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { RestaurantSystem } from '@/components/restaurant-system';
import { isStaffUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const requestHeaders = await headers();
  if (!isStaffUserId(requestHeaders.get('oai-authenticated-user-id'))) redirect('/staff-login');
  return <RestaurantSystem />;
}
