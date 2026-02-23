import { WebhookDelivery } from '../types';

type WebhookTestResultModalProps = {
  result: WebhookDelivery | null;
  onClose: () => void;
};

export default function WebhookTestResultModal({ result, onClose }: WebhookTestResultModalProps) {
  if (!result) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Test Result</h2>
          <button className="btn btn-ghost btn-sm" type="button" onClick={onClose}>
            &#10005;
          </button>
        </div>
        <div className="test-result-body">
          <div className="flex items-center gap-md">
            <span className={`badge ${result.success ? 'badge-success' : 'badge-failure'}`}>
              {result.success ? 'Success' : 'Failed'}
            </span>
            <span className="text-secondary text-sm">
              Status: {result.statusCode ?? 'N/A'}
            </span>
          </div>
          <div className="form-group">
            <label className="form-label">Event</label>
            <span className="event-tag">{result.event}</span>
          </div>
          <div className="form-group">
            <label className="form-label">Response Body</label>
            <p className="text-secondary text-sm">{result.responseBody ?? 'N/A'}</p>
          </div>
          <div className="form-group">
            <label className="form-label">Payload</label>
            <pre>{JSON.stringify(result.payload, null, 2)}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
