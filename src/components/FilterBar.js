export default function FilterBar({
  filter,
  search,
  activeCount,
  totalCount,
  onFilterChange,
  onSearchChange,
}) {
  return (
    <div className="filter-bar">
      <div className="search-box">
        <input
          type="search"
          placeholder="Search tasks or categories..."
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>

      <div className="filter-buttons">
        <button className={filter === "all" ? "pill active" : "pill"} onClick={() => onFilterChange("all")}>All</button>
        <button className={filter === "completed" ? "pill active" : "pill"} onClick={() => onFilterChange("completed")}>Completed</button>
        <button className={filter === "pending" ? "pill active" : "pill"} onClick={() => onFilterChange("pending")}>Pending</button>
      </div>

      <div className="task-count">
        <span>{activeCount} task{activeCount === 1 ? "" : "s"} left</span>
        <span>{totalCount} total</span>
      </div>
    </div>
  );
}
