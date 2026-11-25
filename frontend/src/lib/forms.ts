/**
 * After a refused submit: moves the focus (and the screen) to the first field in error,
 * once React has shown the errors. Called from the submit handler.
 */
export function focusFirstInvalid(form: HTMLFormElement | null) {
  requestAnimationFrame(() => {
    const field = form?.querySelector<HTMLElement>('[aria-invalid="true"]')

    field?.focus()
    field?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  })
}
