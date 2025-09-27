// app/api/payment/validate-account/route.ts

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { currency, accountCode, accountNumber } = await request.json();

    const response = await fetch(
      `https://api.ogateway.io/accountquery?currency=${currency}&accountCode=${accountCode}&accountNumber=${accountNumber}`,
      {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'Authorization': process.env.OGATEWAY_API_KEY!,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        message: data.message || 'Account validation failed'
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      accountName: data.accountName || data.name,
      data: data
    });
  } catch (error) {
    console.error('Account validation error:', error);
    return NextResponse.json({
      success: false,
      message: 'Account validation failed'
    }, { status: 500 });
  }
}