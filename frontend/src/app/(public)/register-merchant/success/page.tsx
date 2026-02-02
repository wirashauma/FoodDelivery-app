'use client';

import { Check, Mail, FileText, Clock } from 'lucide-react';
import Link from 'next/link';

export default function RegistrationSuccessPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-green-50 via-white to-green-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-500 rounded-full mb-6 animate-bounce">
            <Check className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Pendaftaran Berhasil!
          </h1>
          <p className="text-lg text-gray-600">
            Terima kasih telah mendaftar sebagai merchant
          </p>
        </div>

        {/* Info Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-6">
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  Dokumen Sedang Diverifikasi
                </h3>
                <p className="text-sm text-gray-600">
                  Tim kami sedang memeriksa dokumen yang Anda upload. Proses ini biasanya memakan waktu 1-3 hari kerja.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Mail className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  Cek Email Anda
                </h3>
                <p className="text-sm text-gray-600">
                  Kami telah mengirim email konfirmasi. Periksa inbox atau folder spam Anda.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-orange-100 rounded-xl">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  Notifikasi Status
                </h3>
                <p className="text-sm text-gray-600">
                  Anda akan menerima notifikasi email ketika akun Anda telah diverifikasi dan disetujui.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* What's Next */}
        <div className="bg-linear-to-r from-red-500 to-red-600 rounded-2xl p-6 text-white mb-6">
          <h3 className="font-bold text-lg mb-3">Apa yang Selanjutnya?</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-white rounded-full mt-1.5 shrink-0" />
              <span>Pastikan email dan nomor telepon Anda aktif untuk menerima notifikasi</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-white rounded-full mt-1.5 shrink-0" />
              <span>Siapkan menu dan foto produk yang akan dijual</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-white rounded-full mt-1.5 shrink-0" />
              <span>Setelah disetujui, Anda dapat langsung mulai berjualan</span>
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/"
            className="flex-1 text-center px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
          >
            Kembali ke Beranda
          </Link>
          <Link
            href="/login"
            className="flex-1 text-center px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium"
          >
            Login ke Akun
          </Link>
        </div>
      </div>
    </div>
  );
}
