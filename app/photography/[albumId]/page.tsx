'use client'

import { notFound } from "next/navigation"
import Image from "next/image"
import { Card } from "@/components/ui/card"
import Lightbox from "yet-another-react-lightbox"
import "yet-another-react-lightbox/styles.css"
import { useState } from "react"
import Link from "next/link"

// This would typically come from a database or CMS
const albums = {
  "swell-event-01-06-23": {
    title: "Swell Event 01.06.23",
    description: "A collection of moments from the swell event",
    images: [
      {
        id: "1",
        src: "/images/photography/Swell Event 01.06.23/37F7EA9F-3AF7-424E-965F-20F446D9803D_1_201_a.jpeg",
        alt: "Swell Event 01.06.23 - Image 1",
        width: 1920,
        height: 1080,
        aspectRatio: "3/2"
      },
      {
        id: "2",
        src: "/images/photography/Swell Event 01.06.23/B1B597DE-1C65-49C3-921E-2AA71444A93B_4_5005_c.jpeg",
        alt: "Swell Event 01.06.23 - Image 2",
        width: 1920,
        height: 1080,
        aspectRatio: "3/2"
      },
      {
        id: "3",
        src: "/images/photography/Swell Event 01.06.23/3A01B188-9F57-4B7B-900E-5CA55759FA7C_4_5005_c.jpeg",
        alt: "Swell Event 01.06.23 - Image 3",
        width: 1920,
        height: 1080,
        aspectRatio: "3/2"
      }
    ]
  },
  landscapes: {
    title: "Landscapes",
    description: "Capturing the beauty of nature's vast landscapes",
    images: [
      {
        id: "1",
        src: "/images/photography/landscapes/1.jpg",
        alt: "Mountain landscape",
        width: 1920,
        height: 1080,
        aspectRatio: "16/9"
      },
      // Add more images
    ]
  },
  street: {
    title: "Street Photography",
    description: "Moments from urban life",
    images: [
      {
        id: "1",
        src: "/images/photography/street/1.jpg",
        alt: "City street",
        width: 1920,
        height: 1080,
        aspectRatio: "3/2"
      },
      // Add more images
    ]
  }
}

export default function AlbumPage({ params }: { params: { albumId: string } }) {
  const album = albums[params.albumId as keyof typeof albums]
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  if (!album) {
    notFound()
  }

  const slides = album.images.map(image => ({
    src: image.src,
    alt: image.alt,
    width: image.width,
    height: image.height
  }))

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

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">{album.title}</h1>
          <p className="text-slate-300">{album.description}</p>
        </div>

        {/* Masonry-like grid that adapts to image sizes */}
        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
          {album.images.map((image, index) => (
            <Card
              key={image.id}
              className="overflow-hidden border border-slate-700 bg-slate-800/50 backdrop-blur-sm break-inside-avoid cursor-pointer"
              onClick={() => {
                setCurrentImageIndex(index)
                setLightboxOpen(true)
              }}
            >
              <div className="relative group">
                <div style={{ aspectRatio: image.aspectRatio || '4/3' }}>
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    onContextMenu={(e) => e.preventDefault()}
                    loading="lazy"
                    quality={85}
                  />
                  {/* Overlay with protection message */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <p className="text-white text-sm text-center px-4">
                      © Andreas Pappas. All rights reserved.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Lightbox */}
        <Lightbox
          open={lightboxOpen}
          close={() => setLightboxOpen(false)}
          slides={slides}
          index={currentImageIndex}
          carousel={{ padding: "16px", spacing: "16px" }}
          controller={{ closeOnBackdropClick: true }}
          animation={{ fade: 400 }}
          styles={{ container: { backgroundColor: "rgba(0, 0, 0, 0.9)" } }}
        />
      </div>
    </div>
  )
} 