import { redirect } from 'next/navigation';

export default function CuisineTypesPage() {
  // Redirect to master data with cuisine tab active
  redirect('/master-data/categories?tab=cuisines');
}
