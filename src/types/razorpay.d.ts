export {};

declare global {
  interface RazorpayPaymentResponse {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }

  interface RazorpayCheckoutOptions {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description: string;
    order_id: string;
    handler: (response: RazorpayPaymentResponse) => void;
    modal?: {
      ondismiss?: () => void;
    };
    theme?: {
      color?: string;
    };
  }

  interface RazorpayCheckoutInstance {
    open: () => void;
  }

  interface RazorpayCheckoutConstructor {
    new (options: RazorpayCheckoutOptions): RazorpayCheckoutInstance;
  }

  interface Window {
    Razorpay?: RazorpayCheckoutConstructor;
  }
}