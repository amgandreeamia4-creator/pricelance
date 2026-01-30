// app/merchant/dashboard/page.tsx

import { redirect } from 'next/navigation';
import { getMerchantSession } from '@/lib/merchantAuth';
import MerchantDashboardClient from './MerchantDashboardClient';

async function getMerchantData(merchantId: string) {
  // This would normally use Prisma, but we'll handle the client-side for now
  // due to the Prisma client generation issue
  return {
    id: merchantId,
    name: 'Merchant Store',
    website: 'https://example.com',
    country: 'Romania',
    listingCount: 0,
    feedRuns: [],
  };
}

export default async function MerchantDashboard() {
  const session = await getMerchantSession({} as any);

  if (!session) {
    redirect('/merchant/login');
  }

  const merchantData = await getMerchantData(session.merchantId);

  return <MerchantDashboardClient merchant={merchantData} />;
}
