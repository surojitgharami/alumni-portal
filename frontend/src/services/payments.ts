import api from './api'

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance
  }
}

interface RazorpayOptions {
  key: string
  amount: number
  currency: string
  order_id: string
  name: string
  description: string
  prefill?: {
    name?: string
    email?: string
    contact?: string
  }
  handler: (response: RazorpayResponse) => void
  modal?: {
    ondismiss?: () => void
  }
  theme?: {
    color?: string
  }
}

interface RazorpayInstance {
  open: () => void
  close: () => void
}

interface RazorpayResponse {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

interface CreateOrderData {
  amount: number
  purpose: 'membership' | 'event' | 'donation'
  metadata?: Record<string, unknown>
}

export const createPaymentOrder = async (data: CreateOrderData) => {
  const response = await api.post('/api/payments/create-order', data)
  return response.data
}

export const verifyPayment = async (data: {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
  purpose: 'membership' | 'event' | 'donation'
  metadata?: Record<string, unknown>
}) => {
  const response = await api.post('/api/payments/verify', data)
  return response.data
}

export const openRazorpayCheckout = (
  orderData: { order_id: string; amount: number; currency: string; key_id: string },
  userInfo: { name: string; email: string; phone: string },
  purpose: 'membership' | 'event' | 'donation',
  onSuccess: (response: RazorpayResponse) => void,
  onDismiss?: () => void
) => {
  if (!window.Razorpay) {
    alert('Razorpay library not loaded. Please refresh the page and try again.')
    return
  }

  const purposeDescriptions = {
    membership: 'Alumni Portal Membership',
    event: 'Event Registration',
    donation: 'Donation to Alumni Fund'
  }

  const options: RazorpayOptions = {
    key: orderData.key_id,
    amount: orderData.amount,
    currency: orderData.currency,
    order_id: orderData.order_id,
    name: 'Alumni Portal',
    description: purposeDescriptions[purpose],
    prefill: {
      name: userInfo.name,
      email: userInfo.email,
      contact: userInfo.phone
    },
    handler: onSuccess,
    modal: {
      ondismiss: onDismiss
    },
    theme: {
      color: '#0F4C81'
    }
  }

  try {
    const rzp = new window.Razorpay(options)
    rzp.open()
  } catch (error) {
    console.error('Error opening Razorpay checkout:', error)
    alert('Failed to open payment dialog. Please try again.')
  }
}
