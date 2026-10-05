import React from "react";

type Teacher = {
    id: string;
    name: string;
};

type Props = {
    teacherFilter: string;
    setTeacherFilter: React.Dispatch<React.SetStateAction<string>>;
    teachers: Teacher[];
    disabled?: boolean;
};

function TeacherFilter({
    teacherFilter,
    setTeacherFilter,
    teachers,
    disabled
}: Props) {
    return (
        <div className="flex flex-col gap-1">
            <label
                htmlFor="teacher"
                className="text-sm font-medium text-purple-950"
            >
                Teacher:
            </label>

            <select
                onChange={(e) => setTeacherFilter(e.target.value)}
                value={teacherFilter}
                disabled={disabled}
                id="teacher"
                className="rounded-md border border-purple-400 bg-purple-200 px-2 py-1 text-sm font-medium text-purple-950 shadow-sm cursor-pointer transition-all duration-150 hover:bg-purple-300/80 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-400/40 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-purple-200"
            >
                <option value="All">All</option>

                {teachers.map((teacher) => (
                    <option
                        key={teacher.id}
                        value={teacher.id}
                    >
                        {teacher.name}
                    </option>
                ))}
            </select>
        </div>
    );
}

export default TeacherFilter;