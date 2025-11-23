"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowRight, Users, TrendingUp, Wallet, Gift, Star, CheckCircle, Crown, Award, Play } from "lucide-react"
import { useRouter } from "next/navigation"
import { FadeIn } from "@/components/ui/fade-in"

// Agent pricing data with suggested retail prices - Complete package list
const agentPricing = {
  mtn: [
    { size: "1GB", regularPrice: 6.00, agentPrice: 5.50, suggestedRetail: 6.50, savings: 0.50, profit: 1.00 },
    { size: "2GB", regularPrice: 12.00, agentPrice: 10.50, suggestedRetail: 12.50, savings: 1.50, profit: 2.00 },
    { size: "3GB", regularPrice: 16.00, agentPrice: 14.50, suggestedRetail: 16.50, savings: 1.50, profit: 2.00 },
    { size: "4GB", regularPrice: 20.00, agentPrice: 19.50, suggestedRetail: 21.00, savings: 0.50, profit: 1.50 },
    { size: "5GB", regularPrice: 25.00, agentPrice: 23.50, suggestedRetail: 26.00, savings: 1.50, profit: 2.50 },
    { size: "6GB", regularPrice: 30.00, agentPrice: 28.00, suggestedRetail: 31.00, savings: 2.00, profit: 3.00 },
    { size: "8GB", regularPrice: 38.00, agentPrice: 36.50, suggestedRetail: 39.00, savings: 1.50, profit: 2.50 },
    { size: "10GB", regularPrice: 45.00, agentPrice: 44.00, suggestedRetail: 47.00, savings: 1.00, profit: 3.00 },
    { size: "15GB", regularPrice: 67.00, agentPrice: 63.00, suggestedRetail: 69.00, savings: 4.00, profit: 6.00 },
    { size: "20GB", regularPrice: 86.00, agentPrice: 82.00, suggestedRetail: 88.00, savings: 4.00, profit: 6.00 },
    { size: "25GB", regularPrice: 110.00, agentPrice: 103.00, suggestedRetail: 112.00, savings: 7.00, profit: 9.00 },
    { size: "30GB", regularPrice: 130.00, agentPrice: 125.00, suggestedRetail: 133.00, savings: 5.00, profit: 8.00 },
    { size: "40GB", regularPrice: 172.00, agentPrice: 167.00, suggestedRetail: 175.00, savings: 5.00, profit: 8.00 },
    { size: "50GB", regularPrice: 215.00, agentPrice: 207.00, suggestedRetail: 220.00, savings: 8.00, profit: 13.00 },
  ],
  airteltigo: [
    { size: "1GB", regularPrice: 5.00, agentPrice: 4.50, suggestedRetail: 5.50, savings: 0.50, profit: 1.00 },
    { size: "2GB", regularPrice: 10.00, agentPrice: 9.00, suggestedRetail: 10.50, savings: 1.00, profit: 1.50 },
    { size: "3GB", regularPrice: 14.00, agentPrice: 13.00, suggestedRetail: 14.50, savings: 1.00, profit: 1.50 },
    { size: "4GB", regularPrice: 17.00, agentPrice: 16.00, suggestedRetail: 18.00, savings: 1.00, profit: 2.00 },
    { size: "5GB", regularPrice: 22.00, agentPrice: 20.50, suggestedRetail: 23.00, savings: 1.50, profit: 2.50 },
    { size: "6GB", regularPrice: 26.00, agentPrice: 24.50, suggestedRetail: 27.00, savings: 1.50, profit: 2.50 },
    { size: "8GB", regularPrice: 34.00, agentPrice: 32.00, suggestedRetail: 35.00, savings: 2.00, profit: 3.00 },
    { size: "10GB", regularPrice: 40.00, agentPrice: 39.00, suggestedRetail: 42.00, savings: 1.00, profit: 3.00 },
    { size: "15GB", regularPrice: 63.00, agentPrice: 60.00, suggestedRetail: 65.00, savings: 3.00, profit: 5.00 },
    { size: "20GB", regularPrice: 82.00, agentPrice: 79.00, suggestedRetail: 84.00, savings: 3.00, profit: 5.00 },
    { size: "25GB", regularPrice: 105.00, agentPrice: 100.00, suggestedRetail: 108.00, savings: 5.00, profit: 8.00 },
    { size: "30GB", regularPrice: 123.00, agentPrice: 118.00, suggestedRetail: 126.00, savings: 5.00, profit: 8.00 },
    { size: "40GB", regularPrice: 162.00, agentPrice: 157.00, suggestedRetail: 165.00, savings: 5.00, profit: 8.00 },
    { size: "50GB", regularPrice: 205.00, agentPrice: 197.00, suggestedRetail: 210.00, savings: 8.00, profit: 13.00 },
  ],
}

