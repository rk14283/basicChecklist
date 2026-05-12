import React, { useState, useEffect } from 'react';
import './App.css';
import {
  Routes,
  Route,
  Link
} from 'react-router-dom';

import { supabase } from './utils/supabaseclient'

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [showMeds, setShowMeds] = useState(false);
const [medsNote, setMedsNote] = useState('');

const [showFood, setShowFood] = useState(false);
const [foodNote, setFoodNote] = useState('');
const [showTaskPopup, setShowTaskPopup] = useState(false);
const [newTaskText, setNewTaskText] = useState('');
const [activeCategory, setActiveCategory] = useState(null);
const [showArchive, setShowArchive] = useState(false);
  

  // State for editable headers - initialized with defaults
  const [titles, setTitles] = useState({
    Goal_A: "Primary Goal",
    Goal_B: "Secondary Goal",
    Misc: "Miscellaneous"
  });

useEffect(() => {

  // 1. Keep your error listener
  const handler = (event) => {
    console.error("🔥 GLOBAL ERROR:", event.error)
  }
  window.addEventListener("error", handler)

  // 2. CALL THE FUNCTION HERE
  loadTasks();
  loadSettings(); // Add this call

  return () => window.removeEventListener("error", handler)
}, []) // Empty array means this runs once on mount

const loadSettings = async () => {
  const { data, error } = await supabase
    .from('settings')
    .select('*');

  if (!error && data) {
    const newTitles = { ...titles };
    data.forEach(item => {
      // Load Column Titles
      if (item.key.startsWith('title_')) {
        const category = item.key.replace('title_', '');
        newTitles[category] = item.value;
      }
      // Load Food Note
      if (item.key === 'note_food') setFoodNote(item.value);
      // Load Meds Note
      if (item.key === 'note_meds') setMedsNote(item.value);
    });
    setTitles(newTitles);
  }
};

