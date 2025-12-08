import { requireAuth } from '@/lib/auth'
import { trackEvent } from '@/lib/customerio-server'
import { logAuditEvent } from '@/lib/audit'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, TrendingUp, Users, Target } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import CancelButton from '@/components/CancelButton'

type CancelPageProps = {
  searchParams: Promise<{ applied_discount?: string }>
}

export default async function CancelPage({ searchParams }: CancelPageProps) {
  const user = await requireAuth()
  const params = await searchParams
  const appliedDiscount = params?.applied_discount === 'true'

  // Track cancellation page viewed event
  await trackEvent(user.id, 'cancellation_page_viewed', {
    timestamp: new Date().toISOString(),
  })
  await logAuditEvent(user.id, 'cancellation_page_viewed', {
    timestamp: new Date().toISOString(),
  })

  // Track discount applied if returning from portal
  if (appliedDiscount) {
    await trackEvent(user.id, 'discount_applied', {
      timestamp: new Date().toISOString(),
      source: 'portal',
    })
    await logAuditEvent(user.id, 'discount_applied', {
      timestamp: new Date().toISOString(),
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">
            Are you sure you want to cancel?
          </h1>
          <p className="text-slate-300">
            We'd hate to see you go. Here's what you'll be missing out on.
          </p>
        </div>

        <Card className="bg-slate-800/50 border-slate-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Results You've Been Getting</CardTitle>
            <CardDescription className="text-slate-400">
              Product leaders who work with us see measurable improvements
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">
                    40% Improvement in Feature Prioritization
                  </h3>
                  <p className="text-slate-400 text-sm">
                    Better decision-making on what to build next
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">
                    Better Stakeholder Alignment
                  </h3>
                  <p className="text-slate-400 text-sm">
                    Clearer communication and buy-in from your team
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Target className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">
                    Clearer Product Strategy
                  </h3>
                  <p className="text-slate-400 text-sm">
                    A roadmap that aligns with business goals
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">
                    Enhanced Leadership Skills
                  </h3>
                  <p className="text-slate-400 text-sm">
                    Confidence in leading product decisions
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {appliedDiscount && (
          <Alert className="bg-green-500/20 border-green-500/50 mb-6">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <AlertDescription className="text-green-400">
              Great! Your discount has been applied. Your subscription will continue with the discounted rate.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-4 justify-center">
          <Button
            asChild
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <Link href="/dashboard">Keep My Subscription</Link>
          </Button>
          <CancelButton />
        </div>
      </div>
    </div>
  )
}

