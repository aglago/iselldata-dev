"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Shield, Clock, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"

export function Hero() {
  const router = useRouter();
  return (
    <section className="bg-gradient-to-br from-primary/5 to-secondary/5 py-20 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6 text-balance">
           Internet Bundles
            <span className="text-primary block">Data Provider</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto text-pretty">
            Get reliable data bundles for MTN, AirtelTigo, and Telecel. Fast, affordable data packages delivered to your
            phone with 90-day validity.
          </p>

          <div className="flex justify-center mb-12">
            <Button size="lg" className="text-lg px-8" onClick={() => router.push('#packages')}>
              Browse Packages
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          {/* Trust indicators */}
          <div className=" max-w-4xl mx-auto">
            <div className="flex items-center justify-center space-x-3">
              <Clock className="h-8 w-8 text-primary" />
              <div className="text-left">
                <div className="font-semibold">Mon-Sat Service</div>
                <div className="text-sm text-muted-foreground">7AM - 9PM daily</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
