interface StatusBadgeProps {
  status: string;
  type?: 'order' | 'deliverer' | 'user';
}

const orderStatusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  PREPARING: 'bg-orange-100 text-orange-700',
  READY: 'bg-purple-100 text-purple-700',
  PICKED_UP: 'bg-indigo-100 text-indigo-700',
  DELIVERING: 'bg-cyan-100 text-cyan-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

const delivererStatusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
};

const userRoleColors: Record<string, string> = {
  USER: 'bg-gray-100 text-gray-700',
  DELIVERER: 'bg-blue-100 text-blue-700',
  ADMIN: 'bg-purple-100 text-purple-700',
};

export default function StatusBadge({ status, type = 'order' }: StatusBadgeProps) {
  let colorClass = 'bg-gray-100 text-gray-700';

  if (type === 'order') {
    colorClass = orderStatusColors[status] || colorClass;
  } else if (type === 'deliverer') {
    colorClass = delivererStatusColors[status] || colorClass;
  } else if (type === 'user') {
    colorClass = userRoleColors[status] || colorClass;
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {status}
    </span>
  );
}
