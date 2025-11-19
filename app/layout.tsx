import type { Metadata } from 'next'
import './globals.css'
import Script from 'next/script'
import CustomerIOProvider from '@/components/customerio-provider'

export const metadata: Metadata = {
  title: 'Andreas Pappas - Senior Product Manager',
  description: 'Senior Product Manager crafting data-driven experiences that users love. View my portfolio of product strategy, growth, and user experience projects.',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cioKey = process.env.NEXT_PUBLIC_CIO_JS_KEY
  const enableAnonInApp = process.env.NEXT_PUBLIC_CIO_ANON_INAPP === 'true'
  const cioSiteId = process.env.NEXT_PUBLIC_CIO_SITE_ID
  
  // Build the analytics.load() call string
  // Only enable In-App Plugin if siteId is provided (required for the plugin)
  const loadCall = enableAnonInApp && cioSiteId
    ? `analytics.load("${cioKey}",{"integrations":{"Customer.io In-App Plugin":{"anonymousInApp":true,"siteId":"${cioSiteId}"}}});`
    : `analytics.load("${cioKey}");`
  
  return (
    <html lang="en">
      <head>
        {cioKey ? (
          <script
            id="customerio-website-source"
            dangerouslySetInnerHTML={{
              __html: `!function(){var i="cioanalytics", analytics=(window[i]=window[i]||[]);if(!analytics.initialize)if(analytics.invoked)window.console&&console.error&&console.error("Snippet included twice.");else{analytics.invoked=!0;analytics.methods=["trackSubmit","trackClick","trackLink","trackForm","pageview","identify","reset","group","track","ready","alias","debug","page","once","off","on","addSourceMiddleware","addIntegrationMiddleware","setAnonymousId","addDestinationMiddleware"];analytics.factory=function(e){return function(){var t=Array.prototype.slice.call(arguments);t.unshift(e);analytics.push(t);return analytics}};for(var e=0;e<analytics.methods.length;e++){var key=analytics.methods[e];analytics[key]=analytics.factory(key)}analytics.load=function(key,e){var t=document.createElement("script");t.type="text/javascript";t.async=!0;t.setAttribute('data-global-customerio-analytics-key', i);t.src="https://cdp.customer.io/v1/analytics-js/snippet/" + key + "/analytics.min.js";var n=document.getElementsByTagName("script")[0];n.parentNode.insertBefore(t,n);analytics._writeKey=key;analytics._loadOptions=e};analytics.SNIPPET_VERSION="4.15.3";${loadCall}analytics.ready(function(){console.log('[Customer.io] Initialized successfully',window.cioanalytics)});analytics.page();}}();`
            }}
          />
        ) : (
          <script
            id="customerio-debug-missing-key"
            dangerouslySetInnerHTML={{
              __html: `console.warn('[Customer.io] Script not rendered - NEXT_PUBLIC_CIO_JS_KEY is missing or falsy');`
            }}
          />
        )}
      </head>
      <body>
        <CustomerIOProvider />
        {children}
      </body>
    </html>
  )
}
