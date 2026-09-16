import { createContext, useContext, useState } from "react";
import { getAdmission } from "../services/admissionApi";

type AdmissionContextType = {
    pendingRequests: number;
    refreshPendingRequests: () => Promise<void>;
};

const AdmissionContext = createContext<AdmissionContextType | undefined>(
    undefined
);

export const AdmissionProvider = ({
    children
}: {
    children: React.ReactNode
}) => {
    const [pendingRequests, setPendingRequests] = useState(0);

    const refreshPendingRequests = async () => {
        const user = JSON.parse(localStorage.getItem("user") || "{}");

        if (user.role !== "principal") {
            return;
        }

        try {
            const response = await getAdmission();

            const pending = response.data.filter(
                (admission: any) => admission.status === "pending"
            ).length;

            setPendingRequests(pending);
        } catch (error) {
            console.log(error);
        }
    };

    return (
        <AdmissionContext.Provider
            value={{
                pendingRequests,
                refreshPendingRequests
            }}
        >
            {children}
        </AdmissionContext.Provider>
    );
};

export const useAdmission = () => {
    const context = useContext(AdmissionContext);

    if (!context) {
        throw new Error(
            "useAdmission must be used inside AdmissionProvider"
        );
    }

    return context;
};