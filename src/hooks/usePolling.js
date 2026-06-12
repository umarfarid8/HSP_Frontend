import { useEffect, useRef } from 'react'

/**
 * Runs `callback` immediately, then every `interval` milliseconds.
 * Stops when `active` is false or the component unmounts.
 *
 * Usage:
 *   usePolling(fetchMessages, 5000)           // always active
 *   usePolling(fetchMessages, 5000, isOpen)   // only when chat is open
 */
export function usePolling(callback, interval, active = true) {
  // Keep a ref to always call the latest version of callback
  // without needing it in the dependency array
  const savedCallback = useRef(callback)

  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  useEffect(() => {
    if (!active) return

    const tick = () => savedCallback.current()
    tick()  // Run immediately on mount / when activated

    const id = setInterval(tick, interval)
    return () => clearInterval(id)
  }, [interval, active])
}