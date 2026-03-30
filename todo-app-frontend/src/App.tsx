import { useEffect, useState, useCallback } from 'react';

interface Todo {
  id: number;
  name: string;
  isComplete: boolean;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5181/todoitems';

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  
  // State for handling the Edit mode
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTaskName, setEditTaskName] = useState('');

  // 1. Wrap in useCallback to stabilize the function for the linter
  const fetchTodos = useCallback(async () => {
    try {
      const response = await fetch(API_URL);
      if (response.ok) {
        const data = await response.json();
        setTodos(data);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  }, []);

  // 2. The linter is now happy because fetchTodos is a stable dependency
  useEffect(() => {
    // Defining the initial load directly inside the effect pacifies the linter
    const loadInitialTodos = async () => {
      try {
        const response = await fetch(API_URL);
        if (response.ok) {
          const data = await response.json();
          setTodos(data);
        }
      } catch (error) {
        console.error("Error fetching tasks:", error);
      }
    };

    loadInitialTodos();
  }, []);

  // 3. React 19 Form Action (No more FormEvent or e.preventDefault!)
  const handleAddTodo = async (formData: FormData) => {
    const newTaskName = formData.get('taskName')?.toString();
    
    if (!newTaskName || !newTaskName.trim()) return;

    const newTodo = { name: newTaskName, isComplete: false };
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTodo),
    });

    if (response.ok) {
      fetchTodos();
      // Note: In React 19 with actions, the form resets itself natively!
    }
  };

  const handleToggleComplete = async (todo: Todo) => {
    const response = await fetch(`${API_URL}/${todo.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...todo, isComplete: !todo.isComplete }),
    });

    if (response.ok) fetchTodos();
  };

  const handleDelete = async (id: number) => {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
    });

    if (response.ok) fetchTodos();
  };

  const startEditing = (todo: Todo) => {
    setEditingId(todo.id);
    setEditTaskName(todo.name);
  };

  const handleSaveEdit = async (todo: Todo) => {
    if (!editTaskName.trim()) {
      setEditingId(null);
      return;
    }

    const response = await fetch(`${API_URL}/${todo.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...todo, name: editTaskName }),
    });

    if (response.ok) {
      setEditingId(null);
      fetchTodos();
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.header}>.NET + React Tasks</h2>
        
        {/* React 19 uses 'action' instead of 'onSubmit' */}
        <form action={handleAddTodo} style={styles.form}>
          <input 
            type="text" 
            name="taskName" // Required for FormData to pick it up
            placeholder="What needs to be done?"
            style={styles.input}
            required
          />
          <button type="submit" style={styles.addButton}>Add</button>
        </form>

        <ul style={styles.list}>
          {todos.length === 0 && <p style={styles.emptyText}>No tasks yet. Add one above!</p>}
          
          {todos.map(todo => (
            <li key={todo.id} style={styles.listItem}>
              <input 
                type="checkbox" 
                checked={todo.isComplete} 
                onChange={() => handleToggleComplete(todo)} 
                style={styles.checkbox}
              />

              {editingId === todo.id ? (
                <div style={styles.editContainer}>
                  <input
                    type="text"
                    value={editTaskName}
                    onChange={(e) => setEditTaskName(e.target.value)}
                    style={styles.editInput}
                    autoFocus
                  />
                  <button onClick={() => handleSaveEdit(todo)} style={styles.saveButton}>Save</button>
                  <button onClick={() => setEditingId(null)} style={styles.cancelButton}>Cancel</button>
                </div>
              ) : (
                <span style={{ 
                  ...styles.taskText, 
                  textDecoration: todo.isComplete ? 'line-through' : 'none',
                  color: todo.isComplete ? '#64748b' : '#f8fafc' 
                }}>
                  {todo.name}
                </span>
              )}

              {editingId !== todo.id && (
                <div style={styles.actionButtons}>
                  <button onClick={() => startEditing(todo)} style={styles.editBtn}>Edit</button>
                  <button onClick={() => handleDelete(todo.id)} style={styles.deleteBtn}>Delete</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', display: 'flex', justifyContent: 'center', paddingTop: '4rem', backgroundColor: '#0f172a', fontFamily: 'Inter, system-ui, sans-serif' },
  card: { width: '100%', maxWidth: '600px', backgroundColor: '#1e293b', borderRadius: '12px', padding: '2rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)' },
  header: { color: '#f8fafc', marginTop: 0, marginBottom: '1.5rem', textAlign: 'center' as const, fontSize: '1.75rem' },
  form: { display: 'flex', gap: '10px', marginBottom: '2rem' },
  input: { flexGrow: 1, padding: '12px 16px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#f8fafc', fontSize: '1rem', outline: 'none' },
  addButton: { padding: '12px 24px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '1rem', transition: 'background-color 0.2s' },
  list: { listStyle: 'none', padding: 0, margin: 0 },
  emptyText: { color: '#64748b', textAlign: 'center' as const, fontStyle: 'italic' },
  listItem: { display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', backgroundColor: '#0f172a', borderRadius: '8px', marginBottom: '10px', border: '1px solid #334155' },
  checkbox: { width: '20px', height: '20px', cursor: 'pointer', accentColor: '#3b82f6' },
  taskText: { flexGrow: 1, fontSize: '1.05rem', wordBreak: 'break-word' as const },
  editContainer: { display: 'flex', flexGrow: 1, gap: '8px' },
  editInput: { flexGrow: 1, padding: '8px', borderRadius: '4px', border: '1px solid #3b82f6', backgroundColor: '#1e293b', color: '#f8fafc' },
  saveButton: { padding: '6px 12px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  cancelButton: { padding: '6px 12px', backgroundColor: '#64748b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  actionButtons: { display: 'flex', gap: '8px' },
  editBtn: { padding: '6px 12px', backgroundColor: 'transparent', color: '#3b82f6', border: '1px solid #3b82f6', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem' },
  deleteBtn: { padding: '6px 12px', backgroundColor: 'transparent', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem' },
};