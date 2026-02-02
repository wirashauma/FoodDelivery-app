'use client';

import { useState, useEffect, useCallback } from 'react';
import { DollarSign, TrendingUp, Calendar, ShoppingBag } from 'lucide-react';
import { merchantAPI } from '@/lib/api';

interface EarningsSummary {
  totalEarnings: number;
  thisMonth: number;
  lastMonth: number;
  monthlyGrowth: number;
  avgOrderValue: number;
  totalOrders: number;
  totalRevenue: number;
  totalCommission: number;
  commissionRate: number;
}

interface DailyEarning {
  date: string;
  amount: number;
  orders: number;
  netEarnings: number;
}

interface DailyEarningRaw {
  date: string;
  revenue?: number;
  netEarnings?: number;
}

export default function MerchantEarningsPage() {
  const [summary, setSummary] = useState<EarningsSummary>({
    totalEarnings: 0,
    thisMonth: 0,
    lastMonth: 0,
    monthlyGrowth: 0,
    avgOrderValue: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalCommission: 0,
    commissionRate: 0,
  });
  const [dailyEarnings, setDailyEarnings] = useState<DailyEarning[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('week');

  const fetchEarnings = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch earnings data from merchant API
      const earningsData = await merchantAPI.getEarnings(period);
      
      if (earningsData) {
        setSummary({
          totalEarnings: earningsData.netEarnings || 0,
          thisMonth: earningsData.netEarnings || 0,
          lastMonth: 0,
          monthlyGrowth: 0,
          avgOrderValue: earningsData.totalOrders > 0 
            ? (earningsData.totalRevenue || 0) / earningsData.totalOrders 
            : 0,
          totalOrders: earningsData.totalOrders || 0,
          totalRevenue: earningsData.totalRevenue || 0,
          totalCommission: earningsData.totalCommission || 0,
          commissionRate: earningsData.commissionRate || 0,
        });
        
        // Set daily earnings from API
        if (earningsData.dailyEarnings) {
          setDailyEarnings(earningsData.dailyEarnings.map((d: DailyEarningRaw) => ({
            date: new Date(d.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' }),
            amount: d.revenue || 0,
            orders: 0,
            netEarnings: d.netEarnings || 0,
          })));
        }
      }
      
    } catch (error) {
      console.error('Error fetching earnings:', error);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Get max for chart scaling
  const maxDailyAmount = Math.max(...dailyEarnings.map(d => d.netEarnings || d.amount), 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex gap-2">
        {(['week', 'month', 'year'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              period === p
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {p === 'week' ? 'Minggu Ini' : p === 'month' ? 'Bulan Ini' : 'Tahun Ini'}
          </button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-linear-to-br from-orange-500 to-red-500 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <DollarSign className="w-6 h-6" />
            </div>
            <span className="text-orange-100">Pendapatan Bersih</span>
          </div>
          <p className="text-3xl font-bold">{formatCurrency(summary.totalEarnings)}</p>
          <p className="text-sm text-orange-200 mt-2">Setelah komisi {summary.commissionRate}%</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-100 rounded-xl">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-gray-500">Total Revenue</span>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(summary.totalRevenue)}</p>
          <p className="text-sm text-gray-400 mt-2">Sebelum komisi</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <ShoppingBag className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-gray-500">Total Pesanan</span>
          </div>
          <p className="text-2xl font-bold">{summary.totalOrders}</p>
          <p className="text-sm text-gray-400 mt-2">Pesanan selesai</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-100 rounded-xl">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-gray-500">Rata-rata Pesanan</span>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(summary.avgOrderValue)}</p>
          <p className="text-sm text-gray-400 mt-2">Per transaksi</p>
        </div>
      </div>

      {/* Commission Info */}
      {summary.totalCommission > 0 && (
        <div className="bg-yellow-50 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="font-medium text-yellow-800">Komisi Platform</p>
            <p className="text-sm text-yellow-600">Rate: {summary.commissionRate}%</p>
          </div>
          <p className="text-xl font-bold text-yellow-700">{formatCurrency(summary.totalCommission)}</p>
        </div>
      )}

      {/* Chart */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Pendapatan 7 Hari Terakhir</h2>
        </div>

        {/* Simple Bar Chart */}
        <div className="space-y-4">
          {dailyEarnings.map((day, idx) => {
            const displayAmount = day.netEarnings || day.amount;
            return (
              <div key={idx} className="flex items-center gap-4">
                <span className="w-16 text-sm text-gray-500">{day.date}</span>
                <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden">
                  <div 
                    className="h-full bg-linear-to-r from-orange-400 to-orange-500 rounded-lg transition-all duration-500"
                    style={{ width: `${(displayAmount / maxDailyAmount) * 100}%` }}
                  />
                </div>
                <div className="text-right min-w-30">
                  <p className="font-medium text-gray-900">{formatCurrency(displayAmount)}</p>
                  <p className="text-xs text-gray-500">Pendapatan bersih</p>
                </div>
              </div>
            );
          })}
        </div>

        {dailyEarnings.every(d => (d.netEarnings || d.amount) === 0) && (
          <div className="text-center py-8 text-gray-500">
            <p>Belum ada pendapatan dalam 7 hari terakhir</p>
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-100 rounded-xl">
            <Calendar className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-blue-900">Kapan dana masuk?</h3>
            <p className="text-blue-700 text-sm mt-1">
              Pendapatan dari pesanan yang selesai akan masuk ke saldo Anda dalam 1x24 jam. 
              Anda dapat mengajukan pencairan kapan saja melalui menu Payout.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
