import React, { useState, useEffect } from 'react';
import './App.css';
import {
  Routes,
  Route,
  Link
} from 'react-router-dom';

import { supabase } from './utils/supabaseclient'
import Auth from './Auth';
import ConfirmationPage from './ConfirmationPage';
export default function App() {
  const [session, setSession] = useState(null);
  const [tasks, setTasks] = useState([]);
const [showNotes, setShowNotes] = useState(false);
const [notesText, setNotesText] = useState('');

const [showFood, setShowFood] = useState(false);
const [foodMedsText, setFoodMedsText] = useState('');
const [showTaskPopup, setShowTaskPopup] = useState(false);
const [newTaskText, setNewTaskText] = useState('');
const [activeCategory, setActiveCategory] = useState(null);

  

  // State for editable headers - initialized with defaults
  const [titles, setTitles] = useState({
    Goal_A: "Primary Goal",
    Goal_B: "Secondary Goal",
    Misc: "Miscellaneous"
  });

useEffect(() => {
  const handler = (event) => {
    console.error("🔥 GLOBAL ERROR:", event.error);
  };

  window.addEventListener("error", handler);

  return () => window.removeEventListener("error", handler);
}, []);
useEffect(() => {
  let mounted = true;

  supabase.auth.getSession().then(({ data: { session } }) => {
    if (mounted) setSession(session);
  });

  const {
    data: { subscription }
  } = supabase.auth.onAuthStateChange((_event, session) => {
    if (mounted) setSession(session);
  });

  return () => {
    mounted = false;
    subscription.unsubscribe();
  };
}, []);

// New effect to load data ONLY when session exists
useEffect(() => {
  if (session) {
    loadTasks();
    loadSettings();
  }
}, [session]);
  
const deleteTask = async (id) => {
  if (!window.confirm("Delete forever?")) return;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (!error) {
    setTasks(prev => prev.filter(t => t.id !== id));
  }
};
const loadSettings = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('user_id', user.id);

  if (!error && data) {
    const newTitles = { ...titles };

    data.forEach(item => {
      if (item.key.startsWith('title_')) {
        const category = item.key.replace('title_', '');
        newTitles[category] = item.value;
      }

      if (item.key === 'note_notes') setNotesText(item.value);
if (item.key === 'note_food_meds') setFoodMedsText(item.value);
    });

    setTitles(newTitles);
  }
};
const loadTasks = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (!error) setTasks(data);
};
  const addTask = (category) => {
  setActiveCategory(category);
  setShowTaskPopup(true);
};
const saveTask = async () => {
  if (!newTaskText.trim()) return;

  // Get the currently logged in user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    alert("No logged in user found");
    return;
  }

  // Insert task WITH user_id
  const { data, error } = await supabase
    .from('tasks')
    .insert([
      {
        user_id: user.id, // THIS is the critical fix
        content: newTaskText,
        category: activeCategory,
        done: false,
        archived: false,
        created_at: new Date().toISOString(),
        finished_at: null
      }
    ])
    .select();

  console.log("INSERT RESULT:", data);
  console.log("INSERT ERROR:", error);

  if (error) {
    alert(error.message);
    return;
  }

  setTasks([data[0], ...tasks]);
  setNewTaskText('');
  setShowTaskPopup(false);
};
const toggleTask = async (id) => {
  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  // Find task
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  const updatedDone = !task.done;

  // Optimistic UI update
  setTasks(prev =>
    prev.map(t =>
      t.id === id ? { ...t, done: updatedDone } : t
    )
  );

  // Database update
  const { data, error } = await supabase
    .from('tasks')
    .update({
      done: updatedDone,
      finished_at: updatedDone
        ? new Date().toISOString()
        : null
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select();

  // Revert if failed
  if (error || !data || data.length === 0) {
    console.error("Supabase failed to sync. Reverting...");

    setTasks(prev =>
      prev.map(t =>
        t.id === id ? { ...t, done: !updatedDone } : t
      )
    );

    alert("Database update failed.");
  }
};

const updateTaskContent = async (id, newContent) => {
  // Update UI instantly
  setTasks(prev =>
    prev.map(task =>
      task.id === id
        ? { ...task, content: newContent }
        : task
    )
  );

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  // Save to database
  const { error } = await supabase
    .from('tasks')
    .update({ content: newContent })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error(error);
    alert("Failed to update task");
  }
};
const archiveTask = async (id) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { error } = await supabase
    .from('tasks')
    .update({ archived: true })
    .eq('id', id)
    .eq('user_id', user.id);

  if (!error) {
    setTasks(prev =>
      prev.map(task =>
        task.id === id
          ? { ...task, archived: true }
          : task
      )
    );
  } else {
    alert("Error archiving: " + error.message);
  }
};

  // Function to change the Column Title
