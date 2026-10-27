import React, { useEffect } from "react";

type SubjectOption = {
    value: string;
    label: string;
};

type Props = {
    subjectFilter: string;
    setSubjectFilter: React.Dispatch<React.SetStateAction<string>>;
    subjects: SubjectOption[];
    disabled?: boolean;
};

function SubjectFilter({
    subjectFilter,
    setSubjectFilter,
    subjects,
    disabled
}: Props) {
    useEffect(() => {
        if (subjectFilter === "All") {
            return;
        }

        if (!subjects.some((subject) => subject.value === subjectFilter)) {
            setSubjectFilter("All");
        }
    }, [subjects, subjectFilter, setSubjectFilter]);

    return (
        <div className="flex flex-col gap-1">
            <label
                htmlFor="subject"
                className="text-sm font-medium text-purple-950"
            >
                Subject:
            </label>

            <select
                id="subject"
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                disabled={disabled || subjects.length === 0}
                className="rounded-md border border-purple-400 bg-purple-200 px-2 py-1 text-sm font-medium text-purple-950 shadow-sm transition-all duration-150 hover:bg-purple-300/80 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-400/40 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-purple-200"
            >
                <option value="All">All</option>

                {subjects.map((subject) => (
                    <option
                        key={subject.value}
                        value={subject.value}
                    >
                        {subject.label}
                    </option>
                ))}
            </select>
        </div>
    );
}

export default SubjectFilter;