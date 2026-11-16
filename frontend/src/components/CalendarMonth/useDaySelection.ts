import { useEffect, useMemo, useState, type MouseEvent, type PointerEvent } from 'react'
import { dateRange, withoutWeekends } from '../../lib/calendar'

interface Drag {
  anchor: string
  current: string
}

/**
 * Day selection in the calendar, confirmed from the selection bar:
 * - drag over days (mouse held down) adds every day in between;
 * - Shift + click adds or removes one day;
 * - Escape clears everything.
 * - Escape, or a click outside the days and the selection bar, clears everything.
 * - Drag over days (mouse held down) adds every working day in between, weekends skipped;
 * A simple click still opens the day.
 */
export function useDaySelection() {
  const [picked, setPicked] = useState<string[]>([])
  const [drag, setDrag] = useState<Drag | null>(null)

  // Dragging only selects working days: weekends inside the range are skipped.
  const dragged = useMemo(() => (drag ? withoutWeekends(dateRange(drag.anchor, drag.current)) : []), [drag])
  const selected = useMemo(() => new Set([...picked, ...dragged]), [picked, dragged])

  // A drag can end anywhere on the page, so listen on the whole window.
  useEffect(() => {
    if (!drag) return

    function handlePointerUp() {
      setDrag(null)

      // Released on the starting day: it was a simple click, the link opens the day.
      if (drag && drag.anchor !== drag.current) {
        const range = withoutWeekends(dateRange(drag.anchor, drag.current))
        setPicked((current) => [...new Set([...current, ...range])].sort())
      }
    }

    window.addEventListener('pointerup', handlePointerUp)
    return () => window.removeEventListener('pointerup', handlePointerUp)
  }, [drag])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setPicked([])
        setDrag(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Clicking anywhere but a day or the selection bar clears the selection, like in a file explorer.
  useEffect(() => {
    if (picked.length === 0) return

    function handlePointerDown(event: Event) {
      const target = event.target

      if (target instanceof Element && target.closest('[data-day], [data-selection-bar]')) {
        return
      }

      setPicked([])
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [picked.length])

  /** Props to spread on a day cell. */
  function dayProps(isoDate: string) {
    return {
      // Marks the element as a day, so a click on it never clears the selection.
      'data-day': isoDate,
      // Links are draggable by default: the browser would drag the URL instead of selecting days.
      draggable: false,
      onPointerDown(event: PointerEvent<HTMLElement>) {
        if (event.button !== 0 || event.shiftKey) return
        setDrag({ anchor: isoDate, current: isoDate })
      },
      onPointerEnter() {
        setDrag((current) => (current ? { ...current, current: isoDate } : current))
      },
      onClick(event: MouseEvent<HTMLElement>) {
        if (!event.shiftKey) return

        // Shift + click selects the day instead of opening it.
        event.preventDefault()
        setPicked((current) =>
          current.includes(isoDate) ? current.filter((date) => date !== isoDate) : [...current, isoDate].sort(),
        )
      },
    }
  }

  return { selected, picked, clearPicked: () => setPicked([]), dayProps }
}
