type Props = {
    search: string;
    setSearch: React.Dispatch<React.SetStateAction<string>>;
};

function searchBar({ search, setSearch }: Props){
    return(
        <div>
            <form>
                <input onChange={(e) => setSearch(e.target.value)} value={search} placeholder="Search" className="border-2 border-gray-500 
                p-2 rounded-lg border-solid w-35 focus:outline-none focus:border-gray-900" />
            </form>
        </div>
    )
}

export default searchBar;