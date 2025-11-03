import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { paystackAPI, PaystackAPI } from '@/lib/paystack'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const {
      amount,
      packageDetails,
      customerDetails
    } = await request.json();

    console.log('Initiating Paystack payment:', {
      amount,
      packageDetails,
      customerDetails
    });

    // Generate unique reference and tracking ID for this transaction
    const reference = PaystackAPI.generateReference('GD')
    const trackingId = `TRK${Math.random().toString(36).substring(2, 10).toUpperCase()}`
    
    // Prepare Paystack transaction data
    const paystackData = {
      email: customerDetails.email || `${customerDetails.phoneNumber}@iselldata.com`, // Use phone as fallback email
      amount: PaystackAPI.toPesewas(amount), // Convert to pesewas
      reference: reference,
      callback_url: process.env.NODE_ENV === 'development' 
        ? `http://localhost:3000/success?reference=${reference}&trackingId=${trackingId}&amount=${amount}&package=${packageDetails.size}&network=${packageDetails.network}&phone=${customerDetails.phoneNumber}`
        : `https://${process.env.NEXT_PUBLIC_BASE_URL}/success?reference=${reference}&trackingId=${trackingId}&amount=${amount}&package=${packageDetails.size}&network=${packageDetails.network}&phone=${customerDetails.phoneNumber}`,
      metadata: {
        orderId: reference,
        customerName: customerDetails.customerName || customerDetails.name || '',
        packageSize: packageDetails.size,
        network: packageDetails.network,
        phoneNumber: customerDetails.phoneNumber
      }
    }
    
    // Initialize Paystack transaction
    const paystackResponse = await paystackAPI.initializeTransaction(paystackData)

    if (!paystackResponse.status) {
      console.log('Paystack initiation failed:', paystackResponse);
      return NextResponse.json({ 
        success: false, 
        message: paystackResponse.message || 'Payment initiation failed' 
      }, { status: 400 });
    }

    // Save order to database
    const supabase = await createClient()
    
    // Create or get customer
    let customerId: string
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('phone', customerDetails.phoneNumber)
      .single()

    if (existingCustomer) {
      customerId = existingCustomer.id
      // Update customer info
      await supabase
        .from('customers')
        .update({
          name: customerDetails.customerName || customerDetails.name,
          email: customerDetails.email,
          updated_at: new Date().toISOString(),
        })
        .eq('id', customerId)
    } else {
      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert({
          phone: customerDetails.phoneNumber,
          name: customerDetails.customerName || customerDetails.name,
          email: customerDetails.email,
        })
        .select('id')
        .single()

      if (customerError) {
        console.error('Customer creation error:', customerError)
        return NextResponse.json({ success: false, message: 'Failed to create customer record' }, { status: 500 })
      }
      customerId = newCustomer.id
    }

    // Create order record
    const packageSizeGB = Number.parseFloat(packageDetails.size.replace('GB', ''))
    const volumeMB = Math.round(packageSizeGB * 1024)

    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_id: reference,
        customer_id: customerId,
        phone: customerDetails.phoneNumber,
        network: packageDetails.network,
        package_size: packageDetails.size,
        volume_mb: volumeMB,
        price: packageDetails.price,
        payment_method: 'mobile_money',
        payment_status: 'pending',
        delivery_status: 'pending',
        reference: reference,
        tracking_id: trackingId,
        paystack_reference: reference,
      })
      .select()
      .single()

    if (orderError) {
      console.error('Order creation error:', orderError)
      return NextResponse.json({ success: false, message: 'Failed to create order record' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        authorization_url: paystackResponse.data.authorization_url,
        access_code: paystackResponse.data.access_code,
        reference: paystackResponse.data.reference
      },
      orderId: reference,
      trackingId: trackingId,
      authorizationUrl: paystackResponse.data.authorization_url,
      message: 'Payment initialized successfully. Complete payment to proceed.'
    });
  } catch (error) {
    console.error('Payment processing error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Payment processing failed' 
    }, { status: 500 });
  }
}