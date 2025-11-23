# Agent System Implementation Plan
## Multi-Vendor Data Reseller Platform

### 🎯 **Project Goals**

Transform the existing single-customer data platform into a dual-mode system:
1. **Regular Customers**: Continue existing flow (no login, track with reference/tracking ID)
2. **Registered Agents**: Login-based system with wholesale pricing, wallet management, and business tools

---

## 🏗️ **System Architecture Overview**

### **Customer Flow (Existing - No Changes)**
```
Landing Page → Browse Packages → Order → Payment → SMS Confirmation → Track Order
```

### **New Agent Flow**
```
Landing Page → "Join as Agent" → Agent Info Page → Registration → Payment (₵30) 
→ Agent Dashboard → Load Wallet → Place Orders → Manage Business
```

### **Optional Add-on: Custom Flyer Service**
```
Agent Registration → Flyer Option (₵50) → Design Template → Payment → Generated Flyer
```

---

## 📊 **Database Schema Extensions**

### **New Tables to Add**

#### **1. agents**
```sql
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(100) NOT NULL UNIQUE,
  phone VARCHAR(15) NOT NULL UNIQUE,
  full_name VARCHAR(100) NOT NULL,
  business_name VARCHAR(100),
  address TEXT,
  city VARCHAR(50),
  region VARCHAR(50),
  
  -- Status and tier management
  status VARCHAR(20) DEFAULT 'pending', -- pending, active, suspended, inactive
  cumulative_order_value DECIMAL(12,2) DEFAULT 0.00, -- Total order value since registration
  current_month_orders INTEGER DEFAULT 0, -- Orders this month (resets monthly)
  current_month_value DECIMAL(12,2) DEFAULT 0.00, -- Order value this month (resets monthly)
  total_orders INTEGER DEFAULT 0, -- All-time orders
  current_tier VARCHAR(20) DEFAULT 'basic', -- basic, bronze, silver, gold, platinum
  
  -- Financial tracking
  wallet_balance DECIMAL(10,2) DEFAULT 0.00,
  total_revenue DECIMAL(12,2) DEFAULT 0.00,
  pending_commissions DECIMAL(10,2) DEFAULT 0.00, -- Commissions earned this month
  total_commissions_earned DECIMAL(12,2) DEFAULT 0.00, -- All-time commissions
  registration_fee_paid BOOLEAN DEFAULT false,
  registration_fee_reference VARCHAR(100),
  
  -- Login credentials
  password_hash TEXT NOT NULL,
  
  -- Business information
  business_hours VARCHAR(200),
  contact_whatsapp VARCHAR(15),
  contact_telegram VARCHAR(100),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE
);
```

