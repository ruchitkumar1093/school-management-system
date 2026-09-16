type Props = {
    orderBy: string;
    setOrderBy: React.Dispatch<React.SetStateAction<string>>;
    disabled?: boolean;
};

function OrderBy({ orderBy, setOrderBy, disabled }: Props){
    return(
        <div className="flex flex-col gap-1">
            <label htmlFor="order">Order By:</label>
            <select onChange={(e) => setOrderBy(e.target.value)} value={orderBy} disabled={disabled} id="order" className="border-2 border-gray-400 bg-purple-200
                rounded-md focus:outline-none focus:border-gray-900 disabled:text-gray-400 disabled:bg-purple-100">
                <option value="asc">asc</option>
                <option value="desc">desc</option>
            </select>
        </div>
    );
}

export default OrderBy;