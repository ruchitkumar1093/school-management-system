import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:5000/api"
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        const code = error.response?.data?.code;

        if (
            status === 401 &&
            (code === "ACCOUNT_DEACTIVATED" ||
                code === "TOKEN_EXPIRED")
        ) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");

            window.location.replace("/login");
        }

        return Promise.reject(error);
    }
);

export default api;