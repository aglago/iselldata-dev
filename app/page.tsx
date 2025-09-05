import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { DataPackages } from "@/components/data-packages"
import { BusinessInfo } from "@/components/business-info"
import { Footer } from "@/components/footer"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <DataPackages />
        <BusinessInfo />
      </main>
      <Footer />
    </div>
  )
}
