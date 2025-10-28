import { smsService } from './arkesel-sms'

export async function checkLowBalanceAlert(hubnetResult: any) {
  try {
    // Extract current balance from Hubnet response
    const currentBalance = hubnetResult.data?.current_balance || hubnetResult.current_balance
    
    if (currentBalance && currentBalance < 60) {
      console.log(`Low balance detected: GH₵${currentBalance}`)
      
      // Send SMS alert to admin
      await smsService.sendSMS({
        to: '0249905548',
        message: `Your account balance is GH₵${currentBalance}. Please top up your account to continue processing orders.`
      })
      
      console.log('Low balance alert sent to admin')
    }
  } catch (error) {
    console.error('Failed to check/send low balance alert:', error)
    // Don't throw error - this shouldn't stop order processing
  }
}