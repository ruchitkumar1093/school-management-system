import React from "react";

type Props = {
  sortOptions: string[];
  sortBy: string;
  setSortBy: React.Dispatch<React.SetStateAction<string>>;
};

function SortByTeachers({ sortOptions, sortBy, setSortBy }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="sortBy" className="text-sm font-medium text-purple-950">
        Sort By:
      </label>
      <select
        id="sortBy"
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value)}
        className="rounded-md border border-purple-400 bg-purple-200 px-2 py-1 text-sm font-medium text-purple-950 shadow-sm cursor-pointer transition-all duration-150 hover:bg-purple-300/80 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-400/40"
      >
        {sortOptions.map((option, index) => (
          <option key={index} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

export default SortByTeachers;