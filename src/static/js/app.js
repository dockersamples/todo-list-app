/* ================================================
   TaskFlow — Full-Featured Todo App (React + Babel)
   ================================================ */

// ===== SVG Icon Components =====
function IconCheck() {
    return (
        <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
    );
}
function IconTrash() {
    return (
        <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
    );
}
function IconEdit() {
    return (
        <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
    );
}
function IconGrip() {
    return (
        <svg viewBox="0 0 24 24"><circle cx="9" cy="6" r="1.5"></circle><circle cx="15" cy="6" r="1.5"></circle><circle cx="9" cy="12" r="1.5"></circle><circle cx="15" cy="12" r="1.5"></circle><circle cx="9" cy="18" r="1.5"></circle><circle cx="15" cy="18" r="1.5"></circle></svg>
    );
}
function IconNotes() {
    return (
        <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
    );
}
function IconCalendar() {
    return (
        <svg viewBox="0 0 24 24" style={{width:11,height:11,marginRight:3}}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
    );
}

// ===== Helper Functions =====
function formatDate(isoStr) {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}`;
}

function isOverdue(dueDate) {
    if (!dueDate) return false;
    const today = new Date();
    today.setHours(0,0,0,0);
    return new Date(dueDate) < today;
}

function isDueToday(dueDate) {
    if (!dueDate) return false;
    const today = new Date();
    const due = new Date(dueDate);
    return today.toDateString() === due.toDateString();
}

// ===== Main App =====
function App() {
    const [items, setItems] = React.useState(null);
    const [filter, setFilter] = React.useState('all');
    const [search, setSearch] = React.useState('');
    const [priorityFilter, setPriorityFilter] = React.useState('all');
    const [dragId, setDragId] = React.useState(null);

    // Fetch items
    React.useEffect(() => {
        fetch('/items')
            .then(r => r.json())
            .then(setItems);
    }, []);

    const onNewItem = React.useCallback((newItem) => {
        setItems(prev => [...prev, newItem]);
    }, []);

    const onItemUpdate = React.useCallback((item) => {
        setItems(prev => {
            const index = prev.findIndex(i => i.id === item.id);
            return [...prev.slice(0, index), item, ...prev.slice(index + 1)];
        });
    }, []);

    const onItemRemoval = React.useCallback((item) => {
        setItems(prev => prev.filter(i => i.id !== item.id));
    }, []);

    const clearCompleted = React.useCallback(() => {
        fetch('/items', { method: 'DELETE' })
            .then(() => setItems(prev => prev.filter(i => !i.completed)));
    }, []);

    const handleDragStart = (id) => setDragId(id);

    const handleDrop = (targetId) => {
        if (dragId === targetId) return;
        setItems(prev => {
            const arr = [...prev];
            const dragIndex = arr.findIndex(i => i.id === dragId);
            const dropIndex = arr.findIndex(i => i.id === targetId);
            const [dragged] = arr.splice(dragIndex, 1);
            arr.splice(dropIndex, 0, dragged);
            // Update positions
            const updates = arr.map((item, idx) => ({ id: item.id, position: idx }));
            fetch('/items', {
                method: 'PUT',
                body: JSON.stringify(updates),
                headers: { 'Content-Type': 'application/json' },
            });
            return arr.map((item, idx) => ({ ...item, position: idx }));
        });
        setDragId(null);
    };

    if (items === null) {
        return (
            <div className="app-container">
                <div className="loading">
                    <div className="loading-spinner"></div>
                    Loading your tasks...
                </div>
            </div>
        );
    }

    // Compute stats
    const total = items.length;
    const completed = items.filter(i => i.completed).length;
    const pending = total - completed;
    const overdue = items.filter(i => !i.completed && isOverdue(i.due_date)).length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Filter items
    let filtered = items;
    if (filter === 'active') filtered = filtered.filter(i => !i.completed);
    if (filter === 'completed') filtered = filtered.filter(i => i.completed);
    if (priorityFilter !== 'all') filtered = filtered.filter(i => i.priority === priorityFilter);
    if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(i =>
            i.name.toLowerCase().includes(q) ||
            (i.category && i.category.toLowerCase().includes(q)) ||
            (i.notes && i.notes.toLowerCase().includes(q))
        );
    }

    return (
        <div className="app-container">
            <header className="app-header">
                <h1 className="app-title">TaskFlow</h1>
                <p className="app-subtitle">Organize your life, one task at a time</p>
            </header>

            {/* Stats */}
            <div className="stats-bar">
                <div className="stat-card">
                    <div className="stat-value total">{total}</div>
                    <div className="stat-label">Total</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value done">{completed}</div>
                    <div className="stat-label">Done</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value pending">{pending}</div>
                    <div className="stat-label">Pending</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value overdue">{overdue}</div>
                    <div className="stat-label">Overdue</div>
                </div>
            </div>

            {/* Progress */}
            {total > 0 && (
                <div className="progress-container">
                    <div className="progress-header">
                        <span className="progress-label">Progress</span>
                        <span className="progress-percent">{progress}%</span>
                    </div>
                    <div className="progress-track">
                        <div className="progress-fill" style={{ width: progress + '%' }}></div>
                    </div>
                </div>
            )}

            {/* Add Form */}
            <AddItemForm onNewItem={onNewItem} />

            {/* Search & Filter */}
            <div className="toolbar">
                <input
                    className="search-box"
                    type="text"
                    placeholder="Search tasks..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                <div className="filter-tabs">
                    {['all', 'active', 'completed'].map(f => (
                        <button
                            key={f}
                            className={`filter-tab ${filter === f ? 'active' : ''}`}
                            onClick={() => setFilter(f)}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
                <select
                    className="priority-filter"
                    value={priorityFilter}
                    onChange={e => setPriorityFilter(e.target.value)}
                >
                    <option value="all">All Priorities</option>
                    <option value="high">🔴 High</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="low">🟢 Low</option>
                </select>
            </div>

            {/* Task List */}
            <div className="task-list">
                {filtered.length === 0 && (
                    <div className="empty-state">
                        <div className="empty-icon">✨</div>
                        <div className="empty-title">
                            {total === 0 ? 'No tasks yet!' : 'No matching tasks'}
                        </div>
                        <div className="empty-subtitle">
                            {total === 0
                                ? 'Add your first task above to get started'
                                : 'Try adjusting your filters or search'}
                        </div>
                    </div>
                )}
                {filtered.map(item => (
                    <TaskItem
                        key={item.id}
                        item={item}
                        onItemUpdate={onItemUpdate}
                        onItemRemoval={onItemRemoval}
                        onDragStart={handleDragStart}
                        onDrop={handleDrop}
                    />
                ))}
            </div>

            {/* Footer */}
            {total > 0 && (
                <div className="list-footer">
                    <span className="items-count">
                        {pending} item{pending !== 1 ? 's' : ''} remaining
                    </span>
                    {completed > 0 && (
                        <button className="btn-clear" onClick={clearCompleted}>
                            Clear completed ({completed})
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

// ===== Add Item Form =====
function AddItemForm({ onNewItem }) {
    const [name, setName] = React.useState('');
    const [priority, setPriority] = React.useState('medium');
    const [category, setCategory] = React.useState('');
    const [dueDate, setDueDate] = React.useState('');
    const [submitting, setSubmitting] = React.useState(false);
    const [expanded, setExpanded] = React.useState(false);
    const inputRef = React.useRef(null);

    const submit = (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        setSubmitting(true);
        fetch('/items', {
            method: 'POST',
            body: JSON.stringify({
                name: name.trim(),
                priority,
                category: category.trim(),
                due_date: dueDate,
            }),
            headers: { 'Content-Type': 'application/json' },
        })
            .then(r => r.json())
            .then(item => {
                onNewItem(item);
                setName('');
                setCategory('');
                setDueDate('');
                setPriority('medium');
                setSubmitting(false);
                setExpanded(false);
                inputRef.current && inputRef.current.focus();
            });
    };

    return (
        <form className="add-form" onSubmit={submit}>
            <div className="add-form-row">
                <input
                    ref={inputRef}
                    className="input-main"
                    type="text"
                    placeholder="What needs to be done?"
                    value={name}
                    onChange={e => {
                        setName(e.target.value);
                        if (e.target.value && !expanded) setExpanded(true);
                    }}
                    onKeyDown={e => {
                        if (e.key === 'Escape') {
                            setName('');
                            setExpanded(false);
                        }
                    }}
                />
                <button
                    className="btn-add"
                    type="submit"
                    disabled={!name.trim() || submitting}
                >
                    {submitting ? '...' : '+ Add'}
                </button>
            </div>
            {expanded && (
                <div className="add-form-row">
                    <select
                        className="select-field"
                        value={priority}
                        onChange={e => setPriority(e.target.value)}
                    >
                        <option value="high">🔴 High</option>
                        <option value="medium">🟡 Medium</option>
                        <option value="low">🟢 Low</option>
                    </select>
                    <input
                        className="category-field"
                        type="text"
                        placeholder="Category"
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                    />
                    <input
                        className="date-field"
                        type="date"
                        value={dueDate}
                        onChange={e => setDueDate(e.target.value)}
                        title="Due date"
                    />
                </div>
            )}
        </form>
    );
}

// ===== Task Item =====
function TaskItem({ item, onItemUpdate, onItemRemoval, onDragStart, onDrop }) {
    const [editing, setEditing] = React.useState(false);
    const [editValue, setEditValue] = React.useState(item.name);
    const [showNotes, setShowNotes] = React.useState(false);
    const [notes, setNotes] = React.useState(item.notes || '');
    const [dragOver, setDragOver] = React.useState(false);
    const editRef = React.useRef(null);

    React.useEffect(() => {
        if (editing && editRef.current) {
            editRef.current.focus();
            editRef.current.select();
        }
    }, [editing]);

    const toggleCompletion = () => {
        fetch(`/items/${item.id}`, {
            method: 'PUT',
            body: JSON.stringify({ ...item, completed: !item.completed }),
            headers: { 'Content-Type': 'application/json' },
        })
            .then(r => r.json())
            .then(onItemUpdate);
    };

    const removeItem = () => {
        fetch(`/items/${item.id}`, { method: 'DELETE' })
            .then(() => onItemRemoval(item));
    };

    const saveEdit = () => {
        if (!editValue.trim()) return;
        setEditing(false);
        if (editValue.trim() === item.name) return;
        fetch(`/items/${item.id}`, {
            method: 'PUT',
            body: JSON.stringify({ ...item, name: editValue.trim() }),
            headers: { 'Content-Type': 'application/json' },
        })
            .then(r => r.json())
            .then(onItemUpdate);
    };

    const saveNotes = () => {
        if (notes === (item.notes || '')) return;
        fetch(`/items/${item.id}`, {
            method: 'PUT',
            body: JSON.stringify({ ...item, notes }),
            headers: { 'Content-Type': 'application/json' },
        })
            .then(r => r.json())
            .then(onItemUpdate);
    };

    const dueBadgeClass = () => {
        if (!item.due_date) return '';
        if (item.completed) return 'badge badge-due';
        if (isOverdue(item.due_date)) return 'badge badge-due overdue';
        if (isDueToday(item.due_date)) return 'badge badge-due due-today';
        return 'badge badge-due';
    };

    const priorityClass = `priority-${item.priority || 'medium'}`;

    return (
        <div
            className={`task-item ${priorityClass} ${item.completed ? 'completed' : ''} ${dragOver ? 'drag-over' : ''}`}
            draggable
            onDragStart={() => onDragStart(item.id)}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); onDrop(item.id); }}
        >
            {/* Drag Handle */}
            <div className="drag-handle" title="Drag to reorder">
                <IconGrip />
            </div>

            {/* Checkbox */}
            <div className="checkbox-wrapper" onClick={toggleCompletion}>
                <div className={`custom-checkbox ${item.completed ? 'checked' : ''}`}>
                    <IconCheck />
                </div>
            </div>

            {/* Content */}
            <div className="task-content">
                <div className="task-top-row">
                    {editing ? (
                        <input
                            ref={editRef}
                            className="task-edit-input"
                            type="text"
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onBlur={saveEdit}
                            onKeyDown={e => {
                                if (e.key === 'Enter') saveEdit();
                                if (e.key === 'Escape') {
                                    setEditValue(item.name);
                                    setEditing(false);
                                }
                            }}
                        />
                    ) : (
                        <span
                            className="task-name"
                            onDoubleClick={() => {
                                setEditValue(item.name);
                                setEditing(true);
                            }}
                            title="Double-click to edit"
                        >
                            {item.name}
                        </span>
                    )}
                </div>

                {/* Meta badges */}
                <div className="task-meta">
                    <span className={`badge badge-priority-${item.priority || 'medium'}`}>
                        {item.priority === 'high' ? '🔴' : item.priority === 'low' ? '🟢' : '🟡'}{' '}
                        {(item.priority || 'medium').charAt(0).toUpperCase() + (item.priority || 'medium').slice(1)}
                    </span>
                    {item.category && (
                        <span className="badge badge-category">
                            {item.category}
                        </span>
                    )}
                    {item.due_date && (
                        <span className={dueBadgeClass()}>
                            <IconCalendar />
                            {isOverdue(item.due_date) && !item.completed ? 'Overdue: ' : ''}
                            {isDueToday(item.due_date) ? 'Today' : formatDate(item.due_date)}
                        </span>
                    )}
                </div>

                {/* Notes toggle */}
                {(item.notes || showNotes) && !editing && (
                    <div>
                        {!showNotes && item.notes && (
                            <div
                                className="task-notes-preview"
                                onClick={() => setShowNotes(true)}
                            >
                                📝 {item.notes.length > 60 ? item.notes.substring(0, 60) + '...' : item.notes}
                            </div>
                        )}
                        {showNotes && (
                            <div className="task-notes-full">
                                <textarea
                                    className="notes-textarea"
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    onBlur={saveNotes}
                                    placeholder="Add notes..."
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="task-actions">
                <button
                    className="btn-icon"
                    onClick={() => setShowNotes(!showNotes)}
                    title="Toggle notes"
                >
                    <IconNotes />
                </button>
                <button
                    className="btn-icon"
                    onClick={() => {
                        setEditValue(item.name);
                        setEditing(true);
                    }}
                    title="Edit task"
                >
                    <IconEdit />
                </button>
                <button
                    className="btn-icon danger"
                    onClick={removeItem}
                    title="Delete task"
                >
                    <IconTrash />
                </button>
            </div>
        </div>
    );
}

// ===== Mount =====
ReactDOM.render(<App />, document.getElementById('root'));
