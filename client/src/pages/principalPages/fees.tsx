import { useEffect, useMemo, useState } from "react";
import {
    Plus,
    Search,
    IndianRupee,
    BookOpen,
    GraduationCap,
    X,
    LoaderCircle,
    Pencil,
    School,
    AlertCircle,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    Users,
    CheckCircle2,
    Clock3,
    CircleX
} from "lucide-react";

import NavBar from "../../components/navBar";
import SideBar from "../../components/sideBar";
import Breadcrumb from "../../components/breadcrumb";
import Modal from "../../components/modal";

import {
    createFee,
    getFees,
    updateFee,
    getStudentFeeStatuses
} from "../../services/feeApi";

import type {
    FeeData,
    FeeType,
    CreateFeeData,
    StudentFeeStatusRow,
    StudentFeeStatusParams,
    StudentFeeDetails
} from "../../services/feeApi";

type FeeFormData = {
    feeType: FeeType;
    className: string;
    amount: string;
    dueDate: string;
};

type StudentSortOption = NonNullable<StudentFeeStatusParams["sortBy"]>;

const classes = [
    "1st", "2nd", "3rd", "4th", "5th", "6th",
    "7th", "8th", "9th", "10th", "11th", "12th"
];

const studentSortOptions: {
    label: string;
    value: StudentSortOption;
}[] = [
        { label: "Student Name", value: "Student Name" },
        { label: "Class", value: "Class" }
    ];

const initialForm: FeeFormData = {
    feeType: "Tuition Fee",
    className: "",
    amount: "",
    dueDate: ""
};

const currency = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2
    }).format(amount);

const formatDate = (date: string) => {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return "—";

    return parsedDate.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
};

const getStatusStyle = (status: StudentFeeDetails["status"]) => {
    switch (status) {
        case "Paid":
            return "bg-green-50 text-green-700";

        case "Partially Paid":
            return "bg-amber-50 text-amber-700";

        case "Unpaid":
            return "bg-red-50 text-red-700";

        default:
            return "bg-gray-100 text-gray-500";
    }
};

/** Compact, inline status badge. */
const FeeStatusBadge = ({
    status
}: {
    status: StudentFeeDetails["status"];
}) => {
    const Icon =
        status === "Paid"
            ? CheckCircle2
            : status === "Partially Paid"
                ? Clock3
                : status === "Unpaid"
                    ? CircleX
                    : AlertCircle;

    return (
        <span
            className={`inline-flex items-center gap-1 whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-medium ${getStatusStyle(status)}`}
        >
            <Icon size={11} />
            {status}
        </span>
    );
};

/** Compact fee amount, paid amount, and status in one cell. */
const FeeAmountCell = ({
    fee
}: {
    fee: StudentFeeDetails;
}) => {
    if (!fee.configured || fee.amount === null) {
        return (
            <span className="text-xs text-gray-400">
                Not configured
            </span>
        );
    }

    return (
        <div className="flex min-w-[150px] flex-col gap-1">
            <div className="flex items-center gap-2 whitespace-nowrap">
                <span className="font-semibold text-gray-800">
                    {currency(fee.amount)}
                </span>

                {fee.status === "Partially Paid" && (
                    <span className="text-[11px] text-gray-500">
                        Paid {currency(fee.paid)}
                    </span>
                )}
            </div>

            <FeeStatusBadge status={fee.status} />
        </div>
    );
};

