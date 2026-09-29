import React from "react";

type StatusType = "pending" | "approved" | "rejected";

type Props = {
  status: StatusType;
  setStatus: (value: StatusType) => void;
};

function Status({ status, setStatus }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="status" className="text-sm font-medium text-purple-950">
        Status:
      </label>
      <select
        onChange={(e) => setStatus(e.target.value as StatusType)}
        value={status}
        id="status"
        className="rounded-md border border-purple-400 bg-purple-200 px-2 py-1 text-sm font-medium text-purple-950 shadow-sm cursor-pointer transition-all duration-150 hover:bg-purple-300/80 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-400/40"
      >
        <option value="pending">Pending</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
      </select>
    </div>
  );
}

export default Status;