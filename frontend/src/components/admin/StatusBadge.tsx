'use client';

type StatusType = 
  | 'active' | 'inactive' | 'pending' | 'approved' | 'rejected'
  | 'PENDING' | 'PROCESSING' | 'ON_DELIVERY' | 'DELIVERED' | 'CANCELLED'
  | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'VERIFIED' | 'UNVERIFIED'
  | 'success' | 'warning' | 'danger' | 'info';

interface StatusBadgeProps {
  status: StatusType;
  text?: string;
}

const statusConfig: Record<StatusType, { bg: string; text: string; defaultLabel: string }> = {
  // Generic statuses
  active: { bg: 'bg-green-100', text: 'text-green-800', defaultLabel: 'Aktif' },
  inactive: { bg: 'bg-gray-100', text: 'text-gray-800', defaultLabel: 'Nonaktif' },
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', defaultLabel: 'Menunggu' },
  approved: { bg: 'bg-green-100', text: 'text-green-800', defaultLabel: 'Disetujui' },
  rejected: { bg: 'bg-red-100', text: 'text-red-800', defaultLabel: 'Ditolak' },
  success: { bg: 'bg-green-100', text: 'text-green-800', defaultLabel: 'Berhasil' },
  warning: { bg: 'bg-yellow-100', text: 'text-yellow-800', defaultLabel: 'Peringatan' },
  danger: { bg: 'bg-red-100', text: 'text-red-800', defaultLabel: 'Bahaya' },
  info: { bg: 'bg-blue-100', text: 'text-blue-800', defaultLabel: 'Info' },
  
  // Order statuses
  PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', defaultLabel: 'Menunggu' },
  PROCESSING: { bg: 'bg-blue-100', text: 'text-blue-800', defaultLabel: 'Diproses' },
  ON_DELIVERY: { bg: 'bg-purple-100', text: 'text-purple-800', defaultLabel: 'Dalam Pengiriman' },
  DELIVERED: { bg: 'bg-green-100', text: 'text-green-800', defaultLabel: 'Terkirim' },
  CANCELLED: { bg: 'bg-red-100', text: 'text-red-800', defaultLabel: 'Dibatalkan' },
  
  // User/Merchant statuses
  ACTIVE: { bg: 'bg-green-100', text: 'text-green-800', defaultLabel: 'Aktif' },
  INACTIVE: { bg: 'bg-gray-100', text: 'text-gray-800', defaultLabel: 'Nonaktif' },
  SUSPENDED: { bg: 'bg-red-100', text: 'text-red-800', defaultLabel: 'Ditangguhkan' },
  VERIFIED: { bg: 'bg-green-100', text: 'text-green-800', defaultLabel: 'Terverifikasi' },
  UNVERIFIED: { bg: 'bg-yellow-100', text: 'text-yellow-800', defaultLabel: 'Belum Terverifikasi' },
};

export default function StatusBadge({ status, text }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.info;
  const label = text || config.defaultLabel;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
    >
      {label}
    </span>
  );
}
