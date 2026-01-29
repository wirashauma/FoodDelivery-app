'use client';

import { redirect } from 'next/navigation';

export default function BannersPage() {
  // Redirect to promos page with banners tab active
  redirect('/promos?tab=banners');
}
