import {
  jsx as _jsx,
  jsxs as _jsxs,
  Fragment as _Fragment,
} from "react/jsx-runtime";
import { useState, useEffect } from "react";
import "./App.css";
function App() {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState("");
  const [filter, setFilter] = useState("all");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  // Load todos from localStorage on mount
  useEffect(() => {
    const savedTodos = localStorage.getItem("todos");
    if (savedTodos) {
      try {
        const parsed = JSON.parse(savedTodos);
        // Convert string dates back to Date objects
        const todosWithDates = parsed.map((todo) => ({
          ...todo,
          createdAt: new Date(todo.createdAt),
        }));
        setTodos(todosWithDates);
      } catch (e) {
        console.error("Failed to parse todos from localStorage", e);
      }
    }
  }, []);
  // Save todos to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("todos", JSON.stringify(todos));
  }, [todos]);
  const addTodo = () => {
    if (newTodo.trim() === "") return;
    const newTodoItem = {
      id: Date.now().toString(),
      text: newTodo.trim(),
      completed: false,
      createdAt: new Date(),
    };
    setTodos([newTodoItem, ...todos]);
    setNewTodo("");
  };
  const deleteTodo = (id) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };
  const toggleTodo = (id) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo,
      ),
    );
  };
  const startEditing = (todo) => {
    setEditingId(todo.id);
    setEditText(todo.text);
  };
  const saveEdit = () => {
    if (editText.trim() === "") return;
    setTodos(
      todos.map((todo) =>
        todo.id === editingId ? { ...todo, text: editText.trim() } : todo,
      ),
    );
    setEditingId(null);
    setEditText("");
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };
  const filteredTodos = todos.filter((todo) => {
    if (filter === "active") return !todo.completed;
    if (filter === "completed") return todo.completed;
    return true;
  });
  const activeCount = todos.filter((todo) => !todo.completed).length;
  const completedCount = todos.length - activeCount;
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      if (editingId) {
        saveEdit();
      } else {
        addTodo();
      }
    }
  };
  return _jsxs("div", {
    className: "app",
    children: [
      _jsxs("div", {
        className: "header",
        children: [
          _jsx("h1", { children: "\u2728 Todo List" }),
          _jsx("p", { children: "Organize your tasks with style" }),
        ],
      }),
      _jsxs("div", {
        className: "todo-container",
        children: [
          _jsxs("div", {
            className: "input-section",
            children: [
              _jsx("input", {
                type: "text",
                value: newTodo,
                onChange: (e) => setNewTodo(e.target.value),
                onKeyDown: handleKeyDown,
                placeholder: "Add a new task...",
                className: "todo-input",
              }),
              _jsx("button", {
                onClick: addTodo,
                className: "add-btn",
                children: "Add",
              }),
            ],
          }),
          _jsxs("div", {
            className: "stats",
            children: [
              _jsxs("span", {
                className: "stat-item",
                children: ["Total: ", todos.length],
              }),
              _jsxs("span", {
                className: "stat-item",
                children: ["Active: ", activeCount],
              }),
              _jsxs("span", {
                className: "stat-item",
                children: ["Completed: ", completedCount],
              }),
            ],
          }),
          _jsxs("div", {
            className: "filter-section",
            children: [
              _jsx("button", {
                onClick: () => setFilter("all"),
                className: `filter-btn ${filter === "all" ? "active" : ""}`,
                children: "All",
              }),
              _jsx("button", {
                onClick: () => setFilter("active"),
                className: `filter-btn ${filter === "active" ? "active" : ""}`,
                children: "Active",
              }),
              _jsx("button", {
                onClick: () => setFilter("completed"),
                className: `filter-btn ${filter === "completed" ? "active" : ""}`,
                children: "Completed",
              }),
            ],
          }),
          _jsx("div", {
            className: "todos-list",
            children:
              filteredTodos.length === 0
                ? _jsx("div", {
                    className: "empty-state",
                    children: _jsx("p", {
                      children: "No tasks found. Add your first task!",
                    }),
                  })
                : filteredTodos.map((todo) =>
                    _jsx(
                      "div",
                      {
                        className: `todo-item ${todo.completed ? "completed" : ""} ${editingId === todo.id ? "editing" : ""}`,
                        children:
                          editingId === todo.id
                            ? _jsxs("div", {
                                className: "edit-form",
                                children: [
                                  _jsx("input", {
                                    type: "text",
                                    value: editText,
                                    onChange: (e) =>
                                      setEditText(e.target.value),
                                    onKeyDown: (e) => {
                                      if (e.key === "Enter") saveEdit();
                                    },
                                    autoFocus: true,
                                    className: "edit-input",
                                  }),
                                  _jsxs("div", {
                                    className: "edit-actions",
                                    children: [
                                      _jsx("button", {
                                        onClick: saveEdit,
                                        className: "save-btn",
                                        children: "\u2713",
                                      }),
                                      _jsx("button", {
                                        onClick: cancelEdit,
                                        className: "cancel-btn",
                                        children: "\u2715",
                                      }),
                                    ],
                                  }),
                                ],
                              })
                            : _jsxs(_Fragment, {
                                children: [
                                  _jsxs("div", {
                                    className: "todo-content",
                                    children: [
                                      _jsx("input", {
                                        type: "checkbox",
                                        checked: todo.completed,
                                        onChange: () => toggleTodo(todo.id),
                                        className: "todo-checkbox",
                                      }),
                                      _jsx("span", {
                                        className: "todo-text",
                                        children: todo.text,
                                      }),
                                      _jsxs("span", {
                                        className: "todo-date",
                                        children: [
                                          todo.createdAt.toLocaleDateString(),
                                          " ",
                                          todo.createdAt.toLocaleTimeString(
                                            [],
                                            {
                                              hour: "2-digit",
                                              minute: "2-digit",
                                            },
                                          ),
                                        ],
                                      }),
                                    ],
                                  }),
                                  _jsxs("div", {
                                    className: "todo-actions",
                                    children: [
                                      _jsx("button", {
                                        onClick: () => startEditing(todo),
                                        className: "edit-btn",
                                        "aria-label": "Edit todo",
                                        children: "\u270F\uFE0F",
                                      }),
                                      _jsx("button", {
                                        onClick: () => deleteTodo(todo.id),
                                        className: "delete-btn",
                                        "aria-label": "Delete todo",
                                        children: "\uD83D\uDDD1\uFE0F",
                                      }),
                                    ],
                                  }),
                                ],
                              }),
                      },
                      todo.id,
                    ),
                  ),
          }),
        ],
      }),
      _jsx("div", {
        className: "footer",
        children: _jsx("p", {
          children: "Double-click to edit a task \u2022 Press Enter to save",
        }),
      }),
    ],
  });
}
export default App;
