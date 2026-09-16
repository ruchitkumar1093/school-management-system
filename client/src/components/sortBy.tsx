type Props = {
    sortOptions: string[];
    sortBy: string;
    setSortBy: React.Dispatch<React.SetStateAction<string>>;
};

function SortByTeachers({ sortOptions, sortBy, setSortBy }: Props) {
    return (
        <div className="flex flex-col gap-1">
            <label htmlFor="sortBy">Sort By:</label>
            <select id="sortBy" value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="border-2 border-gray-400 bg-purple-200
                rounded-md focus:outline-none focus:border-gray-900">
                {sortOptions.map((option, index) => (
                    <option key={index}>{option}</option>
                ))}
            </select>
        </div>
    );
}

export default SortByTeachers;