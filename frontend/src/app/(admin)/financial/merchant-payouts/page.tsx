import { redirect } from 'next/navigation';

export default function MerchantPayoutsPage() {
  // Redirect to financial page with merchant tab active
  redirect('/financial?tab=merchant');
}
