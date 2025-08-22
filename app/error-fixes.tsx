// This file contains common error fixes for the dark mode implementation

// 1. If you're seeing rendering errors with Image component:
import Image from "next/image"

// Correct implementation with proper fill and sizes props
export function FixedImageComponent() {
  return (
    <div className="relative aspect-[4/3] lg:aspect-auto">
      <Image
        src="/placeholder.svg?height=400&width=300"
        alt="Project screenshot"
        fill
        sizes="(max-width: 768px) 100vw, 50vw"
        className="object-cover"
      />
    </div>
  )
}

// 2. If you're seeing errors with gradient backgrounds:
export function FixedGradientBackground() {
  // Use this instead of complex data URLs that might cause errors
  return (
    <div className="relative py-20 px-6 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600">
      {/* Simple overlay pattern */}
      <div className="absolute inset-0 bg-slate-900 opacity-10 pattern-dots pattern-size-2 pattern-opacity-10"></div>
      <div className="relative z-10">{/* Content goes here */}</div>
    </div>
  )
}

// 3. If you're seeing errors with the backdrop blur:
export function FixedBackdropBlur() {
  return (
    <nav className="sticky top-0 z-50 bg-slate-900/80 border-b border-slate-700">
      <div className="backdrop-blur-md w-full h-full absolute inset-0"></div>
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-4">{/* Navigation content */}</div>
    </nav>
  )
}
