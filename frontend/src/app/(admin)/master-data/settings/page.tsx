'use client';

import { redirect } from 'next/navigation';

export default function SystemSettingsPage() {
  // Redirect to master data with settings tab active
  redirect('/master-data/categories?tab=settings');
}
