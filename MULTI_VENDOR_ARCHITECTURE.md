# Multi-Vendor Architecture Design Document

## Overview
This document outlines the comprehensive architecture for transforming the current single-vendor data reseller application into a scalable multi-vendor marketplace where agents can register and get the lowest prices to resell to their customers.

## 🏗️ Core Architecture Principles

### 1. Vendor Abstraction Layer
- **Purpose**: Standardize interactions with different data vendors
- **Benefits**: Easy addition of new vendors, failover support, price comparison
- **Implementation**: Interface-based design with vendor-specific implementations

### 2. Agent Management System
- **Purpose**: Enable multi-agent marketplace functionality
- **Features**: Registration, commission tracking, tiered pricing, performance metrics
- **Benefits**: Scalable business model, distributed sales network

### 3. Feature-Based Organization
- **Purpose**: Organize code by business features rather than technical layers
- **Benefits**: Better maintainability, team scalability, feature isolation

## 📁 Proposed Folder Structure

```
src/
├── features/                     # Feature-based organization
│   ├── auth/                    # Authentication & Authorization
│   │   ├── api/                 # Auth API routes
│   │   ├── components/          # Auth-specific components
│   │   ├── services/            # Auth business logic
│   │   ├── types/               # Auth TypeScript types
│   │   └── utils/               # Auth utilities
│   │
│   ├── agents/                  # Agent Management
│   │   ├── api/                 
│   │   │   ├── register.ts      # Agent registration
│   │   │   ├── profile.ts       # Agent profile management
│   │   │   ├── commission.ts    # Commission calculations
│   │   │   └── analytics.ts     # Agent performance metrics
│   │   ├── components/
│   │   │   ├── AgentDashboard.tsx
│   │   │   ├── RegistrationForm.tsx
│   │   │   ├── CommissionTracker.tsx
│   │   │   └── AgentAnalytics.tsx
│   │   ├── services/
│   │   │   ├── AgentService.ts
│   │   │   ├── CommissionService.ts
│   │   │   └── AgentAnalyticsService.ts
│   │   └── types/
│   │       └── agent.types.ts
│   │
│   ├── orders/                  # Order Management
│   │   ├── api/
│   │   │   ├── create.ts
│   │   │   ├── track.ts
│   │   │   ├── history.ts
│   │   │   └── status.ts
│   │   ├── components/
│   │   │   ├── OrderModal.tsx
│   │   │   ├── OrderHistory.tsx
│   │   │   ├── OrderTracker.tsx
│   │   │   └── OrderStatusCard.tsx
│   │   ├── services/
│   │   │   ├── OrderService.ts
│   │   │   ├── OrderValidationService.ts
│   │   │   └── OrderNotificationService.ts
│   │   └── types/
│   │       └── order.types.ts
│   │
│   ├── payments/                # Payment Processing
│   │   ├── api/
│   │   │   ├── initiate.ts
│   │   │   ├── callback.ts
│   │   │   ├── verify.ts
│   │   │   └── validate-account.ts
│   │   ├── components/
│   │   │   ├── PaymentForm.tsx
│   │   │   ├── PaymentStatus.tsx
│   │   │   └── PaymentHistory.tsx
│   │   ├── services/
│   │   │   ├── PaymentService.ts
│   │   │   ├── PaystackService.ts
│   │   │   └── MobileMoneyService.ts
│   │   └── types/
│   │       └── payment.types.ts
│   │
│   ├── vendors/                 # Vendor Management
│   │   ├── api/
│   │   │   ├── balance.ts
│   │   │   ├── packages.ts
│   │   │   ├── purchase.ts
│   │   │   └── status.ts
│   │   ├── components/
│   │   │   ├── VendorSelector.tsx
│   │   │   ├── VendorStatus.tsx
│   │   │   └── PriceComparison.tsx
│   │   ├── services/
│   │   │   ├── VendorManager.ts
│   │   │   ├── HubnetVendor.ts
│   │   │   ├── TelecomVendor.ts
│   │   │   └── VendorFailover.ts
│   │   └── types/
│   │       └── vendor.types.ts
│   │
│   ├── admin/                   # Admin Management
│   │   ├── api/
│   │   │   ├── dashboard.ts
│   │   │   ├── analytics.ts
│   │   │   ├── customers.ts
│   │   │   └── system.ts
│   │   ├── components/
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── CustomerManagement.tsx
│   │   │   ├── RevenueAnalytics.tsx
│   │   │   └── SystemMonitor.tsx
│   │   └── services/
│   │       ├── AdminService.ts
│   │       └── AnalyticsService.ts
│   │
│   └── notifications/           # SMS & Notification System
│       ├── api/
│       │   ├── send.ts
│       │   └── templates.ts
│       ├── services/
│       │   ├── NotificationService.ts
│       │   ├── SMSService.ts
│       │   └── TemplateService.ts
│       └── types/
│           └── notification.types.ts
│
├── shared/                      # Shared utilities and components
│   ├── components/              # Reusable UI components
│   │   ├── ui/                  # Base UI components
│   │   ├── forms/               # Form components
│   │   ├── layout/              # Layout components
│   │   └── common/              # Common business components
│   │
│   ├── services/                # Shared services
│   │   ├── api/                 # API clients and configuration
│   │   │   ├── BaseApiClient.ts
│   │   │   ├── SupabaseClient.ts
│   │   │   └── HttpClient.ts
│   │   ├── database/            # Database utilities
│   │   │   ├── DatabaseService.ts
│   │   │   └── QueryBuilder.ts
│   │   └── validation/          # Validation utilities
│   │       ├── ValidationService.ts
│   │       └── schemas.ts
│   │
│   ├── utils/                   # Utility functions
│   │   ├── phone.utils.ts
│   │   ├── currency.utils.ts
│   │   ├── date.utils.ts
│   │   └── format.utils.ts
│   │
│   ├── types/                   # Shared TypeScript types
│   │   ├── common.types.ts
│   │   ├── api.types.ts
│   │   └── database.types.ts
│   │
│   ├── constants/               # Application constants
│   │   ├── config.ts
│   │   ├── networks.ts
│   │   ├── packages.ts
│   │   └── messages.ts
│   │
│   └── hooks/                   # Shared React hooks
│       ├── useApi.ts
│       ├── useAuth.ts
│       └── useLocalStorage.ts
│
├── app/                         # Next.js app directory (routes only)
│   ├── (public)/               # Public pages
│   │   ├── page.tsx
│   │   ├── track-order/
│   │   └── success/
│   │
│   ├── (auth)/                 # Authentication pages
│   │   ├── login/
│   │   └── register/
│   │
│   ├── (agent)/                # Agent-specific pages
│   │   ├── dashboard/
│   │   ├── orders/
│   │   └── profile/
│   │
│   ├── (admin)/                # Admin pages
│   │   ├── dashboard/
│   │   ├── analytics/
│   │   └── settings/
│   │
│   └── api/                    # API routes (thin layer)
│       ├── auth/
│       ├── agents/
│       ├── orders/
│       ├── payments/
│       ├── vendors/
│       └── admin/
│
└── database/                    # Database related files
    ├── migrations/              # Database migrations
    ├── seeds/                   # Database seeders
    ├── schemas/                 # Database schemas
    └── types/                   # Database type definitions
```

