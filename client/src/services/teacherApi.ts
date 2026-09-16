import api from "./api";


//GET ALL:
export const viewStudents = () => {
    return api.get("teacher/students");
}
export const viewTeacher = () => {
    return api.get("teacher/teacher");
}
export const viewSubjects = () => {
    return api.get("teacher/subjects");
}
export const viewMarks = () => {
    return api.get("teacher/marks")
}

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
export const getExamResults = (exam: string) => 
    api.get("/teacher/examResults", {
    params: {
        exam
    }
});

//Attendance:
export const getStudentsForAttendance = () => {
    return api.get("teacher/getStudentsForAttendance")
}

export const createAttendance = (data: any) => {
    return api.post("teacher/createAttendance", data);
};

export const getAttendance = (date: string) => {
    return api.get("teacher/attendance", {
        params: {
            date: date
        }
    });
};

export const getStudentAttendance = (studentId: string) => {
    return api.get("teacher/attendance/student", {
        params: {
            studentId
        }
    });
};