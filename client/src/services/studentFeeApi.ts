import api from "./api";

export type FeeType = "Tuition Fee" | "Examination Fee";

export type PaymentStatus = "Unpaid" | "Partially Paid" | "Paid";

export type TransactionStatus = "pending" | "success" | "failed";

export interface StudentFeeData {
    _id: string;
    feeType: FeeType;
    class: string | null;
    amount: number;
    dueDate: string;
    totalPaid: number;
    balance: number;
    paymentStatus: PaymentStatus;
    createdAt: string;
    updatedAt: string;
}

// Individual FeePayment model.
export interface FeePaymentData {
    _id: string;
    feeId: string;
    studentId: string;
    amount: number;
    status: TransactionStatus;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    receiptNumber?: string;
    transactionId?: string;
    createdAt: string;
    updatedAt: string;
}

// Fee breakdown for a payment-history transaction.
export interface PaymentHistoryFee {
    feeType: string;
    className: string;
    amount: number;
}

// Normalized response returned by getMyPaymentHistory().
export interface PaymentHistoryItem {
    _id: string;
    paymentType: "individual" | "combined";
    amount: number;
    status: TransactionStatus;
    receiptNumber: string | null;
    paymentId: string | null;
    date: string;
    feeDescription: string;
    fees: PaymentHistoryFee[];
}

// Individual/combined order creation response.
export interface CreatePaymentOrderResponse {
    key?: string;
    keyId?: string;
    orderId: string;
    amount: number; // Razorpay amount in paise
    currency: string;
    paymentId?: string;
    transactionId?: string;
    outstandingBalance?: number;
    remainingBalanceAfterPayment?: number;
    allocations?: FeePaymentAllocation[];
}

// One fee allocation in a combined payment.
export interface FeePaymentAllocation {
    feeId: string;
    amount: number; // INR, not paise
}

// Request body for an individual partial payment.
export interface CreateIndividualPaymentOrderRequest {
    amount?: number; // INR; omitted means pay full outstanding balance
}

// Request body for a combined partial payment.
export interface CreateCombinedPaymentOrderRequest {
    allocations: FeePaymentAllocation[];
}

export interface VerifyPaymentData {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}

export const getMyFees = async (): Promise<StudentFeeData[]> => {
    const response = await api.get("/student/fees");

    const data = response.data;

    if (Array.isArray(data)) {
        return data;
    }

    if (Array.isArray(data.fees)) {
        return data.fees;
    }

    return [];
};

export const getMyFeeById = async (
    feeId: string
): Promise<StudentFeeData> => {
    const response = await api.get(`/student/fees/${feeId}`);

    return response.data.fee ?? response.data;
};

/**
 * Create an individual fee payment order.
 *
 * Pass { amount } for a partial payment.
 * Omit the request body to pay the full outstanding balance.
 */
export const createPaymentOrder = async (
    feeId: string,
    data?: CreateIndividualPaymentOrderRequest
): Promise<CreatePaymentOrderResponse> => {
    const response = await api.post(
        `/student/fees/${feeId}/create-order`,
        data ?? {}
    );

    return response.data;
};

/**
 * Create a combined payment order.
 *
 * Pass allocations to pay selected fees or partial amounts.
 * Omit the request body to pay all outstanding applicable fees.
 */
export const createCombinedPaymentOrder = async (
    data?: CreateCombinedPaymentOrderRequest
): Promise<CreatePaymentOrderResponse> => {
    const response = await api.post(
        "/student/fees/create-combined-order",
        data ?? {}
    );

    return response.data;
};

// Verify an individual fee payment.
export const verifyPayment = async (
    data: VerifyPaymentData
) => {
    const response = await api.post(
        "/student/fees/verify-payment",
        data
    );

    return response.data;
};

// Verify a combined fee payment.
export const verifyCombinedPayment = async (
    data: VerifyPaymentData
) => {
    const response = await api.post(
        "/student/fees/verify-combined-payment",
        data
    );

    return response.data;
};

// Retrieve normalized individual and combined payment history.
export const getMyPaymentHistory =
    async (): Promise<PaymentHistoryItem[]> => {
        const response = await api.get(
            "/student/fees/payments/history"
        );

        const data = response.data;

        if (Array.isArray(data)) {
            return data as PaymentHistoryItem[];
        }

        if (Array.isArray(data.payments)) {
            return data.payments as PaymentHistoryItem[];
        }

        return [];
    };

// Download an individual or combined payment receipt.
export const downloadPaymentReceipt = async (
    paymentId: string,
    paymentType: "individual" | "combined" = "individual"
): Promise<Blob> => {
    const endpoint =
        paymentType === "combined"
            ? `/student/fees/combined-payments/${paymentId}/receipt`
            : `/student/fees/payments/${paymentId}/receipt`;

    const response = await api.get(endpoint, {
        responseType: "blob",
    });

    return response.data;
};