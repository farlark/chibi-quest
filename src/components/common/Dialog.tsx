// 確認對話框組件
import { ReactNode } from 'react';
import Button from './Button';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message?: string;
  children?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  showCancel?: boolean;
}

export default function Dialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  children,
  confirmText = '確認',
  cancelText = '取消',
  variant = 'info',
  showCancel = true,
}: DialogProps) {
  if (!isOpen) return null;

  const iconMap = {
    danger: '⚠️',
    warning: '⚡',
    info: 'ℹ️',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black bg-opacity-70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 對話框內容 */}
      <div className="relative bg-gray-900 rounded-lg shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden slide-up">
        <div className="p-6">
          <div className="text-center mb-4">
            <div className="text-5xl mb-3">{iconMap[variant]}</div>
            <h2 className="text-2xl font-bold text-white">{title}</h2>
          </div>

          {/* 內容區域 - 可滾動 */}
          <div className="max-h-[60vh] overflow-y-auto mb-6">
            {children ? children : message && <p className="text-gray-300 text-center">{message}</p>}
          </div>

          {/* 按鈕區域 */}
          <div className="flex gap-3">
            {showCancel && (
              <Button variant="secondary" fullWidth onClick={onClose}>
                {cancelText}
              </Button>
            )}
            <Button
              variant={variant === 'danger' ? 'danger' : 'primary'}
              fullWidth
              onClick={() => {
                if (onConfirm) onConfirm();
                onClose();
              }}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
