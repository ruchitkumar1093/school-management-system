import api from "./api";

export const viewHome = () => {
    return api.get("/principal/home");
}

export const getDeletedTeachers = (
    search: string,
    currentPage: number,
    limit: number
) => {
    return api.get("/principal/deleted-teachers", {
        params: {
            search,
            page: currentPage,
            limit
        }
    });
};

export const restoreTeacher = (id: string) => {
    return api.patch(`/principal/restoreTeacher/${id}`);
};

export const deactivateStudent = (id: string) => {
    return api.patch(`/principal/deactivateStudent/${id}`);
};

export const activateStudent = (id: string) => {
    return api.patch(`/principal/activateStudent/${id}`);
};

//GET ALL:
export const viewTeachers = (
    classFilter: string,
    search: string,
    sortBy: string,
    orderBy: string,
    currentPage: number,
    limit: number,
    showDeleted: boolean
) => {
    return api.get("/principal/teachers", {
        params: {
            class: classFilter,
            search,
            sortBy,
            order: orderBy,
            page: currentPage,
            limit,
            showDeleted
        }
    });
};

export const permanentlyDeleteTeacher = (id: string) => {
    return api.delete(`/principal/teachers/${id}/permanent`);
};

export const viewStudents = (
    classFilter: string,
    search: string,
    sortBy: string,
    orderBy: string,
    currentPage: number,
    limit: number,
    showDeleted: boolean
) => {
    return api.get("/principal/students", {
        params: {
            class: classFilter,
            search,
            sortBy,
            order: orderBy,
            page: currentPage,
            limit,
            showDeleted
        }
    });
};

export const viewSubjects = (
    classFilter: string,
    search: string,
    sortBy: string,
    orderBy: string,
    currentPage: number,
    limit: number
) => {
    return api.get("/principal/subjects", {
        params: {
            class: classFilter,
            search,
            sortBy,
            order: orderBy,
            page: currentPage,
            limit
        }
    });
}

export const viewMarks = (
    classFilter: string,
    examType: string,
    search: string,
    sortBy: string,
    orderBy: string,
    currentPage: number,
    limit: number,
    subjectFilter: string,
    teacherFilter: string
) => {
    return api.get("/principal/marks", {
        params: {
            class: classFilter,
            exam: examType,
            search,
            sortBy,
            order: orderBy,
            page: currentPage,
            limit,
            subject: subjectFilter,
            teacher: teacherFilter
        }
    });
}

export const getDeletedStudents = (
    search: string,
    currentPage: number,
    limit: number
) => {
    return api.get("/principal/deleted-students", {
        params: {
            search,
            page: currentPage,
            limit
        }
    });
};

export const restoreStudent = (id: string) => {
    return api.patch(`/principal/restoreStudent/${id}`);
};

export const getMarkTeachers = () => {
    return api.get("/principal/marks/teachers");
};

export const getMarkFormOptions = (className: string) => {
    return api.get("/principal/markFormOptions", {
        params: {
            class: className
        }
    });
};


export const deactivateTeacher = (
    id: string,
    arrangedTeacherId: string
) => {
    return api.patch(
        `/principal/deactivateTeacher/${id}`,
        { arrangedTeacherId }
    );
};


export const activateTeacher = (id: string) => {
    return api.patch(`/principal/activateTeacher/${id}`);
};

export const getTeacherLeaveApplications = (
    status: string,
    department: string,
    currentPage: number,
    limit: number
) => {
    return api.get("/principal/teacher-leave", {
        params: {
            status,
            department,
            page: currentPage,
            limit
        }
    });
};

export const approveTeacherLeave = (id: string) => {
    return api.patch(`/principal/teacher-leave/${id}/approve`);
};

export const rejectTeacherLeave = (id: string) => {
    return api.patch(`/principal/teacher-leave/${id}/reject`);
};

//TEACHER CRUD:
export const addTeacher = (data: any) => {
    return api.post("principal/teachers/addTeacher", data);
}
export const updateTeacher = async (id: string, data: any) => {
    return api.put(`/principal/updateTeacher/${id}`, data);
};
export const getTeacherById = (id: string) => {
    return api.get(`/principal/teacher/${id}`);
};
export const deleteTeacher = (id: string) => {
    return api.delete(`/principal/deleteTeacher/${id}`);
};

export const permanentlyDeleteStudent = (id: string) => {
    return api.delete(`/principal/students/${id}/permanent`);
};

export const deleteTeachers = (ids: string[]) => {
    return api.delete("/principal/teachers", {
        data: {
            ids
        }
    });
};

export const deleteStudents = (ids: string[]) => {
    return api.delete("/principal/students", {
        data: {
            ids
        }
    });
};

//STUDENT CRUD:
export const deleteStudent = (id: string) => {
    return api.delete(`/principal/deleteStudent/${id}`);
};
export const updateStudent = async (id: string, data: any) => {
    return api.put(`/principal/updateStudent/${id}`, data);
};
export const getStudentById = (id: string) => {
    return api.get(`/principal/student/${id}`);
};

