import { Card, CardContent } from "@/components/ui/card"
import { Clock, Phone, MapPin, Calendar, Zap } from "lucide-react"
import { FadeIn } from "@/components/ui/fade-in"

export function BusinessInfo() {
  return (
    <section className="py-16 bg-muted/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">Important Information</h2>
          <p className="text-lg text-muted-foreground">Everything you need to know about our service</p>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FadeIn delay={0.1}>
            <Card>
              <CardContent className="p-6 text-center">
                <Clock className="w-8 h-8 text-primary mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">Business Hours</h3>
                <p className="text-sm text-muted-foreground">
                  Monday - Saturday
                  <br />
                  7:00 AM - 9:00 PM
                  <br />
                  <span className="text-destructive font-medium">Sunday: Closed</span>
                </p>
              </CardContent>
            </Card>
          </FadeIn>

          <FadeIn delay={0.2}>
            <Card>
              <CardContent className="p-6 text-center">
                <Zap className="w-8 h-8 text-primary mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">Delivery Times</h3>
                <p className="text-sm text-muted-foreground">
                  <span className="text-secondary font-medium">AirtelTigo:</span> Instant
                  <br />
                  <span className="text-primary font-medium">MTN & Telecel:</span> 15-30 min
                  <br />
                  <span className="text-muted-foreground">(Max 1 hour)</span>
                </p>
              </CardContent>
            </Card>
          </FadeIn>

          <FadeIn delay={0.3}>
            <Card>
              <CardContent className="p-6 text-center">
                <Calendar className="w-8 h-8 text-primary mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">Data Validity</h3>
                <p className="text-sm text-muted-foreground">
                  All data bundles are valid for
                  <br />
                  <span className="text-primary font-semibold text-lg">90 Days</span>
                  <br />
                  from activation date
                </p>
              </CardContent>
            </Card>
          </FadeIn>

          <FadeIn delay={0.4}>
            <Card>
              <CardContent className="p-6 text-center">
                <Phone className="w-8 h-8 text-primary mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">Contact Support</h3>
                <p className="text-sm text-muted-foreground">
                  iselldata@gmail.com
                </p>
              </CardContent>
            </Card>
          </FadeIn>

          <FadeIn delay={0.5}>
            <Card>
              <CardContent className="p-6 text-center">
                <MapPin className="w-8 h-8 text-primary mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">Service Area</h3>
                <p className="text-sm text-muted-foreground">
                  Nationwide Coverage
                  <br />
                  MTN • AirtelTigo • Telecel
                </p>
              </CardContent>
            </Card>
          </FadeIn>

          <FadeIn delay={0.6}>
            <Card>
              <CardContent className="p-6 text-center">
                <Clock className="w-8 h-8 text-secondary mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">Late Orders</h3>
                <p className="text-sm text-muted-foreground">
                  Orders received after
                  <br />
                  <span className="text-secondary font-medium">9:00 PM</span>
                  <br />
                  will be processed next day
                </p>
              </CardContent>
            </Card>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}
