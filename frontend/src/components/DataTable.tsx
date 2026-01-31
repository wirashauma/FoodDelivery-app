'use client';

import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useState, ReactNode, useCallback, memo } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface Column<T = any> {
  key: keyof T | string;
  label: string;
  render?: (item: T) => ReactNode;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface DataTableProps<T = any> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  pagination?: {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
  emptyMessage?: string;
  /** Unique key field for each row - defaults to 'id' */
  rowKeyField?: keyof T | string;
}

// Helper function to get nested value - defined outside component
const getValue = <T,>(item: T, key: string): ReactNode => {
  const keys = key.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let value: any = item;
  for (const k of keys) {
    value = value?.[k];
  }
  return value as ReactNode;
};

// Helper function to get row key - defined outside component
const getRowKey = <T,>(item: T, index: number, keyField?: keyof T | string): string => {
  if (keyField) {
    const key = getValue(item, keyField as string);
    if (key != null) return String(key);
  }
  // Fallback to common id fields
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const record = item as any;
  return record?.id ?? record?._id ?? record?.uuid ?? `row-${index}`;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DataTable<T = any>({
  columns,
  data,
  loading = false,
  pagination,
  onSearch,
  searchPlaceholder = 'Search...',
  emptyMessage = 'No data available',
  rowKeyField,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
  }, [onSearch, searchQuery]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  return (
    <div className="bg-white rounded-lg sm:rounded-xl shadow-sm overflow-hidden">
      {/* Search bar */}
      {onSearch && (
        <div className="p-3 sm:p-4 border-b">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder={searchPlaceholder}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              />
            </div>
            <button
              type="submit"
              className="px-3 sm:px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
            >
              Search
            </button>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-150">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key as string}
                  className="px-3 sm:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500 text-sm">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr key={getRowKey(item, index, rowKeyField)} className="hover:bg-gray-50 transition-colors">
                  {columns.map((column) => (
                    <td key={column.key as string} className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-700">
                      {column.render ? column.render(item) : getValue(item, column.key as string)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="px-3 sm:px-6 py-3 sm:py-4 border-t flex items-center justify-between">
          <p className="text-xs sm:text-sm text-gray-500">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-1.5 sm:p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} className="sm:w-4.5 sm:h-4.5" />
            </button>
            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="p-1.5 sm:p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} className="sm:w-4.5 sm:h-4.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Memoize the component to prevent unnecessary re-renders
export default memo(DataTable) as typeof DataTable;
