type StatusType = "pending" | "approved" | "rejected";

type Props = {
    status: StatusType;
    setStatus: (value: StatusType) => void;
};

function Status({ status, setStatus }: Props){
    return(
        <div className="flex flex-col gap-1">
            <label htmlFor="status">Status:</label>
            <select onChange={(e) => setStatus(e.target.value as StatusType)} value={status} id="status" className="border-2 border-gray-400 bg-purple-200
                rounded-md focus:outline-none focus:border-gray-900">
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
            </select>
        </div>
    );
}

export default Status;