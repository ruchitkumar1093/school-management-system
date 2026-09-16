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
        else {
            if (pages[pages.length - 1] !== "...") {
                pages.push("...");
            }
        }
    }

    return (
        <div className="flex gap-3">

            <button type="button" className="px-2 rounded-2xl hover:bg-gray-300 cursor-pointer"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage <= 1}
            >
                Previous
            </button>

            {pages.map((item, index) =>
                item === "..." ? (
                    <span key={index}>{item}</span>
                ) : (
                    <button 
                        key={index}
                        className={item === currentPage ? "px-4 bg-gray-600 text-white rounded-4xl hover:bg-gray-700 cursor-pointer border-3 border-gray-400" : "p-2 px-4 rounded-3xl hover:bg-gray-300 cursor-pointer"}
                        type="button"
                        onClick={() => setCurrentPage(item as number)}
                    >
                        {item}
                    </button>
                )
            )}

            <button
                type="button" className="px-2 rounded-2xl hover:bg-gray-300 cursor-pointer"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
            >
                Next
            </button>

        </div>
    );
}

export default Pagination;