function PrincipalFees() {
    const [fees, setFees] = useState<FeeData[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [students, setStudents] = useState<StudentFeeStatusRow[]>([]);
    const [studentLoading, setStudentLoading] = useState(true);

    const [studentSearch, setStudentSearch] = useState("");
    const [debouncedStudentSearch, setDebouncedStudentSearch] = useState("");

    const [selectedClass, setSelectedClass] = useState("All");

    const [studentSortBy, setStudentSortBy] =
        useState<StudentSortOption>("Class");

    const [studentSortOrder, setStudentSortOrder] =
        useState<"asc" | "desc">("asc");

    const [studentPage, setStudentPage] = useState(1);
    const [studentLimit, setStudentLimit] = useState(10);

    const [totalStudents, setTotalStudents] = useState(0);
    const [totalStudentPages, setTotalStudentPages] = useState(0);

    const [showForm, setShowForm] = useState(false);
    const [editingFee, setEditingFee] = useState<FeeData | null>(null);
    const [formData, setFormData] = useState<FeeFormData>(initialForm);

    const [modal, setModal] = useState({
        show: false,
        title: "",
        message: "",
        type: "success" as "success" | "error"
    });

    const showMessage = (
        title: string,
        message: string,
        type: "success" | "error" = "success"
    ) => {
        setModal({ show: true, title, message, type });
    };

    const fetchFees = async () => {
        try {
            setLoading(true);
            const response = await getFees();
            setFees(Array.isArray(response) ? response : []);
        } catch (error) {
            console.error("Failed to fetch fees:", error);
            showMessage(
                "Unable to Load Fees",
                "Please try loading the fee records again.",
                "error"
            );
        } finally {
            setLoading(false);
        }
    };

    const fetchStudentFeeStatuses = async () => {
        try {
            setStudentLoading(true);

            const response = await getStudentFeeStatuses({
                class: selectedClass,
                search: debouncedStudentSearch,
                page: studentPage,
                limit: studentLimit,
                sortBy: studentSortBy,
                order: studentSortOrder
            });

            setStudents(response.students ?? []);
            setTotalStudents(response.totalStudents ?? 0);
            setTotalStudentPages(response.totalPages ?? 0);
        } catch (error) {
            console.error("Failed to fetch student fee statuses:", error);
            showMessage(
                "Unable to Load Student Fees",
                "The student fee status records could not be loaded. Please try again.",
                "error"
            );
        } finally {
            setStudentLoading(false);
        }
    };

    useEffect(() => {
        void fetchFees();
    }, []);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setDebouncedStudentSearch(studentSearch.trim());
            setStudentPage(1);
        }, 350);

        return () => window.clearTimeout(timer);
    }, [studentSearch]);

    useEffect(() => {
        void fetchStudentFeeStatuses();
    }, [
        selectedClass,
        debouncedStudentSearch,
        studentPage,
        studentLimit,
        studentSortBy,
        studentSortOrder
    ]);

    const tuitionFees = useMemo(
        () => fees.filter((fee) => fee.feeType === "Tuition Fee"),
        [fees]
    );

    const examinationFee = useMemo(
        () => fees.find((fee) => fee.feeType === "Examination Fee") ?? null,
        [fees]
    );

    const openEditForm = (fee: FeeData) => {
        setEditingFee(fee);

        setFormData({
            feeType: fee.feeType,
            className: fee.class ?? "",
            amount: String(fee.amount),
            dueDate: fee.dueDate ? fee.dueDate.slice(0, 10) : ""
        });

        setShowForm(true);
    };

    const closeForm = () => {
        if (submitting) return;

        setShowForm(false);
        setEditingFee(null);
        setFormData(initialForm);
    };

    const handleFeeTypeChange = (feeType: FeeType) => {
        setFormData((current) => ({
            ...current,
            feeType,
            className: feeType === "Tuition Fee" ? current.className : ""
        }));
    };

    const handleSubmit = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        const amount = Number(formData.amount);

        if (!Number.isFinite(amount) || amount <= 0) {
            showMessage(
                "Invalid Amount",
                "Enter a fee amount greater than zero.",
                "error"
            );
            return;
        }

        if (!formData.dueDate) {
            showMessage(
                "Due Date Required",
                "Please select the fee due date.",
                "error"
            );
            return;
        }

        if (formData.feeType === "Tuition Fee" && !formData.className) {
            showMessage(
                "Select a Class",
                "Please select a class for the tuition fee.",
                "error"
            );
            return;
        }

        const duplicateFee = fees.find((fee) => {
            if (fee._id === editingFee?._id) return false;

            if (formData.feeType === "Examination Fee") {
                return fee.feeType === "Examination Fee";
            }

            return (
                fee.feeType === "Tuition Fee" &&
                fee.class === formData.className
            );
        });

        if (duplicateFee) {
            showMessage(
                "Fee Already Exists",
                formData.feeType === "Examination Fee"
                    ? "An examination fee has already been configured for the school. Edit the existing record instead."
                    : `A tuition fee has already been configured for Class ${formData.className}. Edit the existing record instead.`,
                "error"
            );
            return;
        }

        try {
            setSubmitting(true);

            if (editingFee) {
                await updateFee(editingFee._id, {
                    amount,
                    dueDate: formData.dueDate
                });

                showMessage(
                    "Fee Updated",
                    "The fee configuration has been updated successfully."
                );
            } else {
                const payload: CreateFeeData = {
                    feeType: formData.feeType,
                    class:
                        formData.feeType === "Tuition Fee"
                            ? formData.className
                            : null,
                    amount,
                    dueDate: formData.dueDate
                };

                await createFee(payload);

                showMessage(
                    "Fee Created",
                    formData.feeType === "Tuition Fee"
                        ? `The tuition fee for Class ${formData.className} has been configured successfully.`
                        : "The examination fee has been configured for the entire school."
                );
            }

            setShowForm(false);
            setEditingFee(null);
            setFormData(initialForm);

            await Promise.all([
                fetchFees(),
                fetchStudentFeeStatuses()
            ]);

        } catch (error: unknown) {
            console.error("Failed to save fee:", error);

            const axiosError = error as {
                response?: {
                    data?: {
                        message?: string;
                        error?: string;
                    };
                };
                message?: string;
            };

            const message =
                axiosError.response?.data?.message ??
                axiosError.response?.data?.error ??
                axiosError.message ??
                "The fee could not be saved. Please try again.";

            showMessage("Unable to Save Fee", message, "error");
        } finally {
            setSubmitting(false);
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

                        {/* Page heading: unchanged design */}
                        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                            <div>
                                <h1 className="text-2xl font-bold text-purple-950 sm:text-3xl">
                                    Fee Management
                                </h1>

                                <p className="mt-2 max-w-2xl text-sm text-gray-600">
                                    Manage the school examination fee.
                                </p>
                            </div>
                        </div>

                        {/* Student Fee Status: compact table design */}
                        <section className="overflow-hidden rounded-2xl border border-purple-200 bg-white shadow-sm">

                            <div className="border-b border-purple-100 p-4 sm:p-5">
                                <div className="flex flex-col justify-between gap-3 xl:flex-row xl:items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="rounded-lg bg-purple-100 p-2 text-purple-800">
                                            <Users size={19} />
                                        </div>

                                        <div>
                                            <h2 className="text-base font-bold text-purple-950">
                                                Student Fee Status
                                            </h2>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            void fetchStudentFeeStatuses();
                                            void fetchFees();
                                        }}
                                        disabled={studentLoading || loading}
                                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-purple-200 px-3 py-1.5 text-xs font-medium text-purple-800 transition hover:bg-purple-50 disabled:opacity-50"
                                    >
                                        <RefreshCw
                                            size={13}
                                            className={studentLoading || loading ? "animate-spin" : ""}
                                        />
                                        Refresh
                                    </button>
                                </div>

                                {/* Search and filters */}
                                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="relative w-full sm:max-w-md">
                                        <Search
                                            size={15}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                        />

                                        <input
                                            type="text"
                                            value={studentSearch}
                                            onChange={(event) =>
                                                setStudentSearch(event.target.value)
                                            }
                                            placeholder="Search student name or UID..."
                                            className="w-full rounded-lg border border-purple-200 bg-white py-2 pl-9 pr-3 text-xs text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-100"
                                        />
                                    </div>
                                    <div className="flex gap-5">
                                        <select
                                            value={studentSortBy}
                                            onChange={(event) => {
                                                setStudentPage(1);
                                                setStudentSortBy(
                                                    event.target.value as StudentSortOption
                                                );
                                            }}
                                            className="min-w-0 rounded-lg border border-purple-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-purple-500"
                                            aria-label="Sort students by"
                                        >
                                            {studentSortOptions.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setStudentPage(1);
                                                setStudentSortOrder((current) =>
                                                    current === "asc" ? "desc" : "asc"
                                                );
                                            }}
                                            className="whitespace-nowrap rounded-lg border border-purple-200 px-2.5 py-1.5 text-xs font-medium text-purple-800 hover:bg-purple-50"
                                            title="Change sort order"
                                        >
                                            {studentSortOrder === "asc" ? "Ascending ↑" : "Descending ↓"}
                                        </button>

                                        <select
                                            value={selectedClass}
                                            onChange={(event) => {
                                                setStudentPage(1);
                                                setSelectedClass(event.target.value);
                                            }}
                                            className="w-full sm:w-40 shrink-0 rounded-lg border border-purple-200 bg-white px-3 py-2 text-xs text-gray-700 outline-none focus:border-purple-500"
                                            aria-label="Filter students by class"
                                        >
                                            <option value="All">All Classes</option>
                                            {classes.map((className) => (
                                                <option key={className} value={className}>
                                                    Class {className}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Compact student table */}
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[1050px] table-auto text-left text-xs">

                                    <thead className="border-b border-purple-100 bg-purple-50 text-[10px] uppercase tracking-wide text-purple-900">
                                        <tr>
                                            <th className="px-4 py-2.5 font-semibold">
                                                Student
                                            </th>
                                            <th className="px-3 py-2.5 font-semibold">
                                                Class
                                            </th>
                                            <th className="px-3 py-2.5 font-semibold">
                                                Tuition Fee
                                            </th>
                                            <th className="px-3 py-2.5 font-semibold">
                                                Examination Fee
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-gray-100">
                                        {studentLoading ? (
                                            <tr>
                                                <td colSpan={4} className="px-4 py-8 text-center">
                                                    <LoaderCircle
                                                        size={22}
                                                        className="mx-auto animate-spin text-purple-700"
                                                    />
                                                    <p className="mt-2 text-xs text-gray-500">
                                                        Loading student fee statuses...
                                                    </p>
                                                </td>
                                            </tr>
                                        ) : students.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-4 py-8 text-center">
                                                    <Users
                                                        size={22}
                                                        className="mx-auto text-gray-300"
                                                    />
                                                    <p className="mt-2 text-sm font-medium text-gray-700">
                                                        {totalStudents === 0
                                                            ? "No students found"
                                                            : "No matching students"}
                                                    </p>
                                                    <p className="mt-1 text-xs text-gray-500">
                                                        Try changing your search or class filter.
                                                    </p>

                                                    {(studentSearch || selectedClass !== "All") && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setStudentSearch("");
                                                                setSelectedClass("All");
                                                                setStudentPage(1);
                                                            }}
                                                            className="mt-2 text-xs font-medium text-purple-700 hover:underline"
                                                        >
                                                            Clear filters
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ) : (
                                            students.map((student) => (
                                                <tr
                                                    key={student._id}
                                                    className="transition-colors hover:bg-purple-50/50"
                                                >
                                                    <td className="whitespace-nowrap px-4 py-2">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-purple-100 text-xs font-semibold text-purple-800">
                                                                {student.name
                                                                    ?.trim()
                                                                    .charAt(0)
                                                                    .toUpperCase() || "S"}
                                                            </div>

                                                            <div className="min-w-0">
                                                                <p className="font-semibold text-gray-800">
                                                                    {student.name || "Unnamed Student"}
                                                                </p>
                                                                <p className="mt-0.5 text-[10px] text-gray-500 uppercase">
                                                                    UID: {student.uid || "—"}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="whitespace-nowrap px-3 py-2">
                                                        <span className="font-medium text-gray-800">
                                                            Class {student.class}
                                                        </span>
                                                    </td>

                                                    <td className="px-3 py-2">
                                                        <FeeAmountCell fee={student.tuitionFee} />
                                                    </td>

                                                    <td className="px-3 py-2">
                                                        <FeeAmountCell fee={student.examinationFee} />
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination with page limit dropdown */}
                            <div className="flex flex-col gap-2 border-t border-purple-100 bg-white px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">

                                    <span className="whitespace-nowrap text-[11px] text-gray-500">
                                        Page {totalStudentPages === 0 ? 0 : studentPage} of {totalStudentPages}
                                    </span>

                                    <div className="flex items-center gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setStudentPage((current) =>
                                                    Math.max(1, current - 1)
                                                )
                                            }
                                            disabled={
                                                studentLoading ||
                                                studentPage <= 1 ||
                                                totalStudentPages === 0
                                            }
                                            className="inline-flex items-center gap-1 rounded-md border border-purple-200 px-2.5 py-1.5 text-xs text-purple-800 hover:bg-purple-50 disabled:opacity-40"
                                        >
                                            <ChevronLeft size={13} />
                                            Previous
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setStudentPage((current) =>
                                                    Math.min(totalStudentPages, current + 1)
                                                )
                                            }
                                            disabled={
                                                studentLoading ||
                                                totalStudentPages === 0 ||
                                                studentPage >= totalStudentPages
                                            }
                                            className="inline-flex items-center gap-1 rounded-md border border-purple-200 px-2.5 py-1.5 text-xs text-purple-800 hover:bg-purple-50 disabled:opacity-40"
                                        >
                                            Next
                                            <ChevronRight size={13} />
                                        </button>

                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <label
                                        htmlFor="student-limit"
                                        className="whitespace-nowrap text-[11px] text-gray-500"
                                    >
                                        Limit:
                                    </label>

                                    <select
                                        id="student-limit"
                                        value={studentLimit}
                                        onChange={(event) => {
                                            setStudentPage(1);
                                            setStudentLimit(Number(event.target.value));
                                        }}
                                        className="rounded-lg border border-purple-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-purple-500"
                                        aria-label="Students per page"
                                    >
                                        <option value={10}>10</option>
                                        <option value={20}>20</option>
                                        <option value={50}>50</option>
                                        <option value={100}>100</option>
                                    </select>
                                </div>
                            </div>
                        </section>

                        {/* Tuition Fee Configuration: unchanged design */}
                        <section className="rounded-2xl border border-purple-200 bg-white p-5 shadow-sm sm:p-6">
                            <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                                <div>
                                    <h2 className="text-lg font-bold text-purple-950">
                                        Tuition Fee Configuration
                                    </h2>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Assign Tution fee to Classes.
                                    </p>
                                </div>

                                <span className="w-fit rounded-full bg-purple-100 px-3 py-1.5 text-xs font-semibold text-purple-800">
                                    {tuitionFees.length} of 12 configured
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                                {classes.map((className) => {
                                    const fee = tuitionFees.find(
                                        (item) => item.class === className
                                    );

                                    return (
                                        <button
                                            key={className}
                                            type="button"
                                            onClick={() => {
                                                if (fee) {
                                                    openEditForm(fee);
                                                } else {
                                                    setEditingFee(null);
                                                    setFormData({
                                                        ...initialForm,
                                                        feeType: "Tuition Fee",
                                                        className
                                                    });
                                                    setShowForm(true);
                                                }
                                            }}
                                            className={`group rounded-xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${fee
                                                ? "border-green-200 bg-green-50 hover:border-green-300"
                                                : "border-dashed border-purple-300 bg-purple-50/60 hover:border-purple-500 hover:bg-purple-100"
                                                }`}
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-sm font-semibold text-purple-950">
                                                    Class {className}
                                                </span>

                                                {fee ? (
                                                    <GraduationCap size={17} className="text-green-700" />
                                                ) : (
                                                    <Plus size={16} className="text-purple-500 group-hover:text-purple-800" />
                                                )}
                                            </div>

                                            <p className={`mt-3 text-xs font-medium ${fee ? "text-green-700" : "text-purple-600"}`}>
                                                {fee ? currency(fee.amount) : "Not configured"}
                                            </p>

                                            {fee && (
                                                <p className="mt-1 text-[11px] text-gray-500">
                                                    Due {formatDate(fee.dueDate)}
                                                </p>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </section>

                        {/* Examination Fee: unchanged design */}
                        <section className="flex flex-col justify-between gap-4 rounded-2xl border border-purple-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:p-6">
                            <div className="flex items-start gap-4">
                                <div className="rounded-xl bg-indigo-100 p-3 text-indigo-700">
                                    <School size={24} />
                                </div>

                                <div>
                                    <h2 className="font-bold text-purple-950">
                                        School Examination Fee
                                    </h2>

                                    <p className="mt-1 text-sm text-gray-500">
                                        Assign School Examination Fee.
                                    </p>

                                    <p className="mt-3 text-lg font-bold text-purple-900">
                                        {examinationFee
                                            ? currency(examinationFee.amount)
                                            : "Not configured"}
                                    </p>

                                    {examinationFee && (
                                        <p className="mt-1 text-xs text-gray-500">
                                            Due date: {formatDate(examinationFee.dueDate)}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    if (examinationFee) {
                                        openEditForm(examinationFee);
                                    } else {
                                        setEditingFee(null);
                                        setFormData({
                                            ...initialForm,
                                            feeType: "Examination Fee",
                                            className: ""
                                        });
                                        setShowForm(true);
                                    }
                                }}
                                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-purple-200 px-4 py-2.5 text-sm font-semibold text-purple-800 transition hover:bg-purple-50"
                            >
                                {examinationFee ? (
                                    <>
                                        <Pencil size={16} />
                                        Edit Examination Fee
                                    </>
                                ) : (
                                    <>
                                        <Plus size={16} />
                                        Configure Examination Fee
                                    </>
                                )}
                            </button>
                        </section>
                    </div>
                </main>
            </div>

            {/* Create/edit fee form: unchanged design */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-gray-950/40 p-4 backdrop-blur-[2px]">
                    <div className="my-auto w-full max-w-xl overflow-hidden rounded-2xl border border-purple-200 bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-purple-100 bg-purple-50 px-6 py-5">
                            <div className="flex items-center gap-3">
                                <div className="rounded-xl bg-purple-200 p-2.5 text-purple-800">
                                    {editingFee ? <Pencil size={21} /> : <Plus size={21} />}
                                </div>

                                <div>
                                    <h2 className="text-xl font-bold text-purple-950">
                                        {editingFee ? "Edit Fee Configuration" : "Configure New Fee"}
                                    </h2>
                                    <p className="mt-1 text-sm text-gray-500">
                                        {editingFee
                                            ? "Update the amount or due date."
                                            : "Set fee for classes."}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={closeForm}
                                disabled={submitting}
                                className="rounded-lg p-2 text-gray-500 transition hover:bg-purple-100 hover:text-purple-900 disabled:opacity-50"
                            >
                                <X size={21} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="space-y-5 p-6">
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                                        Fee Type <span className="text-red-500">*</span>
                                    </label>

                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        {(["Tuition Fee", "Examination Fee"] as FeeType[]).map((feeType) => {
                                            const selected = formData.feeType === feeType;

                                            return (
                                                <button
                                                    key={feeType}
                                                    type="button"
                                                    disabled={Boolean(editingFee)}
                                                    onClick={() => handleFeeTypeChange(feeType)}
                                                    className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${selected
                                                        ? "border-purple-500 bg-purple-50 ring-2 ring-purple-100"
                                                        : "border-gray-200 hover:border-purple-300 hover:bg-purple-50/50"
                                                        } disabled:cursor-not-allowed disabled:opacity-80`}
                                                >
                                                    <div className={`rounded-lg p-2 ${selected ? "bg-purple-200 text-purple-800" : "bg-gray-100 text-gray-600"}`}>
                                                        {feeType === "Tuition Fee"
                                                            ? <BookOpen size={19} />
                                                            : <School size={19} />}
                                                    </div>

                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-800">
                                                            {feeType}
                                                        </p>
                                                        <p className="mt-1 text-xs text-gray-500">
                                                            {feeType === "Tuition Fee"
                                                                ? "One per class"
                                                                : "One for the whole school"}
                                                        </p>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {formData.feeType === "Tuition Fee" ? (
                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-gray-700">
                                            Class <span className="text-red-500">*</span>
                                        </label>

                                        <select
                                            required
                                            value={formData.className}
                                            disabled={Boolean(editingFee)}
                                            onChange={(event) =>
                                                setFormData((current) => ({
                                                    ...current,
                                                    className: event.target.value
                                                }))
                                            }
                                            className="w-full rounded-xl border border-purple-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 disabled:bg-gray-100"
                                        >
                                            <option value="">Select class</option>

                                            {classes.map((className) => {
                                                const existingFee = fees.find(
                                                    (fee) =>
                                                        fee.feeType === "Tuition Fee" &&
                                                        fee.class === className &&
                                                        fee._id !== editingFee?._id
                                                );

                                                return (
                                                    <option
                                                        key={className}
                                                        value={className}
                                                        disabled={Boolean(existingFee)}
                                                    >
                                                        Class {className}
                                                        {existingFee ? " (Already configured)" : ""}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>
                                ) : (
                                    <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                                        <div className="flex items-start gap-2.5">
                                            <School size={19} className="mt-0.5 shrink-0 text-indigo-700" />
                                            <div>
                                                <p className="text-sm font-semibold text-indigo-950">
                                                    Applies to the entire school
                                                </p>
                                                <p className="mt-1 text-xs leading-5 text-indigo-800">
                                                    Students in every class will see this examination fee.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                                        Amount (₹) <span className="text-red-500">*</span>
                                    </label>

                                    <div className="relative">
                                        <IndianRupee size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            required
                                            type="number"
                                            min="1"
                                            step="0.01"
                                            value={formData.amount}
                                            onChange={(event) =>
                                                setFormData((current) => ({
                                                    ...current,
                                                    amount: event.target.value
                                                }))
                                            }
                                            placeholder="Enter fee amount"
                                            className="w-full rounded-xl border border-purple-200 py-3 pl-10 pr-3.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                                        Due Date <span className="text-red-500">*</span>
                                    </label>

                                    <input
                                        required
                                        type="date"
                                        value={formData.dueDate}
                                        onChange={(event) =>
                                            setFormData((current) => ({
                                                ...current,
                                                dueDate: event.target.value
                                            }))
                                        }
                                        className="w-full rounded-xl border border-purple-200 px-3.5 py-3 text-sm outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col-reverse gap-3 border-t border-purple-100 bg-gray-50/70 px-6 py-4 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={closeForm}
                                    disabled={submitting}
                                    className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-800 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-900 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {submitting && (
                                        <LoaderCircle size={17} className="animate-spin" />
                                    )}
                                    {submitting
                                        ? "Saving..."
                                        : editingFee
                                            ? "Save Changes"
                                            : "Create Fee"}
                                </button>
                            </div>
                        </form>
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
                        show: false
                    }))
                }
            />
        </div>
    );
}

export default PrincipalFees;