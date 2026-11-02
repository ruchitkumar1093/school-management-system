export interface RazorpayPaymentResponse {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}

export interface RazorpayCheckoutOptions {
    key: string;
    amount: number;
    currency: string;
    orderId: string;
    name: string;
    description: string;
    onSuccess: (response: RazorpayPaymentResponse) => void;
    onDismiss?: () => void;
}

declare global {
    interface Window {
        Razorpay?: new (options: Record<string, unknown>) => {
            open: () => void;
            on: (
                event: string,
                callback: (response: {
                    error?: {
                        description?: string;
                    };
                }) => void
            ) => void;
        };
    }
}

export const openRazorpayCheckout = (
    options: RazorpayCheckoutOptions
): Promise<void> => {
    return new Promise((resolve, reject) => {
        const Razorpay = window.Razorpay;

        if (!Razorpay) {
            reject(
                new Error(
                    "Razorpay Checkout has not loaded. Please refresh and try again."
                )
            );
            return;
        }

        const checkout = new Razorpay({
            key: options.key,
            amount: options.amount,
            currency: options.currency,
            order_id: options.orderId,
            name: options.name,
            description: options.description,

            handler: (response: RazorpayPaymentResponse) => {
                options.onSuccess(response);
                resolve();
            },

            modal: {
                ondismiss: () => {
                    options.onDismiss?.();
                    resolve();
                }
            },

            theme: {
                color: "#6D28D9"
            }
        });

        checkout.on("payment.failed", (response) => {
            reject(
                new Error(
                    response.error?.description ||
                    "Payment failed. Please try again."
                )
            );
        });

        checkout.open();
    });
};