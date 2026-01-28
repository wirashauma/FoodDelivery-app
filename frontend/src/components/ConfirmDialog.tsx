'use client';

import { Fragment } from 'react';
import { AlertTriangle, Trash2, Check, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  type = 'danger',
  loading = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const typeStyles = {
    danger: {
      icon: Trash2,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      buttonBg: 'bg-red-600 hover:bg-red-700',
    },
    warning: {
      icon: AlertTriangle,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      buttonBg: 'bg-amber-600 hover:bg-amber-700',
    },
    info: {
      icon: Check,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      buttonBg: 'bg-blue-600 hover:bg-blue-700',
    },
  };

  const styles = typeStyles[type];
  const Icon = styles.icon;

  return (
    <Fragment>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
        <div
          className="bg-white rounded-xl sm:rounded-2xl shadow-xl max-w-md w-full transform transition-all animate-fadeIn"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center gap-3 sm:gap-4 p-4 sm:p-6 pb-0">
            <div className={`p-2.5 sm:p-3 rounded-lg sm:rounded-xl ${styles.iconBg}`}>
              <Icon size={20} className={`sm:w-6 sm:h-6 ${styles.iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">{title}</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={18} className="sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 sm:p-6">
            <p className="text-sm sm:text-base text-gray-600">{message}</p>
          </div>

          {/* Footer */}
          <div className="flex gap-2 sm:gap-3 p-4 sm:p-6 pt-0">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg sm:rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`flex-1 px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-white rounded-lg sm:rounded-xl font-medium transition-colors disabled:opacity-50 ${styles.buttonBg}`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span className="hidden xs:inline">Memproses...</span>
                </span>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </Fragment>
  );
}
