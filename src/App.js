import React, { useEffect, useMemo, useState } from "react";

const USERS_KEY = "todo-app-users";
const SESSION_KEY = "todo-app-session";
const TODOS_PREFIX = "todo-app-todos-";

function readJSON(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getTodoKey(email) {
  return `${TODOS_PREFIX}${email.toLowerCase()}`;
}

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [todoText, setTodoText] = useState("");
  const [todos, setTodos] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const savedSession = readJSON(SESSION_KEY, null);
    if (!savedSession?.email) return;

    setCurrentUser({ email: savedSession.email });
    setTodos(readJSON(getTodoKey(savedSession.email), []));
  }, []);

  useEffect(() => {
    if (!currentUser?.email) return;
    saveJSON(getTodoKey(currentUser.email), todos);
  }, [currentUser, todos]);

  const completedCount = useMemo(
    () => todos.filter((todo) => todo.completed).length,
    [todos]
  );

  const handleLogin = (event) => {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (!normalizedEmail || !trimmedPassword) {
      setMessage("Please enter email and password.");
      return;
    }

    const users = readJSON(USERS_KEY, []);
    const existingUser = users.find((user) => user.email === normalizedEmail);

    if (existingUser && existingUser.password !== trimmedPassword) {
      setMessage("Incorrect password for this email.");
      return;
    }

    if (!existingUser) {
      saveJSON(USERS_KEY, [
        ...users,
        { email: normalizedEmail, password: trimmedPassword },
      ]);
    }

    saveJSON(SESSION_KEY, { email: normalizedEmail });
    setCurrentUser({ email: normalizedEmail });
    setTodos(readJSON(getTodoKey(normalizedEmail), []));
    setEmail("");
    setPassword("");
    setMessage("");
  };

  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    setCurrentUser(null);
    setTodos([]);
    setTodoText("");
    setMessage("");
  };

  const addTodo = (event) => {
    event.preventDefault();

    const text = todoText.trim();
    if (!text) return;

    setTodos((currentTodos) => [
      {
        id: Date.now(),
        text,
        completed: false,
      },
      ...currentTodos,
    ]);
    setTodoText("");
  };

  const toggleTodo = (id) => {
    setTodos((currentTodos) =>
      currentTodos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const deleteTodo = (id) => {
    setTodos((currentTodos) => currentTodos.filter((todo) => todo.id !== id));
  };

  if (!currentUser) {
    return (
      <main style={styles.page}>
        <section style={styles.card}>
          <h1 style={styles.title}>Todo List</h1>
          <p style={styles.subtitle}>Log in to manage your saved todos.</p>

          <form onSubmit={handleLogin} style={styles.form}>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              style={styles.input}
            />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              style={styles.input}
            />
            <button type="submit" style={styles.primaryButton}>
              Login
            </button>
          </form>

          {message ? <p style={styles.message}>{message}</p> : null}
        </section>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Todo List</h1>
            <p style={styles.subtitle}>Signed in as {currentUser.email}</p>
          </div>
          <button type="button" onClick={handleLogout} style={styles.secondaryButton}>
            Logout
          </button>
        </div>

        <form onSubmit={addTodo} style={styles.todoForm}>
          <input
            type="text"
            value={todoText}
            onChange={(event) => setTodoText(event.target.value)}
            placeholder="Add a todo..."
            style={styles.input}
          />
          <button type="submit" style={styles.primaryButton}>
            Add
          </button>
        </form>

        <p style={styles.count}>
          {completedCount} of {todos.length} completed
        </p>

        <div style={styles.list}>
          {todos.length === 0 ? (
            <p style={styles.empty}>No todos yet.</p>
          ) : (
            todos.map((todo) => (
              <div key={todo.id} style={styles.todoItem}>
                <label style={styles.todoLabel}>
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => toggleTodo(todo.id)}
                    style={styles.checkbox}
                  />
                  <span
                    style={{
                      ...styles.todoText,
                      ...(todo.completed ? styles.completedText : null),
                    }}
                  >
                    {todo.text}
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => deleteTodo(todo.id)}
                  style={styles.deleteButton}
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    background: "#f3f4f6",
    fontFamily:
      "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: "560px",
    padding: "28px",
    borderRadius: "16px",
    background: "#ffffff",
    boxShadow: "0 20px 50px rgba(15, 23, 42, 0.12)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    marginBottom: "22px",
  },
  title: {
    margin: 0,
    color: "#111827",
    fontSize: "2rem",
    lineHeight: 1.1,
  },
  subtitle: {
    margin: "8px 0 0",
    color: "#6b7280",
  },
  form: {
    display: "grid",
    gap: "12px",
    marginTop: "22px",
  },
  todoForm: {
    display: "flex",
    gap: "10px",
    marginBottom: "16px",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    padding: "12px 14px",
    fontSize: "1rem",
    outline: "none",
  },
  primaryButton: {
    border: "none",
    borderRadius: "10px",
    padding: "12px 18px",
    background: "#111827",
    color: "#ffffff",
    fontWeight: 700,
    cursor: "pointer",
  },
  secondaryButton: {
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    padding: "10px 14px",
    background: "#ffffff",
    color: "#374151",
    fontWeight: 700,
    cursor: "pointer",
  },
  message: {
    margin: "14px 0 0",
    color: "#b91c1c",
    fontWeight: 600,
  },
  count: {
    margin: "0 0 14px",
    color: "#6b7280",
    fontSize: "0.95rem",
  },
  list: {
    display: "grid",
    gap: "10px",
  },
  empty: {
    margin: 0,
    padding: "18px 0",
    color: "#6b7280",
    textAlign: "center",
  },
  todoItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    padding: "12px 14px",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    background: "#f9fafb",
  },
  todoLabel: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    minWidth: 0,
  },
  checkbox: {
    width: "18px",
    height: "18px",
    flexShrink: 0,
  },
  todoText: {
    color: "#111827",
    wordBreak: "break-word",
  },
  completedText: {
    color: "#9ca3af",
    textDecoration: "line-through",
  },
  deleteButton: {
    border: "none",
    borderRadius: "8px",
    padding: "8px 10px",
    background: "#fee2e2",
    color: "#b91c1c",
    fontWeight: 700,
    cursor: "pointer",
    flexShrink: 0,
  },
};

export default App;
