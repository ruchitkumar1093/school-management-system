import api from "./api";

export const viewSubjects = (
    search: string,
    orderBy: string,
    currentPage: number,
    limit: number
) => {
    return api.get("student/subjects", {
        params: {
            search,
            order: orderBy,
            page: currentPage,
            limit
        }
    });
};

export const viewMarks = (
    exam: string,
    search: string,
    sortBy: string,
    orderBy: string,
    currentPage: number,
    limit: number
) => {
    return api.get("student/marks", {
        params: {
            exam,
            search,
            sortBy,
            order: orderBy,
            page: currentPage,
            limit
        }
    });
};

export const viewStudent = () => {
    return api.get("student/student")
}

export const getAttendance = (
    currentPage: number,
    limit: number
) => {
    return api.get("student/attendance", {
        params: {
            page: currentPage,
            limit
        }
    });
};

export const viewHome = () => {
    return api.get("student/home");
};

//Holidays:
export const getHolidays = () => {
    return api.get("student/holidays");
};

//Leaves:
export const applyLeave = (data: {
    startDate: string;
    endDate: string;
    reason: string;
}) => {
    return api.post("/student/applyLeave", data);
};

export const getMyLeaves = (
    currentPage: number,
    limit: number
) => {
    return api.get("/student/getMyLeaves", {
        params: {
            page: currentPage,
            limit
        }
    });
};