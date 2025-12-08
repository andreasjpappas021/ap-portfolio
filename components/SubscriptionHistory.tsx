'use client'

import Link from 'next/link'

type Purchase = {
  id: string
  created_at: string
  status: string
  subscription_status?: string | null
  stripe_subscription_id?: string | null
  stripe_customer_id?: string | null
}

type SubscriptionHistoryProps = {
  purchases: Purchase[]
  hasActiveSubscription: boolean
}

export default function SubscriptionHistory({
  purchases,
  hasActiveSubscription,
}: SubscriptionHistoryProps) {

  if (!purchases || purchases.length === 0) {
    return null
  }

  // Check if user has an active subscription that can be cancelled
  // Treat null subscription_status as active if there's a subscription_id or customer_id
  // (customer_id indicates a subscription checkout, even if subscription_id isn't set yet)
  const hasCancellableSubscription = purchases?.some(
    (p) => {
      const hasSubscriptionId = p.stripe_subscription_id !== null && p.stripe_subscription_id !== undefined
      const hasCustomerId = p.stripe_customer_id !== null && p.stripe_customer_id !== undefined
      const isNotCancelled = p.subscription_status !== 'cancelled'
      const isPaid = p.status === 'paid'
      
      // Can cancel if: paid, not cancelled, and has either subscription_id, customer_id, or hasActiveSubscription flag
      return isPaid && isNotCancelled && (hasSubscriptionId || hasCustomerId || hasActiveSubscription)
    }
  ) || false

  // Debug logging
  if (typeof window !== 'undefined') {
    console.log('[SubscriptionHistory] Debug:', {
      purchasesCount: purchases?.length,
      hasActiveSubscription,
      hasCancellableSubscription,
      purchases: purchases?.map(p => ({
        status: p.status,
        subscription_status: p.subscription_status,
        has_subscription_id: !!p.stripe_subscription_id,
        has_customer_id: !!p.stripe_customer_id,
        stripe_subscription_id: p.stripe_subscription_id,
        stripe_customer_id: p.stripe_customer_id,
      })),
    })
  }

  return (
    <>
      <div className="space-y-2 pt-4 border-t border-slate-700">
        <p className="text-slate-400 text-sm font-semibold">
          Subscription History
        </p>
        {purchases.slice(0, 3).map((purchase) => (
          <div
            key={purchase.id}
            className="flex items-center justify-between p-2 bg-slate-700/50 rounded"
          >
            <span className="text-slate-300 text-sm">
              {new Date(purchase.created_at).toLocaleDateString()}
            </span>
            <span
              className={`text-sm ${
                purchase.subscription_status === 'cancelled'
                  ? 'text-red-400'
                  : purchase.status === 'paid'
                  ? 'text-green-400'
                  : purchase.status === 'pending'
                  ? 'text-yellow-400'
                  : 'text-red-400'
              }`}
            >
              {purchase.subscription_status === 'cancelled'
                ? 'cancelled'
                : purchase.status}
            </span>
          </div>
        ))}
        {hasCancellableSubscription && (
          <p className="text-slate-400 text-xs mt-2">
            <Link
              href="/cancel"
              className="text-red-400 hover:text-red-300 underline transition-colors"
            >
              Want to cancel?
            </Link>
          </p>
        )}
      </div>
    </>
  )
}

