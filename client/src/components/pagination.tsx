type PaginationProps = {
    currentPage: number;
    totalPages: number;
    setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
};

function Pagination({
    currentPage,
    totalPages,
    setCurrentPage
}: PaginationProps) {

    const pages: (number | string)[] = [];

    for (let i = 1; i <= totalPages; i++) {
        if (
            i === 1 ||
            Math.abs(i - currentPage) <= 1 ||
            i === totalPages
        ) {
            pages.push(i);
        }
        else if (pages[pages.length - 1] !== "...") {
            pages.push("...");
        }
    }

    return (
        <div className="flex items-center gap-1 rounded-xl border border-purple-300 bg-purple-200 p-1.5 shadow-sm">

            <button
                type="button"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700
                transition-colors hover:bg-purple-300
                disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:bg-transparent"
            >
                Previous
            </button>

            <div className="flex items-center gap-1">

                {pages.map((item, index) =>
                    item === "..." ? (
                        <span
                            key={index}
                            className="px-2 text-sm font-medium text-gray-500"
                        >
                            ...
                        </span>
                    ) : (
                        <button
                            key={index}
                            type="button"
                            onClick={() => setCurrentPage(item as number)}
                            className={
                                item === currentPage
                                    ? "min-w-9 rounded-lg bg-purple-800 px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors"
                                    : "min-w-9 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-purple-300"
                            }
                        >
                            {item}
                        </button>
                    )
                )}

            </div>

            <button
                type="button"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700
                transition-colors hover:bg-purple-300
                disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:bg-transparent"
            >
                Next
            </button>

        </div>
    );
}

export default Pagination;