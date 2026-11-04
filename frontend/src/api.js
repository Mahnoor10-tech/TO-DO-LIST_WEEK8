const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:8000/api' : '')
).replace(/\/+$/, '')

async function request(path, options = {}) {
  if (!API_BASE_URL) {
    throw new Error('The API is not configured. Set VITE_API_URL to the deployed API URL.')
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `Request failed with status ${response.status}`)
  }

  if (response.status === 204) return null
  return response.json()
}

export const getHealth = () => request('/health')
export const getTodos = () => request('/todos')

export const createTodo = (todo) =>
  request('/todos', { method: 'POST', body: JSON.stringify(todo) })

export const updateTodo = (id, changes) =>
  request(`/todos/${id}`, { method: 'PUT', body: JSON.stringify(changes) })

export const deleteTodo = (id) => request(`/todos/${id}`, { method: 'DELETE' })
export const clearCompletedTodos = () =>
  request('/todos/completed', { method: 'DELETE' })