#### **2. agent_sessions**
```sql
CREATE TABLE agent_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **3. agent_wallet_transactions**
```sql
CREATE TABLE agent_wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL, -- load, deduction, refund, commission
  amount DECIMAL(10,2) NOT NULL,
  balance_before DECIMAL(10,2) NOT NULL,
  balance_after DECIMAL(10,2) NOT NULL,
  reference VARCHAR(100),
  paystack_reference VARCHAR(100),
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- pending, completed, failed
  order_id UUID REFERENCES orders(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **4. agent_commission_payments**
```sql
CREATE TABLE agent_commission_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  month INTEGER NOT NULL, -- 1-12
  year INTEGER NOT NULL,
  tier_achieved VARCHAR(20) NOT NULL, -- basic, bronze, silver, gold, platinum
  orders_count INTEGER NOT NULL,
  total_order_value DECIMAL(12,2) NOT NULL,
  cumulative_value_at_month_end DECIMAL(12,2) NOT NULL, -- Cumulative orders at month end
  commission_breakdown JSONB NOT NULL, -- Package-specific commission details
  total_commission_amount DECIMAL(10,2) NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(agent_id, month, year)
);
```

#### **5. custom_flyers**
```sql
CREATE TABLE custom_flyers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  business_name VARCHAR(100) NOT NULL,
  contact_phone VARCHAR(15) NOT NULL,
  contact_whatsapp VARCHAR(15),
  business_hours VARCHAR(200),
  pricing_data JSONB NOT NULL, -- Custom package pricing
  design_template VARCHAR(50) DEFAULT 'default',
  generated_image_url TEXT,
  payment_reference VARCHAR(100) NOT NULL,
  payment_status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  generated_at TIMESTAMP WITH TIME ZONE
);
```

### **Modifications to Existing Tables**

#### **Update orders table**
```sql
-- Add agent tracking
ALTER TABLE orders ADD COLUMN agent_id UUID REFERENCES agents(id);
ALTER TABLE orders ADD COLUMN order_type VARCHAR(20) DEFAULT 'customer'; -- customer, agent
ALTER TABLE orders ADD COLUMN agent_price DECIMAL(10,2); -- Price agent paid
ALTER TABLE orders ADD COLUMN commission_amount DECIMAL(10,2); -- Commission to be given to agent
ALTER TABLE orders ADD COLUMN commission_paid BOOLEAN DEFAULT false; -- Whether commission has been liquidated

-- Add indexes
CREATE INDEX idx_orders_agent_id ON orders(agent_id);
CREATE INDEX idx_orders_order_type ON orders(order_type);
CREATE INDEX idx_orders_agent_created_at ON orders(agent_id, created_at);
```

---

## 🏷️ **Pricing Strategy**

### **Simplified Agent Pricing**
**All agents get the same wholesale prices** - no complex tiers for pricing.

### **Commission Reward System (Monthly Payouts)**
iSellData **pays commissions** to agents based on their **cumulative order value since registration** with **package-specific commission rates**:

| Tier | Total Orders Since Registration | Commission Structure | Target Timeline |
|------|------------------------------|---------------------|-----------------|
| **Basic** | ₵0 - 2,000 | **No Commission** - Wholesale pricing only | Month 1-3 |
| **Bronze** | ₵2,000 - 10,000 | **Package-Specific Rates** (0.5% - 3%) | Month 3-6 |
| **Silver** | ₵10,000 - 20,000 | **Package-Specific Rates** (0.7% - 4%) | Month 6-12 |
| **Gold** | ₵20,000 - 50,000 | **Package-Specific Rates** (1% - 5%) | Month 12-18 |
| **Platinum** | ₵50,000+ | **Package-Specific Rates** (1.2% - 6%) | Month 18+ |

### **Sample Package-Specific Commission Rates:**
- **Small packages (1GB-3GB)**: Higher rates (2-6%) - can handle the commission
- **Medium packages (4GB-8GB)**: Moderate rates (1-3%) - protect margins
- **Large packages (10GB+)**: Lower rates (0.5-2.5%) - maintain profitability

**Monthly Liquidation**: Commissions are automatically added to agent wallets on the 1st of each month.

### **Sample Agent Pricing (Same for All)**
Agent prices already include your profit margins:

| Package | Regular Price | Agent Price (All Tiers) | Agent Savings |
|---------|---------------|------------------------|---------------|
| 1GB MTN | ₵4.50 | ₵4.00 | ₵0.50 |
| 2GB MTN | ₵8.50 | ₵7.50 | ₵1.00 |
| 5GB MTN | ₵20.00 | ₵18.00 | ₵2.00 |
| 10GB MTN | ₵38.00 | ₵34.00 | ₵4.00 |

---

## 📋 **Implementation Phases**

### **Phase 1: Agent Registration System** (Week 1-2)

#### **Week 1: Backend Infrastructure**
- [ ] **Day 1-2**: Create database migrations for new tables
- [ ] **Day 3-4**: Build agent registration API endpoints
- [ ] **Day 5**: Build agent authentication system
- [ ] **Day 6-7**: Create agent pricing calculation service

#### **Week 2: Frontend Registration Flow**
- [ ] **Day 1-2**: Build "Join as Agent" landing page with pricing tables
- [ ] **Day 3-4**: Create agent registration form
- [ ] **Day 5**: Implement registration payment flow (₵30)
- [ ] **Day 6-7**: Build registration confirmation and email system

**Action Items Phase 1:**
```
1. Create `app/api/agents/register/route.ts`
2. Create `app/api/agents/auth/login/route.ts` 
3. Create `app/join-as-agent/page.tsx`
4. Create `app/agent/register/page.tsx`
5. Create `components/agent/RegistrationForm.tsx`
6. Create `components/agent/PricingTable.tsx`
7. Create `lib/agent-auth.ts`
8. Create `lib/agent-pricing.ts`
```

### **Phase 2: Agent Dashboard** (Week 3-4)

#### **Week 3: Core Dashboard**
- [ ] **Day 1-2**: Build agent login page and authentication
- [ ] **Day 3-4**: Create main agent dashboard with stats
- [ ] **Day 5**: Build wallet balance display and transaction history
- [ ] **Day 6-7**: Create wallet loading functionality

#### **Week 4: Order Management**
- [ ] **Day 1-2**: Build order placement interface for agents
- [ ] **Day 3-4**: Create order history and tracking for agents
- [ ] **Day 5**: Build customer order management (agents placing orders for customers)
- [ ] **Day 6-7**: Testing and refinement

**Action Items Phase 2:**
```
1. Create `app/agent/login/page.tsx`
2. Create `app/agent/dashboard/page.tsx`
3. Create `app/agent/wallet/page.tsx`
4. Create `app/agent/orders/page.tsx`
5. Create `components/agent/DashboardStats.tsx`
6. Create `components/agent/WalletManager.tsx`
7. Create `components/agent/OrderPlacement.tsx`
8. Create `app/api/agents/wallet/load/route.ts`
9. Create `app/api/agents/orders/place/route.ts`
```

### **Phase 3: Custom Flyer System** (Week 5)

#### **Week 5: Flyer Generator**
- [ ] **Day 1-2**: Design flyer templates (PNG/JPG generation)
- [ ] **Day 3-4**: Build flyer customization interface
- [ ] **Day 5**: Implement flyer payment and generation system
- [ ] **Day 6-7**: Testing and delivery system

**Action Items Phase 3:**
```
1. Create `app/agent/flyer/page.tsx`
2. Create `components/agent/FlyerDesigner.tsx`
3. Create `app/api/agents/flyer/generate/route.ts`
4. Create `lib/flyer-generator.ts`
5. Setup image generation service (Canvas API or similar)
```

### **Phase 4: Commission & Analytics** (Week 6)

#### **Week 6: Commission System & Analytics**
- [ ] **Day 1-2**: Build monthly commission calculation system (package-specific rates based on cumulative value)
- [ ] **Day 3**: Create automated monthly liquidation (runs 1st of each month)
- [ ] **Day 4**: Build commission tracking and history display
- [ ] **Day 5**: Build comprehensive agent analytics with tier progression
- [ ] **Day 6-7**: Performance optimization and testing

**Action Items Phase 4:**
```
1. Create `app/agent/commissions/page.tsx`
2. Create `components/agent/CommissionTracker.tsx`
3. Create `app/api/agents/commissions/calculate/route.ts`
4. Create `lib/monthly-commission-processor.ts` (cron job)
5. Create `app/agent/analytics/page.tsx`
6. Create `components/agent/TierProgress.tsx`
7. Create `components/agent/PerformanceMetrics.tsx`
8. Create automated tier upgrade system based on cumulative order value
9. Create package-specific commission rate display
```

---

## 🛠️ **Technical Implementation Details**

### **Authentication Strategy**
```typescript
// Keep existing customer flow unchanged
// Add new agent authentication parallel to admin auth

// lib/agent-auth.ts
export interface AgentSession {
  agentId: string;
  email: string;
  tier: string;
  walletBalance: number;
  expiresAt: Date;
}
```

### **Pricing & Commission Service**
```typescript
// lib/agent-pricing.ts
export class AgentPricingService {
  // Fixed agent pricing - same for all agents
  static getAgentPrice(regularPrice: number): number {
    const agentPrices = {
      6.00: 5.50,   // 1GB MTN
      12.00: 10.50, // 2GB MTN  
      25.00: 23.50, // 5GB MTN
      45.00: 44.00, // 10GB MTN
      5.00: 4.50,   // 1GB AirtelTigo
      10.00: 9.00,  // 2GB AirtelTigo
      22.00: 20.50, // 5GB AirtelTigo
      40.00: 39.00, // 10GB AirtelTigo
      // ... add all packages
    };
    return agentPrices[regularPrice] || regularPrice * 0.89; // 11% discount as fallback
  }

  // Commission calculation based on cumulative order value and package-specific rates
  static getTierFromCumulativeValue(cumulativeValue: number): string {
    if (cumulativeValue >= 50000) return 'platinum';
    if (cumulativeValue >= 20000) return 'gold';
    if (cumulativeValue >= 10000) return 'silver';
    if (cumulativeValue >= 2000) return 'bronze';
    return 'basic';
  }

  // Package-specific commission rates by tier
  static getPackageCommissionRate(packageSize: string, network: string, tier: string): number {
    const commissionMatrix = {
      'mtn': {
        '1GB': { basic: 0, bronze: 0.03, silver: 0.04, gold: 0.05, platinum: 0.06 },
        '2GB': { basic: 0, bronze: 0.025, silver: 0.035, gold: 0.045, platinum: 0.055 },
        '5GB': { basic: 0, bronze: 0.01, silver: 0.015, gold: 0.02, platinum: 0.025 },
        '10GB': { basic: 0, bronze: 0.005, silver: 0.008, gold: 0.01, platinum: 0.012 },
        '50GB': { basic: 0, bronze: 0.012, silver: 0.018, gold: 0.022, platinum: 0.025 }
      },
      'airteltigo': {
        '1GB': { basic: 0, bronze: 0.03, silver: 0.04, gold: 0.05, platinum: 0.06 },
        '2GB': { basic: 0, bronze: 0.03, silver: 0.04, gold: 0.05, platinum: 0.06 },
        '5GB': { basic: 0, bronze: 0.02, silver: 0.025, gold: 0.03, platinum: 0.035 },
        '10GB': { basic: 0, bronze: 0.008, silver: 0.012, gold: 0.015, platinum: 0.018 },
        '50GB': { basic: 0, bronze: 0.015, silver: 0.022, gold: 0.028, platinum: 0.032 }
      }
    };

    return commissionMatrix[network]?.[packageSize]?.[tier] || 0;
  }

  static calculateCommission(orderAmount: number, packageSize: string, network: string, cumulativeValue: number): number {
    const tier = this.getTierFromCumulativeValue(cumulativeValue);
    const rate = this.getPackageCommissionRate(packageSize, network, tier);
    return orderAmount * rate;
  }
}
```

### **Wallet Management System**
```typescript
// lib/agent-wallet.ts
export class AgentWalletService {
  static async loadWallet(agentId: string, amount: number): Promise<PaystackInitializeResponse>
  static async deductFromWallet(agentId: string, amount: number, orderId: string): Promise<boolean>
  static async getBalance(agentId: string): Promise<number>
  static async getTransactionHistory(agentId: string): Promise<WalletTransaction[]>
}
```

---

## 🎨 **User Interface Design**

### **Landing Page Changes**
```
Current: [Browse Packages] 
New:     [Browse Packages] [Join as Agent]
```

### **Agent Registration Page**
```
Hero Section: "Become a Data Agent - Earn with Every Sale"
Pricing Table: Regular vs Agent prices
Benefits List: Commission rates, wallet system, business tools
Registration Form: Personal + Business details
Payment: ₵30 registration fee
Optional: Custom flyer for ₵50
```

### **Agent Dashboard Layout**
```
Header: Logo, Agent Name, Logout
Sidebar: Dashboard, Orders, Wallet, Analytics, Flyer
Main Content: 
  - Stats cards (Wallet Balance, Total Orders, Commissions)
  - Quick actions (Place Order, Load Wallet)
  - Recent orders table
  - Performance metrics
```

---

## 🔧 **API Endpoints to Create**

### **Agent Management**
```
POST   /api/agents/register          - Agent registration
POST   /api/agents/auth/login        - Agent login
POST   /api/agents/auth/logout       - Agent logout
GET    /api/agents/profile           - Get agent profile
PUT    /api/agents/profile           - Update agent profile
GET    /api/agents/pricing           - Get agent pricing
```

### **Wallet Management**
```
GET    /api/agents/wallet/balance    - Get wallet balance
POST   /api/agents/wallet/load       - Initiate wallet loading
GET    /api/agents/wallet/history    - Transaction history
POST   /api/agents/wallet/verify     - Verify payment
```

### **Order Management**
```
POST   /api/agents/orders/place      - Place order for customer
GET    /api/agents/orders/history    - Get order history
GET    /api/agents/orders/stats      - Get order statistics
```

### **Flyer System**
```
POST   /api/agents/flyer/customize   - Customize flyer
POST   /api/agents/flyer/payment     - Pay for flyer
POST   /api/agents/flyer/generate    - Generate flyer image
GET    /api/agents/flyer/download    - Download generated flyer
```

---

## 💰 **Revenue Model**

### **Revenue Streams**
1. **Registration Fees**: ₵30 per agent
2. **Flyer Service**: ₵50 per custom flyer
3. **Transaction Volume**: Increased sales through agent network
4. **Platform Fees**: Small percentage on agent transactions (optional)

### **Break-Even Analysis**
- 100 agents × ₵30 = ₵3,000 (covers development cost)
- 50 flyers × ₵50 = ₵2,500 (additional revenue)
- Increased transaction volume = ongoing revenue

---

## 🧪 **Testing Strategy**

### **Phase 1 Testing**
- [ ] Agent registration flow end-to-end
- [ ] Payment integration for registration fees
- [ ] Email confirmation system
- [ ] Agent authentication

### **Phase 2 Testing** 
- [ ] Agent dashboard functionality
- [ ] Wallet loading and deduction
- [ ] Order placement for customers
- [ ] Order tracking and history

### **Phase 3 Testing**
- [ ] Flyer customization and generation
- [ ] Payment processing for flyers
- [ ] Image generation and delivery

### **Integration Testing**
- [ ] Regular customer flow unchanged
- [ ] Agent vs customer pricing accuracy
- [ ] Database integrity and relationships
- [ ] Performance under load

---

## 🚀 **Deployment Plan**

### **Pre-Deployment Checklist**
- [ ] All database migrations tested
- [ ] Environment variables configured
- [ ] Payment webhooks tested
- [ ] SMS notifications working
- [ ] Email system configured
- [ ] Image generation service ready

### **Rollout Strategy**
1. **Beta Testing**: 10 invited agents
2. **Soft Launch**: Public registration, limited marketing
3. **Full Launch**: Marketing campaign, social media promotion

---

## 📈 **Success Metrics**

### **Key Performance Indicators**
- Number of registered agents
- Agent retention rate (30-day, 90-day)
- Average wallet loading amount
- Order volume through agents vs direct
- Revenue from registration fees and flyers
- Customer acquisition through agents

### **Technical Metrics**
- Page load times (agent dashboard < 2s)
- Payment success rate (>95%)
- System uptime (>99.5%)
- Order processing time

---

## 🔒 **Security Considerations**

### **Agent Data Protection**
- Encrypt sensitive agent information
- Secure wallet balance storage
- Audit trails for all financial transactions
- Rate limiting on API endpoints

### **Authentication Security**
- Strong password requirements
- Session management and timeouts
- IP tracking for suspicious activity
- Two-factor authentication (future)

---

## 💡 **Future Enhancements** (Post-Launch)

### **Phase 5+ Features**
- Mobile app for agents
- Bulk order processing
- Agent referral program
- Advanced analytics and reporting
- Multi-language support
- Integration with more data vendors
- Agent-to-agent transactions
- Automated tier progression
- Custom commission structures

---

## 📊 **Commission Calculation Examples**

### **Scenario 1: Volume vs Value Comparison**
**Agent A (High Volume, Low Value):**
- 60 orders/month × ₵4 average = ₵240 total value
- ₵240 ÷ 30 days = ₵8/day average
- **Tier: Bronze (₵0-50/day)** → 2% commission = ₵4.80

**Agent B (Low Volume, High Value):**
- 6 orders/month × ₵40 average = ₵240 total value
- ₵240 ÷ 30 days = ₵8/day average  
- **Tier: Bronze (₵0-50/day)** → 2% commission = ₵4.80

*Both get the same commission despite different order patterns - fair and value-based*

### **Scenario 2: Different Performance Levels**
**Casual Agent:** ₵30/day (₵900/month) → Bronze (2%) → ₵18 commission
**Part-time Agent:** ₵100/day (₵3000/month) → Silver (3%) → ₵90 commission  
**Active Agent:** ₵250/day (₵7500/month) → Gold (4%) → ₵300 commission
**Power Agent:** ₵600/day (₵18000/month) → Platinum (5%) → ₵900 commission

### **Scenario 3: Business Growth Journey**
**Growing Agent Example:**
- Month 1: ₵30/day → Bronze (2%) → ₵18 commission on ₵900
- Month 3: ₵80/day → Silver (3%) → ₵72 commission on ₵2,400
- Month 6: ₵200/day → Gold (4%) → ₵240 commission on ₵6,000
- Month 12: ₵500/day → Platinum (5%) → ₵750 commission on ₵15,000

This system rewards **business growth and high-value sales** rather than just order quantity.

---

## 📋 **Quick Reference: Package-Specific Commission Rates**

For detailed commission rates by package and tier, see: `PACKAGE_SPECIFIC_COMMISSION_STRUCTURE.md`

**Key highlights:**
- **Basic Tier** (₵0-2,000): 0% commission - wholesale pricing only
- **Bronze Tier** (₵2,000-10,000): 0.5%-3% commission (package-specific)
- **Silver Tier** (₵10,000-20,000): 0.7%-4% commission (package-specific)  
- **Gold Tier** (₵20,000-50,000): 1%-5% commission (package-specific)
- **Platinum Tier** (₵50,000+): 1.2%-6% commission (package-specific)

**Commission Protection Strategy:**
- Small packages (1GB-3GB): Higher rates (safe margins)
- Medium packages (4GB-8GB): Moderate rates (protected margins)
- Large packages (10GB+): Lower rates (guaranteed profitability)

---

This plan maintains your existing customer flow while building a comprehensive agent system with **guaranteed profitability on every transaction**. Each phase is incremental and testable, ensuring we don't break existing functionality while adding powerful new features.

**Estimated Timeline**: 6 weeks for full implementation
**Estimated Development Cost**: Covered by first 100 agent registrations  
**Risk Level**: Very Low (builds alongside existing system + protected profit margins)

Ready to proceed with Phase 1 when you approve this plan!