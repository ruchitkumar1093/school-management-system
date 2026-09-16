import api from "./api";

export const viewSubjects = () => {
    return api.get("student/subjects");
}

export const viewMarks = () => {
    return api.get("student/marks");
}

export const viewStudent = () => {
    return api.get("student/student")
}

export const getAttendance = () => {
    return api.get("student/attendance");
};