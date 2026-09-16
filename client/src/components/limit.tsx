type Props = {
    limit: number;
    setLimit: React.Dispatch<React.SetStateAction<number>>;
};

function Limit({setLimit, limit}: Props){
    return(
        <div className="flex gap-3 items-center">
            <label htmlFor="limit">Limit:</label>
            <select onChange={(e) => setLimit(Number(e.target.value))} value={limit} id="limit" className="border-3 border-gray-400 bg-gray-600 text-white 
                rounded-2xl focus:outline-none focus:bg-gray-700 p-1">
                <option value="3">3</option>
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="15">15</option>
                <option value="20">20</option>
            </select>
        </div>
    );
}

export default Limit;