const editHeader = async (category) => {
  const newTitle = prompt(
    "Enter new title for this column:",
    titles[category]
  );

  if (!newTitle || newTitle === titles[category]) return;

  // Update UI instantly
  setTitles(prev => ({
    ...prev,
    [category]: newTitle
  }));

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  // Save to Supabase
  const { error } = await supabase
    .from('settings')
    .upsert(
      {
        user_id: user.id,
        key: `title_${category}`,
        value: newTitle
      },
      {
        onConflict: 'user_id,key'
      }
    );

  if (error) {
    console.error("Error saving title:", error.message);
    alert("Failed to save title to database.");
  }
};
// Add this function below your archiveTask function
const restoreTask = async (id) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { error } = await supabase
    .from('tasks')
    .update({ archived: false })
    .eq('id', id)
    .eq('user_id', user.id);

  if (!error) {
    setTasks(prev =>
      prev.map(t =>
        t.id === id
          ? { ...t, archived: false }
          : t
      )
    );
  }
};

const saveNote = async (type, content) => {
  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  // Save note
  const { error } = await supabase
    .from('settings')
    .upsert(
      {
        user_id: user.id,
        key: `note_${type}`,
        value: content
      },
      {
        onConflict: 'user_id,key'
      }
    );

  if (error) {
    alert("Failed to save note: " + error.message);
  } else {
    console.log(`${type} note saved!`);

    // ✅ CLOSE THE RIGHT POPUP
  if (type === 'food') setShowFood(false);
  if (type === 'notes') setShowNotes(false);
  if (type === 'food_meds') setShowFood(false);
  }
};
  const renderColumn = (category, colorClass) => (
    
    <div className="column">
      <div 
        className={`column-header ${colorClass}`} 
        onClick={() => editHeader(category)}
        style={{ cursor: 'pointer' }}
        title="Click to edit title"
      >
        {titles[category]}
      </div>
      <ul>
        {tasks
          .filter(t => t.category === category && !t.archived)
          .map(task => (
     <li key={task.id} className={`${colorClass}-item`}>
 <div className="task-top">
  <input
    type="checkbox"
    checked={task.done}
    onChange={() => toggleTask(task.id)}
  />

  {/* Swap between input and span for better styling support */}
  {task.done ? (
  <span className="edit-input done">{task.content}</span>
) : (
  <input
  className="edit-input"
  value={task.content}
  onChange={(e) =>
    updateTaskContent(task.id, e.target.value)
  }
/>
)}
</div>

  <div className="task-dates">
    <small className="created">
  {task.created_at
    ? new Date(task.created_at).toLocaleDateString()
    : "—"}
</small>

   {/* Ensure this triggers when the task is done and has a date */}
  {task.done && task.finished_at && (
    <small className="finished">
      Finished: {new Date(task.finished_at).toLocaleDateString()}
    </small>
)}
  </div>

  {task.done && (
    
  <button
    className="archive-button"
    onClick={() => archiveTask(task.id)}
  >
    Archive
  </button>
)}
</li>
     
          ))
        }
      </ul>
      <button onClick={() => addTask(category)}>+ New Task</button>
    </div>
    
  );




