import React from "react";

type Props = {
    limit: number;
    setLimit: React.Dispatch<React.SetStateAction<number>>;
};

function Limit({ setLimit, limit }: Props) {
    return (
        <div className="flex flex-col gap-2 items-center">
            <label htmlFor="limit" className="text-sm font-medium text-purple-950">
                Limit:
            </label>
            <select
                onChange={(e) => setLimit(Number(e.target.value))}
                value={limit}
                id="limit"
                className="rounded-md border border-purple-400 bg-purple-200 px-2 py-1 text-sm font-medium text-purple-950 shadow-sm cursor-pointer transition-all duration-150 hover:bg-purple-300/80 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-400/40"
            >
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