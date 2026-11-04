import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Wallet,
    TrendingUp,
    Clock,
    ReceiptText,
    CalendarDays,
    LoaderCircle,
    CreditCard,
    ArrowRight,
    History,
    AlertCircle,
    BookOpen,
    School,
    X,
    RefreshCw,
    CheckCircle2,
    Download,
    Plus,
    Minus,
} from "lucide-react";

import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import Breadcrumb from "../../components/breadcrumb";
import Modal from "../../components/modal";

import {
    getMyFees,
    createPaymentOrder,
    createCombinedPaymentOrder,
    verifyPayment,
    verifyCombinedPayment,
    getMyPaymentHistory,
    downloadPaymentReceipt,
} from "../../services/studentFeeApi";

import type {
    StudentFeeData,
    PaymentHistoryItem,
    FeePaymentAllocation,
} from "../../services/studentFeeApi";

import { openRazorpayCheckout } from "../../utils/razorpayCheckout";

const currency = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
    }).format(amount);

const formatDate = (date: string) => {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return "—";

    return parsedDate.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const statusStyles: Record<string, string> = {
    Paid: "bg-green-100 text-green-700 ring-green-200",
    "Partially Paid": "bg-amber-100 text-amber-700 ring-amber-200",
    Unpaid: "bg-red-100 text-red-700 ring-red-200",
};

type PaymentOrderResponse = {
    message?: string;
    paymentId?: string;
    orderId: string;
    amount: number;
    currency: string;
    keyId?: string;
    key?: string;
};

type PaymentDialogMode = "individual" | "combined";

type PaymentDialogState = {
    mode: PaymentDialogMode;
    fee?: StudentFeeData;
};

function StudentFees() {
    const [fees, setFees] = useState<StudentFeeData[]>([]);
    const [loading, setLoading] = useState(true);
    const [payingFeeId, setPayingFeeId] = useState<string | null>(null);

    const [showHistory, setShowHistory] = useState(false);
    const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryItem[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const [downloadingReceiptId, setDownloadingReceiptId] =
        useState<string | null>(null);

    const [paymentDialog, setPaymentDialog] =
        useState<PaymentDialogState | null>(null);

    const [individualAmount, setIndividualAmount] = useState("");
    const [combinedAmounts, setCombinedAmounts] = useState<Record<string, string>>(
        {}
    );

    const [startingPayment, setStartingPayment] = useState(false);

    const [modal, setModal] = useState({
        show: false,
        title: "",
        message: "",
        type: "error" as "success" | "error",
    });

    const showMessage = (
        title: string,
        message: string,
        type: "success" | "error" = "error"
    ) => {
        setModal({
            show: true,
            title,
            message,
            type,
        });
    };

    const fetchFees = useCallback(async () => {
        try {
            setLoading(true);

            const response = await getMyFees();

            const feeRecords = Array.isArray(response)
                ? response
                : Array.isArray(
                    (response as unknown as { fees?: StudentFeeData[] })?.fees
                )
                    ? (response as unknown as { fees: StudentFeeData[] }).fees
                    : [];

            setFees(feeRecords);
            const history = await getMyPaymentHistory();
            setPaymentHistory(history);
        } catch (error) {
            console.error("Failed to fetch student fees:", error);

            showMessage(
                "Unable to Load Fees",
                "We couldn't load your fee records. Please refresh the page and try again."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchFees();
    }, [fetchFees]);

    const totals = useMemo(
        () =>
            fees.reduce(
                (result, fee) => {
                    result.assigned += Number(fee.amount) || 0;
                    result.paid += Number(fee.totalPaid) || 0;
                    result.balance += Number(fee.balance) || 0;

                    return result;
                },
                {
                    assigned: 0,
                    paid: 0,
                    balance: 0,
                }
            ),
        [fees]
    );

    const tuitionFee = useMemo(
        () => fees.find((fee) => fee.feeType === "Tuition Fee"),
        [fees]
    );

    const examinationFee = useMemo(
        () => fees.find((fee) => fee.feeType === "Examination Fee"),
        [fees]
    );

    const summaryCards = [
        {
            title: "Total Fees",
            value: currency(totals.assigned),
            icon: Wallet,
            iconStyle: "bg-purple-100 text-purple-700",
        },
        {
            title: "Amount Paid",
            value: currency(totals.paid),
            icon: TrendingUp,
            iconStyle: "bg-green-100 text-green-700",
        },
        {
            title: "Outstanding Balance",
            value: currency(totals.balance),
            icon: Clock,
            iconStyle: "bg-amber-100 text-amber-700",
        },
    ];

    const handleDownloadReceipt = async (
        paymentId: string,
        receiptNumber?: string,
        paymentType: "individual" | "combined" = "individual"
    ) => {
        if (downloadingReceiptId !== null) return;

        try {
            setDownloadingReceiptId(paymentId);

            const pdfBlob = await downloadPaymentReceipt(
                paymentId,
                paymentType
            );

            if (pdfBlob.size === 0) {
                throw new Error("The receipt PDF is empty.");
            }

            const pdfUrl = URL.createObjectURL(
                new Blob([pdfBlob], { type: "application/pdf" })
            );

            const link = document.createElement("a");

            link.href = pdfUrl;
            link.download = `${receiptNumber || `fee-receipt-${paymentId}`}.pdf`;

            document.body.appendChild(link);
            link.click();
            link.remove();

            window.setTimeout(() => {
                URL.revokeObjectURL(pdfUrl);
            }, 1000);
        } catch (error) {
            console.error("Failed to download fee receipt:", error);

            showMessage(
                "Receipt Download Failed",
                "We couldn't download your receipt. Please try again."
            );
        } finally {
            setDownloadingReceiptId(null);
        }
    };

    const openIndividualPaymentDialog = (fee: StudentFeeData) => {
        if (fee.balance <= 0) {
            showMessage(
                "Fee Already Paid",
                "There is no outstanding balance for this fee.",
                "success"
            );
            return;
        }

        setIndividualAmount(String(Number(fee.balance.toFixed(2))));
        setPaymentDialog({
            mode: "individual",
            fee,
        });
    };

    const openCombinedPaymentDialog = () => {
        const outstandingFees = fees.filter(
            (fee) => Number(fee.balance) > 0
        );

        if (outstandingFees.length === 0) {
            showMessage(
                "No Outstanding Fees",
                "You have no outstanding fee balance.",
                "success"
            );
            return;
        }

        const initialAmounts = outstandingFees.reduce<Record<string, string>>(
            (result, fee) => {
                result[fee._id] = String(Number(fee.balance.toFixed(2)));
                return result;
            },
            {}
        );

        setCombinedAmounts(initialAmounts);
        setPaymentDialog({ mode: "combined" });
    };

    const parsePaymentAmount = (value: string) => {
        if (!value.trim()) return NaN;

        const amount = Number(value);

        if (!Number.isFinite(amount) || amount <= 0) return NaN;

        // Only allow currency values with at most two decimal places.
        if (!/^\d+(\.\d{1,2})?$/.test(value.trim())) return NaN;

        return Number(amount.toFixed(2));
    };

    const refreshPaymentHistory = async () => {
        try {
            const records = await getMyPaymentHistory();
            setPaymentHistory(records);
        } catch (error) {
            console.error("Failed to refresh payment history:", error);
        }
    };

    const handlePayFee = async (
        fee: StudentFeeData,
        requestedAmount: number
    ) => {
        if (payingFeeId !== null) return;

        if (
            !Number.isFinite(requestedAmount) ||
            requestedAmount <= 0 ||
            requestedAmount > Number(fee.balance) + 0.001
        ) {
            showMessage(
                "Invalid Payment Amount",
                `Enter an amount greater than ₹0 and no more than ${currency(
                    fee.balance
                )}.`
            );
            return;
        }

        let checkoutOpened = false;

        try {
            setPayingFeeId(fee._id);
            setStartingPayment(true);

            const response = (await createPaymentOrder(fee._id, {
                amount: requestedAmount,
            })) as PaymentOrderResponse;

            const razorpayKey = response?.keyId ?? response?.key;

            if (
                !razorpayKey ||
                !response?.orderId ||
                !response?.currency ||
                typeof response.amount !== "number"
            ) {
                console.error("Unexpected payment-order response:", response);

                throw new Error(
                    response?.message ||
                    "The server returned an incomplete payment order."
                );
            }

            checkoutOpened = true;
            setPaymentDialog(null);

            await openRazorpayCheckout({
                key: razorpayKey,
                amount: response.amount,
                currency: response.currency,
                orderId: response.orderId,
                name: "School Management System",
                description: fee.feeType,

                onSuccess: async (paymentResponse) => {
                    try {
                        await verifyPayment({
                            razorpay_order_id:
                                paymentResponse.razorpay_order_id,
                            razorpay_payment_id:
                                paymentResponse.razorpay_payment_id,
                            razorpay_signature:
                                paymentResponse.razorpay_signature,
                        });

                        await fetchFees();

                        if (showHistory) {
                            await refreshPaymentHistory();
                        }

                        showMessage(
                            "Payment Successful",
                            `Your payment of ${currency(
                                requestedAmount
                            )} has been verified successfully.`,
                            "success"
                        );
                    } catch (error) {
                        console.error("Payment verification failed:", error);

                        showMessage(
                            "Verification Pending",
                            "We couldn't confirm the payment with the server. Check your payment history before attempting another payment."
                        );
                    } finally {
                        setPayingFeeId(null);
                        setStartingPayment(false);
                    }
                },

                onDismiss: () => {
                    setPayingFeeId(null);
                    setStartingPayment(false);
                },
            });
        } catch (error) {
            console.error("Unable to initiate payment:", error);

            setPayingFeeId(null);
            setStartingPayment(false);

            showMessage(
                "Payment Failed",
                error instanceof Error
                    ? error.message
                    : "Unable to initiate payment. Please try again."
            );
        } finally {
            if (!checkoutOpened) {
                setPayingFeeId(null);
                setStartingPayment(false);
            }
        }
    };

    const handlePayCombined = async (
        allocations: FeePaymentAllocation[]
    ) => {
        if (payingFeeId !== null) return;

        if (allocations.length === 0) {
            showMessage(
                "No Payment Amount",
                "Enter an amount for at least one outstanding fee."
            );
            return;
        }

        const allocationTotal = allocations.reduce(
            (total, allocation) => total + allocation.amount,
            0
        );

        let checkoutOpened = false;

        try {
            setPayingFeeId("combined");
            setStartingPayment(true);

            const response = (await createCombinedPaymentOrder({
                allocations,
            })) as PaymentOrderResponse;

            const razorpayKey = response.keyId ?? response.key;

            if (
                !razorpayKey ||
                !response.orderId ||
                !response.currency ||
                typeof response.amount !== "number"
            ) {
                console.error(
                    "Unexpected combined payment-order response:",
                    response
                );

                throw new Error(
                    response.message ||
                    "The server returned an incomplete combined payment order."
                );
            }

            checkoutOpened = true;
            setPaymentDialog(null);

            await openRazorpayCheckout({
                key: razorpayKey,
                amount: response.amount,
                currency: response.currency,
                orderId: response.orderId,
                name: "School Management System",
                description: "Partial / Combined Fee Payment",

                onSuccess: async (paymentResponse) => {
                    try {
                        await verifyCombinedPayment({
                            razorpay_order_id:
                                paymentResponse.razorpay_order_id,
                            razorpay_payment_id:
                                paymentResponse.razorpay_payment_id,
                            razorpay_signature:
                                paymentResponse.razorpay_signature,
                        });

                        await fetchFees();

                        if (showHistory) {
                            await refreshPaymentHistory();
                        }

                        showMessage(
                            "Payment Successful",
                            `Your combined payment of ${currency(
                                allocationTotal
                            )} has been verified successfully.`,
                            "success"
                        );
                    } catch (error) {
                        console.error(
                            "Combined payment verification failed:",
                            error
                        );

                        showMessage(
                            "Verification Pending",
                            "We couldn't confirm the combined payment with the server. Check your payment history before attempting another payment."
                        );
                    } finally {
                        setPayingFeeId(null);
                        setStartingPayment(false);
                    }
                },

                onDismiss: () => {
                    setPayingFeeId(null);
                    setStartingPayment(false);
                },
            });
        } catch (error) {
            console.error(
                "Unable to initiate combined payment:",
                error
            );

            setPayingFeeId(null);
            setStartingPayment(false);

            showMessage(
                "Payment Failed",
                error instanceof Error
                    ? error.message
                    : "Unable to initiate the combined payment. Please try again."
            );
        } finally {
            if (!checkoutOpened) {
                setPayingFeeId(null);
                setStartingPayment(false);
            }
        }
    };

    const handleConfirmPaymentDialog = async () => {
        if (!paymentDialog) return;

        if (paymentDialog.mode === "individual" && paymentDialog.fee) {
            const fee = paymentDialog.fee;
            const amount = parsePaymentAmount(individualAmount);

            if (!Number.isFinite(amount)) {
                showMessage(
                    "Invalid Payment Amount",
                    "Enter a valid amount greater than ₹0 with no more than two decimal places."
                );
                return;
            }

            if (amount > Number(fee.balance) + 0.001) {
                showMessage(
                    "Amount Exceeds Balance",
                    `The maximum amount you can pay is ${currency(
                        fee.balance
                    )}.`
                );
                return;
            }

            await handlePayFee(fee, amount);
            return;
        }

        const allocations: FeePaymentAllocation[] = [];

        for (const fee of fees.filter((item) => Number(item.balance) > 0)) {
            const value = combinedAmounts[fee._id] ?? "";
            const trimmed = value.trim();

            // Empty or zero means this fee is not included in this combined payment.
            if (!trimmed || Number(trimmed) === 0) continue;

            const amount = parsePaymentAmount(trimmed);

            if (!Number.isFinite(amount)) {
                showMessage(
                    "Invalid Payment Amount",
                    `Enter a valid amount for ${fee.feeType} with no more than two decimal places.`
                );
                return;
            }

            if (amount > Number(fee.balance) + 0.001) {
                showMessage(
                    "Amount Exceeds Balance",
                    `The maximum amount for ${fee.feeType} is ${currency(
                        fee.balance
                    )}.`
                );
                return;
            }

            allocations.push({
                feeId: fee._id,
                amount,
            });
        }

        await handlePayCombined(allocations);
    };

    const handleOpenHistory = async () => {
        setShowHistory(true);
        setLoadingHistory(true);

        try {
            const records = await getMyPaymentHistory();
            setPaymentHistory(records);
        } catch (error) {
            console.error("Failed to fetch payment history:", error);

            showMessage(
                "Unable to Load History",
                "Your payment history could not be loaded. Please try again."
            );
        } finally {
            setLoadingHistory(false);
        }
    };

    const getPaymentStatusLabel = (
        status: PaymentHistoryItem["status"]
    ) => {
        switch (status) {
            case "success":
                return "Successful";
            case "pending":
                return "Pending";
            case "failed":
                return "Failed";
            default:
                return status;
        }
    };

    return (
        <div className="flex min-h-screen flex-col font-fredoka">
            <NavBar />

            <div className="flex flex-1 items-stretch bg-purple-100">
                <SideBar />

                <main className="min-w-0 flex-1">
                    <Breadcrumb />

                    <div className="mx-auto flex max-w-[1700px] flex-col gap-7 px-5 py-6 sm:px-7 lg:px-9">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>

                                <h1 className="text-2xl font-bold text-purple-950 sm:text-3xl">
                                    My Fees
                                </h1>

                                <p className="mt-2 text-sm text-gray-600">
                                    View your tuition and examination fees and make payments.
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => void fetchFees()}
                                    disabled={loading}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-purple-300 bg-white px-4 py-2.5 text-sm font-semibold text-purple-800 shadow-sm transition hover:bg-purple-50 disabled:opacity-50"
                                >
                                    <RefreshCw
                                        size={16}
                                        className={loading ? "animate-spin" : ""}
                                    />
                                    Refresh
                                </button>
                            </div>
                        </div>

                        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {summaryCards.map((card) => {
                                const Icon = card.icon;

                                return (
                                    <div
                                        key={card.title}
                                        className="rounded-2xl border border-purple-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-gray-500">
                                                    {card.title}
                                                </p>
                                                <h2 className="mt-3 break-words text-xl font-bold text-purple-950 sm:text-2xl">
                                                    {card.value}
                                                </h2>
                                            </div>

                                            <div className={`rounded-xl p-3 ${card.iconStyle}`}>
                                                <Icon size={22} />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </section>

                        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            {[
                                {
                                    title: "Tuition Fee",
                                    fee: tuitionFee,
                                    icon: BookOpen,
                                    iconStyle: "bg-purple-100 text-purple-700",
                                },
                                {
                                    title: "Examination Fee",
                                    fee: examinationFee,
                                    icon: School,
                                    iconStyle: "bg-indigo-100 text-indigo-700",
                                },
                            ].map((item) => {
                                const Icon = item.icon;

                                return (
                                    <div
                                        key={item.title}
                                        className="rounded-2xl border border-purple-200 bg-white p-5 shadow-sm sm:p-6"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`shrink-0 rounded-xl p-3 ${item.iconStyle}`}>
                                                    <Icon size={23} />
                                                </div>

                                                <h2 className="font-bold text-purple-950">
                                                    {item.title}
                                                </h2>
                                            </div>

                                            {item.fee && (
                                                <span
                                                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusStyles[item.fee.paymentStatus] ??
                                                        "bg-gray-100 text-gray-600 ring-gray-200"
                                                        }`}
                                                >
                                                    {item.fee.paymentStatus}
                                                </span>
                                            )}
                                        </div>

                                        {loading ? (
                                            <div className="mt-5 flex items-center gap-2 text-sm text-gray-500">
                                                <LoaderCircle size={17} className="animate-spin" />
                                                Loading fee details...
                                            </div>
                                        ) : item.fee ? (
                                            <>
                                                <p className="mt-5 text-2xl font-bold text-purple-950">
                                                    {currency(item.fee.amount)}
                                                </p>
                                                <div className="mt-4 grid grid-cols-2 gap-3">
                                                    <div className="rounded-xl bg-green-50 p-3">
                                                        <p className="text-xs text-green-700">
                                                            Amount paid
                                                        </p>
                                                        <p className="mt-1 font-bold text-green-800">
                                                            {currency(item.fee.totalPaid)}
                                                        </p>
                                                    </div>

                                                    <div className="rounded-xl bg-amber-50 p-3">
                                                        <p className="text-xs text-amber-700">
                                                            Remaining
                                                        </p>
                                                        <p className="mt-1 font-bold text-amber-800">
                                                            {currency(item.fee.balance)}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="mt-4 flex flex-col gap-3 border-t border-purple-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                                                    <p className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                                                        <CalendarDays size={14} className="text-purple-500" />
                                                        Due {formatDate(item.fee.dueDate)}
                                                    </p>

                                                    {item.fee.balance > 0 ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => openIndividualPaymentDialog(item.fee!)}
                                                            disabled={payingFeeId !== null}
                                                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-900 disabled:cursor-not-allowed disabled:opacity-60"
                                                        >
                                                            <CreditCard size={16} />
                                                            Pay / Partial Pay
                                                        </button>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-700">
                                                            <CheckCircle2 size={17} />
                                                            Fully Paid
                                                        </span>
                                                    )}
                                                </div>
                                            </>
                                        ) : (
                                            <div className="mt-5 rounded-xl border border-dashed border-purple-200 bg-purple-50/60 p-4">
                                                <p className="text-sm font-medium text-gray-700">
                                                    {item.title === "Tuition Fee"
                                                        ? "No tuition fee configured for your class."
                                                        : "No examination fee has been configured yet."}
                                                </p>
                                                <p className="mt-1 text-xs text-gray-500">
                                                    Please contact the school administration if you think this is incorrect.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </section>

                        {!loading && totals.balance > 0 && (
                            <section className="flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-start gap-3">
                                    <div className="rounded-xl bg-amber-100 p-2.5 text-amber-700">
                                        <AlertCircle size={22} />
                                    </div>

                                    <div>
                                        <h2 className="font-bold text-amber-950">
                                            You have outstanding fees
                                        </h2>
                                        <p className="mt-1 text-sm text-amber-800">
                                            Your total remaining balance is{" "}
                                            <span className="font-bold">
                                                {currency(totals.balance)}
                                            </span>
                                            .
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={openCombinedPaymentDialog}
                                    disabled={payingFeeId !== null}
                                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-purple-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-900 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {payingFeeId === "combined" ? (
                                        <LoaderCircle size={17} className="animate-spin" />
                                    ) : (
                                        <CreditCard size={17} />
                                    )}
                                    Pay / Partial Pay Fees
                                </button>
                            </section>
                        )}

                        <section className="overflow-hidden rounded-2xl border border-purple-200 bg-white shadow-sm">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex min-w-0 items-center gap-3 border-b border-purple-100 p-5 sm:p-6">
                                    <div className="rounded-xl bg-purple-100 p-2.5 text-purple-800">
                                        <ReceiptText size={21} />
                                    </div>

                                    <div>
                                        <h2 className="text-lg font-bold text-purple-950">
                                            My Fee Records
                                        </h2>
                                        <p className="mt-1 text-sm text-gray-500">
                                            Your individual payment status for each applicable fee.
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => void handleOpenHistory()}
                                    className="inline-flex shrink-0 items-center justify-center gap-2 self-center bg-white px-4 py-2.5 text-sm font-semibold text-purple-800 transition hover:text-purple-950"
                                >
                                    <History size={18} />
                                    History
                                    <ArrowRight size={15} />
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[800px] text-left text-sm">
                                    <thead className="bg-purple-100 text-xs uppercase tracking-wide text-purple-900">
                                        <tr>
                                            <th className="px-4 py-3 font-semibold">Fee Type</th>
                                            <th className="px-4 py-3 font-semibold">Amount</th>
                                            <th className="px-4 py-3 font-semibold">Paid</th>
                                            <th className="px-4 py-3 font-semibold">Balance</th>
                                            <th className="px-4 py-3 font-semibold">Due Date</th>
                                            <th className="px-4 py-3 font-semibold">Action</th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-purple-100">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={8} className="px-4 py-10 text-center">
                                                    <LoaderCircle size={24} className="mx-auto animate-spin text-purple-700" />
                                                    <p className="mt-2 text-sm text-gray-500">
                                                        Loading fee records...
                                                    </p>
                                                </td>
                                            </tr>
                                        ) : fees.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                                                    No fee records found.
                                                </td>
                                            </tr>
                                        ) : (
                                            fees.map((fee) => (
                                                <tr key={fee._id} className="transition hover:bg-purple-50/70">
                                                    <td className="px-4 py-4 font-semibold text-gray-800">
                                                        {fee.feeType}
                                                    </td>

                                                    <td className="whitespace-nowrap px-4 py-4 font-medium text-gray-800">
                                                        {currency(fee.amount)}
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-4 font-medium text-green-700">
                                                        {currency(fee.totalPaid)}
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-4 font-medium text-amber-700">
                                                        {currency(fee.balance)}
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-4 text-gray-600">
                                                        {formatDate(fee.dueDate)}
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        {fee.balance > 0 ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => openIndividualPaymentDialog(fee)}
                                                                disabled={payingFeeId !== null}
                                                                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-purple-800 px-3 py-2 text-xs font-semibold text-white transition hover:bg-purple-900 disabled:cursor-not-allowed disabled:opacity-50"
                                                            >
                                                                <CreditCard size={14} />
                                                                Pay / Partial
                                                            </button>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700">
                                                                <CheckCircle2 size={15} />
                                                                Paid
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                        </section>
                    </div>
                </main>
            </div>

            {/* Partial / combined payment amount dialog */}
            {paymentDialog && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-gray-950/50 p-4 backdrop-blur-[2px]">
                    <div className="my-auto max-h-[90vh] w-full max-w-xl overflow-hidden rounded-2xl border border-purple-200 bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-purple-100 bg-purple-50 px-5 py-4 sm:px-6">
                            <div>
                                <h2 className="text-lg font-bold text-purple-950">
                                    {paymentDialog.mode === "individual"
                                        ? "Enter Payment Amount"
                                        : "Choose Payment Amounts"}
                                </h2>
                                <p className="mt-1 text-sm text-gray-500">
                                    Pay the full balance or enter a smaller amount.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setPaymentDialog(null)}
                                disabled={startingPayment}
                                className="rounded-lg p-2 text-gray-500 transition hover:bg-purple-100 hover:text-purple-900 disabled:opacity-50"
                                aria-label="Close payment dialog"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="max-h-[calc(90vh-150px)] overflow-y-auto p-5 sm:p-6">
                            {paymentDialog.mode === "individual" &&
                                paymentDialog.fee ? (
                                <div>
                                    <div className="rounded-xl bg-purple-50 p-4">
                                        <p className="font-semibold text-purple-950">
                                            {paymentDialog.fee.feeType}
                                            {paymentDialog.fee.class
                                                ? ` — Class ${paymentDialog.fee.class}`
                                                : ""}
                                        </p>
                                        <p className="mt-1 text-sm text-gray-600">
                                            Outstanding:{" "}
                                            <span className="font-bold text-amber-700">
                                                {currency(paymentDialog.fee.balance)}
                                            </span>
                                        </p>
                                    </div>

                                    <label
                                        htmlFor="individual-payment-amount"
                                        className="mt-5 block text-sm font-semibold text-gray-700"
                                    >
                                        Amount to pay (₹)
                                    </label>

                                    <input
                                        id="individual-payment-amount"
                                        type="number"
                                        min="0.01"
                                        max={paymentDialog.fee.balance}
                                        step="0.01"
                                        value={individualAmount}
                                        onChange={(event) =>
                                            setIndividualAmount(event.target.value)
                                        }
                                        disabled={startingPayment}
                                        className="mt-2 w-full rounded-xl border border-purple-200 px-4 py-3 text-lg font-semibold text-purple-950 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100 disabled:bg-gray-100"
                                        placeholder="Enter amount"
                                    />

                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setIndividualAmount(
                                                    String(
                                                        Number(
                                                            paymentDialog.fee!.balance.toFixed(2)
                                                        )
                                                    )
                                                )
                                            }
                                            disabled={startingPayment}
                                            className="rounded-lg border border-purple-200 px-3 py-1.5 text-xs font-semibold text-purple-800 hover:bg-purple-50 disabled:opacity-50"
                                        >
                                            Pay Full Balance
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setIndividualAmount("")}
                                            disabled={startingPayment}
                                            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                                        >
                                            Clear
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {fees
                                        .filter((fee) => Number(fee.balance) > 0)
                                        .map((fee) => (
                                            <div
                                                key={fee._id}
                                                className="rounded-xl border border-purple-100 p-4"
                                            >
                                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                                    <div>
                                                        <p className="font-semibold text-purple-950">
                                                            {fee.feeType}
                                                            {fee.class
                                                                ? ` — Class ${fee.class}`
                                                                : ""}
                                                        </p>
                                                        <p className="mt-1 text-xs text-gray-500">
                                                            Balance: {currency(fee.balance)}
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setCombinedAmounts((current) => ({
                                                                    ...current,
                                                                    [fee._id]: "0",
                                                                }))
                                                            }
                                                            disabled={startingPayment}
                                                            className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                                            aria-label={`Exclude ${fee.feeType}`}
                                                        >
                                                            <Minus size={15} />
                                                        </button>

                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max={fee.balance}
                                                            step="0.01"
                                                            value={combinedAmounts[fee._id] ?? ""}
                                                            onChange={(event) =>
                                                                setCombinedAmounts((current) => ({
                                                                    ...current,
                                                                    [fee._id]: event.target.value,
                                                                }))
                                                            }
                                                            disabled={startingPayment}
                                                            className="w-32 rounded-lg border border-purple-200 px-3 py-2 text-right text-sm font-semibold text-purple-950 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 disabled:bg-gray-100"
                                                            aria-label={`Amount for ${fee.feeType}`}
                                                        />

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setCombinedAmounts((current) => ({
                                                                    ...current,
                                                                    [fee._id]: String(
                                                                        Number(fee.balance.toFixed(2))
                                                                    ),
                                                                }))
                                                            }
                                                            disabled={startingPayment}
                                                            className="rounded-lg border border-purple-200 p-2 text-purple-700 hover:bg-purple-50 disabled:opacity-50"
                                                            aria-label={`Set full balance for ${fee.feeType}`}
                                                        >
                                                            <Plus size={15} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col-reverse gap-2 border-t border-purple-100 bg-gray-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
                            <button
                                type="button"
                                onClick={() => setPaymentDialog(null)}
                                disabled={startingPayment}
                                className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={() => void handleConfirmPaymentDialog()}
                                disabled={startingPayment}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-900 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {startingPayment ? (
                                    <LoaderCircle size={16} className="animate-spin" />
                                ) : (
                                    <CreditCard size={16} />
                                )}
                                {startingPayment ? "Preparing Payment..." : "Continue to Pay"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment history modal */}
            {showHistory && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-gray-950/40 p-4 backdrop-blur-[2px]">
                    <div className="my-auto max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-2xl border border-purple-200 bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-purple-100 bg-purple-50 px-5 py-4 sm:px-6">
                            <div className="flex items-center gap-3">
                                <div className="rounded-xl bg-purple-200 p-2.5 text-purple-800">
                                    <History size={21} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-purple-950">
                                        Payment History
                                    </h2>
                                    <p className="mt-1 text-sm text-gray-500">
                                        A record of your payment attempts.
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowHistory(false)}
                                className="rounded-lg p-2 text-gray-500 transition hover:bg-purple-100 hover:text-purple-900"
                                aria-label="Close payment history"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="max-h-[calc(85vh-85px)] overflow-y-auto p-5 sm:p-6">
                            {loadingHistory ? (
                                <div className="py-12 text-center">
                                    <LoaderCircle size={28} className="mx-auto animate-spin text-purple-700" />
                                    <p className="mt-3 text-sm text-gray-500">
                                        Loading payment history...
                                    </p>
                                </div>
                            ) : paymentHistory.length === 0 ? (
                                <div className="py-12 text-center">
                                    <History size={30} className="mx-auto text-purple-400" />
                                    <p className="mt-3 font-semibold text-gray-700">
                                        No payment history
                                    </p>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Your payment records will appear here.
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[700px] text-left text-sm">
                                        <thead className="bg-purple-100 text-xs uppercase tracking-wide text-purple-900">
                                            <tr>
                                                <th className="px-4 py-3 font-semibold">Date</th>
                                                <th className="px-4 py-3 font-semibold">Payment</th>
                                                <th className="px-4 py-3 font-semibold">Amount</th>
                                                <th className="px-4 py-3 font-semibold">Receipt</th>
                                                <th className="px-4 py-3 font-semibold">Status</th>
                                            </tr>
                                        </thead>

                                        <tbody className="divide-y divide-purple-100">
                                            {paymentHistory.map((payment) => (
                                                <tr
                                                    key={`${payment.paymentType}-${payment._id}`}
                                                    className="transition hover:bg-purple-50/70"
                                                >
                                                    <td className="whitespace-nowrap px-4 py-4 text-gray-600">
                                                        <div className="flex items-center gap-2">
                                                            <CalendarDays size={15} className="text-purple-500" />
                                                            {formatDate(payment.date)}
                                                        </div>
                                                    </td>

                                                    <td className="px-4 py-4">
                                                        <div className="flex flex-col gap-2">
                                                            <span className="font-semibold text-gray-800">
                                                                {payment.paymentType === "combined"
                                                                    ? "Combined Fee Payment"
                                                                    : payment.feeDescription}
                                                            </span>

                                                            <span
                                                                className={`w-fit rounded-full px-2 py-1 text-xs font-medium ${payment.paymentType === "combined"
                                                                    ? "bg-indigo-100 text-indigo-700"
                                                                    : "bg-purple-100 text-purple-700"
                                                                    }`}
                                                            >
                                                                {payment.paymentType === "combined"
                                                                    ? "Multiple Fees"
                                                                    : "Individual Payment"}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    <td className="whitespace-nowrap px-4 py-4 font-bold text-purple-950">
                                                        {currency(payment.amount)}
                                                    </td>

                                                    <td className="px-4 py-4">
                                                        <div className="flex flex-col items-start gap-2">
                                                            <span className="break-all text-xs text-gray-600">
                                                                {payment.receiptNumber ?? "Not generated"}
                                                            </span>

                                                            {payment.status === "success" &&
                                                                payment.receiptNumber && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            void handleDownloadReceipt(
                                                                                payment._id,
                                                                                payment.receiptNumber ?? undefined,
                                                                                payment.paymentType
                                                                            )
                                                                        }
                                                                        disabled={downloadingReceiptId !== null}
                                                                        className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-purple-800 px-3 py-2 text-xs font-semibold text-white transition hover:bg-purple-900 disabled:cursor-not-allowed disabled:opacity-50"
                                                                    >
                                                                        {downloadingReceiptId === payment._id ? (
                                                                            <LoaderCircle size={14} className="animate-spin" />
                                                                        ) : (
                                                                            <Download size={14} />
                                                                        )}
                                                                        {downloadingReceiptId === payment._id
                                                                            ? "Downloading..."
                                                                            : "Download PDF"}
                                                                    </button>
                                                                )}
                                                        </div>
                                                    </td>

                                                    <td className="px-4 py-4">
                                                        <span
                                                            className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${payment.status === "success"
                                                                ? "bg-green-100 text-green-700"
                                                                : payment.status === "pending"
                                                                    ? "bg-amber-100 text-amber-700"
                                                                    : "bg-red-100 text-red-700"
                                                                }`}
                                                        >
                                                            {getPaymentStatusLabel(payment.status)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <Modal
                isOpen={modal.show}
                title={modal.title}
                message={modal.message}
                onClose={() =>
                    setModal((current) => ({
                        ...current,
                        show: false,
                    }))
                }
            />
        </div>
    );
}

export default StudentFees;