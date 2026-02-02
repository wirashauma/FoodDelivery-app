'use client';

import { Search } from 'lucide-react';
import { ChangeEvent, FormEvent } from 'react';

interface FilterOption {
  label: string;
  value: string;
}

interface FilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit?: (value: string) => void;
  filters?: {
    label: string;
    name: string;
    value: string;
    options: FilterOption[];
    onChange: (value: string) => void;
  }[];
  actions?: React.ReactNode;
}

export default function FilterBar({
  searchValue,
  onSearchChange,
  onSearchSubmit,
  filters = [],
  actions,
}: FilterBarProps) {
  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSearchSubmit?.(searchValue);
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchValue}
              onChange={(e: ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Cari..."
            />
          </div>
        </form>

        {/* Filter Dropdowns */}
        {filters.map((filter) => (
          <div key={filter.name} className="min-w-[150px]">
            <label htmlFor={filter.name} className="sr-only">
              {filter.label}
            </label>
            <select
              id={filter.name}
              value={filter.value}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => filter.onChange(e.target.value)}
              className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">{filter.label}</option>
              {filter.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ))}

        {/* Action Buttons */}
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
