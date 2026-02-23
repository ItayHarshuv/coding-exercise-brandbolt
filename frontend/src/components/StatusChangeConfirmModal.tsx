import { ReactNode } from "react";

type StatusChangeConfirmModalProps = {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  confirmLabel?: string;
  loading?: boolean;
  children: ReactNode;
};

export default function StatusChangeConfirmModal({
  isOpen,
  title,
  onClose,
  onConfirm,
  confirmLabel = "Confirm",
  loading = false,
  children,
}: StatusChangeConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button
            className="btn btn-ghost btn-sm"
            type="button"
            onClick={onClose}
            disabled={loading}
          >
            &#10005;
          </button>
        </div>
        <div className="modal-body">{children}</div>
        <div className="modal-footer">
          <button
            className="btn btn-secondary"
            type="button"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="btn btn-accent"
            type="button"
            onClick={() => void onConfirm()}
            disabled={loading}
          >
            {loading ? "Updating..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