const commissionTiers = [
  {
    name: "Basic",
    range: "₵0 - 2,000",
    commission: "0%",
    icon: Users,
    color: "text-muted-foreground",
    bgColor: "bg-muted/10",
    borderColor: "border-muted",
    description: "Get started with wholesale pricing"
  },
  {
    name: "Bronze", 
    range: "₵2,000 - 10,000",
    commission: "0.5% - 3%",
    icon: Award,
    color: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/30", 
    description: "Earn your first commissions"
  },
  {
    name: "Silver",
    range: "₵10,000 - 20,000", 
    commission: "0.7% - 4%",
    icon: Star,
    color: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/30",
    description: "Higher commission rates"
  },
  {
    name: "Gold",
    range: "₵20,000 - 50,000",
    commission: "1% - 5%",
    icon: TrendingUp,
    color: "text-secondary", 
    bgColor: "bg-secondary/10",
    borderColor: "border-secondary/30",
    description: "Premium commission tier"
  },
  {
    name: "Platinum",
    range: "₵50,000+",
    commission: "1.2% - 6%",
    icon: Crown,
    color: "text-secondary",
    bgColor: "bg-secondary/10", 
    borderColor: "border-secondary/30",
    description: "Maximum earning potential"
  },
]

const agentBenefits = [
  {
    icon: TrendingUp,
    title: "Wholesale Pricing",
    description: "Get up to ₵8 discount per package compared to regular prices"
  },
  {
    icon: Gift,
    title: "Monthly Commissions", 
    description: "Earn 0.5% - 6% commission based on your cumulative sales volume"
  },
  {
    icon: Wallet,
    title: "Wallet System",
    description: "Load your wallet and place orders instantly for your customers"
  },
  {
    icon: Users,
    title: "Business Tools",
    description: "Get custom flyers, order tracking, and business analytics"
  }
]

