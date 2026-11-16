import { useState } from 'react'
import { useMutation } from '@apollo/client/react'
import { useTranslation } from 'react-i18next'
import {
  CreateEntryTemplateDocument,
  DeleteEntryTemplateDocument,
  EntryTemplatesDocument,
  UpdateEntryTemplateDocument,
  type EntryTemplateFieldsFragment,
  type EntryTemplateInput,
} from '../../graphql/__generated__/graphql'
import { useFormatters } from '../../i18n/useFormatters'
import { EntryTemplateForm } from '../EntryTemplateForm/EntryTemplateForm'
import './EntryTemplatesManager.css'

interface EntryTemplatesManagerProps {
  /** Already ordered by the API: default first, then most used. */
  templates: EntryTemplateFieldsFragment[]
}

// Reloading the templates also refreshes the entry page: both read the same cached User.entryTemplates.
const REFRESH_TEMPLATES = { refetchQueries: [EntryTemplatesDocument], awaitRefetchQueries: true }

export function EntryTemplatesManager({ templates }: EntryTemplatesManagerProps) {
  const { t } = useTranslation()
  const fmt = useFormatters()
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  const [createTemplate, { loading: saving }] = useMutation(CreateEntryTemplateDocument, REFRESH_TEMPLATES)
  const [updateTemplate, { loading: updating }] = useMutation(UpdateEntryTemplateDocument, REFRESH_TEMPLATES)
  const [deleteTemplate, { loading: deleting }] = useMutation(DeleteEntryTemplateDocument, REFRESH_TEMPLATES)

  /** "8h–12h, 13h–16h · 7h" or "Durée · 3h30" */
  function describe(template: EntryTemplateFieldsFragment): string {
    const total = template.durationMinutes !== null ? fmt.duration(template.durationMinutes) : null
    const parts =
      template.mode === 'DURATION'
        ? t('templates.duration')
        : template.slots.map((slot) => fmt.shiftRange(slot.startTime, slot.endTime)).join(', ')

    return total ? `${parts} · ${total}` : parts
  }

  /** Runs a mutation and records whether it failed. Returns whether it succeeded. */
  async function run(mutation: () => Promise<unknown>): Promise<boolean> {
    setFailed(false)

    try {
      await mutation()
      return true
    } catch {
      setFailed(true)
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
            submitLabel={t('templates.create')}
            busy={saving}
            onSubmit={handleCreate}
            onCancel={() => setCreating(false)}
          />
        </div>
      ) : (
        <button type="button" className="templates-new" onClick={() => setCreating(true)}>
          {t('templates.new')}
        </button>
      )}

      {templates.length === 0 ? (
        <p className="templates-empty">{t('templates.empty')}</p>
      ) : (
        <ul className="templates-list">
          {templates.map((template) => (
            <li
              key={template.id}
              className={editingId === template.id ? 'templates-item is-editing' : 'templates-item'}
            >
              {editingId === template.id ? (
                <EntryTemplateForm
                  template={template}
                  submitLabel={t('common.save')}
                  busy={updating}
                  onSubmit={(input) => handleUpdate(template.id, input)}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <>
                  <div className="templates-item-info">
                    <strong>
                      {template.label ?? t('common.unnamed')}
                      {template.isDefault && <span className="templates-badge">{t('templates.default')}</span>}
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
                          {deleting ? t('common.deleting') : t('common.confirm')}
                        </button>
                        <button
                          type="button"
                          className="templates-button-secondary"
                          onClick={() => setConfirmingDeleteId(null)}
                        >
                          {t('common.cancel')}
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
                          {t('common.edit')}
                        </button>
                        <button
                          type="button"
                          className="templates-button-ghost-danger"
                          onClick={() => setConfirmingDeleteId(template.id)}
                        >
                          {t('common.delete')}
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

      {failed && <p className="form-error">{t('common.operationFailed')}</p>}
    </div>
  )
}
