export default function TaskItem({ task, provided, onToggle, onEdit, onDelete }) {
  return (
    <div
      className={`task-row ${task.completed ? "completed" : ""}`}
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
    >
      <div className="task-left">
        <label className="checkbox-label">
          <input type="checkbox" checked={task.completed} onChange={() => onToggle(task.id)} />
          <span className="checkbox-custom" />
        </label>

        <div className="task-details">
          <p className="task-title">{task.text}</p>
          <div className="task-meta">
            <span className="task-chip">{task.category}</span>
            <span className="task-date">Due {new Date(task.dueDate).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      <div className="task-actions">
        <button className="icon-button" type="button" onClick={() => onEdit(task.id)} title="Edit task">
          ✏️
        </button>
        <button className="icon-button delete-button" type="button" onClick={() => onDelete(task.id)} title="Delete task">
          🗑️
        </button>
      </div>
    </div>
  );
}
