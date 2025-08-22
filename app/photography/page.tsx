'use client'

import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import Link from "next/link"

// Define the album type
type Album = {
  id: string
  title: string
  description: string
  coverImage: string
  imageCount: number
  date: string
}

// Sample albums data - you can move this to a separate file later
const albums: Album[] = [
  {
    id: "swell-event-01-06-23",
    title: "Swell Event 01.06.23",
    description: "A collection of moments from the swell event",
    coverImage: "/images/photography/Swell Event 01.06.23/37F7EA9F-3AF7-424E-965F-20F446D9803D_1_201_a.jpeg",
    imageCount: 3,
    date: "January 6, 2023"
  }
]

export default function PhotographyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-700">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-full overflow-hidden">
                <Image
                  src="/images/headshot.png"
                  alt="Andreas Pappas"
                  width={40}
                  height={40}
                  className="object-cover"
                />
              </div>
              <span className="font-semibold text-white">Andreas Pappas</span>
              <span className="text-slate-400 text-sm ml-4">Vibe coded by me 🚀</span>
            </div>
            <div className="flex items-center space-x-6">
              <Link href="/" className="text-slate-300 hover:text-white transition-colors">
                Home
              </Link>
              <Link href="/photography" className="text-slate-300 hover:text-white transition-colors">
                Photography
              </Link>
              <a 
                href="/documents/Apappas2025.pdf" 
                download="Andreas_Pappas_Resume.pdf"
                className="text-slate-300 hover:text-white transition-colors"
              >
                Download Resume
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-white mb-4">Photography</h1>
        <p className="text-slate-300 text-lg mb-8">
          A collection of moments captured through my lens
        </p>

        {/* Albums Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {albums.map((album) => (
            <Link href={`/photography/${album.id}`} key={album.id}>
              <Card className="overflow-hidden border border-slate-700 bg-slate-800/50 backdrop-blur-sm hover:border-slate-600 transition-all duration-300 cursor-pointer">
                <div className="relative aspect-[4/3]">
                  <Image
                    src={album.coverImage}
                    alt={album.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-xl font-semibold text-white mb-1">{album.title}</h3>
                    <p className="text-slate-300 text-sm mb-2">{album.description}</p>
                    <div className="flex justify-between text-slate-400 text-sm">
                      <span>{album.imageCount} photos</span>
                      <span>{album.date}</span>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
} 