## 🔧 Core Service Abstractions

### 1. Vendor Interface
```typescript
// shared/types/vendor.types.ts
export interface IDataVendor {
  id: string;
  name: string;
  isActive: boolean;
  checkBalance(): Promise<VendorBalanceResponse>;
  getPackages(network: NetworkType): Promise<DataPackage[]>;
  purchaseData(request: DataPurchaseRequest): Promise<VendorPurchaseResponse>;
  checkTransactionStatus(transactionId: string): Promise<TransactionStatus>;
  formatPhoneNumber(phone: string): string;
  getCommissionRate(packageType: string): number;
}

export interface VendorBalanceResponse {
  balance: number;
  currency: string;
  lastUpdated: Date;
}

export interface DataPurchaseRequest {
  phoneNumber: string;
  network: NetworkType;
  packageSize: string;
  volumeMB: number;
  orderId: string;
}

export interface VendorPurchaseResponse {
  success: boolean;
  transactionId?: string;
  message: string;
  cost: number;
  estimatedDelivery?: Date;
}
```

### 2. Agent System
```typescript
// features/agents/types/agent.types.ts
export interface Agent {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: AgentStatus;
  tier: AgentTier;
  commissionRate: number;
  totalOrders: number;
  totalRevenue: number;
  createdAt: Date;
  lastLoginAt?: Date;
}

export enum AgentStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  INACTIVE = 'inactive'
}

export enum AgentTier {
  BRONZE = 'bronze',    // 0-100 orders
  SILVER = 'silver',    // 101-500 orders  
  GOLD = 'gold',        // 501-1000 orders
  PLATINUM = 'platinum' // 1000+ orders
}

export interface AgentCommission {
  id: string;
  agentId: string;
  orderId: string;
  baseAmount: number;
  commissionRate: number;
  commissionAmount: number;
  status: CommissionStatus;
  paidAt?: Date;
  createdAt: Date;
}

export enum CommissionStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  PAID = 'paid',
  DISPUTED = 'disputed'
}
```

### 3. Pricing Strategy
```typescript
// features/vendors/services/PricingService.ts
export class PricingService {
  // Get best price across all vendors
  async getBestPrice(network: NetworkType, packageSize: string): Promise<VendorPriceComparison> {
    const vendors = await this.getActiveVendors();
    const prices = await Promise.all(
      vendors.map(vendor => vendor.getPackages(network))
    );
    
    return this.compareAndRankPrices(prices);
  }

  // Calculate agent pricing with commission
  calculateAgentPrice(basePrice: number, agentTier: AgentTier): number {
    const commissionRates = {
      [AgentTier.BRONZE]: 0.05,   // 5%
      [AgentTier.SILVER]: 0.08,   // 8%
      [AgentTier.GOLD]: 0.12,     // 12%
      [AgentTier.PLATINUM]: 0.15  // 15%
    };
    
    return basePrice * (1 - commissionRates[agentTier]);
  }
}
```

