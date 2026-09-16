import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { StaffLoginForm } from '@/components/staff-login-form';
import {
  isStaffIdentity,
  readStaffSession,
  staffLoginConfigured,
} from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function StaffLoginPage() {
  const requestHeaders = await headers();
  const legacyIdentity = isStaffIdentity(
    requestHeaders.get('oai-authenticated-user-id'),
    requestHeaders.get('oai-authenticated-user-email'),
  );
  const staffSession = await readStaffSession(requestHeaders.get('cookie'));
  if (legacyIdentity || staffSession) redirect('/');

  return <StaffLoginForm configured={staffLoginConfigured()} />;
}
