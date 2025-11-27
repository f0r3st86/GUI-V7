// Reusable Modal component with theme support
import React, { ReactNode } from 'react';
import { useTheme } from '../../context';
import { Button } from './Button';

interface ModalProps {
  show: boolean;
  title: string;
  children: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'default' | 'primary' | 'danger' | 'success';
}

export const Modal: React.FC<ModalProps> = ({
  show,
  title,
  children,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'danger'
}) => {
  const { styles } = useTheme();

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`${styles.sectionBg} rounded-lg p-6 max-w-md w-full mx-4 ${styles.borderColor} border`}>
        <h3 className={`text-lg font-medium ${styles.textPrimary} mb-4`}>{title}</h3>
        <div className={`${styles.textSecondary} mb-6`}>
          {children}
        </div>
        <div className="flex justify-end space-x-3">
          <Button variant="default" onClick={onCancel}>
            {cancelText}
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm}>
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

// Delete confirmation modal - common pattern
interface DeleteModalProps {
  show: boolean;
  itemName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteModal: React.FC<DeleteModalProps> = ({
  show,
  itemName,
  onConfirm,
  onCancel
}) => {
  return (
    <Modal
      show={show}
      title="Confirm Delete"
      onConfirm={onConfirm}
      onCancel={onCancel}
      confirmText="Delete"
      confirmVariant="danger"
    >
      <p>
        Are you sure you want to delete <span className="font-medium">{itemName || '(New)'}</span>?
        <br />
        <span className="text-xs mt-2 block">This action cannot be undone.</span>
      </p>
    </Modal>
  );
};
