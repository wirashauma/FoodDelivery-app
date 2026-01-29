import { redirect } from 'next/navigation';

export default function VouchersPage() {
  // Redirect to promos page with vouchers tab active
  redirect('/promos?tab=vouchers');
}
