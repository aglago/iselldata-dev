import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Smartphone, CreditCard, Headphones, Zap, Shield, Clock } from "lucide-react"

const features = [
  {
    icon: Smartphone,
    title: "All Networks Supported",
    description: "MTN, AirtelTigo, and Telecel data bundles available with competitive pricing.",
  },
  {
    icon: Zap,
    title: "Instant Delivery",
    description: "Your data bundle is delivered to your phone within seconds of payment confirmation.",
  },
  {
    icon: CreditCard,
    title: "Secure Payments",
    description: "Multiple payment options including mobile money, bank transfer, and card payments.",
  },
  {
    icon: Shield,
    title: "100% Reliable",
    description: "Trusted by thousands of customers across Ghana with 99.9% success rate.",
  },
  {
    icon: Clock,
    title: "24/7 Service",
    description: "Our automated system works round the clock, so you can buy data anytime.",
  },
  {
    icon: Headphones,
    title: "Customer Support",
    description: "Dedicated support team available via WhatsApp and phone for any assistance.",
  },
]

export function Features() {
  return (
    <section id="features" className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">Why Choose GhanaData Pro?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We provide the most reliable and affordable data service in Ghana with unmatched customer satisfaction.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
                  <feature.icon className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl font-semibold">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
