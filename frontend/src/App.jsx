import { useEffect, useMemo, useState } from 'react'
import {
  clearCompletedTodos,
  createTodo,
  deleteTodo,
  getTodos,
  updateTodo,
} from './api'
import './App.css'

const filters = ['all', 'active', 'completed']
const todayLabel = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
}).format()

function App() {
  const [todos, setTodos] = useState([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [clearingCompleted, setClearingCompleted] = useState(false)
  const [busyIds, setBusyIds] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    getTodos()
      .then((items) => {
        if (active) setTodos(items)
      })
      .catch((requestError) => {
        if (active) setError(`Could not load tasks. ${requestError.message}`)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const remainingCount = useMemo(
    () => todos.filter((todo) => !todo.completed).length,
    [todos],
  )
  const completedCount = todos.length - remainingCount
  const visibleTodos = todos.filter((todo) => {
    if (filter === 'active') return !todo.completed
    if (filter === 'completed') return todo.completed
    return true
  })

  async function handleAdd(event) {
    event.preventDefault()
    const cleanTitle = title.trim()
    if (!cleanTitle) return

    setSaving(true)
    setError('')
    try {
      const todo = await createTodo({
        title: cleanTitle,
        description: description.trim() || null,
      })
      setTodos((current) => [todo, ...current])
      setTitle('')
      setDescription('')
    } catch (requestError) {
      setError(`Could not add task. ${requestError.message}`)
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdate(todo, changes) {
    setBusyIds((ids) => [...ids, todo.id])
    setError('')
    try {
      const updated = await updateTodo(todo.id, changes)
      setTodos((current) =>
        current.map((item) => (item.id === todo.id ? updated : item)),
      )
      if (editingId === todo.id) setEditingId(null)
    } catch (requestError) {
      setError(`Could not update task. ${requestError.message}`)
    } finally {
      setBusyIds((ids) => ids.filter((id) => id !== todo.id))
    }
  }

  async function handleDelete(todo) {
    setBusyIds((ids) => [...ids, todo.id])
    setError('')
    try {
      await deleteTodo(todo.id)
      setTodos((current) => current.filter((item) => item.id !== todo.id))
    } catch (requestError) {
      setError(`Could not delete task. ${requestError.message}`)
    } finally {
      setBusyIds((ids) => ids.filter((id) => id !== todo.id))
    }
  }

  async function handleClearCompleted() {
    setClearingCompleted(true)
    setError('')
    try {
      await clearCompletedTodos()
      setTodos((current) => current.filter((todo) => !todo.completed))
    } catch (requestError) {
      setError(`Could not clear completed tasks. ${requestError.message}`)
    } finally {
      setClearingCompleted(false)
    }
  }

  function startEditing(todo) {
    setEditingId(todo.id)
    setEditingTitle(todo.title)
  }

  function saveEdit(event, todo) {
    event.preventDefault()
    const cleanTitle = editingTitle.trim()
    if (!cleanTitle) {
      setError('Task title cannot be empty.')
      return
    }
    if (cleanTitle === todo.title) {
      setEditingId(null)
      return
    }
    handleUpdate(todo, { title: cleanTitle })
  }

  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Taskflow home">
          <span className="brand-mark" aria-hidden="true">✓</span>
          <span>taskflow</span>
        </a>
        <span className="topbar-note">A little progress, every day.</span>
      </header>

      <section className="workspace">
        <div className="page-heading">
          <div>
            <p className="eyebrow">YOUR PERSONAL SPACE</p>
            <h1>Good things take <span>time.</span></h1>
            <p className="subtitle">Keep your focus on what matters today.</p>
          </div>
          <div className="date-card">
            <span className="date-label">TODAY</span>
            <strong>{todayLabel}</strong>
          </div>
        </div>

        <form className="add-card" onSubmit={handleAdd}>
          <div className="add-title-row">
            <span className="plus-icon" aria-hidden="true">+</span>
            <input
              aria-label="Task title"
              autoComplete="off"
              maxLength={200}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="What needs to get done?"
              value={title}
            />
            <button className="add-button" disabled={saving || !title.trim()} type="submit">
              {saving ? 'Adding…' : 'Add task'}
            </button>
          </div>
          <input
            aria-label="Task description (optional)"
            className="description-input"
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Add a note (optional)"
            value={description}
          />
        </form>

        <section className="tasks-card" aria-label="Todo list">
          <div className="list-heading">
            <div>
              <h2>Your tasks</h2>
              <p>{remainingCount === 1 ? '1 task' : `${remainingCount} tasks`} left to focus on</p>
            </div>
            <div className="progress-ring" aria-label={`${completedCount} completed`}>
              <span>{completedCount}<small>/{todos.length}</small></span>
            </div>
          </div>

          <div className="list-toolbar">
            <div className="filter-tabs" aria-label="Filter tasks">
              {filters.map((name) => (
                <button
                  aria-pressed={filter === name}
                  className={filter === name ? 'filter-tab selected' : 'filter-tab'}
                  key={name}
                  onClick={() => setFilter(name)}
                  type="button"
                >
                  {name[0].toUpperCase() + name.slice(1)}
                  {name === 'all' && <span className="filter-count">{todos.length}</span>}
                </button>
              ))}
            </div>
            {completedCount > 0 && (
              <button className="clear-button" disabled={clearingCompleted} onClick={handleClearCompleted} type="button">
                {clearingCompleted ? 'Clearing…' : 'Clear completed'}
              </button>
            )}
          </div>

          {error && <p className="error-banner" role="alert">{error}</p>}

          {loading ? (
            <div className="empty-state"><span className="spinner" /> Loading your tasks…</div>
          ) : visibleTodos.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon" aria-hidden="true">{filter === 'completed' ? '✦' : '○'}</span>
              <strong>{filter === 'all' ? 'A fresh start.' : `No ${filter} tasks.`}</strong>
              <span>{filter === 'all' ? 'Add your first task above and get going.' : 'Try another filter or add a new task.'}</span>
            </div>
          ) : (
            <ul className="todo-list">
              {visibleTodos.map((todo) => {
                const busy = busyIds.includes(todo.id)
                return (
                  <li className={todo.completed ? 'todo-row completed' : 'todo-row'} key={todo.id}>
                    <button
                      aria-label={todo.completed ? `Mark ${todo.title} active` : `Complete ${todo.title}`}
                      className="check-button"
                      disabled={busy}
                      onClick={() => handleUpdate(todo, { completed: !todo.completed })}
                      type="button"
                    >
                      {todo.completed && <span aria-hidden="true">✓</span>}
                    </button>
                    <div className="todo-content">
                      {editingId === todo.id ? (
                        <form className="edit-form" onSubmit={(event) => saveEdit(event, todo)}>
                          <input
                            aria-label="Edit task title"
                            autoFocus
                            disabled={busy}
                            maxLength={200}
                            onChange={(event) => setEditingTitle(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === 'Escape') setEditingId(null)
                            }}
                            value={editingTitle}
                          />
                          <button disabled={busy} type="submit">Save</button>
                          <button disabled={busy} onClick={() => setEditingId(null)} type="button">Cancel</button>
                        </form>
                      ) : (
                        <>
                          <button className="todo-title" onClick={() => startEditing(todo)} type="button">
                            {todo.title}
                          </button>
                          {todo.description && <p className="todo-description">{todo.description}</p>}
                        </>
                      )}
                    </div>
                    {busy && <span className="row-status" role="status">Saving…</span>}
                    <span className="todo-date">
                      {new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(todo.created_at))}
                    </span>
                    <button
                      aria-label={`Delete ${todo.title}`}
                      className="delete-button"
                      disabled={busy}
                      onClick={() => handleDelete(todo)}
                      type="button"
                    >
                      <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
                        <path d="M4.5 6h11m-9.5 0 .6 10h6.8l.6-10M8 6V4.5h4V6m-3 3v4m2-4v4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                      </svg>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          <footer className="list-footer">
            <span><i className="status-dot" /> Saved automatically</span>
            <span>{completedCount} completed</span>
          </footer>
        </section>
        <p className="page-footer">Small steps add up. You’re doing great.</p>
      </section>
    </main>
  )
}

export default App
