"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ShoppingCart, Star, Clock, Calendar } from "lucide-react"
import { OrderModal } from "@/components/order-modal"

const dataPackages = {
  mtn: [
    { id: 1, size: "1GB", price: 6, duration: "90 Days", popular: false },
    { id: 2, size: "2GB", price: 12, duration: "90 Days", popular: true },
    { id: 3, size: "3GB", price: 16, duration: "90 Days", popular: false },
    { id: 4, size: "4GB", price: 20, duration: "90 Days", popular: false },
    { id: 5, size: "5GB", price: 25, duration: "90 Days", popular: false },
    { id: 6, size: "6GB", price: 30, duration: "90 Days", popular: false },
    { id: 7, size: "8GB", price: 38, duration: "90 Days", popular: false },
    { id: 8, size: "10GB", price: 45, duration: "90 Days", popular: false },
    { id: 9, size: "15GB", price: 67, duration: "90 Days", popular: false },
    { id: 10, size: "20GB", price: 86, duration: "90 Days", popular: false },
    { id: 11, size: "25GB", price: 110, duration: "90 Days", popular: false },
    { id: 12, size: "30GB", price: 130, duration: "90 Days", popular: false },
    { id: 13, size: "40GB", price: 172, duration: "90 Days", popular: false },
    { id: 14, size: "50GB", price: 215, duration: "90 Days", popular: false },
    //{ id: 15, size: "5000GB", price: 1, duration: "90 Days", popular: false },
  ],
  airteltigo: [
    { id: 15, size: "1GB", price: 5, duration: "90 Days", popular: false },
    { id: 16, size: "2GB", price: 10, duration: "90 Days", popular: true },
    { id: 17, size: "3GB", price: 14, duration: "90 Days", popular: false },
    { id: 18, size: "4GB", price: 17, duration: "90 Days", popular: false },
    { id: 19, size: "5GB", price: 22, duration: "90 Days", popular: false },
    { id: 20, size: "6GB", price: 26, duration: "90 Days", popular: false },
    { id: 21, size: "8GB", price: 34, duration: "90 Days", popular: false },
    { id: 22, size: "10GB", price: 40, duration: "90 Days", popular: false },
    { id: 23, size: "15GB", price: 63, duration: "90 Days", popular: false },
    { id: 24, size: "20GB", price: 82, duration: "90 Days", popular: false },
    { id: 25, size: "25GB", price: 105, duration: "90 Days", popular: false },
    { id: 26, size: "30GB", price: 123, duration: "90 Days", popular: false },
    { id: 27, size: "40GB", price: 162, duration: "90 Days", popular: false },
    { id: 28, size: "50GB", price: 205, duration: "90 Days", popular: false },
  ],
  // telecel: [
  //   { id: 29, size: "1GB", price: 6, duration: "90 Days", popular: false },
  //   { id: 30, size: "2GB", price: 12, duration: "90 Days", popular: true },
  //   { id: 31, size: "3GB", price: 16, duration: "90 Days", popular: false },
  //   { id: 32, size: "4GB", price: 20, duration: "90 Days", popular: false },
  //   { id: 33, size: "5GB", price: 25, duration: "90 Days", popular: false },
  //   { id: 34, size: "6GB", price: 30, duration: "90 Days", popular: false },
  //   { id: 35, size: "8GB", price: 38, duration: "90 Days", popular: false },
  //   { id: 36, size: "10GB", price: 45, duration: "90 Days", popular: false },
  //   { id: 37, size: "15GB", price: 67, duration: "90 Days", popular: false },
  //   { id: 38, size: "20GB", price: 86, duration: "90 Days", popular: false },
  //   { id: 39, size: "25GB", price: 110, duration: "90 Days", popular: false },
  //   { id: 40, size: "30GB", price: 130, duration: "90 Days", popular: false },
  //   { id: 41, size: "40GB", price: 172, duration: "90 Days", popular: false },
  //   { id: 42, size: "50GB", price: 215, duration: "90 Days", popular: false },
  // ],
}

const networkInfo = {
  mtn: {
    deliveryTime: "15-30 minutes (up to 1 hour)",
    color: "text-yellow-600",
  },
  airteltigo: {
    deliveryTime: "Instant delivery",
    color: "text-green-600",
  },
  telecel: {
    deliveryTime: "15-30 minutes (up to 1 hour)",
    color: "text-blue-600",
  },
}

export function DataPackages() {
  const [selectedNetwork, setSelectedNetwork] = useState("mtn")
  const [selectedPackage, setSelectedPackage] = useState<any>(null)
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false)

  const handleOrderNow = (packageItem: any) => {
    setSelectedPackage({ ...packageItem, network: selectedNetwork })
    setIsOrderModalOpen(true)
  }

  return (
    <section id="packages" className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Tabs value={selectedNetwork} onValueChange={setSelectedNetwork} className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto mb-8">
            <TabsTrigger value="mtn" className="text-sm font-medium">
              MTN
            </TabsTrigger>
            <TabsTrigger value="airteltigo" className="text-sm font-medium">
              AirtelTigo
            </TabsTrigger>
            <TabsTrigger value="telecel" className="text-sm font-medium">
              Telecel
            </TabsTrigger>
          </TabsList>

          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">Delivery Time:</span>
              <span
                className={`text-sm font-semibold ${networkInfo[selectedNetwork as keyof typeof networkInfo].color}`}
              >
                {networkInfo[selectedNetwork as keyof typeof networkInfo].deliveryTime}
              </span>
            </div>
          </div>

          {Object.entries(dataPackages).map(([network, packages]) => (
            <TabsContent key={network} value={network}>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
                {packages.map((pkg) => (
                  <Card key={pkg.id} className="relative hover:shadow-lg transition-shadow">
                    {pkg.popular && (
                      <Badge className="absolute -top-2 left-2 sm:left-4 bg-secondary text-secondary-foreground text-xs">
                        <Star className="w-3 h-3 mr-1" />
                        Popular
                      </Badge>
                    )}
                    <CardHeader className="text-center">
                      <CardTitle className="text-xl sm:text-2xl font-bold text-primary">{pkg.size}</CardTitle>
                      <CardDescription className="text-xs text-muted-foreground/70 flex items-center justify-center gap-1">
                        <Calendar className="w-2.5 h-2.5" />
                        {pkg.duration}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                      <div className="text-2xl sm:text-3xl font-bold text-foreground mb-1">GH₵{pkg.price}</div>
                      <div className="text-xs text-muted-foreground">{network.toUpperCase()}</div>
                    </CardContent>
                    <CardFooter>
                      <Button className="w-full text-sm" size="sm" onClick={() => handleOrderNow(pkg)}>
                        <ShoppingCart className="w-3 h-3 mr-1" />
                        Order
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
      <OrderModal isOpen={isOrderModalOpen} onClose={() => setIsOrderModalOpen(false)} package={selectedPackage} />
    </section>
  )
}
