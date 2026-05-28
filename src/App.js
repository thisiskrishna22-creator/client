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
      border: isDark
        ? "1px solid rgba(148, 163, 184, 0.16)"
        : "1px solid rgba(148, 163, 184, 0.18)",
      boxShadow: isDark
        ? "0 24px 60px rgba(0, 0, 0, 0.45), 0 8px 24px rgba(15, 23, 42, 0.35)"
        : "0 24px 60px rgba(15, 23, 42, 0.12), 0 6px 18px rgba(15, 23, 42, 0.06)",
    },
    statCard: {
      background: isDark ? "rgba(15, 23, 42, 0.88)" : "#ffffff",
      border: isDark
        ? "1px solid rgba(148, 163, 184, 0.16)"
        : "1px solid rgba(148, 163, 184, 0.18)",
      boxShadow: isDark
        ? "0 10px 24px rgba(0, 0, 0, 0.18)"
        : "0 10px 24px rgba(15, 23, 42, 0.06)",
    },
    textPrimary: isDark ? "#f8fafc" : "#111827",
    textSecondary: isDark ? "#cbd5e1" : "#6b7280",
    textMuted: isDark ? "#94a3b8" : "#8b8f98",
    accent: isDark ? "#93c5fd" : "#111827",
    navBorder: isDark ? "rgba(148, 163, 184, 0.16)" : "rgba(148, 163, 184, 0.22)",
    input: {
      background: isDark ? "#111827" : "#ffffff",
      color: isDark ? "#f8fafc" : "#111827",
      border: isDark
        ? "1px solid rgba(148, 163, 184, 0.22)"
        : "1px solid #d6dbe6",
      boxShadow: isDark
        ? "inset 0 1px 2px rgba(0, 0, 0, 0.2)"
        : "inset 0 1px 2px rgba(15, 23, 42, 0.03)",
    },
    primaryButton: {
      background: isDark ? "#e2e8f0" : "#111827",
      color: isDark ? "#0f172a" : "#ffffff",
      boxShadow: isDark
        ? "0 10px 22px rgba(0, 0, 0, 0.24)"
        : "0 10px 22px rgba(17, 24, 39, 0.16)",
    },
    secondaryButton: {
      background: isDark ? "#111827" : "#ffffff",
      color: isDark ? "#e2e8f0" : "#374151",
      border: isDark
        ? "1px solid rgba(148, 163, 184, 0.22)"
        : "1px solid #d1d5db",
      boxShadow: isDark
        ? "0 8px 18px rgba(0, 0, 0, 0.2)"
        : "0 8px 18px rgba(15, 23, 42, 0.06)",
    },
    todoItem: {
      background: isDark ? "#111827" : "#f9fafb",
      border: isDark ? "1px solid rgba(148, 163, 184, 0.16)" : "1px solid #e5e7eb",
      boxShadow: isDark
        ? "0 6px 16px rgba(0, 0, 0, 0.2)"
        : "0 6px 16px rgba(15, 23, 42, 0.04)",
    },
    deleteButton: {
      background: isDark ? "rgba(239, 68, 68, 0.14)" : "#fee2e2",
      color: isDark ? "#fca5a5" : "#b91c1c",
    },
  };
}

