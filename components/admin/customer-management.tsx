"use client"

import { useState } from "react"
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
  lastOrderDate: string
  status: "active" | "inactive"
  preferredNetwork: string
}

export function CustomerManagement() {
  const [customers, setCustomers] = useState<Customer[]>([
    {
      id: "CUST001",
      name: "John Doe",
      phone: "0244123456",
      email: "john@example.com",
      totalOrders: 15,
      totalSpent: 120,
      lastOrderDate: "2024-01-15",
      status: "active",
      preferredNetwork: "MTN",
    },
    {
      id: "CUST002",
      name: "Jane Smith",
      phone: "0201987654",
      email: "jane@example.com",
      totalOrders: 8,
      totalSpent: 64,
      lastOrderDate: "2024-01-14",
      status: "active",
      preferredNetwork: "AirtelTigo",
    },
    {
      id: "CUST003",
      name: "Mike Johnson",
      phone: "0557654321",
      totalOrders: 3,
      totalSpent: 24,
      lastOrderDate: "2024-01-10",
      status: "inactive",
      preferredNetwork: "Telecel",
    },
  ])

  const [searchTerm, setSearchTerm] = useState("")

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
              {customers.filter((c) => c.status === "active").length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">GH₵8.50</div>
            <p className="text-xs text-muted-foreground">Per customer order</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Repeat Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78%</div>
            <p className="text-xs text-muted-foreground">Customer retention rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Spender</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">GH₵120</div>
            <p className="text-xs text-muted-foreground">John Doe - 15 orders</p>
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
            {filteredCustomers.map((customer) => {
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
                      <div className="text-muted-foreground">Preferred Network</div>
                      <div className="font-medium">{customer.preferredNetwork}</div>
                    </div>

                    <div className="text-sm">
                      <div className="text-muted-foreground">Last Order</div>
                      <div className="font-medium">{new Date(customer.lastOrderDate).toLocaleDateString()}</div>
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
            })}
          </div>

          {filteredCustomers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">No customers found matching your search.</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
