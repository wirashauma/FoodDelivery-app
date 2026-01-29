import { redirect } from 'next/navigation';

export default function DeliveryZonesPage() {
  // Redirect to master data with zones tab active
  redirect('/master-data/categories?tab=zones');
}