function App() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [task, setTask] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("medium");
  const [category, setCategory] = useState("General");
  const [todos, setTodos] = useState([]);
  const [todosOwnerEmail, setTodosOwnerEmail] = useState(null);
  const [theme, setTheme] = useState(() => readJSON(THEME_KEY, "light"));
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [editingDueDate, setEditingDueDate] = useState("");
  const [editingPriority, setEditingPriority] = useState("medium");
  const [editingCategory, setEditingCategory] = useState("General");
  const [filter, setFilter] = useState("all");
  const [toasts, setToasts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [busyAction, setBusyAction] = useState(null);
  const [animatingIds, setAnimatingIds] = useState([]);
  const [removingIds, setRemovingIds] = useState([]);

  useEffect(() => {
    const session = getSession();
    if (!session?.email) return;

    const users = getUsers();
    const savedUser = users.find((user) => user.email === session.email);

    if (!savedUser) {
      clearSession();
      return;
    }

    setCurrentUser({ email: savedUser.email });
  }, []);

  useEffect(() => {
    if (!currentUser?.email) {
      setTodos([]);
      setTodosOwnerEmail(null);
      return;
    }

    const nextTodos = loadTodos(currentUser.email);
    setTodos(nextTodos);
    setTodosOwnerEmail(currentUser.email);
  }, [currentUser?.email]);

  useEffect(() => {
    if (currentUser?.email && todosOwnerEmail === currentUser.email) {
      localStorage.setItem(
        todoStorageKey(currentUser.email),
        JSON.stringify(todos)
      );
    }
  }, [currentUser?.email, todos, todosOwnerEmail]);

  useEffect(() => {
    localStorage.setItem(THEME_KEY, JSON.stringify(theme));
  }, [theme]);

  useEffect(() => {
    const styleId = "taskify-responsive-styles";
    if (document.getElementById(styleId)) return undefined;

    const styleTag = document.createElement("style");
    styleTag.id = styleId;
    styleTag.textContent = `
      @media (max-width: 640px) {
        [data-taskify="page"] { padding: 16px !important; }
        [data-taskify="card"] { padding: 18px !important; border-radius: 18px !important; }
        [data-taskify="nav-bar"] { flex-direction: column !important; align-items: stretch !important; }
        [data-taskify="nav-actions"] { width: 100% !important; }
        [data-taskify="nav-actions"] button, [data-taskify="auth-toggle"] { width: 100% !important; }
        [data-taskify="tabs"], [data-taskify="category-filter"] { flex-direction: column !important; }
        [data-taskify="stats-row"] { grid-template-columns: 1fr !important; }
        [data-taskify="search"] { width: 100% !important; }
        [data-taskify="filter-bar"] { flex-direction: column !important; }
        [data-taskify="filter-bar"] button, [data-taskify="category-filter"] button { width: 100% !important; }
        [data-taskify="task-form"], [data-taskify="auth-form"] { flex-direction: column !important; }
        [data-taskify="task-inputs"], [data-taskify="edit-fields"] { grid-template-columns: 1fr !important; width: 100% !important; }
        [data-taskify="task-form"] button, [data-taskify="auth-form"] button { width: 100% !important; }
        [data-taskify="todo-item"] { flex-direction: column !important; align-items: stretch !important; }
        [data-taskify="todo-label"], [data-taskify="todo-meta"], [data-taskify="todo-actions"], [data-taskify="edit-actions"], [data-taskify="edit-row"] { width: 100% !important; }
        [data-taskify="todo-actions"], [data-taskify="edit-actions"] { justify-content: flex-start !important; }
        [data-taskify="toast-viewport"] { left: 12px !important; right: 12px !important; top: 12px !important; width: auto !important; }
      }
    `;
    document.head.appendChild(styleTag);
    return () => styleTag.remove();
  }, []);

  const remainingCount = useMemo(
    () => todos.filter((todo) => !todo.completed).length,
    [todos]
  );
  const completedCount = useMemo(
    () => todos.filter((todo) => todo.completed).length,
    [todos]
  );
  const totalCount = todos.length;
  const progressPercent = useMemo(
    () => (totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100)),
    [completedCount, totalCount]
  );
  const themeStyles = getThemeStyles(theme);
  const isBusy = busyAction !== null;

  const visibleTodos = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    const matchesSearch = (todo) => {
      if (!normalizedQuery) return true;
      return (
        todo.text.toLowerCase().includes(normalizedQuery) ||
        (todo.priority || "").toLowerCase().includes(normalizedQuery) ||
        (todo.dueDate || "").toLowerCase().includes(normalizedQuery)
      );
    };

    if (filter === "completed") {
      return todos.filter((todo) => todo.completed && matchesSearch(todo));
    }

    if (filter === "pending") {
      return todos.filter((todo) => !todo.completed && matchesSearch(todo));
    }

    return todos.filter((todo) => matchesSearch(todo));
  }, [filter, searchQuery, todos]);

  const addToast = (type, text) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((currentToasts) => [...currentToasts, { id, type, text }]);

    window.setTimeout(() => {
      setToasts((currentToasts) =>
        currentToasts.filter((toast) => toast.id !== id)
      );
    }, 2600);
  };

  const animateInTask = (id) => {
    setAnimatingIds((currentIds) => [...currentIds, id]);
    window.setTimeout(() => {
      setAnimatingIds((currentIds) =>
        currentIds.filter((itemId) => itemId !== id)
      );
    }, 320);
  };

  const runWithLoading = (action, callback, delay = 350) => {
    setBusyAction(action);
    window.setTimeout(() => {
      try {
        callback();
      } finally {
        setBusyAction(null);
      }
    }, delay);
  };

  const handleAuthSubmit = (event) => {
    event.preventDefault();
    if (isBusy) return;

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password.trim()) {
      setMessage("Please enter both email and password.");
      return;
    }

    const users = getUsers();
    const existingUser = users.find((user) => user.email === normalizedEmail);

    if (mode === "register") {
      if (existingUser) {
        setMessage("This email already exists. Please log in.");
        return;
      }

      runWithLoading("auth", () => {
        const newUser = { email: normalizedEmail, password };
        saveUsers([...users, newUser]);
        saveSession({ email: normalizedEmail });
        setCurrentUser({ email: normalizedEmail });
        setTodos([]);
        setMessage("");
        setEmail("");
        setPassword("");
        addToast("success", "Account created and logged in.");
      });
      return;
    }

    if (!existingUser || existingUser.password !== password) {
      setMessage("Invalid email or password.");
      return;
    }

    runWithLoading("auth", () => {
      saveSession({ email: normalizedEmail });
      setCurrentUser({ email: normalizedEmail });
      setTodos(loadTodos(normalizedEmail));
      setMessage("");
      setEmail("");
      setPassword("");
      addToast("success", "Logged in successfully.");
    });
  };

  const addTask = (event) => {
    event.preventDefault();
    if (isBusy) return;

    const taskText = task.trim();
    if (!taskText) {
      addToast("error", "Please enter a task before adding it.");
      return;
    }

    const id = Date.now();
    const newTodo = {
      id,
      text: taskText,
      completed: false,
      completedAt: null,
      dueDate: dueDate || "",
      priority,
      category,
    };

    setTodos((currentTodos) => {
      const nextTodos = [newTodo, ...currentTodos];
      if (currentUser?.email) {
        localStorage.setItem(
          todoStorageKey(currentUser.email),
          JSON.stringify(nextTodos)
        );
      }
      return nextTodos;
    });
    animateInTask(id);
    setTask("");
    setDueDate("");
    setPriority("medium");
    addToast("success", "Task added.");
  };

  const toggleTask = (id) => {
    if (isBusy) return;
    setTodos((currentTodos) =>
      currentTodos.map((todo) =>
        todo.id === id
          ? {
              ...todo,
              completed: !todo.completed,
              completedAt: !todo.completed ? new Date().toISOString() : null,
            }
          : todo
      )
    );
  };

  const deleteTask = (id) => {
    if (isBusy) return;
    setRemovingIds((currentIds) =>
      currentIds.includes(id) ? currentIds : [...currentIds, id]
    );
    runWithLoading(`delete-${id}`, () => {
      window.setTimeout(() => {
        setTodos((currentTodos) => currentTodos.filter((todo) => todo.id !== id));
        setRemovingIds((currentIds) =>
          currentIds.filter((itemId) => itemId !== id)
        );
        if (editingId === id) {
          setEditingId(null);
          setEditingText("");
          setEditingDueDate("");
          setEditingPriority("medium");
          setEditingCategory("General");
        }
        addToast("info", "Task deleted.");
      }, 220);
    });
  };

  const startEdit = (todo) => {
    if (isBusy) return;
    setEditingId(todo.id);
    setEditingText(todo.text);
    setEditingDueDate(todo.dueDate || "");
    setEditingPriority(todo.priority || "medium");
    setEditingCategory(todo.category || "General");
  };

  const cancelEdit = () => {
    if (isBusy) return;
    setEditingId(null);
    setEditingText("");
    setEditingDueDate("");
    setEditingPriority("medium");
  };

  const saveEdit = (id) => {
    if (isBusy) return;
    const trimmedText = editingText.trim();
    if (!trimmedText) return;

    runWithLoading(`save-${id}`, () => {
      setTodos((currentTodos) =>
        currentTodos.map((todo) =>
          todo.id === id
            ? {
                ...todo,
                text: trimmedText,
                dueDate: editingDueDate,
                priority: editingPriority,
                category: editingCategory,
              }
            : todo
        )
      );
      setEditingId(null);
      setEditingText("");
      setEditingDueDate("");
      setEditingPriority("medium");
      setEditingCategory("General");
      addToast("success", "Task updated.");
    });
  };

  const clearCompleted = () => {
    if (isBusy || completedCount === 0) return;

    runWithLoading("clear-completed", () => {
      setTodos((currentTodos) => currentTodos.filter((todo) => !todo.completed));
      addToast("info", "Completed tasks cleared.");
    });
  };

  const handleLogout = () => {
    if (isBusy) return;
    runWithLoading("logout", () => {
      clearSession();
      setCurrentUser(null);
      setTodos([]);
      setTodosOwnerEmail(null);
      setTask("");
      setDueDate("");
      setPriority("medium");
      setMessage("");
      setMode("login");
      setEditingId(null);
      setEditingText("");
      setEditingDueDate("");
      setEditingPriority("medium");
      setEditingCategory("General");
      setFilter("all");
      setSearchQuery("");
      addToast("info", "Logged out.");
    });
  };

  const toastViewport = (
    <div data-taskify="toast-viewport" style={styles.toastViewport}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            ...styles.toast,
            ...(toast.type === "success"
              ? styles.toastSuccess
              : toast.type === "error"
              ? styles.toastError
              : styles.toastInfo),
            background:
              theme === "dark"
                ? "rgba(15, 23, 42, 0.96)"
                : "rgba(255, 255, 255, 0.98)",
            color: themeStyles.textPrimary,
            borderColor: themeStyles.navBorder,
          }}
        >
          {toast.text}
        </div>
      ))}
    </div>
  );

  if (!currentUser) {
    return (
      <div data-taskify="page" style={{ ...styles.page, ...themeStyles.page }}>
        {toastViewport}
        <div data-taskify="card" style={{ ...styles.card, ...themeStyles.card }}>
          <div
            data-taskify="nav-bar"
            style={{ ...styles.navBar, borderColor: themeStyles.navBorder }}
          >
            <div>
              <div style={{ ...styles.navTitle, color: themeStyles.textPrimary }}>
                Taskify
              </div>
              <div style={{ ...styles.navSubtitle, color: themeStyles.textSecondary }}>
                Simple login or registration to access your tasks.
              </div>
            </div>
            <button
              data-taskify="auth-toggle"
              type="button"
              onClick={() =>
                setTheme((currentTheme) =>
                  currentTheme === "light" ? "dark" : "light"
                )
              }
              disabled={isBusy}
              style={{
                ...styles.secondaryButton,
                ...themeStyles.secondaryButton,
                ...(isBusy ? styles.disabledButton : null),
              }}
            >
              {theme === "light" ? "Dark mode" : "Light mode"}
            </button>
          </div>

          <div
            data-taskify="tabs"
            style={{
              ...styles.tabs,
              background: theme === "dark" ? "#111827" : "#f8fafc",
            }}
          >
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setMessage("");
              }}
              disabled={isBusy}
              style={{
                ...styles.tabButton,
                ...(mode === "login" ? styles.activeTabButton : {}),
                ...(mode === "login"
                  ? {
                      background: theme === "dark" ? "#e2e8f0" : "#111827",
                      color: theme === "dark" ? "#0f172a" : "#ffffff",
                    }
                  : { color: themeStyles.textSecondary }),
                ...(isBusy ? styles.disabledButton : null),
              }}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setMessage("");
              }}
              disabled={isBusy}
              style={{
                ...styles.tabButton,
                ...(mode === "register" ? styles.activeTabButton : {}),
                ...(mode === "register"
                  ? {
                      background: theme === "dark" ? "#e2e8f0" : "#111827",
                      color: theme === "dark" ? "#0f172a" : "#ffffff",
                    }
                  : { color: themeStyles.textSecondary }),
                ...(isBusy ? styles.disabledButton : null),
              }}
            >
              Register
            </button>
          </div>

          <form data-taskify="auth-form" onSubmit={handleAuthSubmit} style={styles.form}>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              disabled={isBusy}
              style={{ ...styles.input, ...themeStyles.input }}
            />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              disabled={isBusy}
              style={{ ...styles.input, ...themeStyles.input }}
            />
            <button
              type="submit"
              disabled={isBusy}
              style={{
                ...styles.primaryButton,
                ...themeStyles.primaryButton,
                ...(isBusy ? styles.disabledButton : null),
              }}
            >
              {busyAction === "auth"
                ? mode === "register"
                  ? "Creating..."
                  : "Logging in..."
                : mode === "register"
                ? "Create account"
                : "Login"}
            </button>
          </form>

          {message ? <p style={styles.message}>{message}</p> : null}
        </div>
      </div>
    );
  }

  return (
    <div data-taskify="page" style={{ ...styles.page, ...themeStyles.page }}>
      {toastViewport}
      <div data-taskify="card" style={{ ...styles.card, ...themeStyles.card }}>
        <div
          data-taskify="nav-bar"
          style={{ ...styles.navBar, borderColor: themeStyles.navBorder }}
        >
          <div>
            <div style={{ ...styles.navTitle, color: themeStyles.textPrimary }}>
              Taskify
            </div>
            <div style={{ ...styles.navSubtitle, color: themeStyles.textSecondary }}>
              Signed in as <strong>{currentUser.email}</strong>
            </div>
          </div>
          <div data-taskify="nav-actions" style={styles.navActions}>
            <button
              type="button"
              onClick={() =>
                setTheme((currentTheme) =>
                  currentTheme === "light" ? "dark" : "light"
                )
              }
              disabled={isBusy}
              style={{
                ...styles.secondaryButton,
                ...themeStyles.secondaryButton,
                ...(isBusy ? styles.disabledButton : null),
              }}
            >
              {theme === "light" ? "Dark mode" : "Light mode"}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              disabled={isBusy}
              style={{
                ...styles.secondaryButton,
                ...themeStyles.secondaryButton,
                ...(isBusy ? styles.disabledButton : null),
              }}
            >
              {busyAction === "logout" ? "Logging out..." : "Logout"}
            </button>
          </div>
        </div>

        <p style={{ ...styles.subtitle, color: themeStyles.textSecondary }}>
          {remainingCount} task{remainingCount === 1 ? "" : "s"} left
        </p>

        <div style={styles.progressSection}>
          <div style={styles.progressHeader}>
            <span style={{ color: themeStyles.textSecondary, fontSize: "0.9rem", fontWeight: 600 }}>
              Progress
            </span>
            <strong style={{ color: themeStyles.textPrimary, fontSize: "0.9rem" }}>
              {progressPercent}%
            </strong>
          </div>
          <div
            style={{
              ...styles.progressTrack,
              background: theme === "dark" ? "rgba(148, 163, 184, 0.16)" : "#e5e7eb",
            }}
          >
            <div
              style={{
                ...styles.progressFill,
                width: `${progressPercent}%`,
                background: theme === "dark" ? "#60a5fa" : "#2563eb",
              }}
            />
          </div>
        </div>

        <div style={styles.clearCompletedRow}>
          <button
            type="button"
            onClick={clearCompleted}
            disabled={isBusy || completedCount === 0}
            style={{
              ...styles.secondaryButton,
              ...themeStyles.secondaryButton,
              ...styles.clearCompletedButton,
              ...(isBusy || completedCount === 0 ? styles.disabledButton : null),
            }}
          >
            Clear Completed
          </button>
        </div>

        <div data-taskify="stats-row" style={styles.statsRow}>
          <div style={{ ...styles.statCard, ...themeStyles.statCard }}>
            <span style={{ ...styles.statLabel, color: themeStyles.textSecondary }}>
              Total
            </span>
            <strong style={{ ...styles.statValue, color: themeStyles.textPrimary }}>
              {totalCount}
            </strong>
          </div>
          <div style={{ ...styles.statCard, ...themeStyles.statCard }}>
            <span style={{ ...styles.statLabel, color: themeStyles.textSecondary }}>
              Completed
            </span>
            <strong style={{ ...styles.statValue, color: themeStyles.textPrimary }}>
              {completedCount}
            </strong>
          </div>
          <div style={{ ...styles.statCard, ...themeStyles.statCard }}>
            <span style={{ ...styles.statLabel, color: themeStyles.textSecondary }}>
              Pending
            </span>
            <strong style={{ ...styles.statValue, color: themeStyles.textPrimary }}>
              {remainingCount}
            </strong>
          </div>
        </div>

        <div style={styles.searchWrap}>
          <input
            data-taskify="search"
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search tasks..."
            disabled={isBusy}
            style={{ ...styles.input, ...themeStyles.input, ...styles.searchInput }}
          />
        </div>

        <div
          data-taskify="filter-bar"
          style={{
            ...styles.filterBar,
            background: theme === "dark" ? "#111827" : "#f8fafc",
            borderColor:
              theme === "dark" ? "rgba(148, 163, 184, 0.18)" : "#e5e7eb",
          }}
        >
          {[
            { key: "all", label: "All" },
            { key: "completed", label: "Completed" },
            { key: "pending", label: "Pending" },
          ].map((item) => {
            const active = filter === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key)}
                disabled={isBusy}
                style={{
                  ...styles.filterButton,
                  ...(active
                    ? {
                        background: theme === "dark" ? "#e2e8f0" : "#111827",
                        color: theme === "dark" ? "#0f172a" : "#ffffff",
                        boxShadow:
                          theme === "dark"
                            ? "0 8px 18px rgba(0, 0, 0, 0.22)"
                            : "0 8px 18px rgba(15, 23, 42, 0.12)",
                      }
                    : {
                        background: "transparent",
                        color: themeStyles.textSecondary,
                      }),
                  ...(isBusy ? styles.disabledButton : null),
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <form data-taskify="task-form" onSubmit={addTask} style={styles.form}>
          <div data-taskify="task-inputs" style={styles.taskInputs}>
            <input
              type="text"
              value={task}
              onChange={(event) => setTask(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addTask(event);
                }
              }}
              placeholder="Add a new task..."
              disabled={isBusy}
              style={{ ...styles.input, ...themeStyles.input, ...styles.taskTextInput }}
            />
            <input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              disabled={isBusy}
              style={{ ...styles.input, ...themeStyles.input, ...styles.taskDateInput }}
            />
            <select
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
              disabled={isBusy}
              style={{ ...styles.input, ...themeStyles.input, ...styles.taskSelect }}
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={isBusy}
            style={{
              ...styles.primaryButton,
              ...themeStyles.primaryButton,
              ...(isBusy ? styles.disabledButton : null),
            }}
          >
            {busyAction === "add" ? "Adding..." : "Add"}
          </button>
        </form>

        <div style={styles.list}>
          {visibleTodos.length === 0 ? (
            <p style={{ ...styles.emptyState, color: themeStyles.textSecondary }}>
              {filter === "all"
                ? "No tasks yet, add one!"
                : filter === "completed"
                ? "No completed tasks yet."
                : "No pending tasks right now."}
            </p>
          ) : (
            visibleTodos.map((todo) => {
              const overdue = isTodoOverdue(todo);
              const categoryStyles = getCategoryStyle(todo.category || "General", theme);

              return (
              <div
                data-taskify="todo-item"
                key={todo.id}
                style={{
                  ...styles.todoItem,
                  ...themeStyles.todoItem,
                  ...(overdue ? styles.overdueItem : null),
                  ...(animatingIds.includes(todo.id) ? styles.todoItemEnter : null),
                  ...(removingIds.includes(todo.id) ? styles.todoItemExit : null),
                }}
              >
                {editingId === todo.id ? (
                    <div data-taskify="edit-row" style={styles.editRow}>
                    <div data-taskify="edit-fields" style={styles.editFields}>
                      <input
                        type="text"
                        value={editingText}
                        onChange={(event) => setEditingText(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            saveEdit(todo.id);
                          }
                          if (event.key === "Escape") {
                            cancelEdit();
                          }
                        }}
                        disabled={isBusy}
                        style={{ ...styles.editInput, ...themeStyles.input }}
                        autoFocus
                      />
                      <input
                        type="date"
                        value={editingDueDate}
                        onChange={(event) => setEditingDueDate(event.target.value)}
                        disabled={isBusy}
                        style={{ ...styles.editInput, ...themeStyles.input }}
                      />
                      <select
                        value={editingPriority}
                        onChange={(event) => setEditingPriority(event.target.value)}
                        disabled={isBusy}
                        style={{ ...styles.editInput, ...themeStyles.input }}
                      >
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </div>
                    <div data-taskify="edit-actions" style={styles.actionRow}>
                      <button
                        type="button"
                        onClick={() => saveEdit(todo.id)}
                        disabled={isBusy}
                        style={{
                          ...styles.primaryButton,
                          ...themeStyles.primaryButton,
                          ...(busyAction === `save-${todo.id}` ? styles.disabledButton : null),
                        }}
                      >
                        {busyAction === `save-${todo.id}` ? "Saving..." : "Save"}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        disabled={isBusy}
                        style={{
                          ...styles.secondaryButton,
                          ...themeStyles.secondaryButton,
                          ...(isBusy ? styles.disabledButton : null),
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <label data-taskify="todo-label" style={styles.todoLabel}>
                      <input
                        type="checkbox"
                        checked={todo.completed}
                        onChange={() => toggleTask(todo.id)}
                        disabled={isBusy}
                        style={{ ...styles.checkbox, accentColor: themeStyles.accent }}
                      />
                      <span
                        style={{
                          ...styles.todoText,
                          textDecoration: todo.completed ? "line-through" : "none",
                          color: todo.completed
                            ? themeStyles.textMuted
                            : themeStyles.textPrimary,
                        }}
                        >
                        {todo.text}
                      </span>
                    </label>

                    {todo.completed && todo.completedAt ? (
                      <div style={{ color: themeStyles.textSecondary, fontSize: "0.88rem", marginTop: "-4px", width: "100%" }}>
                        Completed on: {formatDisplayDate(todo.completedAt)}
                      </div>
                    ) : null}

                    <div data-taskify="todo-meta" style={styles.metaRow}>
                      {overdue ? (
                        <span
                          style={{
                            ...styles.overduePill,
                            background: theme === "dark" ? "rgba(239, 68, 68, 0.18)" : "#fee2e2",
                            color: theme === "dark" ? "#fca5a5" : "#b91c1c",
                          }}
                        >
                          Overdue
                        </span>
                      ) : null}
                      <span
                        style={{
                          ...styles.categoryPill,
                          ...categoryStyles,
                        }}
                      >
                        {todo.category || "General"}
                      </span>
                      {todo.dueDate ? (
                        <span
                          style={{
                            ...styles.metaPill,
                            background:
                              theme === "dark"
                                ? "rgba(148, 163, 184, 0.16)"
                                : "#e2e8f0",
                            color: themeStyles.textSecondary,
                          }}
                        >
                          Due{" "}
                          {new Date(todo.dueDate + "T00:00:00").toLocaleDateString()}
                        </span>
                      ) : null}
                      <span
                        style={{
                          ...styles.priorityPill,
                          ...(todo.priority === "high"
                            ? styles.highPriority
                            : todo.priority === "low"
                            ? styles.lowPriority
                            : styles.mediumPriority),
                        }}
                      >
                        {todo.priority || "medium"}
                      </span>
                    </div>

                    <div data-taskify="todo-actions" style={styles.actionRow}>
                      <button
                        type="button"
                        onClick={() => startEdit(todo)}
                        disabled={isBusy}
                        style={{
                          ...styles.secondaryButton,
                          ...themeStyles.secondaryButton,
                          ...(isBusy ? styles.disabledButton : null),
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteTask(todo.id)}
                        disabled={isBusy}
                        style={{
                          ...styles.deleteButton,
                          ...themeStyles.deleteButton,
                          ...(busyAction === `delete-${todo.id}` ? styles.disabledButton : null),
                        }}
                      >
                        {busyAction === `delete-${todo.id}` ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </>
                )}
              </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "32px 20px",
    fontFamily:
      "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: "720px",
    borderRadius: "24px",
    padding: "32px",
  },
  navBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    paddingBottom: "18px",
    marginBottom: "18px",
    borderBottom: "1px solid",
    flexWrap: "wrap",
  },
  navActions: {
    display: "flex",
    gap: "10px",
    flexShrink: 0,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  navTitle: {
    margin: 0,
    fontSize: "1.35rem",
    letterSpacing: "-0.04em",
    fontWeight: 700,
  },
  navSubtitle: {
    marginTop: "6px",
    lineHeight: 1.5,
    fontSize: "0.95rem",
  },
  tabs: {
    display: "flex",
    gap: "8px",
    marginBottom: "24px",
    padding: "6px",
    borderRadius: "14px",
  },
  tabButton: {
    flex: 1,
    border: "1px solid transparent",
    borderRadius: "10px",
    padding: "12px 14px",
    background: "transparent",
    cursor: "pointer",
    fontSize: "0.98rem",
    fontWeight: 600,
  },
  activeTabButton: {
    borderColor: "#111827",
  },
  form: {
    display: "flex",
    gap: "12px",
    marginBottom: "24px",
    flexWrap: "wrap",
    alignItems: "flex-start",
  },
  progressSection: {
    marginBottom: "18px",
  },
  progressHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "8px",
  },
  progressTrack: {
    height: "8px",
    borderRadius: "999px",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: "999px",
    transition: "width 220ms ease",
  },
  clearCompletedRow: {
    display: "flex",
    justifyContent: "flex-end",
    marginBottom: "18px",
  },
  clearCompletedButton: {
    padding: "10px 14px",
  },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "12px",
    marginBottom: "18px",
  },
  statCard: {
    borderRadius: "16px",
    padding: "14px 16px",
    border: "1px solid",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  statLabel: {
    fontSize: "0.85rem",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  statValue: {
    fontSize: "1.5rem",
    lineHeight: 1,
    letterSpacing: "-0.03em",
  },
  searchWrap: {
    marginBottom: "18px",
  },
  categoryFilterWrap: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginBottom: "18px",
  },
  categoryFilterLabel: {
    fontSize: "0.85rem",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  categoryFilterBar: {
    display: "flex",
    gap: "8px",
    padding: "6px",
    borderRadius: "14px",
    border: "1px solid",
    flexWrap: "wrap",
  },
  searchInput: {
    width: "100%",
  },
  filterBar: {
    display: "flex",
    gap: "8px",
    padding: "6px",
    borderRadius: "14px",
    border: "1px solid",
    marginBottom: "18px",
    flexWrap: "wrap",
  },
  filterButton: {
    border: "none",
    borderRadius: "10px",
    padding: "10px 14px",
    cursor: "pointer",
    fontSize: "0.95rem",
    fontWeight: 600,
  },
  taskInputs: {
    display: "grid",
    gridTemplateColumns:
      "minmax(0, 1.8fr) minmax(140px, 1fr) minmax(120px, 0.9fr) minmax(120px, 0.9fr)",
    gap: "12px",
    flex: "1 1 100%",
  },
  taskTextInput: {
    minWidth: 0,
  },
  taskDateInput: {
    minWidth: 0,
  },
  taskSelect: {
    minWidth: 0,
  },
  input: {
    flex: "1 1 220px",
    borderRadius: "14px",
    padding: "14px 16px",
    fontSize: "1rem",
    outline: "none",
    background: "#ffffff",
  },
  primaryButton: {
    border: "none",
    borderRadius: "14px",
    padding: "14px 20px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: 600,
  },
  secondaryButton: {
    borderRadius: "14px",
    padding: "12px 16px",
    cursor: "pointer",
    fontSize: "0.95rem",
    fontWeight: 600,
    flexShrink: 0,
  },
  disabledButton: {
    opacity: 0.65,
    cursor: "not-allowed",
  },
  message: {
    margin: 0,
    color: "#b91c1c",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "14px",
    padding: "12px 14px",
  },
  list: {
    display: "grid",
    gap: "14px",
  },
  todoItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    padding: "16px 18px",
    borderRadius: "16px",
    flexWrap: "wrap",
    transition:
      "transform 220ms ease, opacity 220ms ease, box-shadow 220ms ease, border-color 220ms ease",
  },
  todoItemEnter: {
    animation: "taskifyFadeIn 280ms ease-out",
  },
  todoItemExit: {
    opacity: 0,
    transform: "translateY(-8px) scale(0.98)",
  },
  overdueItem: {
    borderColor: "#ef4444",
    background: "rgba(239, 68, 68, 0.06)",
  },
  editRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    width: "100%",
    flexWrap: "wrap",
  },
  editFields: {
    display: "grid",
    gridTemplateColumns:
      "minmax(0, 1.6fr) minmax(140px, 1fr) minmax(120px, 0.9fr) minmax(140px, 1fr)",
    gap: "10px",
    flex: "1 1 100%",
  },
  actionRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexShrink: 0,
    flexWrap: "wrap",
  },
  todoLabel: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flex: 1,
    minWidth: 0,
  },
  metaRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
    marginRight: "auto",
  },
  metaPill: {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: "999px",
    padding: "6px 10px",
    fontSize: "0.82rem",
    fontWeight: 600,
  },
  categoryPill: {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: "999px",
    padding: "6px 10px",
    fontSize: "0.82rem",
    fontWeight: 700,
    textTransform: "capitalize",
  },
  overduePill: {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: "999px",
    padding: "6px 10px",
    fontSize: "0.78rem",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  categoryPill: {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: "999px",
    padding: "6px 10px",
    fontSize: "0.82rem",
    fontWeight: 700,
    textTransform: "capitalize",
  },
  priorityPill: {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: "999px",
    padding: "6px 10px",
    fontSize: "0.82rem",
    fontWeight: 700,
    textTransform: "capitalize",
  },
  highPriority: {
    background: "rgba(239, 68, 68, 0.14)",
    color: "#ef4444",
  },
  mediumPriority: {
    background: "rgba(245, 158, 11, 0.14)",
    color: "#f59e0b",
  },
  lowPriority: {
    background: "rgba(34, 197, 94, 0.14)",
    color: "#22c55e",
  },
  checkbox: {
    width: "18px",
    height: "18px",
    flexShrink: 0,
  },
  todoText: {
    fontSize: "1rem",
    wordBreak: "break-word",
  },
  editInput: {
    flex: "1 1 220px",
    borderRadius: "14px",
    padding: "12px 14px",
    fontSize: "1rem",
    outline: "none",
  },
  deleteButton: {
    border: "none",
    borderRadius: "10px",
    padding: "10px 14px",
    cursor: "pointer",
    flexShrink: 0,
    fontWeight: 600,
  },
  emptyState: {
    margin: 0,
    textAlign: "center",
    padding: "28px 0",
  },
  toastViewport: {
    position: "fixed",
    top: "20px",
    right: "20px",
    zIndex: 50,
    display: "grid",
    gap: "10px",
    width: "min(92vw, 340px)",
  },
  toast: {
    borderRadius: "14px",
    border: "1px solid",
    padding: "12px 14px",
    boxShadow: "0 16px 36px rgba(15, 23, 42, 0.16)",
    fontSize: "0.95rem",
    lineHeight: 1.4,
    backdropFilter: "blur(10px)",
  },
  toastSuccess: {
    borderLeft: "4px solid #22c55e",
  },
  toastError: {
    borderLeft: "4px solid #ef4444",
  },
  toastInfo: {
    borderLeft: "4px solid #3b82f6",
  },
};

const animationStyles = `
@keyframes taskifyFadeIn {
  from { opacity: 0; transform: translateY(10px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
`;

if (typeof document !== "undefined" && !document.getElementById("taskify-animations")) {
  const styleTag = document.createElement("style");
  styleTag.id = "taskify-animations";
  styleTag.textContent = animationStyles;
  document.head.appendChild(styleTag);
}

export default App;
