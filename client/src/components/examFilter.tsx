import React from "react";

type ExamType = "All" | "class test" | "mid term" | "final";

type Props = {
  examType: ExamType;
  setExamType: (value: ExamType) => void;
  showAll?: boolean;
};

function ExamFilter({ examType, setExamType, showAll = true }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="order" className="text-sm font-medium text-purple-950">
        Exam:
      </label>
      <select
        onChange={(e) => setExamType(e.target.value as ExamType)}
        value={examType}
        id="order"
        className="rounded-md border border-purple-400 bg-purple-200 px-2 py-1 text-sm font-medium text-purple-950 shadow-sm cursor-pointer transition-all duration-150 hover:bg-purple-300/80 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-400/40"
      >
        {showAll && <option value="All">All</option>}
        <option value="class test">Class Test</option>
        <option value="mid term">Mid Term</option>
        <option value="final">Final</option>
      </select>
    </div>
  );
}

export default ExamFilter;