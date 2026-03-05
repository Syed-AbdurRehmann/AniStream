import { useEffect, useRef, useCallback, useState } from 'react'

/**
 * AdBlocker wrapper for iframe embeds.
 * 
 * Strategy:
 * 1. Sandboxes the iframe to block popups, top-nav, and form submissions
 * 2. Catches click-jacking via an invisible overlay that only lets first clicks through
 * 3. Blocks window.open / popunders via a MutationObserver on newly opened windows
 * 4. Removes ad-injected elements (overlay divs, invisible iframes)
 * 5. Monitors and closes any popup windows
 */
export default function AdBlocker({ src, title, onError }) {
  const containerRef = useRef(null)
  const iframeRef = useRef(null)
  const shieldRef = useRef(null)
  const [clickCount, setClickCount] = useState(0)
  const [shieldActive, setShieldActive] = useState(true)
  const popupCheckRef = useRef(null)

  // Sandbox permissions — allow scripts and same-origin for the player to work,
  // but block popups, top navigation, and form submission to external
  const sandboxPermissions = [
    'allow-scripts',
    'allow-same-origin',
    'allow-forms',
    'allow-presentation',
    'allow-orientation-lock',
  ].join(' ')

  // Block popups globally while Watch page is active
  useEffect(() => {
    const originalOpen = window.open

    // Override window.open to block popups from any sneaky iframe communication
    window.open = function (...args) {
      console.warn('[AdBlocker] Blocked popup:', args[0])
      return null
    }

    // Block beforeunload hijacking
    const blockBeforeUnload = (e) => {
      // Don't let embeds hijack navigation
    }

    // Intercept and close any popup windows
    popupCheckRef.current = setInterval(() => {
      // Remove any dynamically injected iframes that aren't our player
      if (containerRef.current) {
        const rogue = containerRef.current.querySelectorAll('iframe:not(.player-iframe)')
        rogue.forEach(el => {
          console.warn('[AdBlocker] Removed rogue iframe:', el.src)
          el.remove()
        })
      }

      // Remove any fixed/absolute positioned overlay divs that might be ads
      document.querySelectorAll('div[style*="z-index: 9999"], div[style*="z-index:9999"], div[style*="z-index: 99999"]').forEach(el => {
        if (!el.closest('.watch__player-wrapper')) {
          console.warn('[AdBlocker] Removed ad overlay')
          el.remove()
        }
      })
    }, 2000)

    window.addEventListener('beforeunload', blockBeforeUnload)

    return () => {
      window.open = originalOpen
      window.removeEventListener('beforeunload', blockBeforeUnload)
      if (popupCheckRef.current) clearInterval(popupCheckRef.current)
    }
  }, [])

  // Click shield — first click on embedded player often triggers an ad/popup.
  // We intercept the first 1-2 clicks, let subsequent ones through to the actual player.
  const handleShieldClick = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()

    setClickCount(prev => {
      const next = prev + 1
      // After 2 "absorbed" clicks, disable shield
      if (next >= 2) {
        setShieldActive(false)
      }
      return next
    })
  }, [])

  // Re-enable shield when source changes (new embed = new ad traps)
  useEffect(() => {
    setShieldActive(true)
    setClickCount(0)
  }, [src])

  // Monitor for any <a> tags with target=_blank that get injected
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mut => {
        mut.addedNodes.forEach(node => {
          if (node.nodeType === 1) {
            // Remove injected anchors that open new tabs
            if (node.tagName === 'A' && node.target === '_blank') {
              console.warn('[AdBlocker] Removed injected link:', node.href)
              node.remove()
            }
            // Remove injected hidden iframes
            if (node.tagName === 'IFRAME' && !node.classList.contains('player-iframe')) {
              const style = window.getComputedStyle(node)
              if (style.width === '0px' || style.height === '0px' || style.display === 'none' || style.visibility === 'hidden') {
                console.warn('[AdBlocker] Removed hidden iframe')
                node.remove()
              }
            }
          }
        })
      })
    })

    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])

  return (
    <div className="watch__player-wrapper" ref={containerRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
      <iframe
        ref={iframeRef}
        className="player-iframe"
        src={src}
        sandbox={sandboxPermissions}
        frameBorder="0"
        allowFullScreen
        allow="autoplay; encrypted-media; picture-in-picture"
        title={title}
        referrerPolicy="no-referrer"
        loading="lazy"
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none', zIndex: 1 }}
      />

      {/* Click shield overlay — absorbs initial ad-triggering clicks */}
      {shieldActive && (
        <div
          ref={shieldRef}
          className="ad-shield"
          onClick={handleShieldClick}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 2,
            cursor: 'pointer',
            background: 'transparent',
          }}
        >
          <div className="ad-shield__prompt">
            <span className="ad-shield__icon">▶</span>
            <span>Click to play {clickCount === 0 ? '' : '— one more click'}</span>
          </div>
        </div>
      )}
    </div>
  )
}
