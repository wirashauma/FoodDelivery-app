'use client';

import { useState } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight,
  Building2,
  Truck,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  Download,
  Calendar,
  CreditCard,
  Wallet,
  PieChart,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from 'recharts';

// Dummy financial data
const financialSummary = {
  totalRevenue: 487500000,
  totalRevenueGrowth: 12.5,
  totalOrders: 12450,
  totalOrdersGrowth: 8.2,
  totalDeliveryFees: 24375000,
  totalServiceFees: 48750000,
  totalCommissions: 73125000,
  totalPayouts: 365000000,
  pendingPayouts: 42500000,
  totalRefunds: 8750000,
  netRevenue: 121875000,
};

const revenueData = [
  { date: '1 Jun', revenue: 12500000, orders: 350 },
  { date: '5 Jun', revenue: 15200000, orders: 420 },
  { date: '10 Jun', revenue: 18400000, orders: 510 },
  { date: '15 Jun', revenue: 16800000, orders: 465 },
  { date: '20 Jun', revenue: 21500000, orders: 595 },
  { date: '25 Jun', revenue: 19200000, orders: 532 },
  { date: '30 Jun', revenue: 24500000, orders: 680 },
];

const paymentMethodData = [
  { name: 'E-Wallet', value: 45, color: '#6366f1' },
  { name: 'Bank Transfer', value: 25, color: '#22c55e' },
  { name: 'QRIS', value: 20, color: '#f59e0b' },
  { name: 'Cash', value: 10, color: '#94a3b8' },
];

const pendingMerchantPayouts = [
  { id: '1', merchantName: 'Warung Padang Sederhana', amount: 12500000, requestDate: '2024-06-28', status: 'PENDING' },
  { id: '2', merchantName: 'Sushi Tei Express', amount: 8750000, requestDate: '2024-06-27', status: 'PROCESSING' },
  { id: '3', merchantName: 'Kedai Kopi Nusantara', amount: 5200000, requestDate: '2024-06-26', status: 'PENDING' },
  { id: '4', merchantName: 'Ayam Geprek Bensu', amount: 7800000, requestDate: '2024-06-25', status: 'PENDING' },
];

const pendingDriverPayouts = [
  { id: '1', driverName: 'Joko Driver', amount: 2500000, requestDate: '2024-06-28', status: 'PENDING' },
  { id: '2', driverName: 'Andi Driver', amount: 1850000, requestDate: '2024-06-27', status: 'PROCESSING' },
  { id: '3', driverName: 'Bambang Driver', amount: 3200000, requestDate: '2024-06-26', status: 'PENDING' },
];

const recentRefunds = [
  { id: '1', orderNumber: '#TTP-2024-890', customerName: 'Ahmad Rizki', amount: 85000, reason: 'Pesanan tidak lengkap', status: 'PENDING' },
  { id: '2', orderNumber: '#TTP-2024-875', customerName: 'Sarah Wijaya', amount: 245000, reason: 'Merchant tutup', status: 'COMPLETED' },
  { id: '3', orderNumber: '#TTP-2024-862', customerName: 'Budi Santoso', amount: 65000, reason: 'Item tidak sesuai', status: 'PROCESSING' },
];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

