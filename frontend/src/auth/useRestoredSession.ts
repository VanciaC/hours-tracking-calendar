import { useEffect, useState } from 'react'
import { session } from './session'

/** False until the page load has tried to restore the session from the refresh cookie. */
export function useRestoredSession(): boolean {
  const [restored, setRestored] = useState(false)

  useEffect(() => {
    let active = true

    // Safe twice under StrictMode: restore() only refreshes once.
    void session.restore().then(() => {
      if (active) {
        setRestored(true)
      }
    })

    return () => {
      active = false
    }
  }, [])

  return restored
}