export default function JoinAsAgentPage() {
  const router = useRouter()
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header/Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <h2 className="text-2xl font-bold text-primary">iSellData</h2>
            </div>
            <Button 
              variant="ghost" 
              onClick={() => router.push('/')}
              className="text-muted-foreground hover:text-foreground"
            >
              ← Back to Home
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 to-secondary/5 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center">
            <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6">
              Become a Data Agent
              <span className="text-primary block">Start Your Business Today</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Join thousands of successful agents earning daily income by selling data packages. 
              Get wholesale prices, monthly commissions, and all the tools you need to succeed.
            </p>

            {/* Call to Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
              <Button size="lg" className="text-lg px-8">
                Start Your Business - ₵30
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-8 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
              >
                View Pricing Details
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
            
            {/* Key Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">₵1 - ₵13</div>
                <div className="text-sm text-muted-foreground">Profit per package</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">0.5% - 6%</div>
                <div className="text-sm text-muted-foreground">Monthly commissions</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">₵30</div>
                <div className="text-sm text-muted-foreground">One-time registration</div>
              </div>
            </div>

            
          </FadeIn>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Agent Benefits */}
        <section className="mb-20">
          <FadeIn className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Why Become an Agent?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join our growing network of successful data resellers and start earning today
            </p>
          </FadeIn>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {agentBenefits.map((benefit, index) => {
              const IconComponent = benefit.icon
              return (
                <FadeIn key={index} delay={index * 0.1}>
                  <Card className="text-center hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <IconComponent className="w-6 h-6 text-primary" />
                      </div>
                      <CardTitle className="text-xl">{benefit.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{benefit.description}</p>
                    </CardContent>
                  </Card>
                </FadeIn>
              )
            })}
          </div>
        </section>

        {/* Video Tutorial Section */}
        <section className="mb-20">
          <FadeIn className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground mb-6">
              Watch our step-by-step tutorial to learn about the benefits and registration process
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/10 rounded-lg border border-secondary/20">
              <Play className="w-4 h-4 text-secondary" />
              <span className="text-sm font-medium text-secondary">5-minute tutorial video</span>
            </div>
          </FadeIn>
          
          <FadeIn delay={0.2} className="max-w-4xl mx-auto">
            <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl">
              <iframe
                className="w-full h-full border-0"
                src="https://www.youtube.com/embed/YOUR_VIDEO_ID_HERE"
                title="iSellData Agent Tutorial - How to Register and Start Earning"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
            <p className="text-sm text-muted-foreground text-center mt-4">
              Learn how to register as an agent, load your wallet, place orders, and maximize your earnings
            </p>
          </FadeIn>
        </section>

        {/* Pricing Comparison Tables */}
        <section id="pricing" className="mb-20">
          <FadeIn className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Agent Pricing & Profit Potential</h2>
            <p className="text-lg text-muted-foreground mb-4">
              Get wholesale prices and see your potential profit margins
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg border border-primary/20">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Earn ₵1 - ₵13 profit per package sold</span>
            </div>
            <p className="text-sm text-muted-foreground mt-4 max-w-2xl mx-auto">
              <strong>Important:</strong> You have full freedom to set your own selling prices. The prices shown are suggestions only to help you stay competitive while maximizing profits.
            </p>
          </FadeIn>

          <FadeIn delay={0.2}>
            <Tabs defaultValue="mtn" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
              <TabsTrigger value="mtn" className="text-sm font-medium">MTN</TabsTrigger>
              <TabsTrigger value="airteltigo" className="text-sm font-medium">AirtelTigo</TabsTrigger>
            </TabsList>

            {Object.entries(agentPricing).map(([network, packages]) => (
              <TabsContent key={network} value={network}>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
                  {packages.map((pkg, index) => (
                    <Card key={index} className="relative hover:shadow-lg transition-shadow">
                      {pkg.profit >= 5 && (
                        <Badge className="absolute -top-2 left-2 sm:left-4 bg-secondary text-secondary-foreground text-xs">
                          High Profit
                        </Badge>
                      )}
                      <CardHeader className="text-center">
                        <CardTitle className="text-xl sm:text-2xl font-bold text-primary">{pkg.size}</CardTitle>
                        <CardDescription className="text-xs text-muted-foreground/70 uppercase tracking-wide">
                          {network.replace('airteltigo', 'AirtelTigo').toUpperCase()}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="text-center">
                        <div className="space-y-2">
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">Agent Price</div>
                            <div className="text-2xl sm:text-3xl font-bold text-primary">
                              ₵{pkg.agentPrice.toFixed(2)}
                            </div>
                          </div>
                          <div className="border-t border-border pt-2 space-y-1">
                            <div className="text-xs text-muted-foreground">Can resell at</div>
                            <div className="text-lg font-semibold text-foreground">
                              ₵{pkg.suggestedRetail.toFixed(2)}
                            </div>
                          </div>
                          <div className="bg-primary/10 rounded-lg p-2">
                            <div className="text-xs text-primary">Potential Profit</div>
                            <div className="text-lg font-bold text-primary">
                              ₵{pkg.profit.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            ))}
            </Tabs>
          </FadeIn>
        </section>

        {/* Commission Tier System */}
        <section className="mb-20">
          <FadeIn className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Commission Tier System</h2>
            <p className="text-lg text-muted-foreground mb-6">
              Earn more commissions as your business grows. Based on cumulative order value since registration.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/10 rounded-lg border border-secondary/20">
              <CheckCircle className="w-4 h-4 text-secondary" />
              <span className="text-sm font-medium text-secondary">Commissions paid monthly on the 1st</span>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {commissionTiers.map((tier, index) => {
              const IconComponent = tier.icon
              return (
                <FadeIn key={index} delay={index * 0.1}>
                  <Card 
                    className={`text-center hover:shadow-lg transition-all duration-300 ${tier.borderColor} ${tier.bgColor} border-2`}
                  >
                    <CardHeader className="pb-4">
                      <div className={`w-12 h-12 ${tier.bgColor} rounded-lg flex items-center justify-center mx-auto mb-2`}>
                        <IconComponent className={`w-6 h-6 ${tier.color}`} />
                      </div>
                      <CardTitle className={`text-lg ${tier.color}`}>{tier.name}</CardTitle>
                      <CardDescription className="text-xs font-semibold">
                        {tier.range}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-4">
                      <div className={`text-xl font-bold ${tier.color} mb-2`}>
                        {tier.commission}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {tier.description}
                      </p>
                    </CardContent>
                  </Card>
                </FadeIn>
              )
            })}
          </div>
          
          <div className="mt-8 p-4 bg-muted/30 rounded-lg border border-muted">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> Commission rates vary by package size. Small packages (1GB-3GB) earn higher rates, 
              while large packages (10GB+) have lower rates to ensure sustainable business operations.
            </p>
          </div>
        </section>

        {/* Registration & Pricing */}
        <section className="mb-20">
          <FadeIn className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Get Started Today</h2>
            <p className="text-lg text-muted-foreground">
              Simple registration process with optional business tools
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Agent Registration */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Agent Registration</CardTitle>
                <CardDescription>Join our agent network</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">₵30</div>
                  <div className="text-sm text-muted-foreground">One-time registration fee</div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm">Wholesale pricing access</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm">Agent wallet system</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm">Monthly commission earnings</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm">Order tracking & analytics</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" size="lg">
                  Register as Agent
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>

            {/* Custom Flyer */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 text-secondary" />
                </div>
                <CardTitle className="text-2xl">Custom Business Flyer</CardTitle>
                <CardDescription>Professional marketing materials</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-secondary mb-2">₵50</div>
                  <div className="text-sm text-muted-foreground">Add-on service</div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm">Custom business name & logo</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm">Your pricing & contact info</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm">Professional design template</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm">High-quality digital download</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="secondary" className="w-full" size="lg">
                  Order Custom Flyer
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </div>
        </section>

        {/* Call to Action */}
        <FadeIn>
          <section className="text-center py-16 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-2xl">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Ready to Start Your Data Business?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join hundreds of successful agents already earning with iSellData. 
              Start today with just ₵30 and begin your journey to financial independence.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button size="lg" className="text-lg px-8">
                Register Now - ₵30
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-8"
                onClick={() => router.push('/')}
              >
                Back to Homepage
              </Button>
            </div>
          </section>
        </FadeIn>
      </div>
    </div>
  )
}