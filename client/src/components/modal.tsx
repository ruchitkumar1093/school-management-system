type ModalProps = {
    isOpen: boolean;
    title: string;
    message: string;
    onClose: () => void;
    onConfirm?: () => void;
    confirmText?: string;
    cancelText?: string;
};

function Modal({
    isOpen,
    title,
    message,
    onClose,
    onConfirm,
    confirmText = "Confirm",
    cancelText = "Cancel"
}: ModalProps) {
    if (!isOpen) {
        return null;
    }

    const isConfirmation = Boolean(onConfirm);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
                <div className="mb-5">
                    <h2 className="text-xl font-semibold text-purple-950">
                        {title}
                    </h2>

                    <p className="mt-2 text-gray-600">
                        {message}
                    </p>
                </div>

                <div className="flex justify-end gap-3">
                    {isConfirmation && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="cursor-pointer rounded-lg bg-gray-200 px-5 py-2.5 font-medium text-gray-800 transition-colors hover:bg-gray-300"
                        >
                            {cancelText}
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={isConfirmation ? onConfirm : onClose}
                        className="cursor-pointer rounded-lg bg-purple-800 px-5 py-2.5 font-medium text-white transition-colors hover:bg-purple-900"
                    >
                        {isConfirmation ? confirmText : "OK"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Modal;