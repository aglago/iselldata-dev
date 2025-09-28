import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const {
      amount,
      reason,
      currency,
      network,
      accountName,
      accountNumber,
      reference,
      packageDetails,
      customerDetails
    } = await request.json();

    console.log('Initiating payment with data:', {
      amount,
      reason,
      currency,
      network,
      accountName,
      accountNumber,
      reference,
      packageDetails,
      customerDetails
    });

    // Make API call to ogateway
    const ogatewayResponse = await fetch('https://api.ogateway.io/collections/mobilemoney', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'Authorization': process.env.OGATEWAY_API_KEY!,
      },
      body: JSON.stringify({
        amount: amount,
        reason: reason,
        currency: currency,
        network: network,
        accountName: accountName,
        accountNumber: accountNumber,
        reference: reference,
        callbackURL: process.env.PAYMENT_CALLBACK_URL || `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment/callback`,
      }),
    });

    console.log('Request sent to ogateway:', {
      amount,
      reason,
      currency,
      network,
      accountName,
      accountNumber,
      reference,
      callbackURL: process.env.PAYMENT_CALLBACK_URL || `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment/callback`,
    });

    console.log('API URL:', 'https://api.ogateway.io/collections/mobilemoney');

    const paymentData = await ogatewayResponse.json();

    if (!ogatewayResponse.ok) {
        console.log('Payment initiation failed:', paymentData);
      return NextResponse.json({ 
        success: false, 
        message: paymentData.message || 'Payment initiation failed' 
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
    const trackingId = `TRK${Math.random().toString(36).substring(2, 10).toUpperCase()}`

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
        reference: paymentData.reference || reference,
        tracking_id: trackingId,
        ogateway_payment_id: paymentData.id,
      })
      .select()
      .single()

    if (orderError) {
      console.error('Order creation error:', orderError)
      return NextResponse.json({ success: false, message: 'Failed to create order record' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      data: paymentData,
      orderId: reference,
      trackingId: trackingId,
      transactionId: paymentData.id,
      message: 'Payment initiated successfully'
    });
  } catch (error) {
    console.error('Payment processing error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Payment processing failed' 
    }, { status: 500 });
  }
}