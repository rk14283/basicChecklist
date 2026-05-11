import React, { useState, useEffect } from 'react';
import './App.css';

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [showMeds, setShowMeds] = useState(false);
const [medsNote, setMedsNote] = useState('');

const [showFood, setShowFood] = useState(false);
const [foodNote, setFoodNote] = useState('');
const [showTaskPopup, setShowTaskPopup] = useState(false);
const [newTaskText, setNewTaskText] = useState('');
const [activeCategory, setActiveCategory] = useState(null);
  
  // State for editable headers - initialized with defaults
  const [titles, setTitles] = useState({
    Goal_A: "Primary Goal",
    Goal_B: "Secondary Goal",
    Misc: "Miscellaneous"
  });

  const addTask = (category) => {
  setActiveCategory(category);
  setShowTaskPopup(true);
};
const saveTask = () => {
  if (!newTaskText.trim()) return;

  const task = {
    id: Date.now(),
    content: newTaskText,
    category: activeCategory,
    done: false,
    createdAt: new Date(),
    finishedAt: null,
    archived: false
  };

  setTasks([task, ...tasks]);
  setNewTaskText('');
  setShowTaskPopup(false);
};

const toggleTask = (id) => {
  setTasks(
    tasks.map(t => {
      if (t.id !== id) return t;

      const nowDone = !t.done;

      return {
        ...t,
        done: nowDone,
        finishedAt: nowDone ? new Date() : null
      };
    })
  );
};
const archiveTask = (id) => {
  setTasks(
    tasks.map(t =>
      t.id === id ? { ...t, archived: true } : t
    )
  );
};

  // Function to change the Column Title
  const editHeader = async (category) => {
    const newTitle = prompt("Enter new title for this column:", titles[category]);
    if (!newTitle || newTitle === titles[category]) return;

    // Update UI immediately
    setTitles({ ...titles, [category]: newTitle });

    // Save to Database
    await fetch('http://localhost:3001/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: `title_${category}`, value: newTitle })
    });
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
          .filter(t => t.category === category)
          .map(task => (
           <li key={task.id} className={`${colorClass}-item`}>
  <input
    type="checkbox"
    checked={task.done}
    onChange={() => toggleTask(task.id)}
  />

  <span className={task.done ? "done" : ""}>
    {task.content}
  </span>
</li>
          ))
        }
      </ul>
      <button onClick={() => addTask(category)}>+ New Task</button>
    </div>
  );


return (
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

    <button className="save-btn" onClick={saveTask}>
      Add Task
    </button>
  </div>
)}
    {/* Floating Buttons */}
    <div className="floating-buttons">

      {/* Food Button */}
      <button
        className="food-button"
        onClick={() => setShowFood(true)}
      >
        Food
      </button>

      {/* Meds Button */}
      <button
        className="meds-button"
        onClick={() => setShowMeds(true)}
      >
        Meds
      </button>

    </div>

    {/* Food Popup */}
    {showFood && (
      <div className="food-popup">
        <div className="food-header">
          <span>Food Notes</span>

          <button
            className="close-btn"
            onClick={() => setShowFood(false)}
          >
            ✕
          </button>
        </div>

        <textarea
          placeholder="Write your food notes here..."
          value={foodNote}
          onChange={(e) => setFoodNote(e.target.value)}
        />
      </div>
    )}

    {/* Meds Popup */}
    {showMeds && (
      <div className="meds-popup">
        <div className="meds-header">
          <span>Meds Notes</span>

          <button
            className="close-btn"
            onClick={() => setShowMeds(false)}
          >
            ✕
          </button>
        </div>

        <textarea
          placeholder="Write your meds notes here..."
          value={medsNote}
          onChange={(e) => setMedsNote(e.target.value)}
        />
      </div>
    )}

  </div>
);
}