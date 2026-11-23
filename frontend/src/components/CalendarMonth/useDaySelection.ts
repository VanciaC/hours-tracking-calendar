import { useEffect, useMemo, useRef, useState, type MouseEvent, type PointerEvent, type SyntheticEvent } from 'react'
import { dateRange, withoutWeekends } from '../../lib/calendar'

interface Drag {
  anchor: string
  current: string
}

interface Press {
  timer: number
  x: number
  y: number
}

/** How long a finger stays on a day before the selection starts. */
const LONG_PRESS_MS = 400
/** A finger moving further than this before the long press is scrolling the page. */
const MOVE_TOLERANCE_PX = 10
/** After a long press, the browser may still send a click: ignored for this long. */
const CLICK_GUARD_MS = 400

/** Stops a pending long press, if any. */
function clearPress(press: { current: Press | null }) {
  if (press.current) {
    window.clearTimeout(press.current.timer)
    press.current = null
  }
}

/** The days a drag covers: every working day in between, or the single day pressed. */
function draggedDays({ anchor, current }: Drag): string[] {
  return anchor === current ? [anchor] : withoutWeekends(dateRange(anchor, current))
}

/**
 * Day selection in the calendar, confirmed from the selection bar.
 * - Mouse: drag over days (button held down) adds every working day in between, weekends skipped.
 * - Mouse: Shift + click adds or removes one day.
 * - Touch: press and hold a day, then slide over the others without lifting the finger.
 * - Escape, or a click outside the days and the selection bar, clears everything.
 * A simple click or tap still opens the day.
 */
export function useDaySelection() {
  const [picked, setPicked] = useState<string[]>([])
  const [drag, setDrag] = useState<Drag | null>(null)
  // A finger is selecting days: the page must not scroll under it.
  const [touchSelecting, setTouchSelecting] = useState(false)

  const dragRef = useRef<Drag | null>(null)
  const press = useRef<Press | null>(null)
  const ignoreClick = useRef(false)

  useEffect(() => {
    dragRef.current = drag
  }, [drag])

  // Dragging only selects working days: weekends inside the range are skipped.
  const dragged = useMemo(() => (drag ? withoutWeekends(dateRange(drag.anchor, drag.current)) : []), [drag])
  const selected = useMemo(() => new Set([...picked, ...dragged]), [picked, dragged])

  function cancelPress() {
    clearPress(press)
  }

  // A pending long press never outlives the calendar.
  useEffect(() => {
    const pending = press
    return () => clearPress(pending)
  }, [])

  // Mouse: a drag can end anywhere on the page, so listen on the whole window.
  useEffect(() => {
    if (!drag) return

    function handlePointerUp(event: globalThis.PointerEvent) {
      // A finger selection ends on touchend, below.
      if (event.pointerType === 'touch') return

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

  // Touch: once the long press started a selection, the finger moves over the days.
  useEffect(() => {
    if (!touchSelecting) return

    function handleTouchMove(event: TouchEvent) {
      // Selecting, not scrolling.
      event.preventDefault()

      const touch = event.touches[0]
      if (!touch) return

      // The finger stays attached to the first day: find the day really under it.
      const day = document.elementFromPoint(touch.clientX, touch.clientY)?.closest<HTMLElement>('[data-day]')
        ?.dataset.day

      if (day) {
        setDrag((current) => (current && current.current !== day ? { ...current, current: day } : current))
      }
    }

    function handleTouchEnd() {
      const finished = dragRef.current

      setTouchSelecting(false)
      setDrag(null)

      // Unlike a mouse click, a long press on a single day selects it.
      if (finished) {
        const days = draggedDays(finished)
        setPicked((current) => [...new Set([...current, ...days])].sort())
      }

      window.setTimeout(() => {
        ignoreClick.current = false
      }, CLICK_GUARD_MS)
    }

    // passive: false, or the browser ignores preventDefault and scrolls anyway.
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', handleTouchEnd)
    window.addEventListener('touchcancel', handleTouchEnd)

    return () => {
      document.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
      window.removeEventListener('touchcancel', handleTouchEnd)
    }
  }, [touchSelecting])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        clearPress(press)
        setPicked([])
        setDrag(null)
        setTouchSelecting(false)
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
        if (event.pointerType === 'touch') {
          // Touch: the selection starts only after a long press, a quick swipe still scrolls.
          cancelPress()
          press.current = {
            x: event.clientX,
            y: event.clientY,
            timer: window.setTimeout(() => {
              press.current = null
              ignoreClick.current = true
              setDrag({ anchor: isoDate, current: isoDate })
              setTouchSelecting(true)
              navigator.vibrate?.(15)
            }, LONG_PRESS_MS),
          }
          return
        }

        if (event.button !== 0 || event.shiftKey) return
        setDrag({ anchor: isoDate, current: isoDate })
      },
      onPointerMove(event: PointerEvent<HTMLElement>) {
        // The finger moved before the long press: the user is scrolling.
        if (
          press.current &&
          Math.hypot(event.clientX - press.current.x, event.clientY - press.current.y) > MOVE_TOLERANCE_PX
        ) {
          cancelPress()
        }
      },
      // Lifted before the long press (a tap), or taken over by the browser's scrolling.
      onPointerUp: cancelPress,
      onPointerCancel: cancelPress,
      onPointerEnter() {
        setDrag((current) => (current ? { ...current, current: isoDate } : current))
      },
      onContextMenu(event: SyntheticEvent) {
        // A long press on a link opens the browser's menu: not while selecting days.
        if (press.current || ignoreClick.current) event.preventDefault()
      },
      onClick(event: MouseEvent<HTMLElement>) {
        // The long press selected the day: the click that may follow must not open it.
        if (ignoreClick.current) {
          event.preventDefault()
          return
        }

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
