'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Store, MapPin, FileText, Clock, CreditCard, 
  ChevronRight, ChevronLeft, Upload, Check, AlertCircle 
} from 'lucide-react';


const CUISINE_TYPES = [
  'Indonesian', 'Chinese', 'Japanese', 'Western', 'Korean',
  'Thai', 'Italian', 'Fast Food', 'Cafe', 'Bakery', 'Beverages'
];

const DAYS_OF_WEEK = [
  'Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'
];

interface OperationalHour {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

export default function MerchantRegistrationPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form Data
  const [formData, setFormData] = useState({
    // Step 1: Business Info
    businessName: '',
    description: '',
    cuisineTypes: [] as string[],
    phone: '',
    email: '',
    
    // Step 2: Location
    address: '',
    city: '',
    district: '',
    postalCode: '',
    latitude: 0,
    longitude: 0,
    
    // Step 3: Documents
    siupFile: null as File | null,
    nibFile: null as File | null,
    npwpFile: null as File | null,
    halalFile: null as File | null,
    
    // Step 4: Operational Hours
    operationalHours: DAYS_OF_WEEK.map((_, index) => ({
      dayOfWeek: index,
      openTime: '08:00',
      closeTime: '22:00',
      isClosed: false,
    })) as OperationalHour[],
    
    // Step 5: Bank Account
    bankName: '',
    bankAccountNumber: '',
    bankAccountName: '',
  });

