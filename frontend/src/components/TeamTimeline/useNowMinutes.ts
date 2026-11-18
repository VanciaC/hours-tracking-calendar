import { useEffect, useState } from 'react'

function minutesNow(): number {
  const now = new Date()

  return now.getHours() * 60 + now.getMinutes()
}

/** Minutes since midnight, refreshed every minute. */
export function useNowMinutes(): number {
  const [minutes, setMinutes] = useState(minutesNow)

  useEffect(() => {
    const timer = window.setInterval(() => setMinutes(minutesNow()), 60_000)

    return () => window.clearInterval(timer)
  }, [])

  return minutes
}
