import React from "react"
import Link from "next/link"
import Image from "next/image"

export function BrandLogo() {
  return (
    <Link href="/" className="flex items-center gap-2 group">
      <div className="relative w-8 h-8 rounded-sm overflow-hidden transition-transform group-hover:scale-105">
        <Image 
          src="/logo.png" 
          alt="Nubian Logo" 
          fill
          className="object-contain"
        />
      </div>
      <span className="text-xl font-bold tracking-tight text-foreground">
        نوبيان <span className="text-muted-foreground font-light ml-1">nubian</span>
      </span>
    </Link>
  )
}
