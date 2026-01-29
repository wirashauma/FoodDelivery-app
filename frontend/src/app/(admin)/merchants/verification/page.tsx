'use client';

import { redirect } from 'next/navigation';

export default function MerchantVerificationPage() {
  // For now, redirect to main merchants page
  // In full implementation, this would be a dedicated verification page
  redirect('/merchants?filter=pending');
}