  const steps = [
    { title: 'Informasi Bisnis', icon: Store },
    { title: 'Lokasi', icon: MapPin },
    { title: 'Dokumen', icon: FileText },
    { title: 'Jam Operasional', icon: Clock },
    { title: 'Rekening Bank', icon: CreditCard },
  ];

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 0) {
      if (!formData.businessName.trim()) newErrors.businessName = 'Nama bisnis wajib diisi';
      if (!formData.phone.trim()) newErrors.phone = 'Nomor telepon wajib diisi';
      if (!formData.email.trim()) newErrors.email = 'Email wajib diisi';
      if (formData.cuisineTypes.length === 0) newErrors.cuisineTypes = 'Pilih minimal 1 tipe masakan';
    } else if (step === 1) {
      if (!formData.address.trim()) newErrors.address = 'Alamat wajib diisi';
      if (!formData.city.trim()) newErrors.city = 'Kota wajib diisi';
    } else if (step === 2) {
      if (!formData.siupFile) newErrors.siupFile = 'SIUP wajib diupload';
      if (!formData.nibFile) newErrors.nibFile = 'NIB wajib diupload';
    } else if (step === 4) {
      if (!formData.bankName.trim()) newErrors.bankName = 'Nama bank wajib diisi';
      if (!formData.bankAccountNumber.trim()) newErrors.bankAccountNumber = 'Nomor rekening wajib diisi';
      if (!formData.bankAccountName.trim()) newErrors.bankAccountName = 'Nama pemilik rekening wajib diisi';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleFileChange = (field: string, file: File | null) => {
    setFormData({ ...formData, [field]: file });
    if (file && errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const toggleCuisineType = (cuisine: string) => {
    const current = formData.cuisineTypes;
    if (current.includes(cuisine)) {
      setFormData({ ...formData, cuisineTypes: current.filter(c => c !== cuisine) });
    } else {
      setFormData({ ...formData, cuisineTypes: [...current, cuisine] });
    }
  };

  const updateOperationalHour = (index: number, field: keyof OperationalHour, value: string | boolean) => {
    const updated = [...formData.operationalHours];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, operationalHours: updated });
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    setLoading(true);
    try {
      const formDataToSend = new FormData();
      
      // User email for account linking
      formDataToSend.append('userEmail', formData.email);
      
      // Business info
      formDataToSend.append('businessName', formData.businessName);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('cuisineTypes', JSON.stringify(formData.cuisineTypes));
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('email', formData.email);
      
      // Location
      formDataToSend.append('address', formData.address);
      formDataToSend.append('city', formData.city);
      formDataToSend.append('district', formData.district);
      formDataToSend.append('postalCode', formData.postalCode);
      formDataToSend.append('latitude', formData.latitude.toString());
      formDataToSend.append('longitude', formData.longitude.toString());
      
      // Documents
      if (formData.siupFile) formDataToSend.append('siup', formData.siupFile);
      if (formData.nibFile) formDataToSend.append('nib', formData.nibFile);
      if (formData.npwpFile) formDataToSend.append('npwp', formData.npwpFile);
      if (formData.halalFile) formDataToSend.append('halal', formData.halalFile);
      
      // Operational hours
      formDataToSend.append('operationalHours', JSON.stringify(formData.operationalHours));
      
      // Bank account
      formDataToSend.append('bankName', formData.bankName);
      formDataToSend.append('bankAccountNumber', formData.bankAccountNumber);
      formDataToSend.append('bankAccountName', formData.bankAccountName);

      const response = await fetch('/api/merchant/register', {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) throw new Error('Gagal mendaftar');

      // Success - show success page
      router.push('/register-merchant/success');
    } catch (error) {
      alert('Gagal mendaftar sebagai merchant. Silakan coba lagi.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Bisnis <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                className={`w-full px-4 py-3 rounded-xl border ${errors.businessName ? 'border-red-500' : 'border-gray-200'} focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none`}
                placeholder="Misal: Warung Makan Sederhana"
              />
              {errors.businessName && (
                <p className="mt-1 text-sm text-red-500">{errors.businessName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deskripsi Bisnis
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none resize-none"
                placeholder="Ceritakan tentang bisnis Anda..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipe Masakan <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {CUISINE_TYPES.map((cuisine) => (
                  <button
                    key={cuisine}
                    type="button"
                    onClick={() => toggleCuisineType(cuisine)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      formData.cuisineTypes.includes(cuisine)
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {cuisine}
                  </button>
                ))}
              </div>
              {errors.cuisineTypes && (
                <p className="mt-2 text-sm text-red-500">{errors.cuisineTypes}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nomor Telepon <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={`w-full px-4 py-3 rounded-xl border ${errors.phone ? 'border-red-500' : 'border-gray-200'} focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none`}
                  placeholder="08123456789"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Bisnis <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full px-4 py-3 rounded-xl border ${errors.email ? 'border-red-500' : 'border-gray-200'} focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none`}
                  placeholder="bisnis@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                )}
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alamat Lengkap <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={3}
                className={`w-full px-4 py-3 rounded-xl border ${errors.address ? 'border-red-500' : 'border-gray-200'} focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none resize-none`}
                placeholder="Jl. Contoh No. 123, RT/RW 001/002"
              />
              {errors.address && (
                <p className="mt-1 text-sm text-red-500">{errors.address}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kota <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className={`w-full px-4 py-3 rounded-xl border ${errors.city ? 'border-red-500' : 'border-gray-200'} focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none`}
                  placeholder="Jakarta"
                />
                {errors.city && (
                  <p className="mt-1 text-sm text-red-500">{errors.city}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kecamatan
                </label>
                <input
                  type="text"
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none"
                  placeholder="Menteng"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kode Pos
                </label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none"
                  placeholder="10340"
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-blue-900 mb-1">Info Lokasi</h4>
                  <p className="text-sm text-blue-700">
                    Koordinat GPS akan otomatis terdeteksi. Pastikan browser Anda mengizinkan akses lokasi.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-yellow-900 mb-1">Dokumen yang Diperlukan</h4>
                  <p className="text-sm text-yellow-700">
                    Upload dokumen dalam format JPG, PNG, atau PDF. Maksimal 5MB per file.
                  </p>
                </div>
              </div>
            </div>

            {/* SIUP */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SIUP (Surat Izin Usaha Perdagangan) <span className="text-red-500">*</span>
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-red-500 transition-colors">
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => handleFileChange('siupFile', e.target.files?.[0] || null)}
                  className="hidden"
                  id="siup-upload"
                />
                <label htmlFor="siup-upload" className="cursor-pointer">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    {formData.siupFile ? formData.siupFile.name : 'Klik untuk upload SIUP'}
                  </p>
                </label>
              </div>
              {errors.siupFile && (
                <p className="mt-1 text-sm text-red-500">{errors.siupFile}</p>
              )}
            </div>

            {/* NIB */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                NIB (Nomor Induk Berusaha) <span className="text-red-500">*</span>
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-red-500 transition-colors">
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => handleFileChange('nibFile', e.target.files?.[0] || null)}
                  className="hidden"
                  id="nib-upload"
                />
                <label htmlFor="nib-upload" className="cursor-pointer">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    {formData.nibFile ? formData.nibFile.name : 'Klik untuk upload NIB'}
                  </p>
                </label>
              </div>
              {errors.nibFile && (
                <p className="mt-1 text-sm text-red-500">{errors.nibFile}</p>
              )}
            </div>

            {/* NPWP */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                NPWP (Opsional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-red-500 transition-colors">
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => handleFileChange('npwpFile', e.target.files?.[0] || null)}
                  className="hidden"
                  id="npwp-upload"
                />
                <label htmlFor="npwp-upload" className="cursor-pointer">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    {formData.npwpFile ? formData.npwpFile.name : 'Klik untuk upload NPWP'}
                  </p>
                </label>
              </div>
            </div>

            {/* Halal Certificate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sertifikat Halal (Opsional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-red-500 transition-colors">
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => handleFileChange('halalFile', e.target.files?.[0] || null)}
                  className="hidden"
                  id="halal-upload"
                />
                <label htmlFor="halal-upload" className="cursor-pointer">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    {formData.halalFile ? formData.halalFile.name : 'Klik untuk upload Sertifikat Halal'}
                  </p>
                </label>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-blue-900 mb-1">Atur Jam Operasional</h4>
                  <p className="text-sm text-blue-700">
                    Tentukan jam buka dan tutup untuk setiap hari dalam seminggu.
                  </p>
                </div>
              </div>
            </div>

            {formData.operationalHours.map((hour, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-4">
                  <div className="w-24">
                    <span className="font-medium text-gray-900">{DAYS_OF_WEEK[index]}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="checkbox"
                      checked={!hour.isClosed}
                      onChange={(e) => updateOperationalHour(index, 'isClosed', !e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <span className="text-sm text-gray-600">Buka</span>
                  </div>

                  {!hour.isClosed && (
                    <>
                      <input
                        type="time"
                        value={hour.openTime}
                        onChange={(e) => updateOperationalHour(index, 'openTime', e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none"
                      />
                      <span className="text-gray-500">-</span>
                      <input
                        type="time"
                        value={hour.closeTime}
                        onChange={(e) => updateOperationalHour(index, 'closeTime', e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none"
                      />
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <CreditCard className="w-5 h-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-green-900 mb-1">Informasi Rekening</h4>
                  <p className="text-sm text-green-700">
                    Rekening ini akan digunakan untuk menerima pembayaran dari pesanan.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Bank <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                className={`w-full px-4 py-3 rounded-xl border ${errors.bankName ? 'border-red-500' : 'border-gray-200'} focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none`}
              >
                <option value="">Pilih Bank</option>
                <option value="BCA">BCA</option>
                <option value="Mandiri">Mandiri</option>
                <option value="BNI">BNI</option>
                <option value="BRI">BRI</option>
                <option value="CIMB Niaga">CIMB Niaga</option>
                <option value="Permata">Permata</option>
                <option value="Danamon">Danamon</option>
                <option value="BSI">BSI (Bank Syariah Indonesia)</option>
              </select>
              {errors.bankName && (
                <p className="mt-1 text-sm text-red-500">{errors.bankName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nomor Rekening <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.bankAccountNumber}
                onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                className={`w-full px-4 py-3 rounded-xl border ${errors.bankAccountNumber ? 'border-red-500' : 'border-gray-200'} focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none`}
                placeholder="1234567890"
              />
              {errors.bankAccountNumber && (
                <p className="mt-1 text-sm text-red-500">{errors.bankAccountNumber}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Pemilik Rekening <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.bankAccountName}
                onChange={(e) => setFormData({ ...formData, bankAccountName: e.target.value })}
                className={`w-full px-4 py-3 rounded-xl border ${errors.bankAccountName ? 'border-red-500' : 'border-gray-200'} focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none`}
                placeholder="Nama sesuai rekening"
              />
              {errors.bankAccountName && (
                <p className="mt-1 text-sm text-red-500">{errors.bankAccountName}</p>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-red-50 via-white to-red-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Daftar Sebagai Merchant
          </h1>
          <p className="text-gray-600">
            Bergabunglah dengan platform kami dan kembangkan bisnis Anda
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;

              return (
                <div key={index} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : isActive
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-6 h-6" />
                      ) : (
                        <Icon className="w-6 h-6" />
                      )}
                    </div>
                    <span
                      className={`mt-2 text-xs text-center font-medium ${
                        isActive ? 'text-red-500' : isCompleted ? 'text-green-500' : 'text-gray-500'
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`h-1 flex-1 mx-2 rounded transition-all ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            {steps[currentStep].title}
          </h2>
          
          {renderStepContent()}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            {currentStep > 0 ? (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                Kembali
              </button>
            ) : (
              <div />
            )}

            {currentStep < steps.length - 1 ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
              >
                Lanjutkan
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-8 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Kirim Pendaftaran
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
