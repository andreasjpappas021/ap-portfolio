'use client'

import { useEffect } from 'react'

export default function CustomerIOScript() {
  useEffect(() => {
    // According to Customer.io docs: https://docs.customer.io/integrations/data-in/connections/javascript/in-app/
    // We need: 1) CDP API Key (for analytics.load), 2) Site ID (for siteId in integration config)
    const cioSiteId = process.env.NEXT_PUBLIC_CIO_SITE_ID
    const cioCdpApiKey = process.env.NEXT_PUBLIC_CIO_JS_KEY // This should be the CDP API Key
    const enableAnonInApp = process.env.NEXT_PUBLIC_CIO_ANON_INAPP === 'true'

    // Log environment check (helpful for debugging production issues)
    console.log('[Customer.io] Environment check:', {
      hasCdpKey: !!cioCdpApiKey,
      hasSiteId: !!cioSiteId,
      enableAnonInApp,
      env: process.env.NODE_ENV,
      cdpKeyLength: cioCdpApiKey?.length || 0,
      siteIdLength: cioSiteId?.length || 0,
    })

    if (!cioCdpApiKey || !cioSiteId) {
      console.error('[Customer.io] ❌ Missing configuration. Check NEXT_PUBLIC_CIO_JS_KEY and NEXT_PUBLIC_CIO_SITE_ID', {
        hasCdpKey: !!cioCdpApiKey,
        hasSiteId: !!cioSiteId,
        cdpKeyValue: cioCdpApiKey ? `${cioCdpApiKey.substring(0, 4)}...` : 'undefined',
        siteIdValue: cioSiteId || 'undefined',
        nodeEnv: process.env.NODE_ENV,
      })
      return
    }

    // Check if already loaded
    if ((window as any).cioanalytics && !Array.isArray((window as any).cioanalytics)) {
      return
    }

    // Base analytics snippet - exact format from Customer.io docs
    const baseSnippet = `!function(){var i="cioanalytics", analytics=(window[i]=window[i]||[]);if(!analytics.initialize)if(analytics.invoked)window.console&&console.error&&console.error("Snippet included twice.");else{analytics.invoked=!0;analytics.methods=["trackSubmit","trackClick","trackLink","trackForm","pageview","identify","reset","group","track","ready","alias","debug","page","once","off","on","addSourceMiddleware","addIntegrationMiddleware","setAnonymousId","addDestinationMiddleware"];analytics.factory=function(e){return function(){var t=Array.prototype.slice.call(arguments);t.unshift(e);analytics.push(t);return analytics}};for(var e=0;e<analytics.methods.length;e++){var key=analytics.methods[e];analytics[key]=analytics.factory(key)}analytics.load=function(key,e){var t=document.createElement("script");t.type="text/javascript";t.async=!0;t.setAttribute('data-global-customerio-analytics-key', i);t.src="https://cdp.customer.io/v1/analytics-js/snippet/" + key + "/analytics.min.js";t.onerror=function(){if(typeof console!=='undefined'&&console.error){console.error('[Customer.io] Failed to load SDK script')}};var n=document.getElementsByTagName("script")[0];n.parentNode.insertBefore(t,n);analytics._writeKey=key;analytics._loadOptions=e};analytics.SNIPPET_VERSION="4.15.3";`

    try {
      // Build integration config according to Customer.io docs
      // CDP API Key goes in analytics.load(), Site ID goes in integration config
      let loadCall
      if (enableAnonInApp && cioSiteId) {
        // Include in-app messaging plugin with siteId and anonymousInApp
        // Format matches Customer.io's snippet exactly
        loadCall = `analytics.load("${cioCdpApiKey}",{"integrations":{"Customer.io In-App Plugin":{"siteId":"${cioSiteId}","anonymousInApp":true}}});`
      } else if (cioSiteId) {
        // Include siteId but no anonymous messaging (required for in-app messages)
        loadCall = `analytics.load("${cioCdpApiKey}",{"integrations":{"Customer.io In-App Plugin":{"siteId":"${cioSiteId}"}}});`
      } else {
        // Basic load without in-app plugin (in-app messages won't work)
        loadCall = `analytics.load("${cioCdpApiKey}");`
      }

      // Page call - required for in-app messages to work
      const pageCall = `analytics.page();`
      const fullScript = baseSnippet + loadCall + pageCall + `}}();`
      
      eval(fullScript)
      console.log('[Customer.io] ✅ Script executed successfully', {
        cdpKey: `${cioCdpApiKey.substring(0, 4)}...`,
        siteId: cioSiteId,
        enableAnonInApp,
      })
    } catch (error: any) {
      console.error('[Customer.io] ❌ Error executing script:', error)
      console.error('[Customer.io] Error details:', {
        message: error?.message,
        stack: error?.stack,
        cdpKey: cioCdpApiKey ? `${cioCdpApiKey.substring(0, 4)}...` : 'missing',
        siteId: cioSiteId || 'missing',
      })
    }
  }, [])

  return null
}

