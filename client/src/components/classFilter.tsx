import React from "react";

type Props = {
    classFilter: string;
    setClassFilter: React.Dispatch<React.SetStateAction<string>>;
    classes: string[];
    showAll?: boolean;
    disabled?: boolean;
};

function ClassFilter({
    classFilter,
    setClassFilter,
    classes,
    showAll = true,
    disabled = false
}: Props) {
    return (
        <div className="flex flex-col gap-1">
            <label
                htmlFor="classFilter"
                className="text-sm font-medium text-purple-950"
            >
                Class:
            </label>

            <select
                onChange={(e) => setClassFilter(e.target.value)}
                value={classFilter}
                id="classFilter"
                disabled={disabled || classes.length === 0}
                className="rounded-md border border-purple-400 bg-purple-200 px-2 py-1 text-sm font-medium text-purple-950 shadow-sm cursor-pointer transition-all duration-150 hover:bg-purple-300/80 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-400/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
                {showAll && <option value="All">All</option>}

                {classes.map((className) => (
                    <option key={className} value={className}>
                        {className}
                    </option>
                ))}
            </select>
        </div>
    );
}

export default ClassFilter;