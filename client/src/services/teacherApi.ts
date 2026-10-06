import api from "./api";

export const viewHome = () => {
    return api.get("teacher/home");
}

//GET ALL:
export const viewStudents = (
    search: string,
    sortBy: string,
    orderBy: string,
    currentPage: number,
    limit: number
) => {
    return api.get("teacher/students", {
        params: {
            search,
            sortBy,
            order: orderBy,
            page: currentPage,
            limit
        }
    });
}

export const viewTeacher = () => {
    return api.get("teacher/teacher");
}

export const viewSubjects = (
    search: string,
    orderBy: string,
    currentPage: number,
    limit: number
) => {
    return api.get("teacher/subjects", {
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
    limit: number,
    subject: string
) => {
    return api.get("teacher/marks", {
        params: {
            exam,
            search,
            sortBy,
            order: orderBy,
            page: currentPage,
            limit,
            subject
        }
    });
};

export const applyLeave = (data: {
    startDate: string;
    endDate: string;
    reason: string;
}) => {
    return api.post("/teacher/leave", data);
};

export const getMyLeaves = (
    currentPage: number,
    limit: number
) => {
    return api.get("/teacher/leave", {
        params: {
            page: currentPage,
            limit
        }
    });
};

//STUDENT CRUD:
export const deleteStudent = (id: string) => {
    return api.delete(`/teacher/deleteStudent/${id}`);
};
export const addStudent = (data: any) => {
    return api.post("teacher/students/addStudent", data);
};
export const updateStudent = async (id: string, data: any) => {
    return api.put(`/teacher/updateStudent/${id}`, data);
};
export const getStudentById = (id: string) => {
    return api.get(`/teacher/student/${id}`);
};

//MARKS CRUD:
export const deleteMark = (id: string) => {
    return api.delete(`/teacher/deleteMark/${id}`);
};
export const addMark = (data: any) => {
    return api.post("teacher/marks/addMark", data);
};
export const updateMark = async (id: string, data: any) => {
    return api.put(`/teacher/updateMark/${id}`, data);
};
export const getMarkById = (id: string) => {
    return api.get(`/teacher/mark/${id}`);
};

//Exams:
export const getExamResults = (
    exam: string,
    search: string,
    sortBy: string,
    orderBy: string,
    currentPage: number,
    limit: number
) => {
    return api.get("/teacher/examResults", {
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

//Attendance:
export const getStudentsForAttendance = (
    date: string,
    search: string,
    currentPage: number,
    limit: number
) => {
    return api.get("teacher/getStudentsForAttendance", {
        params: {
            date,
            search,
            page: currentPage,
            limit
        }
    });
};

export const createAttendance = (data: any) => {
    return api.post("teacher/createAttendance", data);
};

export const getAttendance = (
    date: string,
    search: string,
    currentPage: number,
    limit: number
) => {
    return api.get("teacher/attendance", {
        params: {
            date,
            search,
            page: currentPage,
            limit
        }
    });
};

export const getStudentAttendance = (
    studentId: string,
    currentPage: number,
    limit: number
) => {
    return api.get("teacher/attendance/student", {
        params: {
            studentId,
            page: currentPage,
            limit
        }
    });
};

export const getAttendanceStudents = () => {
    return api.get("teacher/attendance/students");
};

//Holidays:
export const getHolidays = () => {
    return api.get("teacher/holidays");
};

//Leaves:
export const getLeaveApplications = (
    status: string,
    currentPage: number,
    limit: number
) => {
    return api.get("/teacher/leaves", {
        params: {
            status,
            page: currentPage,
            limit
        }
    });
};


export const approveLeave = (id: string) => {
    return api.patch(
        `/teacher/leaves/${id}/approve`
    );
};


export const rejectLeave = (id: string) => {
    return api.patch(
        `/teacher/leaves/${id}/reject`
    );
};