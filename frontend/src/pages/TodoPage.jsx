import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TodoForm from '../components/TodoForm';
import TodoCard from '../components/TodoCard';
import {
  getAllTodos,
  createTodo,
  toggleComplete,
  deleteTodo,
  summarizeTodos,
} from '../api';

export default function TodoPage() {
  const [todos, setTodos] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState(null);
  const [showSummary, setShowSummary] = useState(false);

  const navigate = useNavigate();
  const username = localStorage.getItem('username') || 'there';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('email');
    navigate('/login', { replace: true });
  };

  const fetchTodos = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await getAllTodos();
      setTodos(data);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleLogout();
      } else {
        setError(
          'Could not connect to the server. Check your internet connection or try again later.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  const handleCreate = async (title, description) => {
    const { data } = await createTodo(title, description);
    setTodos((prev) => [data, ...prev]);
  };

  const handleToggle = async (id) => {
    const { data } = await toggleComplete(id);
    setTodos((prev) => prev.map((todo) => (todo.id === id ? data : todo)));
  };

  const handleDelete = async (id) => {
    await deleteTodo(id);
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  };

  const handleSummarize = async () => {
    setSummaryLoading(true);
    setSummaryError(null);
    setSummary(null);
    setShowSummary(true);

    try {
      const { data } = await summarizeTodos();
      setSummary(data.summary);
    } catch {
      setSummaryError('Could not generate summary. Try again!');
    } finally {
      setSummaryLoading(false);
    }
  };

  const closeSummary = () => {
    setShowSummary(false);
    setSummary(null);
    setSummaryError(null);
  };

  const completedCount = todos.filter((todo) => todo.is_completed).length;
  const pendingCount = todos.length - completedCount;

  const filteredTodos = todos.filter((todo) => {
    const query = search.trim().toLowerCase();

    const title = (todo.title || '').toLowerCase();
    const description = (todo.description || '').toLowerCase();

    const matchesSearch =
      title.includes(query) || description.includes(query);

    const matchesFilter =
      filter === 'all' ||
      (filter === 'completed' && todo.is_completed) ||
      (filter === 'pending' && !todo.is_completed);

    return matchesSearch && matchesFilter;
  });

  return (
    <div>
      <header className="header">
        <div className="header-inner">
          <div className="header-logo">✓</div>

          <div className="header-text">
            <h1 className="header-title">My Todo List</h1>
            <p className="header-sub">Welcome back, {username}!</p>
          </div>

          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="main">
        <TodoForm onSubmit={handleCreate} />

        <div className="todo-search-filters">
          <input
            type="search"
            className="todo-search"
            placeholder="Search todos by title or description..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search todos"
          />

          <div className="todo-filters">
            <button
              type="button"
              className={filter === 'all' ? 'active' : ''}
              aria-pressed={filter === 'all'}
              onClick={() => setFilter('all')}
            >
              All ({todos.length})
            </button>

            <button
              type="button"
              className={filter === 'pending' ? 'active' : ''}
              aria-pressed={filter === 'pending'}
              onClick={() => setFilter('pending')}
            >
              Pending ({pendingCount})
            </button>

            <button
              type="button"
              className={filter === 'completed' ? 'active' : ''}
              aria-pressed={filter === 'completed'}
              onClick={() => setFilter('completed')}
            >
              Completed ({completedCount})
            </button>
          </div>
        </div>

        {todos.length > 0 && !loading && (
          <div className="stats">
            <span>{todos.length} total</span>
            <span className="stats-dot">·</span>
            <span className="stats-done">{completedCount} completed</span>
            <span className="stats-dot">·</span>
            <span className="stats-todo">{pendingCount} pending</span>
          </div>
        )}

        <div className="summarize-wrap">
          <button
            className="btn btn-ai"
            onClick={handleSummarize}
            disabled={summaryLoading || todos.length === 0}
          >
            {summaryLoading ? (
              <>
                <span className="spinner-inline" />
                AI is analyzing your todos…
              </>
            ) : (
              '✨ Summarize My Todos'
            )}
          </button>
        </div>

        {showSummary && (
          <div className="ai-summary-card">
            <div className="ai-summary-header">
              <span className="ai-summary-title">✨ AI Summary</span>

              <button
                className="ai-summary-close"
                onClick={closeSummary}
                aria-label="Close summary"
              >
                ✕
              </button>
            </div>

            {summaryLoading ? (
              <p className="ai-summary-text">
                AI is analyzing your todos…
              </p>
            ) : summaryError ? (
              <p className="ai-summary-error">{summaryError}</p>
            ) : (
              <p className="ai-summary-text">{summary}</p>
            )}
          </div>
        )}

        {loading && (
          <div className="spinner-wrap">
            <div className="spinner" />
            <p className="spinner-label">Loading your todos…</p>
          </div>
        )}

        {error && !loading && (
          <div className="error-banner">
            <span>⚠ {error}</span>
            <button className="retry-btn" onClick={fetchTodos}>
              Retry
            </button>
          </div>
        )}

        {!loading && !error && todos.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <p className="empty-text">No todos yet!</p>
            <p className="empty-hint">
              Use the form above to add your first task.
            </p>
          </div>
        )}

        {!loading && !error && todos.length > 0 && (
          filteredTodos.length > 0 ? (
            <ul className="todo-list">
              {filteredTodos.map((todo) => (
                <li key={todo.id}>
                  <TodoCard
                    todo={todo}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-state">
              <p className="empty-text">No results found</p>
              <p className="empty-hint">
                Try another search or filter.
              </p>
            </div>
          )
        )}
      </main>
    </div>
  );
}
