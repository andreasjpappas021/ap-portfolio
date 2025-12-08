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
  // Show cancel link if they have any paid subscription that's not cancelled
  // The cancel endpoint will handle finding the subscription even if subscription_id is missing
  const hasCancellableSubscription = purchases?.some(
    (p) => {
      const isNotCancelled = p.subscription_status !== 'cancelled'
      const isPaid = p.status === 'paid'
      
      // Can cancel if: paid and not cancelled
      // We'll show the link for any paid subscription, and the cancel endpoint will handle the rest
      return isPaid && isNotCancelled
    }
  ) || false

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

