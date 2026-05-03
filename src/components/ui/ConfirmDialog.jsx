import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal, ModalFooter } from './Modal';
import { Button } from './Button';

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'destructive',
  loading = false,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-danger/10 flex items-center justify-center shrink-0">
          <AlertTriangle size={20} className="text-danger" />
        </div>
        <p className="text-sm text-gray-300 pt-2">{message}</p>
      </div>

      <ModalFooter>
        <Button variant="ghost" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          variant={variant}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? 'Processing...' : confirmLabel}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