## 🔄 Migration Strategy

### Phase 1: Code Restructuring (Week 1)
1. **Setup new folder structure**
   - Create feature-based directories
   - Move existing components to appropriate features
   - Extract shared utilities

2. **Create service layer**
   - Extract business logic from API routes
   - Create service interfaces
   - Implement dependency injection

3. **Standardize API clients**
   - Create base API client
   - Implement consistent error handling
   - Add request/response logging

### Phase 2: Vendor Abstraction (Week 2)
1. **Implement vendor interface**
   - Create IDataVendor interface
   - Refactor Hubnet integration to implement interface
   - Add vendor configuration system

2. **Create vendor manager**
   - Implement vendor selection logic
   - Add failover mechanisms
   - Create price comparison engine

### Phase 3: Agent System (Week 3-4)
1. **Database schema updates**
   - Create agent tables
   - Add commission tracking
   - Update order tables for multi-agent support

2. **Agent registration system**
   - Create registration API
   - Implement approval workflow
   - Add agent authentication

3. **Commission system**
   - Calculate commissions per order
   - Create payout mechanisms
   - Add reporting dashboards

### Phase 4: Enhanced Features (Week 5-6)
1. **Multi-vendor price comparison**
   - Display best prices to agents
   - Implement vendor selection
   - Add vendor performance metrics

2. **Agent dashboard**
   - Order management interface
   - Commission tracking
   - Performance analytics

3. **Advanced admin features**
   - Agent management
   - Vendor monitoring
   - System analytics

## 💰 Business Logic Implementation

### 1. Commission Calculation
```typescript
export class CommissionService {
  calculateCommission(order: Order, agent: Agent): AgentCommission {
    const baseCommission = this.getBaseCommissionRate(agent.tier);
    const performanceBonus = this.getPerformanceBonus(agent);
    const finalRate = Math.min(baseCommission + performanceBonus, 0.20); // Cap at 20%
    
    return {
      baseAmount: order.price,
      commissionRate: finalRate,
      commissionAmount: order.price * finalRate,
      // ... other fields
    };
  }
}
```

### 2. Vendor Selection Strategy
```typescript
export class VendorSelectionService {
  async selectOptimalVendor(request: DataPurchaseRequest): Promise<IDataVendor> {
    const vendors = await this.getAvailableVendors(request.network);
    
    // Priority: 1. Success rate, 2. Price, 3. Speed
    const scored = vendors.map(vendor => ({
      vendor,
      score: this.calculateVendorScore(vendor, request)
    }));
    
    return scored.sort((a, b) => b.score - a.score)[0].vendor;
  }
}
```

### 3. Notification System
```typescript
export class NotificationService {
  async sendOrderConfirmation(order: Order, agent?: Agent): Promise<void> {
    const template = agent ? 'agent_order_confirmation' : 'customer_order_confirmation';
    const recipient = agent ? agent.phone : order.phone;
    
    await this.smsService.send({
      to: recipient,
      template,
      data: { order, agent }
    });
  }
}
```

## 🔒 Security Considerations

### 1. Agent Authentication
- JWT-based authentication with refresh tokens
- Role-based access control (Customer, Agent, Admin)
- API rate limiting per agent tier

### 2. Financial Security
- Commission calculations server-side only
- Transaction logging and audit trails
- Fraud detection for suspicious patterns

### 3. Vendor API Security
- Secure credential storage
- API key rotation
- Request signing and validation

## 📊 Performance Optimization

### 1. Database Optimization
- Proper indexing for agent queries
- Commission calculation caching
- Order history pagination

### 2. API Optimization
- Vendor response caching
- Bulk operations for commission payouts
- Background job processing for heavy operations

### 3. Frontend Optimization
- Agent dashboard lazy loading
- Real-time updates via WebSocket for order status
- Optimistic UI updates for better UX

## 🧪 Testing Strategy

### 1. Unit Tests
- Service layer testing
- Vendor interface implementations
- Commission calculations

### 2. Integration Tests
- API endpoint testing
- Database operations
- Third-party vendor integrations

### 3. E2E Tests
- Agent registration flow
- Order placement and tracking
- Commission calculation and payout

## 📈 Monitoring & Analytics

### 1. Business Metrics
- Agent performance tracking
- Vendor success rates
- Commission payout trends

### 2. Technical Metrics
- API response times
- Error rates per vendor
- System uptime and reliability

### 3. User Experience
- Agent dashboard usage
- Order completion rates
- Customer satisfaction scores

This architecture provides a solid foundation for scaling your data reseller business into a multi-vendor marketplace while maintaining code quality and business logic separation.