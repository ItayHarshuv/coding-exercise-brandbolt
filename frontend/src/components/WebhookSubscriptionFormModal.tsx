import { FormEvent } from 'react';

export type WebhookFormState = {
  url: string;
  secret: string;
  events: string[];
  isActive: boolean;
};

type WebhookSubscriptionFormModalProps = {
  isOpen: boolean;
  title: string;
  form: WebhookFormState;
  eventOptions: string[];
  saving: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
  onFormChange: (nextForm: WebhookFormState) => void;
};

export default function WebhookSubscriptionFormModal({
  isOpen,
  title,
  form,
  eventOptions,
  saving,
  onClose,
  onSubmit,
  onFormChange,
}: WebhookSubscriptionFormModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="btn btn-ghost btn-sm" type="button" onClick={onClose} disabled={saving}>
            &#10005;
          </button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">URL</label>
              <input
                className="form-input"
                type="url"
                value={form.url}
                onChange={(event) => onFormChange({ ...form, url: event.target.value })}
                placeholder="https://example.com/webhook"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Secret</label>
              <input
                className="form-input"
                value={form.secret}
                onChange={(event) => onFormChange({ ...form, secret: event.target.value })}
                placeholder="Webhook signing secret"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Events</label>
              <div className="form-checkbox-group">
                {eventOptions.map((eventName) => (
                  <label
                    key={eventName}
                    className={`form-checkbox-label${form.events.includes(eventName) ? ' checked' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={form.events.includes(eventName)}
                      onChange={(event) =>
                        onFormChange({
                          ...form,
                          events: event.target.checked
                            ? [...form.events, eventName]
                            : form.events.filter((current) => current !== eventName),
                        })
                      }
                    />
                    {eventName}
                  </label>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) => onFormChange({ ...form, isActive: event.target.checked })}
                />
                <span className="toggle-track"></span>
                Active
              </label>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" type="button" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
