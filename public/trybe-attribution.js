// The Trybe pixel is loaded only after an explicit choice on the production site.
(() => {
  if (!['getmacrostack.com', 'www.getmacrostack.com'].includes(location.hostname)) return

  const choiceKey = 'macrostack-affiliate-tracking'
  const storeId = '0e887765-0edf-4b93-9d45-b709d1262196'
  let loaded = false

  function loadPixel() {
    if (loaded) return
    loaded = true
    window._trybe = window._trybe || {
      pixelCode: 'px_2d2bb3f3d1c6',
      storeId,
      platform: 'CUSTOM',
      autoTracking: 'false',
      customDomain: 'track.getmacrostack.com',
      serviceUrl: 'https://prod-trybe-platform-6mi3j.ondigitalocean.app/attribution',
    }
    const script = document.createElement('script')
    script.src = 'https://track.getmacrostack.com/pixel.js'
    script.async = true
    script.dataset.pixelCode = 'px_2d2bb3f3d1c6'
    script.dataset.storeId = storeId
    script.dataset.platform = 'CUSTOM'
    script.dataset.autoTracking = 'false'
    document.head.appendChild(script)
  }

  function setChoice(value) {
    localStorage.setItem(choiceKey, value)
    document.getElementById('macrostack-affiliate-consent')?.remove()
    if (value === 'accepted') loadPixel()
  }

  window.macrostackAffiliateTracking = { setChoice }
  if (localStorage.getItem(choiceKey) === 'accepted') {
    loadPixel()
    return
  }
  if (localStorage.getItem(choiceKey) === 'declined') return

  const notice = document.createElement('aside')
  notice.id = 'macrostack-affiliate-consent'
  notice.setAttribute('aria-label', 'Affiliate tracking choice')
  notice.style.cssText = 'position:fixed;z-index:2147483647;bottom:16px;left:16px;right:16px;max-width:620px;margin:auto;padding:16px 18px;background:#111827;color:#fff;border:1px solid #58617b;border-radius:14px;box-shadow:0 12px 36px #0008;font:14px/1.5 system-ui,sans-serif'
  notice.innerHTML = '<div style="font-weight:700;margin-bottom:4px">Affiliate tracking</div><div>With your permission, we use Trybe to credit creators when you visit MacroStack and purchase Pro. <a href="/privacy" style="color:#a5b4fc">Privacy details</a></div><div style="display:flex;gap:8px;margin-top:12px"><button type="button" data-choice="accepted" style="background:#6366f1;color:white;border:0;border-radius:7px;padding:7px 12px;cursor:pointer">Allow</button><button type="button" data-choice="declined" style="background:transparent;color:white;border:1px solid #7b849b;border-radius:7px;padding:7px 12px;cursor:pointer">No thanks</button></div>'
  notice.addEventListener('click', (event) => {
    const value = event.target.closest('button[data-choice]')?.dataset.choice
    if (value) setChoice(value)
  })
  document.body.appendChild(notice)
})()
