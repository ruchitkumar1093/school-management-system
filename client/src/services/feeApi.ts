import api from "./api";

export type FeeType = "Tuition Fee" | "Examination Fee";

export interface FeeData {
    _id: string;
    feeType: FeeType;
    class: string | null;
    amount: number;
    dueDate: string;
    createdBy?: {
        _id: string;
        name: string;
        uid: string;
    };
    createdAt: string;
    updatedAt: string;
}

export interface CreateFeeData {
    feeType: FeeType;
    class?: string | null;
    amount: number;
    dueDate: string;
}

export type StudentFeeStatus =
    | "Unpaid"
    | "Partially Paid"
    | "Paid"
    | "Not Configured";

export interface StudentFeeDetails {
    configured: boolean;
    amount: number | null;
    paid: number;
    balance: number | null;
    status: StudentFeeStatus;
}

export interface StudentFeeStatusRow {
    _id: string;
    name: string;
    uid: string;
    class: string;
    section?: string;
    rollNumber: number;
    tuitionFee: StudentFeeDetails;
    examinationFee: StudentFeeDetails;
}

export interface StudentFeeStatusResponse {
    message: string;
    students: StudentFeeStatusRow[];
    totalStudents: number;
    totalPages: number;
    currentPage: number;
    limit: number;
}

export interface StudentFeeStatusParams {
    class?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: "Student Name" | "Class" | "Roll no";
    order?: "asc" | "desc";
}

export interface UpdateFeeData {
    amount?: number;
    dueDate?: string;
}

export const getStudentFeeStatuses = async (
    params: StudentFeeStatusParams = {}
): Promise<StudentFeeStatusResponse> => {
    const response = await api.get<StudentFeeStatusResponse>(
        "/principal/fees/student-status",
        {
            params: {
                class: params.class ?? "All",
                search: params.search ?? "",
                page: params.page ?? 1,
                limit: params.limit ?? 10,
                sortBy: params.sortBy ?? "Student Name",
                order: params.order ?? "asc",
            },
        }
    );

    return response.data;
};

export const createFee = async (data: CreateFeeData) => {
    const response = await api.post("/principal/fees", data);
    return response.data;
};

export const getFees = async (): Promise<FeeData[]> => {
    const response = await api.get("/principal/fees");

    // Handle either a direct array or an object containing the fees array.
    const data = response.data;

    if (Array.isArray(data)) {
        return data;
    }

    if (Array.isArray(data.fees)) {
        return data.fees;
    }

    return [];
};

export const getFeeById = async (feeId: string): Promise<FeeData> => {
    const response = await api.get(`/principal/fees/${feeId}`);

    // Support either a direct fee object or { fee: ... }.
    return response.data.fee ?? response.data;
};

export const updateFee = async (
    feeId: string,
    data: UpdateFeeData
) => {
    const response = await api.put(
        `/principal/fees/${feeId}`,
        data
    );

    return response.data;
};

export const deleteFee = async (feeId: string) => {
    const response = await api.delete(`/principal/fees/${feeId}`);
    return response.data;
};