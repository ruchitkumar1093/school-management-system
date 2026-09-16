type ExamType = "All" | "class test" | "mid term" | "final";

type Props = {
    examType: ExamType;
    setExamType: (value: ExamType) => void;
    showAll?: boolean;
};

function ExamFilter({examType, setExamType, showAll = true}: Props) {
    return (
        <div className="flex flex-col gap-1">
            <label htmlFor="order">Exam:</label>
            <select onChange={(e) => setExamType(e.target.value as ExamType)} value={examType} id="order" className="border-2 border-gray-400 bg-purple-200 
                rounded-md focus:outline-none focus:border-gray-900">
                {showAll && (
                    <option value="All">All</option>
                )}
                <option value="class test">Class Test</option>
                <option value="mid term">Mid Term</option>
                <option value="final">Final</option>
            </select>
        </div>
    );
}

export default ExamFilter;