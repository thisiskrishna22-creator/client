import React, { useEffect, useMemo, useState } from "react";

const USERS_KEY = "taskify-users";
const SESSION_KEY = "taskify-session";
const TODOS_PREFIX = "taskify-todos-";
const THEME_KEY = "taskify-theme";

function readJSON(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function getUsers() {
  return readJSON(USERS_KEY, []);
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getSession() {
  return readJSON(SESSION_KEY, null);
}

function saveSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function todoStorageKey(email) {
  return `${TODOS_PREFIX}${email.toLowerCase()}`;
}

function loadTodos(email) {
  return readJSON(todoStorageKey(email), []);
}

function formatDisplayDate(dateString) {
  if (!dateString) return "";
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString("en-GB");
}

function isTodoOverdue(todo) {
  if (!todo?.dueDate || todo.completed) return false;
  const dueDate = new Date(`${todo.dueDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dueDate < today;
}

function getCategoryStyle(category, theme) {
  const isDark = theme === "dark";

  switch (category) {
    case "Work":
      return {
        background: isDark ? "rgba(59, 130, 246, 0.18)" : "#dbeafe",
        color: isDark ? "#93c5fd" : "#1d4ed8",
      };
    case "Personal":
      return {
        background: isDark ? "rgba(34, 197, 94, 0.18)" : "#dcfce7",
        color: isDark ? "#86efac" : "#15803d",
      };
    case "Urgent":
      return {
        background: isDark ? "rgba(239, 68, 68, 0.18)" : "#fee2e2",
        color: isDark ? "#fca5a5" : "#b91c1c",
      };
    default:
      return {
        background: isDark ? "rgba(148, 163, 184, 0.18)" : "#e5e7eb",
        color: isDark ? "#cbd5e1" : "#4b5563",
      };
  }
}

function getThemeStyles(theme) {
  const isDark = theme === "dark";

  return {
    page: {
      background: isDark
        ? "radial-gradient(circle at top, rgba(30, 41, 59, 0.98), rgba(15, 23, 42, 1) 55%, rgba(2, 6, 23, 1) 100%)"
        : "radial-gradient(circle at top, rgba(255,255,255,0.9), rgba(243,246,255,0.95) 35%, rgba(232,238,255,0.98) 100%)",
    },
    card: {
      background: isDark ? "#0f172a" : "#ffffff",
    },
    textPrimary: isDark ? "#f8fafc" : "#111827",
    textSecondary: isDark ? "#cbd5e1" : "#6b7280",
    input: {
      background: isDark ? "#111827" : "#ffffff",
      color: isDark ? "#f8fafc" : "#111827",
    },
    primaryButton: {
      background: isDark ? "#e2e8f0" : "#111827",
      color: isDark ? "#0f172a" : "#ffffff",
    },
    secondaryButton: {
      background: isDark ? "#111827" : "#ffffff",
      color: isDark ? "#e2e8f0" : "#374151",
    },
    todoItem: {
      background: isDark ? "#111827" : "#f9fafb",
    },
    deleteButton: {
      background: isDark ? "rgba(239, 68, 68, 0.14)" : "#fee2e2",
      color: isDark ? "#fca5a5" : "#b91c1c",
    },
  };
}

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [todos, setTodos] = useState([]);
  const [task, setTask] = useState("");
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const session = getSession();
    if (!session?.email) return;
    setCurrentUser({ email: session.email });
  }, []);

  useEffect(() => {
    if (!currentUser?.email) return;
    setTodos(loadTodos(currentUser.email));
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser?.email) return;
    localStorage.setItem(
      todoStorageKey(currentUser.email),
      JSON.stringify(todos)
    );
  }, [todos, currentUser]);

  const addTask = (e) => {
    e.preventDefault();
    if (!task.trim()) return;

    setTodos((prev) => [
      {
        id: Date.now(),
        text: task,
        completed: false,
        dueDate: "",
        priority: "medium",
        category: "General",
      },
      ...prev,
    ]);

    setTask("");
  };

  const toggleTask = (id) => {
    setTodos((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, completed: !t.completed } : t
      )
    );
  };

  const deleteTask = (id) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  const themeStyles = getThemeStyles(theme);

  if (!currentUser) {
    return <h2>Login Required</h2>;
  }

  return (
    <div style={{ ...themeStyles.page, minHeight: "100vh", padding: 20 }}>
      <h1 style={{ color: themeStyles.textPrimary }}>Taskify</h1>

      <button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
        Toggle Theme
      </button>

      <form onSubmit={addTask}>
        <input
          value={task}
          onChange={(e) => setTask(e.target.value)}
          placeholder="Add task"
        />
        <button>Add</button>
      </form>

      {todos.map((t) => (
        <div
          key={t.id}
          style={{
            ...themeStyles.todoItem,
            padding: 10,
            marginTop: 10,
          }}
        >
          <input
            type="checkbox"
            checked={t.completed}
            onChange={() => toggleTask(t.id)}
          />
          <span
            style={{
              textDecoration: t.completed ? "line-through" : "none",
            }}
          >
            {t.text}
          </span>

          <button onClick={() => deleteTask(t.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}

export default App;