//SUBJECT CRUD:
export const deleteSubject = (id: string) => {
    return api.delete(`/principal/deleteSubject/${id}`);
};
export const addSubject = (data: any) => {
    return api.post("principal/subjects/addSubject", data);
};
export const updateSubject = async (id: string, data: any) => {
    return api.put(`/principal/updateSubject/${id}`, data);
};
export const getSubjectById = (id: string) => {
    return api.get(`/principal/subject/${id}`);
};

//MARKS CRUD:
export const deleteMark = (id: string) => {
    return api.delete(`/principal/deleteMark/${id}`);
};
export const addMark = (data: any) => {
    return api.post("principal/marks/addMark", data);
};
export const updateMark = async (id: string, data: any) => {
    return api.put(`/principal/updateMark/${id}`, data);
};
export const getMarkById = (id: string) => {
    return api.get(`/principal/mark/${id}`);
};

//Attendance:
export const getAttendanceSummary = (date: string) => {
    return api.get("principal/attendance/summary", {
        params: {
            date
        }
    });
};

export const getAttendance = (
    studentClass: string,
    date: string,
    search: string,
    currentPage: number,
    limit: number
) => {
    return api.get("principal/attendance", {
        params: {
            class: studentClass,
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
    return api.get("principal/attendance/student", {
        params: {
            studentId,
            page: currentPage,
            limit
        }
    });
};

//Exams:
export const getExamResults = (
    studentClass: string,
    exam: string,
    search: string,
    sortBy: string,
    orderBy: string,
    currentPage: number,
    limit: number
) => {
    return api.get("/principal/examResults", {
        params: {
            class: studentClass,
            exam,
            search,
            sortBy,
            order: orderBy,
            page: currentPage,
            limit
        }
    });
};

export const getClassOverview = (className: string) => {
    return api.get(`/principal/class-overview/${className}`);
};

//Holidays:
export const getHolidays = (year: number) => {
    return api.get("principal/holidays", {
        params: { year }
    });
};

export const addHoliday = (data: { date: string; name: string }) => {
    return api.post("/principal/addHolidays", data);
};

export const updateHoliday = (
    id: string,
    data: { date: string; name: string }
) => {
    return api.patch(`/principal/updateHolidays/${id}`, data);
};

export const deleteHoliday = (id: string) => {
    return api.delete(`/principal/deleteHolidays/${id}`);
};

//Leaves:
export const getLeaveApplications = (
    status: string,
    classFilter: string,
    currentPage: number,
    limit: number
) => {
    return api.get("/principal/leaves", {
        params: {
            status,
            class: classFilter,
            page: currentPage,
            limit
        }
    });
};

export const getStudentAttendanceDetails = (studentId: string) =>
    api.get("principal/attendance/student/details", {
        params: { studentId }
    });

export const getStudentMonthlyAttendance = (
    studentId: string,
    year: number,
    month: number
) =>
    api.get("principal/attendance/student/month", {
        params: { studentId, year, month }
    });

export const approveLeave = (id: string) => {
    return api.patch(`/principal/leaves/${id}/approve`);
};

export const rejectLeave = (id: string) => {
    return api.patch(`/principal/leaves/${id}/reject`);
};

export const assignClassTeacher = (
    studentClass: string,
    teacherId: string
) => {
    return api.put(
        `/principal/class-overview/${studentClass}/teacher`,
        { teacherId }
    );
};

export const getTeachersForAttendance = async (params: {
    date: string;
    search?: string;
    page?: number;
    limit?: number;
    classFilter?: string;
}) => {
    const response = await api.get(
        "/principal/teachersForAttendance",
        { params }
    );

    return response.data;
};

export const createTeacherAttendance = async (data: {
    date: string;
    classFilter: string;
    attendance: {
        teacherId: string;
        status: "Present" | "Absent";
    }[];
}) => {
    const response = await api.post(
        "/principal/createTeacherAttendance",
        data
    );

    return response.data;
};

export const getTeacherAttendance = async (params: {
    date: string;
    search?: string;
    page?: number;
    limit?: number;
    classFilter: string;
}) => {
    const response = await api.get(
        "/principal/teacherAttendance",
        { params }
    );

    return response.data;
};


export const getTeacherAttendanceDetails = (teacherId: string) => {
    return api.get("/principal/teacher-attendance/details", {
        params: { teacherId }
    });
};

export const getTeacherMonthlyAttendance = (
    teacherId: string,
    year: number,
    month: number
) => {
    return api.get("/principal/teacher-attendance/month", {
        params: {
            teacherId,
            year,
            month
        }
    });
};

export const updateStudentProfile = (
    id: string,
    data: Record<string, string | number>
) => {
    return api.patch(`/principal/students/${id}`, data);
};

export const updateTeacherProfile = (
    id: string,
    data: Record<string, string>
) => {
    return api.patch(`/principal/teachers/${id}`, data);
};

//Arrangements
// Fetch eligible teachers for a temporary arrangement
export const getTeachersForArrangement = (className: string) =>
    api.get("/principal/arrangement/teachers", {
        params: { class: className }
    });

// Create a temporary arrangement
export const createArrangement = (
    originalTeacherId: string,
    arrangedTeacherId: string
) => {
    return api.post("/principal/arrangement", {
        originalTeacherId,
        arrangedTeacherId
    });
};