function StatCard({ 
  title, 
  value, 
  growth, 
  icon: Icon, 
  color 
}: { 
  title: string; 
  value: string; 
  growth?: number; 
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
          {growth !== undefined && (
            <div className={`flex items-center gap-1 mt-1 text-xs ${growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {growth >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              <span>{Math.abs(growth)}% dari bulan lalu</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="text-white" size={24} />
        </div>
      </div>
    </div>
  );
}

export default function FinancialPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [activeTab, setActiveTab] = useState<'overview' | 'merchant' | 'driver' | 'refund'>('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: PieChart },
    { id: 'merchant', label: 'Payout Merchant', icon: Building2 },
    { id: 'driver', label: 'Payout Driver', icon: Truck },
    { id: 'refund', label: 'Refund', icon: RefreshCw },
  ];

  const statusColors: Record<string, { bg: string; text: string }> = {
    PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
    PROCESSING: { bg: 'bg-blue-100', text: 'text-blue-700' },
    COMPLETED: { bg: 'bg-green-100', text: 'text-green-700' },
    FAILED: { bg: 'bg-red-100', text: 'text-red-700' },
  };

  return (
    <div className="space-y-6">
      {/* Header with Period Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50">
            <Calendar size={16} />
            Juni 2024
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600">
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Revenue"
              value={formatCurrency(financialSummary.totalRevenue)}
              growth={financialSummary.totalRevenueGrowth}
              icon={DollarSign}
              color="bg-green-500"
            />
            <StatCard
              title="Total Pesanan"
              value={financialSummary.totalOrders.toLocaleString()}
              growth={financialSummary.totalOrdersGrowth}
              icon={CreditCard}
              color="bg-blue-500"
            />
            <StatCard
              title="Pending Payouts"
              value={formatCurrency(financialSummary.pendingPayouts)}
              icon={Clock}
              color="bg-yellow-500"
            />
            <StatCard
              title="Net Revenue"
              value={formatCurrency(financialSummary.netRevenue)}
              icon={Wallet}
              color="bg-purple-500"
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Chart */}
            <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4">Revenue Trend</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `${v/1000000}M`} />
                    <Tooltip 
                      formatter={(value) => typeof value === 'number' ? formatCurrency(value) : value}
                      labelStyle={{ color: '#1f2937' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#6366f1" 
                      fillOpacity={1} 
                      fill="url(#colorRevenue)" 
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4">Metode Pembayaran</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={paymentMethodData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {paymentMethodData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-4">
                {paymentMethodData.map((method) => (
                  <div key={method.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: method.color }} />
                      <span className="text-sm text-gray-600">{method.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{method.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Revenue Breakdown */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4">Revenue Breakdown</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Delivery Fees</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(financialSummary.totalDeliveryFees)}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Service Fees</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(financialSummary.totalServiceFees)}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Commissions</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(financialSummary.totalCommissions)}</p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-gray-500">Refunds</p>
                <p className="text-lg font-bold text-red-600">-{formatCurrency(financialSummary.totalRefunds)}</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Merchant Payouts Tab */}
      {activeTab === 'merchant' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Pending Merchant Payouts</h3>
            <button className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600">
              + Buat Payout
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Merchant</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Request Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pendingMerchantPayouts.map((payout) => (
                  <tr key={payout.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                          <Building2 className="text-primary-600" size={20} />
                        </div>
                        <span className="font-medium text-gray-900">{payout.merchantName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-900">{formatCurrency(payout.amount)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-600">{payout.requestDate}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[payout.status].bg} ${statusColors[payout.status].text}`}>
                        {payout.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600">
                          Approve
                        </button>
                        <button className="px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-50">
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Driver Payouts Tab */}
      {activeTab === 'driver' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Pending Driver Payouts</h3>
            <button className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600">
              + Buat Payout
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Driver</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Request Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pendingDriverPayouts.map((payout) => (
                  <tr key={payout.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                          <Truck className="text-cyan-600" size={20} />
                        </div>
                        <span className="font-medium text-gray-900">{payout.driverName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-900">{formatCurrency(payout.amount)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-600">{payout.requestDate}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[payout.status].bg} ${statusColors[payout.status].text}`}>
                        {payout.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600">
                          Approve
                        </button>
                        <button className="px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-50">
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Refunds Tab */}
      {activeTab === 'refund' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Recent Refunds</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Order</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentRefunds.map((refund) => (
                  <tr key={refund.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className="font-medium text-primary-600">{refund.orderNumber}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-900">{refund.customerName}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-red-600">{formatCurrency(refund.amount)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-600">{refund.reason}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[refund.status].bg} ${statusColors[refund.status].text}`}>
                        {refund.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {refund.status === 'PENDING' && (
                        <div className="flex items-center justify-end gap-2">
                          <button className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600">
                            Process
                          </button>
                          <button className="px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-50">
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
