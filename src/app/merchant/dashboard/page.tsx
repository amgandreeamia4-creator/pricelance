import { redirect } from 'next/navigation';
import { getCurrentMerchant } from '@/lib/merchantAuth';
import MerchantDashboardClient from './MerchantDashboardClient';

export default async function MerchantDashboardPage() {
  const merchant = await getCurrentMerchant();

  if (!merchant) {
    redirect('/merchant/login');
  }

  return <MerchantDashboardClient merchant={merchant} />;
}
