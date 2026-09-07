import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { RestaurantSystem } from '@/components/restaurant-system';
import { isStaffIdentity } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const requestHeaders = await headers();
  if (!isStaffIdentity(
    requestHeaders.get('oai-authenticated-user-id'),
    requestHeaders.get('oai-authenticated-user-email'),
  )) redirect('/staff-login');
  return <RestaurantSystem />;
}
