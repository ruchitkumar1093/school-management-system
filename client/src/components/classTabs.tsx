type ClassTabsProps = {
    selectedClass: string;
    onClassChange: (className: string) => void;
};

const classes = [
    "1st",
    "2nd",
    "3rd",
    "4th",
    "5th",
    "6th",
    "7th",
    "8th",
    "9th",
    "10th",
    "11th",
    "12th",
];

function ClassTabs({
    selectedClass,
    onClassChange
}: ClassTabsProps) {

    return (
        <div className="w-full">

            <div className="flex items-center gap-2 overflow-x-auto rounded-xl border border-purple-200 bg-purple-200 p-3 shadow-sm">

                {classes.map((className) => (

                    <button
                        key={className}
                        onClick={() => onClassChange(className)}
                        className={`
                            min-w-[70px] rounded-lg px-5 py-2.5 text-sm font-medium
                            transition-all duration-200
                            ${
                                selectedClass === className
                                    ? "bg-gray-600 text-white shadow-md"
                                    : "text-gray-600 hover:bg-purple-100 hover:text-gray-500"
                            }
                        `}
                    >
                        Class {className}
                    </button>

                ))}

            </div>

        </div>
    );
}

export default ClassTabs;