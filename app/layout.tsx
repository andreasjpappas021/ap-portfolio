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
  return (
    <html lang="en">
      <head>
        {cioKey ? (
          <Script id="customerio-website-source" strategy="beforeInteractive">
{`!function(){var i="cioanalytics", analytics=(window[i]=window[i]||[]);if(!analytics.initialize)if(analytics.invoked)window.console&&console.error&&console.error("Snippet included twice.");else{analytics.invoked=!0;analytics.methods=["trackSubmit","trackClick","trackLink","trackForm","pageview","identify","reset","group","track","ready","alias","debug","page","once","off","on","addSourceMiddleware","addIntegrationMiddleware","setAnonymousId","addDestinationMiddleware"];analytics.factory=function(e){return function(){var t=Array.prototype.slice.call(arguments);t.unshift(e);analytics.push(t);return analytics}};for(var e=0;e<analytics.methods.length;e++){var key=analytics.methods[e];analytics[key]=analytics.factory(key)}analytics.load=function(key,e){var t=document.createElement("script");t.type="text/javascript";t.async=!0;t.setAttribute('data-global-customerio-analytics-key', i);t.src="https://cdp.customer.io/v1/analytics-js/snippet/" + key + "/analytics.min.js";var n=document.getElementsByTagName("script")[0];n.parentNode.insertBefore(t,n);analytics._writeKey=key;analytics._loadOptions=e};analytics.SNIPPET_VERSION="4.15.3";

analytics.load(
  "${cioKey}"${enableAnonInApp ? `,
  {
    "integrations": {
      "Customer.io In-App Plugin": {
        anonymousInApp: true
      }
    }
  }` : ``}
);

analytics.page();
}}();`}
          </Script>
        ) : null}
      </head>
      <body>
        <CustomerIOProvider />
        {children}
      </body>
    </html>
  )
}
