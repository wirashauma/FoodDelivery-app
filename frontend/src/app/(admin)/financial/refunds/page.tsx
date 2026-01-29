'use client';

import { redirect } from 'next/navigation';

export default function RefundsPage() {
  // Redirect to financial page with refund tab active
  redirect('/financial?tab=refund');
}
