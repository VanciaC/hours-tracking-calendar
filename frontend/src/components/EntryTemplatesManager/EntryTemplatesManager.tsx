import { useState } from 'react'
import { useMutation } from '@apollo/client/react'
import {
  CREATE_ENTRY_TEMPLATE_MUTATION,
  DELETE_ENTRY_TEMPLATE_MUTATION,
  ENTRY_TEMPLATES_QUERY,
  UPDATE_ENTRY_TEMPLATE_MUTATION,
  type EntryTemplateDetail,
  type EntryTemplateInput,
} from '../../graphql/planning'
import { formatDuration } from '../../lib/calendar'
import { EntryTemplateForm } from '../EntryTemplateForm/EntryTemplateForm'
import './EntryTemplatesManager.css'

interface EntryTemplatesManagerProps {
  /** Already ordered by the API: default first, then most used. */
  templates: EntryTemplateDetail[]
}

// Reloading the templates also refreshes the entry page: both read the same cached User.entryTemplates.
const REFRESH_TEMPLATES = { refetchQueries: [ENTRY_TEMPLATES_QUERY], awaitRefetchQueries: true }

/** "08:00-12:00, 13:00-16:00 · 7h" or "Durée · 3h30" */
function describe(template: EntryTemplateDetail): string {
  const total = template.durationMinutes !== null ? formatDuration(template.durationMinutes) : null

  if (template.mode === 'DURATION') {
    return total ? `Durée · ${total}` : 'Durée'
  }

  const slots = template.slots.map((slot) => `${slot.startTime}-${slot.endTime}`).join(', ')

  return total ? `${slots} · ${total}` : slots
}

export function EntryTemplatesManager({ templates }: EntryTemplatesManagerProps) {
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [createTemplate, { loading: saving }] = useMutation(CREATE_ENTRY_TEMPLATE_MUTATION, REFRESH_TEMPLATES)
  const [updateTemplate, { loading: updating }] = useMutation(UPDATE_ENTRY_TEMPLATE_MUTATION, REFRESH_TEMPLATES)
  const [deleteTemplate, { loading: deleting }] = useMutation(DELETE_ENTRY_TEMPLATE_MUTATION, REFRESH_TEMPLATES)

  /** Runs a mutation and turns any failure into a message. Returns whether it succeeded. */
  async function run(mutation: () => Promise<unknown>): Promise<boolean> {
    setError(null)

    try {
      await mutation()
      return true
    } catch {
      setError("L'opération a échoué. Réessaie dans un instant.")
      return false
    }
  }

  async function handleCreate(input: EntryTemplateInput) {
    if (await run(() => createTemplate({ variables: { input } }))) {
      setCreating(false)
    }
  }

  async function handleUpdate(id: string, input: EntryTemplateInput) {
    if (await run(() => updateTemplate({ variables: { id, input } }))) {
      setEditingId(null)
    }
  }

  async function handleDelete(id: string) {
    if (await run(() => deleteTemplate({ variables: { id } }))) {
      setConfirmingDeleteId(null)
    }
  }

  return (
    <div className="templates-manager">
      {creating ? (
        <div className="templates-panel">
          <EntryTemplateForm
            template={null}
            submitLabel="Créer le modèle"
            busy={saving}
            onSubmit={handleCreate}
            onCancel={() => setCreating(false)}
          />
        </div>
      ) : (
        <button type="button" className="templates-new" onClick={() => setCreating(true)}>
          + Nouveau modèle
        </button>
      )}

      {templates.length === 0 ? (
        <p className="templates-empty">Aucun modèle pour l'instant.</p>
      ) : (
        <ul className="templates-list">
          {templates.map((template) => (
            <li key={template.id} className={editingId === template.id ? 'templates-item is-editing' : 'templates-item'}>
              {editingId === template.id ? (
                <EntryTemplateForm
                  template={template}
                  submitLabel="Enregistrer"
                  busy={updating}
                  onSubmit={(input) => handleUpdate(template.id, input)}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <>
                  <div className="templates-item-info">
                    <strong>
                      {template.label ?? 'Sans nom'}
                      {template.isDefault && <span className="templates-badge">Par défaut</span>}
                    </strong>
                    <span>{describe(template)}</span>
                  </div>

                  <div className="templates-item-actions">
                    {confirmingDeleteId === template.id ? (
                      <>
                        <button
                          type="button"
                          className="templates-button-danger"
                          disabled={deleting}
                          onClick={() => handleDelete(template.id)}
                        >
                          {deleting ? 'Suppression…' : 'Confirmer'}
                        </button>
                        <button
                          type="button"
                          className="templates-button-secondary"
                          onClick={() => setConfirmingDeleteId(null)}
                        >
                          Annuler
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="templates-button-secondary"
                          onClick={() => {
                            setEditingId(template.id)
                            setConfirmingDeleteId(null)
                          }}
                        >
                          Modifier
                        </button>
                        <button
                          type="button"
                          className="templates-button-ghost-danger"
                          onClick={() => setConfirmingDeleteId(template.id)}
                        >
                          Supprimer
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {error && <p className="form-error">{error}</p>}
    </div>
  )
}