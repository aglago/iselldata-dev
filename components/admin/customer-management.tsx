"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Search, Users, Star, Phone, Mail } from "lucide-react"

interface Customer {
  id: string
  name: string
  phone: string
  email?: string
  totalOrders: number
  totalSpent: number
  lastOrder: string | null
  status: "active" | "inactive"
  joinedAt: string
}

export function CustomerManagement() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch('/api/admin/customers')
        const data = await response.json()
        
        if (data.success) {
          setCustomers(data.data)
        } else {
          throw new Error(data.message || 'Failed to fetch customers')
        }
      } catch (error) {
        console.error('Failed to fetch customers:', error)
        setError(error instanceof Error ? error.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchCustomers()
  }, [])

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getCustomerTier = (totalSpent: number) => {
    if (totalSpent >= 100) return { tier: "Gold", color: "bg-yellow-100 text-yellow-800" }
    if (totalSpent >= 50) return { tier: "Silver", color: "bg-gray-100 text-gray-800" }
    return { tier: "Bronze", color: "bg-orange-100 text-orange-800" }
  }

  // Calculate statistics
  const activeCustomers = customers.filter(c => c.status === "active").length
  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0)
  const totalOrders = customers.reduce((sum, c) => sum + c.totalOrders, 0)
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
  const repeatCustomers = customers.filter(c => c.totalOrders > 1).length
  const repeatRate = customers.length > 0 ? (repeatCustomers / customers.length) * 100 : 0
  const topSpender = customers.reduce((top, customer) => 
    customer.totalSpent > (top?.totalSpent || 0) ? customer : top, null as Customer | null)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-red-600 mb-4">Error loading customers: {error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Customer Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
            <p className="text-xs text-muted-foreground">
              {activeCustomers} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">GH₵{avgOrderValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Per customer order</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Repeat Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{repeatRate.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">Customer retention rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Spender</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">GH₵{topSpender?.totalSpent || 0}</div>
            <p className="text-xs text-muted-foreground">
              {topSpender ? `${topSpender.name} - ${topSpender.totalOrders} orders` : 'No data'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Customer List */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Directory</CardTitle>
          <CardDescription>Manage your customer base and view purchase history</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div>
            <Label htmlFor="customerSearch">Search Customers</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="customerSearch"
                placeholder="Search by name, phone, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Customer Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map((customer) => {
                const tierInfo = getCustomerTier(customer.totalSpent)
                return (
                  <Card key={customer.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{customer.name}</CardTitle>
                        <Badge className={tierInfo.color}>{tierInfo.tier}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{customer.phone}</span>
                      </div>

                      {customer.email && (
                        <div className="flex items-center space-x-2 text-sm">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate">{customer.email}</span>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Orders</div>
                          <div className="font-medium">{customer.totalOrders}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Total Spent</div>
                          <div className="font-medium">GH₵{customer.totalSpent}</div>
                        </div>
                      </div>

                      <div className="text-sm">
                        <div className="text-muted-foreground">Status</div>
                        <div className="font-medium">
                          <Badge className={customer.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                            {customer.status}
                          </Badge>
                        </div>
                      </div>

                      <div className="text-sm">
                        <div className="text-muted-foreground">Last Order</div>
                        <div className="font-medium">
                          {customer.lastOrder ? new Date(customer.lastOrder).toLocaleDateString() : 'Never'}
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                          View Orders
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                          Contact
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            ) : (
              <div className="col-span-3 text-center text-muted-foreground py-8">
                {searchTerm ? 'No customers found matching your search.' : 'No customers found.'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}