return (
  <Routes>
    <Route
  path="/"
  element={
    !session ? (
      <Auth />
    ) : (
   
      <div className="container">
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1>Focus OS</h1>
            <button 
              onClick={() => supabase.auth.signOut()} 
              style={{ width: 'auto', background: '#dfe6e9', color: '#2d3436', fontSize: '0.8rem', padding: '5px 12px' }}
            >
              Sign Out
            </button>
          </header>

          <div className="board">
            {renderColumn("Goal_A", "cat-a")}
            {renderColumn("Goal_B", "cat-b")}
            {renderColumn("Misc", "cat-misc")}
          </div>

          {showTaskPopup && (
            <div className="task-popup">
              <div className="task-header">
                <span>New Task</span>
                <button className="close-btn" onClick={() => setShowTaskPopup(false)}>✕</button>
              </div>
              <textarea
                placeholder="Enter task..."
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
              />
              <button className="save-btn" onClick={saveTask}>Add Task</button>
            </div>
          )}

          <div className="floating-buttons">
  <button
    className="meds-button"
    onClick={() => setShowNotes(true)}
  >
    Notes
  </button>

  <button
    className="food-button"
    onClick={() => setShowFood(true)}
  >
    Food & Meds
  </button>

  <Link to="/archive">
    <button className="archive-button">Archive</button>
  </Link>
</div>
          {showNotes && (
  <div className="meds-popup">
    <div className="meds-header">
      <span>Notes</span>
      <button className="close-btn" onClick={() => setShowNotes(false)}>✕</button>
    </div>

    <textarea
      placeholder="Write your notes here..."
      value={notesText}
      onChange={(e) => setNotesText(e.target.value)}
    />

    <button
      className="save-btn"
      style={{ backgroundColor: '#00b894', marginTop: '10px' }}
      onClick={() => saveNote('notes', notesText)}
    >
      Save Notes
    </button>
  </div>
)}

         {showFood && (
  <div className="food-popup">
    <div className="food-header">
      <span>Food & Meds</span>
      <button className="close-btn" onClick={() => setShowFood(false)}>✕</button>
    </div>

    <textarea
      placeholder="Write food & meds notes here..."
      value={foodMedsText}
      onChange={(e) => setFoodMedsText(e.target.value)}
    />

    <button
      className="save-btn"
      style={{ backgroundColor: '#e74c3c', marginTop: '10px' }}
      onClick={() => saveNote('food_meds', foodMedsText)}
    >
      Save Food & Meds
    </button>
  </div>
)}
               </div>
      )
    }
    />

    <Route
  path="/archive"
  element={
    session ? (
      <ArchivePage
        tasks={tasks}
        restoreTask={restoreTask}
        deleteTask={deleteTask}
      />
    ) : (
      <Auth />
    )
  }
/>

    <Route
    path="/confirmationpage"
    element={<ConfirmationPage />}
  />
  </Routes>
);
}

const ArchivePage = ({ tasks, restoreTask, deleteTask }) => {
  const archivedTasks = tasks.filter(t => t.archived);

  return (
    <div className="container">
      <header><h1>Archived Tasks</h1></header>
      <div className="archive-list">
        {archivedTasks.length === 0 ? (
          <p style={{ textAlign: 'center' }}>No archived tasks.</p>
        ) : (
          archivedTasks.map(task => (
            <div key={task.id} className={`archived-item cat-${task.category.toLowerCase()}-item`}>
              <div style={{ fontWeight: 'bold', textDecoration: 'line-through', color: '#7f8c8d' }}>
                {task.content}
              </div>
              <div className="task-dates">
                <small className="created">Created: {new Date(task.created_at).toLocaleDateString()}</small>
                {task.finished_at && (
                  <small className="finished">Finished: {new Date(task.finished_at).toLocaleDateString()}</small>
                )}
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button onClick={() => restoreTask(task.id)}>Restore</button>
                <button onClick={() => deleteTask(task.id)} style={{ background: '#e74c3c' }}>Delete</button>
              </div>
            </div>
          ))
        )}
      </div>
      <Link to="/">Back to Board</Link>
    </div>
  );
};