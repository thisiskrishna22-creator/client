import { useEffect, useMemo, useRef, useState } from "react";
import { db } from "../firebaseConfig";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import FilterBar from "./FilterBar";
import ProgressBar from "./ProgressBar";
import TaskItem from "./TaskItem";

const categories = ["Personal", "Work", "Study", "Health", "Shopping", "Other"];

const createId = () => {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.round(Math.random() * 10000)}`;
};

const defaultTaskForm = {
  text: "",
  category: "Personal",
  dueDate: new Date().toISOString().slice(0, 10),
};

export default function TaskBoard({ user, onSignOut, darkMode, onToggleDark }) {
  const storageKey = useMemo(() => `taskifyTasks-${user.uid}`, [user.uid]);
  const [tasks, setTasks] = useState(() => {
    const saved = window.localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : [];
  });
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [taskForm, setTaskForm] = useState(defaultTaskForm);
  const [editingId, setEditingId] = useState(null);
  const [editingForm, setEditingForm] = useState(defaultTaskForm);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(tasks));
  }, [tasks, storageKey]);

  useEffect(() => {
    if (!user?.uid) {
      return undefined;
    }

    const tasksQuery = query(
      collection(db, "tasks"),
      where("userId", "==", user.uid),
      orderBy("order", "asc")
    );

    const unsubscribe = onSnapshot(tasksQuery, (snapshot) => {
      const remoteTasks = snapshot.docs.map((docSnapshot) => ({
        id: docSnapshot.id,
        ...docSnapshot.data(),
      }));
      setTasks(remoteTasks);
    });

    return unsubscribe;
  }, [user.uid]);

  const activeCount = useMemo(() => tasks.filter((task) => !task.completed).length, [tasks]);
  const completedCount = useMemo(() => tasks.filter((task) => task.completed).length, [tasks]);

  const visibleTasks = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return tasks
      .filter((task) => {
        if (!normalizedSearch) {
          return true;
        }
        return (
          task.text.toLowerCase().includes(normalizedSearch) ||
          task.category.toLowerCase().includes(normalizedSearch)
        );
      })
      .filter((task) => {
        if (filter === "completed") return task.completed;
        if (filter === "pending") return !task.completed;
        return true;
      });
  }, [tasks, filter, search]);

  const addTask = async (event) => {
    event.preventDefault();
    setStatus("");
    setLoading(true);
    const nextText = taskForm.text.trim();

    if (!nextText) {
      setStatus("Write a task before saving.");
      setLoading(false);
      return;
    }

    const nextTask = {
      id: createId(),
      userId: user.uid,
      text: nextText,
      completed: false,
      dueDate: taskForm.dueDate,
      category: taskForm.category,
      order: tasks.length,
      createdAt: Date.now(),
    };

    setTasks((current) => [...current, nextTask]);
    setTaskForm(defaultTaskForm);

    try {
      await setDoc(doc(db, "tasks", nextTask.id), nextTask);
    } catch (error) {
      setStatus("Unable to save task to cloud. Working offline instead.");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (id) => {
    const taskToEdit = tasks.find((task) => task.id === id);
    if (!taskToEdit) return;
    setEditingId(id);
    setEditingForm({ text: taskToEdit.text, category: taskToEdit.category, dueDate: taskToEdit.dueDate });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingForm(defaultTaskForm);
    setStatus("");
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const updatedText = editingForm.text.trim();

    if (!updatedText) {
      setStatus("A task needs a title.");
      return;
    }

    const updatedTasks = tasks.map((task) =>
      task.id === editingId
        ? {
            ...task,
            text: updatedText,
            category: editingForm.category,
            dueDate: editingForm.dueDate,
          }
        : task
    );

    setTasks(updatedTasks);
    setEditingId(null);
    setEditingForm(defaultTaskForm);
    setStatus("");

    try {
      await updateDoc(doc(db, "tasks", editingId), {
        text: updatedText,
        category: editingForm.category,
        dueDate: editingForm.dueDate,
      });
    } catch (error) {
      setStatus("Unable to sync edits to Firestore.");
    }
  };

  const deleteTask = async (id) => {
    setTasks((current) => current.filter((task) => task.id !== id));

    try {
      await deleteDoc(doc(db, "tasks", id));
    } catch (error) {
      setStatus("Unable to remove the task from cloud storage.");
    }
  };

  const toggleComplete = async (id) => {
    const updatedTasks = tasks.map((task) =>
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    setTasks(updatedTasks);

    try {
      const taskToUpdate = updatedTasks.find((task) => task.id === id);
      await updateDoc(doc(db, "tasks", id), { completed: taskToUpdate.completed });
    } catch (error) {
      setStatus("Task update did not sync. You can still continue offline.");
    }
  };

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    if (filter !== "all" || search.trim()) return;

    const updated = Array.from(tasks);
    const [movedTask] = updated.splice(result.source.index, 1);
    updated.splice(result.destination.index, 0, movedTask);

    const orderedTasks = updated.map((task, index) => ({ ...task, order: index }));
    setTasks(orderedTasks);

    try {
      const batch = writeBatch(db);
      orderedTasks.forEach((task) => {
        batch.update(doc(db, "tasks", task.id), { order: task.order });
      });
      await batch.commit();
    } catch (error) {
      setStatus("Unable to sync task order. Drag reorder may be postponed.");
    }
  };

  const exportTasks = () => {
    const json = JSON.stringify(tasks, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "taskify-tasks.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const importTasks = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();

    reader.onload = async () => {
      try {
        const imported = JSON.parse(reader.result);
        if (!Array.isArray(imported)) {
          throw new Error("Import file should contain a JSON array.");
        }

        const newTasks = imported
          .filter((item) => item?.text)
          .map((item, index) => ({
            id: item.id || createId(),
            userId: user.uid,
            text: item.text.trim(),
            completed: !!item.completed,
            dueDate: item.dueDate || new Date().toISOString().slice(0, 10),
            category: categories.includes(item.category) ? item.category : "Personal",
            order: tasks.length + index,
            createdAt: item.createdAt || Date.now(),
          }));

        if (!newTasks.length) {
          setStatus("No valid tasks were found in the import file.");
          return;
        }

        const nextTasks = [...tasks, ...newTasks];
        setTasks(nextTasks);
        setStatus(`${newTasks.length} tasks imported successfully.`);

        const batch = writeBatch(db);
        newTasks.forEach((task) => {
          batch.set(doc(db, "tasks", task.id), task);
        });

        await batch.commit();
      } catch (error) {
        setStatus("Import failed. Please use a valid JSON export.");
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    };

    reader.readAsText(file);
  };

  const canReorder = filter === "all" && search.trim() === "";

  return (
    <div className="dashboard-shell">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">Taskify</p>
          <h1>Organize your day with smarter tasks</h1>
          <p className="dashboard-copy">Realtime sync, categories, due dates, and cross-device support.</p>
        </div>

        <div className="top-actions">
          <button className="secondary-button" type="button" onClick={onToggleDark}>
            {darkMode ? "Light Mode" : "Dark Mode"}
          </button>
          <button className="secondary-button" type="button" onClick={onSignOut}>
            Sign Out
          </button>
        </div>
      </header>

      <section className="task-form-card">
        <form className="task-form" onSubmit={addTask}>
          <div className="task-form-grid">
            <div className="field-group">
              <label>Task</label>
              <input
                type="text"
                value={taskForm.text}
                autoFocus
                onChange={(event) => setTaskForm({ ...taskForm, text: event.target.value })}
                placeholder="Add a task description"
                onKeyDown={(event) => {
                  if (event.key === "Enter") addTask(event);
                }}
              />
            </div>

            <div className="field-group">
              <label>Category</label>
              <select
                value={taskForm.category}
                onChange={(event) => setTaskForm({ ...taskForm, category: event.target.value })}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="field-group">
              <label>Due date</label>
              <input
                type="date"
                value={taskForm.dueDate}
                onChange={(event) => setTaskForm({ ...taskForm, dueDate: event.target.value })}
              />
            </div>

            <div className="field-group submit-group">
              <label>&nbsp;</label>
              <button className="primary-button" type="submit" disabled={loading}>
                Add task
              </button>
            </div>
          </div>
        </form>

        <div className="task-summary-row">
          <div className="summary-card">
            <strong>{tasks.length}</strong>
            <span>Tasks stored for you</span>
          </div>
          <div className="summary-card">
            <strong>{activeCount}</strong>
            <span>Pending tasks</span>
          </div>
          <div className="summary-card">
            <strong>{completedCount}</strong>
            <span>Completed tasks</span>
          </div>
        </div>

        {status && <p className="form-status">{status}</p>}
      </section>

      <section className="dashboard-card">
        <FilterBar
          filter={filter}
          search={search}
          activeCount={activeCount}
          totalCount={tasks.length}
          onFilterChange={setFilter}
          onSearchChange={setSearch}
        />

        <ProgressBar completed={completedCount} total={tasks.length} />

        <div className="import-export-row">
          <button className="secondary-button" type="button" onClick={exportTasks}>
            Export JSON
          </button>
          <label className="upload-button">
            Import JSON
            <input ref={fileInputRef} type="file" accept=".json" onChange={importTasks} />
          </label>
        </div>

        <div className="drag-note">{canReorder ? "Drag tasks to reorder them." : "Switch to All view to reorder tasks."}</div>

        <div className="task-list-shell">
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="taskList" isDropDisabled={!canReorder}>
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="task-list">
                  {visibleTasks.length === 0 ? (
                    <div className="empty-state-card">
                      <p>{tasks.length === 0 ? "Your task list is empty." : "No tasks match your filters."}</p>
                      <span>Use the form above to create tasks with due dates and categories.</span>
                    </div>
                  ) : (
                    visibleTasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index} isDragDisabled={!canReorder}>
                        {(provided) => (
                          <TaskItem
                            task={task}
                            provided={provided}
                            onToggle={toggleComplete}
                            onEdit={startEdit}
                            onDelete={deleteTask}
                          />
                        )}
                      </Draggable>
                    ))
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </section>

      {editingId && (
        <section className="edit-panel">
          <div className="edit-card">
            <h2>Edit task</h2>
            <div className="task-form-grid">
              <div className="field-group">
                <label>Task</label>
                <input
                  type="text"
                  value={editingForm.text}
                  onChange={(event) => setEditingForm({ ...editingForm, text: event.target.value })}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") saveEdit();
                    if (event.key === "Escape") cancelEdit();
                  }}
                />
              </div>
              <div className="field-group">
                <label>Category</label>
                <select
                  value={editingForm.category}
                  onChange={(event) => setEditingForm({ ...editingForm, category: event.target.value })}
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field-group">
                <label>Due date</label>
                <input
                  type="date"
                  value={editingForm.dueDate}
                  onChange={(event) => setEditingForm({ ...editingForm, dueDate: event.target.value })}
                />
              </div>
              <div className="field-group submit-group">
                <label>&nbsp;</label>
                <div className="edit-actions">
                  <button className="primary-button" type="button" onClick={saveEdit}>
                    Save changes
                  </button>
                  <button className="secondary-button" type="button" onClick={cancelEdit}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
