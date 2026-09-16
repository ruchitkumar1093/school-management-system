import api from "./api";


//GET ALL:
export const viewTeachers = () => {
    return api.get("/principal/teachers");
}
export const viewStudents = () => {
    return api.get("/principal/students");
}
export const viewSubjects = () => {
    return api.get("/principal/subjects");
}
export const viewMarks = () => {
    return api.get("/principal/marks");
}
export const viewTotal = () => {
    return api.get("/principal/total");
}

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

export const getStudentsForAttendance = (studentClass: string) => {
    return api.get("principal/attendance/students", {
        params: {
            class: studentClass
        }
    });
};

export const getStudentAttendance = (studentId: string) => {
    return api.get("principal/attendance/student", {
        params: {
            studentId
        }
    });
};

//Exams:
export const getExamResults = (studentClass: string, exam: string) => 
    api.get("/principal/examResults", {
    params: {
        class: studentClass,
        exam
    }
});

export const getAttendance = (studentClass: string, date: string) => {
    return api.get("principal/attendance", {
        params: {
            class: studentClass,
            date
        }
    });
};