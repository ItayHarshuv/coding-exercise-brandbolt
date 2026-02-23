type OrderNotesSectionProps = {
  isEditing: boolean;
  notesDraft: string;
  originalNotes: string | null;
  saveLoading: boolean;
  onEdit: () => void;
  onNotesChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
};

export default function OrderNotesSection({
  isEditing,
  notesDraft,
  originalNotes,
  saveLoading,
  onEdit,
  onNotesChange,
  onSave,
  onCancel,
}: OrderNotesSectionProps) {
  return (
    <div className="detail-section mb-lg">
      <div className="detail-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Notes
        {!isEditing && (
          <button className="btn btn-ghost btn-sm" type="button" onClick={onEdit}>
            Edit
          </button>
        )}
      </div>
      {isEditing ? (
        <div className="flex flex-col gap-md">
          <textarea
            className="form-textarea"
            value={notesDraft}
            onChange={(event) => onNotesChange(event.target.value)}
            rows={4}
          />
          <div className="flex gap-sm">
            <button className="btn btn-primary btn-sm" type="button" onClick={onSave} disabled={saveLoading}>
              {saveLoading ? 'Saving...' : 'Save'}
            </button>
            <button className="btn btn-secondary btn-sm" type="button" onClick={onCancel} disabled={saveLoading}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className="text-secondary">{originalNotes || 'No notes'}</p>
      )}
    </div>
  );
}
