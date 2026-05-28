import { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import {
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import "./TaskPage.css";

export default function TaskPage({ user, onLogout }) {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Real-time listener for tasks
  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const tasksRef = collection(db, "tasks");
    const q = query(tasksRef, where("userId", "==", user.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const tasksList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTasks(tasksList);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

  const addTask = async (e) => {
    e.preventDefault();

    if (!newTask.trim()) {
      setError("Task cannot be empty");
      return;
    }

    try {
      setError("");
      await addDoc(collection(db, "tasks"), {
        userId: user.uid,
        title: newTask,
        completed: false,
        createdAt: new Date(),
      });
      setNewTask("");
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await deleteDoc(doc(db, "tasks", taskId));
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleTaskComplete = async (taskId, completed) => {
    try {
      await updateDoc(doc(db, "tasks", taskId), {
        completed: !completed,
      });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      onLogout();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div className="task-container"><p>Loading tasks...</p></div>;
  }

  return (
    <div className="task-container">
      <div className="task-card">
        <div className="task-header">
          <h1>Taskify</h1>
          <div className="user-info">
            <span>{user?.email}</span>
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>

        {error && <p className="error">{error}</p>}

        <form onSubmit={addTask} className="task-form">
          <input
            type="text"
            placeholder="Add a new task..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
          />
          <button type="submit">Add Task</button>
        </form>

        <div className="task-list">
          {tasks.length === 0 ? (
            <p className="empty-message">No tasks yet. Add one to get started!</p>
          ) : (
            tasks.map((task) => (
              <div key={task.id} className="task-item">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleTaskComplete(task.id, task.completed)}
                  className="task-checkbox"
                />
                <span className={task.completed ? "completed" : ""}>
                  {task.title}
                </span>
                <button
                  className="delete-btn"
                  onClick={() => deleteTask(task.id)}
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
