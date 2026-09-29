import React from "react";

type Props = {
    orderBy: string;
    setOrderBy: React.Dispatch<React.SetStateAction<string>>;
    disabled?: boolean;
};

function OrderBy({ orderBy, setOrderBy, disabled }: Props) {
    return (
        <div className="flex flex-col gap-1">
            <label htmlFor="order" className="text-sm font-medium text-purple-950">
                Order By:
            </label>
            <select
                onChange={(e) => setOrderBy(e.target.value)}
                value={orderBy}
                disabled={disabled}
                id="order"
                className="rounded-md border border-purple-400 bg-purple-200 px-2 py-1 text-sm font-medium text-purple-950 shadow-sm cursor-pointer transition-all duration-150 hover:bg-purple-300/80 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-400/40 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-purple-200"
            >
                <option value="asc">asc</option>
                <option value="desc">desc</option>
            </select>
        </div>
    );
}

export default OrderBy;