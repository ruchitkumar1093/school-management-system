import React from "react";

type Props = {
    subjectFilter: string;
    setSubjectFilter: React.Dispatch<React.SetStateAction<string>>;
    disabled?: boolean;
};

function SubjectFilter({
    subjectFilter,
    setSubjectFilter,
    disabled
}: Props) {
    return (
        <div className="flex flex-col gap-1">
            <label
                htmlFor="subject"
                className="text-sm font-medium text-purple-950"
            >
                Subject:
            </label>

            <select
                onChange={(e) => setSubjectFilter(e.target.value)}
                value={subjectFilter}
                disabled={disabled}
                id="subject"
                className="rounded-md border border-purple-400 bg-purple-200 px-2 py-1 text-sm font-medium text-purple-950 shadow-sm cursor-pointer transition-all duration-150 hover:bg-purple-300/80 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-400/40 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-purple-200"
            >
                <option value="All">All</option>
                <option value="Science">Science</option>
                <option value="Mathematics">Mathematics</option>
                <option value="English">English</option>
                <option value="Social Science">Social Science</option>
                <option value="Hindi">Hindi</option>
            </select>
        </div>
    );
}

export default SubjectFilter;