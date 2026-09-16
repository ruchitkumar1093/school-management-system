type Props = {
    classFilter: string;
    setClassFilter: React.Dispatch<React.SetStateAction<string>>;
    showAll?: boolean;
};

function classFilter({ classFilter, setClassFilter, showAll = true }: Props) {
    return (
        <div className="flex flex-col gap-1">
            <label htmlFor="order">Class:</label>
            <select onChange={(e) => setClassFilter(e.target.value)} value={classFilter} id="order" className="border-2 border-gray-400 bg-purple-200 
                rounded-md focus:outline-none focus:border-gray-900">
                {showAll && (
                    <option value="All">All</option>
                )}
                <option value="1st">1st</option>
                <option value="2nd">2nd</option>
                <option value="3rd">3rd</option>
                <option value="4th">4th</option>
                <option value="5th">5th</option>
                <option value="6th">6th</option>
                <option value="7th">7th</option>
                <option value="8th">8th</option>
                <option value="9th">9th</option>
                <option value="10th">10th</option>
                <option value="11th">11th</option>
                <option value="12th">12th</option>
            </select>
        </div>
    );
}

export default classFilter;