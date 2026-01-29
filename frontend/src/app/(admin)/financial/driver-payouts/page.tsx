'use client';

import { redirect } from 'next/navigation';

export default function DriverPayoutsPage() {
  // Redirect to financial page with driver tab active
  redirect('/financial?tab=driver');
}
