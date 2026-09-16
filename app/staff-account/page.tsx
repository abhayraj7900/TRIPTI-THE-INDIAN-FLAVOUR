import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { StaffAccount } from '@/components/staff-account';
import { isStaffIdentity, readStaffSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function StaffAccountPage() {
  const requestHeaders = await headers();
  const legacyIdentity = isStaffIdentity(
    requestHeaders.get('oai-authenticated-user-id'),
    requestHeaders.get('oai-authenticated-user-email'),
  );
  const staffSession = await readStaffSession(requestHeaders.get('cookie'));
  if (!legacyIdentity && !staffSession) redirect('/staff-login');

  return <StaffAccount phone={staffSession?.phone ?? ''} />;
}
