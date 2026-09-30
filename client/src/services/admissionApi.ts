import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:5000/api"
});

export const createAdmission = (data: any) => {
    return api.post("/admissionRequest/createAdmission", data);
};

export const getAdmission = (
    status: string,
    classFilter: string,
    search: string,
    sortBy: string,
    orderBy: string,
    currentPage: number,
    limit: number
) => {
    return api.get("/admissionRequest/getAdmissions", {
        params: {
            status,
            class: classFilter,
            search,
            sortBy,
            order: orderBy,
            page: currentPage,
            limit
        }
    });
};

export const getAdmissionById = (id: string) => {
    return api.get(`/admissionRequest/getAdmissions/${id}`);
};

export const rejectAdmissionById = (id: string) => {
    return api.patch(`/admissionRequest/rejectAdmissions/${id}`);
};

export const deleteRejectAdmissions = () => {
    return api.delete(`/admissionRequest/deleteRejectAdmissions`);
};

export const approveAdmission = (id: string) => {
    return api.post(`/admissionRequest/approveAdmission/${id}`);
};