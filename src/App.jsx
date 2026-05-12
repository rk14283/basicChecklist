import React, { useState, useEffect } from 'react';
import './App.css';
import {
  Routes,
  Route,
  Link
} from 'react-router-dom';
export default function App() {
  const [tasks, setTasks] = useState([]);
  const [showMeds, setShowMeds] = useState(false);
const [medsNote, setMedsNote] = useState('');

const [showFood, setShowFood] = useState(false);
const [foodNote, setFoodNote] = useState('');
const [showTaskPopup, setShowTaskPopup] = useState(false);
const [newTaskText, setNewTaskText] = useState('');
const [activeCategory, setActiveCategory] = useState(null);
const [archive, setArchive] = useState([]);
const [showArchive, setShowArchive] = useState(false);
  
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
  createdAt: new Date().toISOString(),
  finishedAt: null,
  archived: false,
  editing: false
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
  const taskToArchive = tasks.find(t => t.id === id);

  if (!taskToArchive) return;

  setArchive([
    {
      ...taskToArchive,
      archivedAt: new Date().toISOString()
    },
    ...archive
  ]);

  setTasks(tasks.filter(t => t.id !== id));
};

const ArchivePage = () => (
  <div className="container">
    <header>
      <h1>Archive</h1>
    </header>

    <div className="column">

      {archive.length === 0 ? (
        <small>No archived tasks yet.</small>
      ) : (
        archive.map(task => (
          <div
            key={task.id}
            className={`archived-item ${
              task.category === "Goal_A"
                ? "cat-a"
                : task.category === "Goal_B"
                ? "cat-b"
                : "cat-misc"
            }`}
          >
            <div className="done">
              {task.content}
            </div>

            <div className="task-dates">
              <small className="created">
                Created:{" "}
                {new Date(task.createdAt).toLocaleDateString()}
              </small>

              {task.finishedAt && (
                <small className="finished">
                  Finished:{" "}
                  {new Date(task.finishedAt).toLocaleDateString()}
                </small>
              )}
            </div>

            <button
              className="delete-button"
              onClick={() =>
                setArchive(
                  archive.filter(t => t.id !== task.id)
                )
              }
            >
              Delete Forever
            </button>
          </div>
        ))
      )}

      <Link to="/">
        <button>
          Back
        </button>
      </Link>

    </div>
  </div>
);
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
  <div className="task-top">

    <input
      type="checkbox"
      checked={task.done}
      onChange={() => toggleTask(task.id)}
    />

    <input
      className={`edit-input ${task.done ? "done" : ""}`}
      value={task.content}
      onChange={(e) =>
        setTasks(
          tasks.map(t =>
            t.id === task.id
              ? { ...t, content: e.target.value }
              : t
          )
        )
      }
    />
  </div>

  <div className="task-dates">
    <small className="created">
      Created:{" "}
      {new Date(task.createdAt).toLocaleDateString()}
    </small>

    {task.finishedAt && (
      <small className="finished">
        Finished:{" "}
        {new Date(task.finishedAt).toLocaleDateString()}
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
                onChange={(e) =>
                  setFoodNote(e.target.value)
                }
              />
            </div>
          )}

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
                onChange={(e) =>
                  setMedsNote(e.target.value)
                }
              />
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