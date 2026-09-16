import api from "./api";

export const login = (data: any) => {
    return api.post("/login", data);
}

export const changePassword = (data: {
    oldPassword: string;
    newPassword: string;
}) => {
    return api.put("/changePassword", data);
}