const loadTasks = async () => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false })

  if (!error) setTasks(data)
}
  const addTask = (category) => {
  setActiveCategory(category);
  setShowTaskPopup(true);
};
const saveTask = async () => {
  if (!newTaskText.trim()) return;

  const { data, error } = await supabase
    .from('tasks')
    .insert([
      {
        content: newTaskText,
        category: activeCategory,
        done: false,
        archived: false,
        created_at: new Date().toISOString(),
        finished_at: null
      }
    ])
    .select()

  console.log("INSERT RESULT:", data)
  console.log("INSERT ERROR:", error)

  if (error) {
    alert(error.message)
    return
  }

  setTasks([data[0], ...tasks])
  setNewTaskText('')
  setShowTaskPopup(false)
}
const toggleTask = async (id) => {
  // 1. Find the task
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  const updatedDone = !task.done;

  // 2. UPDATE UI IMMEDIATELY (Optimistic)
  setTasks(prev => prev.map(t => 
    t.id === id ? { ...t, done: updatedDone } : t
  ));

  // 3. TELL SUPABASE
  const { data, error } = await supabase
    .from('tasks')
    .update({
      done: updatedDone,
      finished_at: updatedDone ? new Date().toISOString() : null
    })
    .eq('id', id)
    .select();

  // 4. IF SUPABASE FAILS, REVERT UI
  if (error || !data || data.length === 0) {
    console.error("Supabase failed to sync. Reverting...");
    setTasks(prev => prev.map(t => 
      t.id === id ? { ...t, done: !updatedDone } : t
    ));
    alert("Database update failed. Check your Supabase RLS Policies!");
  }
};
const archiveTask = async (id) => {
  const { error } = await supabase
    .from('tasks')
    .update({
      archived: true
    })
    .eq('id', id)

  if (!error) {
    setTasks(tasks.filter(t => t.id !== id))
  }
}
const ArchivePage = () => {
  const archivedTasks = tasks.filter(t => t.archived);

  return (
    <div className="container">
      <header>
        <h1>Archived Tasks</h1>
      </header>

      <div className="archive-list">
        {archivedTasks.length === 0 ? (
          <p style={{ textAlign: 'center' }}>No archived tasks.</p>
        ) : (
          archivedTasks.map(task => (
            <div key={task.id} className={`archived-item cat-${task.category.toLowerCase()}-item`} style={{ background: 'white', padding: '15px', borderRadius: '12px', marginBottom: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
              <div style={{ fontWeight: 'bold', textDecoration: 'line-through', color: '#7f8c8d' }}>
                {task.content}
              </div>

              {/* Date Section - Reusing your existing CSS classes */}
              <div className="task-dates">
                <small className="created">
                  Created: {task.created_at ? new Date(task.created_at).toLocaleDateString() : "—"}
                </small>
                {task.finished_at && (
                  <small className="finished">
                    Finished: {new Date(task.finished_at).toLocaleDateString()}
                  </small>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button 
                  onClick={() => restoreTask(task.id)}
                  style={{ background: '#00b894', fontSize: '0.8rem' }}
                >
                  Restore
                </button>
                
                <button
                  onClick={async () => {
                    if(window.confirm("Delete forever?")) {
                      await supabase.from('tasks').delete().eq('id', task.id);
                      setTasks(tasks.filter(t => t.id !== task.id));
                    }
                  }}
                  style={{ background: '#e74c3c', fontSize: '0.8rem' }}
                >
                  Delete Forever
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <Link to="/" style={{ display: 'block', textAlign: 'center', marginTop: '20px', fontWeight: 'bold', color: '#1e272e' }}>
        ← Back to Board
      </Link>
    </div>
  );
};
  // Function to change the Column Title
const editHeader = async (category) => {
  const newTitle = prompt(
    "Enter new title for this column:",
    titles[category]
  );

  if (!newTitle || newTitle === titles[category]) return;

  // 1. Update UI instantly
  setTitles(prev => ({
    ...prev,
    [category]: newTitle
  }));

  // 2. Save to Supabase
  const { error } = await supabase
    .from('settings')
    .upsert({
      key: `title_${category}`,
      value: newTitle
    }, { onConflict: 'key' }); // Ensures it updates if key exists

  if (error) {
    console.error("Error saving title:", error.message);
    alert("Failed to save title to database.");
  }
};
// Add this function below your archiveTask function
const restoreTask = async (id) => {
  const { error } = await supabase
    .from('tasks')
    .update({ archived: false })
    .eq('id', id);

  if (!error) {
    // Update local state to show it back in the main columns
    setTasks(prev => prev.map(t => t.id === id ? { ...t, archived: false } : t));
  }
};

const saveNote = async (type, content) => {
  const { error } = await supabase
    .from('settings')
    .upsert({
      key: `note_${type}`,
      value: content
    }, { onConflict: 'key' });

  if (error) {
    alert("Failed to save note: " + error.message);
  } else {
    // Optional: visual feedback
    console.log(`${type} note saved!`);
    if (type === 'food') setShowFood(false);
    if (type === 'meds') setShowMeds(false);
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
    onChange={(e) => { /* handle change */ }}
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
        <div className="container">

          <header>
            <h1>Focus OS</h1>
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

                <button
                  className="close-btn"
                  onClick={() => setShowTaskPopup(false)}
                >
                  ✕
                </button>
              </div>

              <textarea
                placeholder="Enter task..."
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
              />

              <button
                className="save-btn"
                onClick={saveTask}
              >
                Add Task
              </button>

            </div>
          )}

          <div className="floating-buttons">

            <button
              className="food-button"
              onClick={() => setShowFood(true)}
            >
              Food
            </button>

            <button
              className="meds-button"
              onClick={() => setShowMeds(true)}
            >
              Meds
            </button>

            <Link to="/archive">
              <button className="archive-button">
                Archive
              </button>
            </Link>

          </div>
          {/* Food Popup */}
          {showFood && (
            <div className="food-popup">
              <div className="food-header">
                <span>Food Notes</span>
                <button className="close-btn" onClick={() => setShowFood(false)}>✕</button>
                </div>
                 <textarea
                 placeholder="Write your food notes here..."
                 value={foodNote}
                 onChange={(e) => setFoodNote(e.target.value)}
                 />
                 <button 
                 className="save-btn" 
                 style={{ backgroundColor: '#e74c3c' }} 
                 onClick={() => saveNote('food', foodNote)}
                 >
                  Save Food Note
                  </button>
                   </div>
                  )}

          {/* Meds Popup */}
{showMeds && (
  <div className="meds-popup">
    <div className="meds-header">
      <span>Meds Notes</span>
      <button className="close-btn" onClick={() => setShowMeds(false)}>✕</button>
    </div>
    <textarea
      placeholder="Write your meds notes here..."
      value={medsNote}
      onChange={(e) => setMedsNote(e.target.value)}
    />
    <button 
      className="save-btn" 
      style={{ backgroundColor: '#00b894' }} 
      onClick={() => saveNote('meds', medsNote)}
    >
      Save Meds Note
    </button>
  </div>
)}

        </div>
      }
    />

    <Route
      path="/archive"
      element={<ArchivePage />}
    />

  </Routes>
);
}