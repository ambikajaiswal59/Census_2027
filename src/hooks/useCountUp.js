// src/hooks/useCountUp.js
import { useEffect, useState } from 'react'

export default function useCountUp(rawValue, { duration = 1400 } = {}) {
  const str = String(rawValue)
  const match = str.match(/-?[\d,]*\.?\d+/)
  const numericEnd = match ? Number(match[0].replace(/,/g, '')) : NaN
  const prefix = match ? str.slice(0, match.index) : ''
  const suffix = match ? str.slice(match.index + match[0].length) : ''
  const decimals = match && match[0].includes('.') ? match[0].split('.')[1].length : 0

  const [display, setDisplay] = useState(prefix + '0' + suffix)

  useEffect(() => {
    if (isNaN(numericEnd)) {
      setDisplay(str) // not a number at all, just show as-is
      return
    }

    let startTime = null
    let frameId
    const easeOutQuad = (t) => t * (2 - t)

    const step = (timestamp) => {
      if (startTime === null) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const eased = easeOutQuad(progress)
      const current = eased * numericEnd

      const formatted = decimals > 0
        ? current.toFixed(decimals)
        : Math.floor(current).toLocaleString('en-IN')

      setDisplay(prefix + formatted + suffix)

      if (progress < 1) {
        frameId = requestAnimationFrame(step)
      } else {
        const final = decimals > 0 ? numericEnd.toFixed(decimals) : numericEnd.toLocaleString('en-IN')
        setDisplay(prefix + final + suffix)
      }
    }

    frameId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frameId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawValue])

  return display
}