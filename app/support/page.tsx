"use client"

import { MessageCircle, Phone, Mail } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">How can we help you?</h1>
          <p className="text-xl text-muted-foreground">Get in touch with our support team for any questions or issues</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* WhatsApp Support */}
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <MessageCircle className="w-12 h-12 text-primary mx-auto mb-4" />
              <CardTitle className="text-primary">WhatsApp Support</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">Get instant help via WhatsApp</p>
              <a 
                href="https://wa.me/233509581027" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full"
              >
                <Button className="w-full">
                  Chat on WhatsApp
                </Button>
              </a>
              <p className="text-sm text-muted-foreground mt-2">+233 50 958 1027</p>
            </CardContent>
          </Card>

          {/* Phone Support */}
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Phone className="w-12 h-12 text-primary mx-auto mb-4" />
              <CardTitle className="text-primary">Phone Support</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">Call us directly for immediate assistance</p>
              <a href="tel:+233509581027" className="w-full">
                <Button variant="outline" className="w-full">
                  Call Now
                </Button>
              </a>
              <p className="text-sm text-muted-foreground mt-2">+233 50 958 1027</p>
            </CardContent>
          </Card>

          {/* Email Support */}
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Mail className="w-12 h-12 text-primary mx-auto mb-4" />
              <CardTitle className="text-primary">Email Support</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">Send us an email for detailed inquiries</p>
              <a href="mailto:support@iselldata.com" className="w-full">
                <Button variant="outline" className="w-full">
                  Send Email
                </Button>
              </a>
              <p className="text-sm text-muted-foreground mt-2">support@iselldata.com</p>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold text-foreground mb-2">How long does data delivery take?</h3>
              <p className="text-muted-foreground">Most data bundles are delivered within 15-30 minutes. AirtelTigo delivers instantly, while MTN and Telecel may take up to 1 hour during peak times.</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-foreground mb-2">What payment methods do you accept?</h3>
              <p className="text-muted-foreground">We accept all major payment methods via Paystack including debit cards, bank transfers, and mobile money (MTN, AirtelTigo, Telecel).</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-foreground mb-2">I paid but didn't receive my data. What should I do?</h3>
              <p className="text-muted-foreground">Please contact us immediately via WhatsApp with your Order ID. We'll investigate and resolve the issue within 30 minutes.</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-foreground mb-2">Can I get a refund if the data wasn't delivered?</h3>
              <p className="text-muted-foreground">Yes, if we cannot deliver your data bundle within 2 hours, we will process a full refund or deliver the data manually.</p>
            </div>
          </CardContent>
        </Card>

        {/* Back to Home */}
        <div className="text-center mt-12">
          <Link href="/">
            <Button variant="outline" className="px-8">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}