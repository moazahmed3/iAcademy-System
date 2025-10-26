let cycles = [];
let currentCycleId = null;
let currentView = "dashboard";
let currentReviewStudent = null;
let currentReviewWeek = null;
let currentEditCycleId = null;
const SESSIONS_PER_WEEK = 3;
const TASKS_PER_WEEK = 2;

function init() {
  loadDataFromLocalStorage();
  renderView();
}

function showToast(message, type = "success") {
  const colors = {
    success: "bg-green-500",
    error: "bg-red-500",
    warning: "bg-amber-500",
    info: "bg-blue-500",
  };
  const toast = document.createElement("div");
  toast.className = `toast ${colors[type]} text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3`;
  toast.innerHTML = `<span class="text-2xl">${
    type === "success" ? "✓" : type === "error" ? "✗" : "ℹ"
  }</span><span class="font-semibold">${message}</span>`;
  document.getElementById("toastContainer").appendChild(toast);
  setTimeout(() => {
    toast.style.animation = "slideIn 0.3s ease-out reverse";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function renderView() {
  if (currentView === "dashboard") {
    renderDashboard();
  } else {
    renderCycleView();
  }
}

function renderDashboard() {
  const totalStudents = cycles.reduce((sum, c) => sum + c.students.length, 0);
  const totalCycles = cycles.length;

  let totalAttRate = 0,
    totalTaskRate = 0,
    cyclesWithData = 0;
  cycles.forEach((cycle) => {
    if (cycle.students.length > 0) {
      cyclesWithData++;
      cycle.students.forEach((s) => {
        let att = 0,
          attCount = 0,
          task = 0,
          taskCount = 0;
        for (let w = 0; w < cycle.weeks; w++) {
          for (let ses = 0; ses < SESSIONS_PER_WEEK; ses++) {
            const a = s.attendance[w]?.[ses] || "empty";
            if (a !== "empty") {
              attCount++;
              if (a === "present") att++;
            }
          }
          for (let t = 0; t < TASKS_PER_WEEK; t++) {
            const ta = s.tasks[w]?.[t] || "empty";
            if (ta !== "empty") {
              taskCount++;
              if (ta === "task-done") task++;
            }
          }
        }
        if (attCount > 0) totalAttRate += (att / attCount) * 100;
        if (taskCount > 0) totalTaskRate += (task / taskCount) * 100;
      });
    }
  });

  const avgAtt =
    totalStudents > 0 ? Math.round(totalAttRate / totalStudents) : 0;
  const avgTask =
    totalStudents > 0 ? Math.round(totalTaskRate / totalStudents) : 0;

  const container = document.getElementById("mainContainer");
  container.innerHTML = `
                <div class="bg-white rounded-2xl shadow-xl p-8 mb-6">
                    <div class="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            
                            <h1 class="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                <span class="text-[#F36C28]" >I<span>  <span class="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent" >Academy System<span>
                            </h1>
                            <p class="text-gray-600 mt-2">Dashboard Overview - Manage all your cycles</p>
                        </div>
                        <div class="flex gap-3 flex-wrap">
                            <button onclick="openCreateCycleModal()" class="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold shadow-lg transition-all hover:scale-105">
                                ➕ New Cycle
                            </button>
                            <button onclick="saveAllData()" class="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold shadow-lg transition-all hover:scale-105">
                                💾 Save Data
                            </button>
                            <button onclick="document.getElementById('loadFile').click()" class="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-semibold shadow-lg transition-all hover:scale-105">
                                📁 Load Data
                            </button>
                            <button onclick="exportDashboardPDF()" class="px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-semibold shadow-lg transition-all hover:scale-105">
                                📄 Export PDF
                            </button>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <div class="stat-card bg-gradient-to-br from-indigo-500 to-purple-500 text-white p-6 rounded-2xl shadow-xl">
                        <div class="text-sm opacity-90 mb-2 font-semibold">Total Cycles</div>
                        <div class="text-4xl font-bold">${totalCycles}</div>
                        <div class="text-xs opacity-80 mt-2">Active tracking cycles</div>
                    </div>
                    <div class="stat-card bg-gradient-to-br from-green-500 to-emerald-500 text-white p-6 rounded-2xl shadow-xl">
                        <div class="text-sm opacity-90 mb-2 font-semibold">Total Students</div>
                        <div class="text-4xl font-bold">${totalStudents}</div>
                        <div class="text-xs opacity-80 mt-2">Across all cycles</div>
                    </div>
                    <div class="stat-card bg-gradient-to-br from-blue-500 to-cyan-500 text-white p-6 rounded-2xl shadow-xl">
                        <div class="text-sm opacity-90 mb-2 font-semibold">Avg Attendance</div>
                        <div class="text-4xl font-bold">${avgAtt}%</div>
                        <div class="text-xs opacity-80 mt-2">Overall performance</div>
                    </div>
                    <div class="stat-card bg-gradient-to-br from-amber-500 to-orange-500 text-white p-6 rounded-2xl shadow-xl">
                        <div class="text-sm opacity-90 mb-2 font-semibold">Avg Tasks</div>
                        <div class="text-4xl font-bold">${avgTask}%</div>
                        <div class="text-xs opacity-80 mt-2">Completion rate</div>
                    </div>
                </div>

                <div class="bg-white rounded-2xl shadow-xl p-6">
                    <h2 class="text-2xl font-bold text-gray-800 mb-6">All Cycles</h2>
                    ${
                      cycles.length === 0
                        ? `
                        <div class="text-center py-16">
                            <div class="text-6xl mb-4">📚</div>
                            <h3 class="text-xl font-semibold text-gray-600 mb-2">No Cycles Yet</h3>
                            <p class="text-gray-500 mb-6">Create your first cycle to start tracking students</p>
                            <button onclick="openCreateCycleModal()" class="px-8 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold shadow-lg transition-all hover:scale-105">
                                ➕ Create First Cycle
                            </button>
                        </div>
                    `
                        : `
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            ${cycles
                              .map((cycle) => {
                                const students = cycle.students.length;
                                let att = 0,
                                  attCnt = 0;
                                cycle.students.forEach((s) => {
                                  for (let w = 0; w < cycle.weeks; w++) {
                                    for (
                                      let ses = 0;
                                      ses < SESSIONS_PER_WEEK;
                                      ses++
                                    ) {
                                      const a =
                                        s.attendance[w]?.[ses] || "empty";
                                      if (a !== "empty") {
                                        attCnt++;
                                        if (a === "present") att++;
                                      }
                                    }
                                  }
                                });
                                const attRate =
                                  attCnt > 0
                                    ? Math.round((att / attCnt) * 100)
                                    : 0;

                                return `
                                    <div class="cycle-card bg-gradient-to-br from-white to-indigo-50 p-6 rounded-2xl shadow-lg border-2 border-indigo-100 cursor-pointer" onclick="switchToCycle('${
                                      cycle.id
                                    }')">
                                        <div class="flex items-start justify-between mb-4">
                                            <div>
                                                <h3 class="text-xl font-bold text-gray-800">${
                                                  cycle.name
                                                }</h3>
                                                <p class="text-sm text-gray-500 mt-1">${
                                                  cycle.weeks
                                                } weeks</p>
                                            </div>
                                            <div class="flex gap-2">
                                                <button onclick="event.stopPropagation(); openEditCycleModal('${
                                                  cycle.id
                                                }')" class="p-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-600 rounded-lg transition-all" title="Edit">
                                                    ✏️
                                                </button>
                                                <button onclick="event.stopPropagation(); deleteCycleFromDashboard('${
                                                  cycle.id
                                                }')" class="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-all" title="Delete">
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                        <div class="space-y-3">
                                            <div class="flex items-center justify-between py-2 px-3 bg-white rounded-lg">
                                                <span class="text-sm font-medium text-gray-600">Students</span>
                                                <span class="text-lg font-bold text-indigo-600">${students}</span>
                                            </div>
                                            <div class="flex items-center justify-between py-2 px-3 bg-white rounded-lg">
                                                <span class="text-sm font-medium text-gray-600">Attendance</span>
                                                <span class="text-lg font-bold text-green-600">${attRate}%</span>
                                            </div>
                                            <div class="flex items-center justify-between py-2 px-3 bg-white rounded-lg">
                                                <span class="text-sm font-medium text-gray-600">Created</span>
                                                <span class="text-sm font-semibold text-gray-700">${new Date(
                                                  cycle.createdAt
                                                ).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <button class="w-full mt-4 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-semibold transition-all">
                                            Open Cycle →
                                        </button>
                                    </div>
                                `;
                              })
                              .join("")}
                        </div>
                    `
                    }
                </div>
            `;
  saveDataToLocalStorage();
}

function switchToCycle(cycleId) {
  currentCycleId = cycleId;
  currentView = "cycle";
  renderView();
  saveDataToLocalStorage();
}

function renderCycleView() {
  const cycle = cycles.find((c) => c.id === currentCycleId);
  if (!cycle) {
    currentView = "dashboard";
    renderView();
    return;
  }

  const container = document.getElementById("mainContainer");
  container.innerHTML = `
                <div class="bg-white rounded-2xl shadow-xl p-6 mb-6">
                    <div class="flex items-center justify-between flex-wrap gap-4">
                        <div class="flex items-center gap-4">
                            <button onclick="switchToDashboard()" class="p-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all">
                                ← Back
                            </button>
                            <div>
                                <h1 class="text-3xl font-bold text-gray-800">${cycle.name}</h1>
                                <p class="text-gray-600 mt-1">${cycle.weeks} weeks • ${cycle.students.length} students</p>
                            </div>
                        </div>
                        <div class="flex gap-3 flex-wrap">
                            <button onclick="openAddStudentModal()" class="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold shadow-lg transition-all hover:scale-105">
                                ➕ Add Student
                            </button>
                            <button onclick="exportCycleToPDF()" class="px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-semibold shadow-lg transition-all hover:scale-105">
                                📄 Export PDF
                            </button>
                        </div>
                    </div>
                </div>

                <div id="cycleStats" class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"></div>

                <div class="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl shadow-xl p-6 mb-6 text-white">
                    <div class="flex items-center justify-center gap-6 flex-wrap">
                        <h3 class="text-xl font-bold">Select Week:</h3>
                        <select id="weekSelect" onchange="renderTable()" class="px-6 py-3 bg-white text-gray-800 rounded-xl font-semibold shadow-lg min-w-[200px] focus:ring-4 focus:ring-white/50">
                        </select>
                        <div class="flex gap-3">
                            <button onclick="previousWeek()" class="px-5 py-3 bg-white/20 hover:bg-white/30 backdrop-blur rounded-xl font-semibold transition-all">
                                ⬅️ Previous
                            </button>
                            <button onclick="nextWeek()" class="px-5 py-3 bg-white/20 hover:bg-white/30 backdrop-blur rounded-xl font-semibold transition-all">
                                Next ➡️
                            </button>
                        </div>
                    </div>
                </div>

                <div class="bg-white rounded-2xl shadow-xl p-6 mb-6">
                    <input type="text" id="searchStudent" placeholder="🔍 Search students by name..." oninput="filterStudents()" class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-indigo-200 focus:border-indigo-500 transition-all">
                </div>

                <div class="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
                    <div class="overflow-x-auto">
                        <table class="w-full">
                            <thead class="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                                <tr>
                                    <th class="px-6 py-4 text-left font-semibold">Student Name</th>
                                    <th class="px-6 py-4 text-center font-semibold bg-purple-700">Session 1</th>
                                    <th class="px-6 py-4 text-center font-semibold bg-blue-600">Task 1</th>
                                    <th class="px-6 py-4 text-center font-semibold bg-purple-700">Session 2</th>
                                    <th class="px-6 py-4 text-center font-semibold bg-blue-600">Task 2</th>
                                    <th class="px-6 py-4 text-center font-semibold bg-green-600">Lab</th>
                                    <th class="px-6 py-4 text-center font-semibold bg-amber-500">Att %</th>
                                    <th class="px-6 py-4 text-center font-semibold bg-amber-500">Tasks %</th>
                                    <th class="px-6 py-4 text-center font-semibold bg-amber-500">Overall %</th>
                                    <th class="px-6 py-4 text-center font-semibold bg-cyan-500">Weekly Review</th>
                                    <th class="px-6 py-4 text-center font-semibold bg-red-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="tableBody" class="divide-y divide-gray-200">
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="bg-white rounded-2xl shadow-xl p-6">
                    <div class="flex flex-wrap gap-6 justify-center">
                        <div class="flex items-center gap-2">
                            <div class="w-8 h-8 bg-green-400 rounded-lg"></div>
                            <span class="font-semibold text-gray-700">Present ✓</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <div class="w-8 h-8 bg-red-400 rounded-lg"></div>
                            <span class="font-semibold text-gray-700">Absent ✗</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <div class="w-8 h-8 bg-blue-400 rounded-lg"></div>
                            <span class="font-semibold text-gray-700">Task Done ✓</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <div class="w-8 h-8 bg-orange-400 rounded-lg"></div>
                            <span class="font-semibold text-gray-700">Task Not Done ✗</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <div class="w-8 h-8 bg-gray-300 rounded-lg"></div>
                            <span class="font-semibold text-gray-700">Not Recorded -</span>
                        </div>
                    </div>
                </div>
            `;

  renderWeekSelect();
  updateCycleStats();
  renderTable();
  saveDataToLocalStorage();
}

function switchToDashboard() {
  currentView = "dashboard";
  renderView();
  saveDataToLocalStorage();
}

function updateCycleStats() {
  const cycle = cycles.find((c) => c.id === currentCycleId);
  if (!cycle) return;

  let totalAtt = 0,
    totalTask = 0,
    totalAttCount = 0,
    totalTaskCount = 0;
  cycle.students.forEach((s) => {
    for (let w = 0; w < cycle.weeks; w++) {
      for (let ses = 0; ses < SESSIONS_PER_WEEK; ses++) {
        const att = s.attendance[w]?.[ses] || "empty";
        if (att !== "empty") {
          totalAttCount++;
          if (att === "present") totalAtt++;
        }
      }
      for (let t = 0; t < TASKS_PER_WEEK; t++) {
        const task = s.tasks[w]?.[t] || "empty";
        if (task !== "empty") {
          totalTaskCount++;
          if (task === "task-done") totalTask++;
        }
      }
    }
  });

  const avgAtt =
    totalAttCount > 0 ? Math.round((totalAtt / totalAttCount) * 100) : 0;
  const avgTask =
    totalTaskCount > 0 ? Math.round((totalTask / totalTaskCount) * 100) : 0;
  const overall = Math.round((avgAtt + avgTask) / 2);

  document.getElementById("cycleStats").innerHTML = `
                <div class="bg-gradient-to-br from-indigo-500 to-purple-500 text-white p-4 rounded-xl stat-card">
                    <div class="text-sm opacity-90 mb-1">Total Students</div>
                    <div class="text-3xl font-bold">${cycle.students.length}</div>
                </div>
                <div class="bg-gradient-to-br from-green-500 to-emerald-500 text-white p-4 rounded-xl stat-card">
                    <div class="text-sm opacity-90 mb-1">Avg Attendance</div>
                    <div class="text-3xl font-bold">${avgAtt}%</div>
                </div>
                <div class="bg-gradient-to-br from-blue-500 to-cyan-500 text-white p-4 rounded-xl stat-card">
                    <div class="text-sm opacity-90 mb-1">Avg Tasks</div>
                    <div class="text-3xl font-bold">${avgTask}%</div>
                </div>
                <div class="bg-gradient-to-br from-amber-500 to-orange-500 text-white p-4 rounded-xl stat-card">
                    <div class="text-sm opacity-90 mb-1">Overall</div>
                    <div class="text-3xl font-bold">${overall}%</div>
                </div>
            `;
}

function renderWeekSelect() {
  const cycle = cycles.find((c) => c.id === currentCycleId);
  if (!cycle) return;

  const select = document.getElementById("weekSelect");
  select.innerHTML = "";

  for (let i = 1; i <= cycle.weeks; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = `Week ${i}`;
    select.appendChild(option);
  }
}

function renderTable() {
  const cycle = cycles.find((c) => c.id === currentCycleId);
  if (!cycle) return;

  const tbody = document.getElementById("tableBody");
  const selectedWeek =
    parseInt(document.getElementById("weekSelect").value) - 1;

  if (cycle.students.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="11" class="text-center py-12 text-gray-500 text-lg">No students added yet. Click "Add Student" to get started.</td></tr>';
    return;
  }

  tbody.innerHTML = "";

  cycle.students.forEach((student, studentIdx) => {
    const tr = document.createElement("tr");
    tr.className = "hover:bg-indigo-50 transition-colors";

    // Calculate stats
    let totalAtt = 0,
      totalTasks = 0,
      totalAttCount = 0,
      totalTaskCount = 0;
    for (let w = 0; w < cycle.weeks; w++) {
      for (let s = 0; s < SESSIONS_PER_WEEK; s++) {
        const att = student.attendance[w]?.[s] || "empty";
        if (att !== "empty") {
          totalAttCount++;
          if (att === "present") totalAtt++;
        }
      }
      for (let t = 0; t < TASKS_PER_WEEK; t++) {
        const task = student.tasks[w]?.[t] || "empty";
        if (task !== "empty") {
          totalTaskCount++;
          if (task === "task-done") totalTasks++;
        }
      }
    }

    const attPerc =
      totalAttCount > 0 ? Math.round((totalAtt / totalAttCount) * 100) : 0;
    const taskPerc =
      totalTaskCount > 0 ? Math.round((totalTasks / totalTaskCount) * 100) : 0;
    const overall = Math.round((attPerc + taskPerc) / 2);

    const reviewStatus =
      student.reviews[selectedWeek] && student.reviews[selectedWeek] !== ""
        ? "📝"
        : "---";
    const reviewButtonClass =
      student.reviews[selectedWeek] && student.reviews[selectedWeek] !== ""
        ? "bg-cyan-500 text-white"
        : "bg-gray-200 text-gray-600";

    tr.innerHTML = `
                    <td class="px-6 py-4 font-semibold text-gray-800">${
                      student.name
                    }</td>
                    <td class="px-6 py-4 text-center">
                        <button onclick="toggleAttendance(${studentIdx}, ${selectedWeek}, 0)" class="w-12 h-12 rounded-lg font-bold text-xl transition-all hover:scale-110 ${getCellClass(
      student.attendance[selectedWeek]?.[0]
    )}">
                            ${getCellSymbol(
                              student.attendance[selectedWeek]?.[0]
                            )}
                        </button>
                    </td>
                    <td class="px-6 py-4 text-center">
                        <button onclick="toggleTask(${studentIdx}, ${selectedWeek}, 0)" class="w-12 h-12 rounded-lg font-bold text-xl transition-all hover:scale-110 ${getTaskClass(
      student.tasks[selectedWeek]?.[0]
    )}">
                            ${getTaskSymbol(student.tasks[selectedWeek]?.[0])}
                        </button>
                    </td>
                    <td class="px-6 py-4 text-center">
                        <button onclick="toggleAttendance(${studentIdx}, ${selectedWeek}, 1)" class="w-12 h-12 rounded-lg font-bold text-xl transition-all hover:scale-110 ${getCellClass(
      student.attendance[selectedWeek]?.[1]
    )}">
                            ${getCellSymbol(
                              student.attendance[selectedWeek]?.[1]
                            )}
                        </button>
                    </td>
                    <td class="px-6 py-4 text-center">
                        <button onclick="toggleTask(${studentIdx}, ${selectedWeek}, 1)" class="w-12 h-12 rounded-lg font-bold text-xl transition-all hover:scale-110 ${getTaskClass(
      student.tasks[selectedWeek]?.[1]
    )}">
                            ${getTaskSymbol(student.tasks[selectedWeek]?.[1])}
                        </button>
                    </td>
                    <td class="px-6 py-4 text-center">
                        <button onclick="toggleAttendance(${studentIdx}, ${selectedWeek}, 2)" class="w-12 h-12 rounded-lg font-bold text-xl transition-all hover:scale-110 ${getCellClass(
      student.attendance[selectedWeek]?.[2]
    )}">
                            ${getCellSymbol(
                              student.attendance[selectedWeek]?.[2]
                            )}
                        </button>
                    </td>
                    <td class="px-6 py-4 text-center">
                        <span class="inline-block px-4 py-2 bg-amber-100 text-amber-800 rounded-lg font-bold">${attPerc}%</span>
                    </td>
                    <td class="px-6 py-4 text-center">
                        <span class="inline-block px-4 py-2 bg-amber-100 text-amber-800 rounded-lg font-bold">${taskPerc}%</span>
                    </td>
                    <td class="px-6 py-4 text-center">
                        <span class="inline-block px-4 py-2 bg-amber-100 text-amber-800 rounded-lg font-bold">${overall}%</span>
                    </td>
                    <td class="px-6 py-4 text-center">
                        <button onclick="openReviewModal(${studentIdx}, ${selectedWeek})" class="px-4 py-2 rounded-lg font-semibold transition-all hover:scale-105 ${reviewButtonClass}">
                            ${reviewStatus}
                        </button>
                    </td>
                    <td class="px-6 py-4 text-center">
                        <div class="flex gap-2 justify-center">
                            <button onclick="deleteStudent(${studentIdx})" class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-all hover:scale-105">
                                Delete
                            </button>
                        </div>
                    </td>
                `;

    tbody.appendChild(tr);
  });
  saveDataToLocalStorage();
}

function getCellClass(value) {
  if (value === "present") return "bg-green-400 text-white shadow-lg";
  if (value === "absent") return "bg-red-400 text-white shadow-lg";
  return "bg-gray-300 text-gray-600";
}

function getCellSymbol(value) {
  if (value === "present") return "✓";
  if (value === "absent") return "✗";
  return "-";
}

function getTaskClass(value) {
  if (value === "task-done") return "bg-blue-400 text-white shadow-lg";
  if (value === "task-not-done") return "bg-orange-400 text-white shadow-lg";
  return "bg-gray-300 text-gray-600";
}

function getTaskSymbol(value) {
  if (value === "task-done") return "✓";
  if (value === "task-not-done") return "✗";
  return "-";
}

function toggleAttendance(studentIdx, week, session) {
  const cycle = cycles.find((c) => c.id === currentCycleId);
  const current = cycle.students[studentIdx].attendance[week][session];

  if (current === "empty") {
    cycle.students[studentIdx].attendance[week][session] = "present";
  } else if (current === "present") {
    cycle.students[studentIdx].attendance[week][session] = "absent";
  } else {
    cycle.students[studentIdx].attendance[week][session] = "empty";
  }

  renderTable();
  updateCycleStats();
  saveDataToLocalStorage();
}

function toggleTask(studentIdx, week, taskIdx) {
  const cycle = cycles.find((c) => c.id === currentCycleId);
  const current = cycle.students[studentIdx].tasks[week][taskIdx];

  if (current === "empty") {
    cycle.students[studentIdx].tasks[week][taskIdx] = "task-done";
  } else if (current === "task-done") {
    cycle.students[studentIdx].tasks[week][taskIdx] = "task-not-done";
  } else {
    cycle.students[studentIdx].tasks[week][taskIdx] = "empty";
  }

  renderTable();
  updateCycleStats();
  saveDataToLocalStorage();
}

function filterStudents() {
  const search = document.getElementById("searchStudent").value.toLowerCase();
  const rows = document.querySelectorAll("#tableBody tr");

  rows.forEach((row) => {
    const name = row.querySelector("td:first-child")?.textContent.toLowerCase();
    row.style.display = name && name.includes(search) ? "" : "none";
  });
}

function previousWeek() {
  const select = document.getElementById("weekSelect");
  if (select.selectedIndex > 0) {
    select.selectedIndex--;
    renderTable();
  }
}

function nextWeek() {
  const select = document.getElementById("weekSelect");
  if (select.selectedIndex < select.options.length - 1) {
    select.selectedIndex++;
    renderTable();
  }
}

function deleteStudent(idx) {
  const cycle = cycles.find((c) => c.id === currentCycleId);
  if (
    confirm(`Are you sure you want to delete "${cycle.students[idx].name}"?`)
  ) {
    cycle.students.splice(idx, 1);
    renderTable();
    updateCycleStats();
    showToast("Student deleted successfully", "success");
    saveDataToLocalStorage();
  }
}

// Modal Functions
function openCreateCycleModal() {
  document.getElementById("createCycleModal").classList.remove("hidden");
}

function closeCreateCycleModal() {
  document.getElementById("createCycleModal").classList.add("hidden");
  document.getElementById("cycleName").value = "";
  document.getElementById("cycleWeeks").value = "20";
}

function createCycle() {
  const name = document.getElementById("cycleName").value.trim();
  const weeks = parseInt(document.getElementById("cycleWeeks").value);

  if (!name) {
    showToast("Please enter cycle name", "error");
    return;
  }

  const newCycle = {
    id: Date.now().toString(),
    name: name,
    weeks: weeks,
    students: [],
    createdAt: new Date().toISOString(),
  };

  cycles.push(newCycle);
  closeCreateCycleModal();
  showToast(`Cycle "${name}" created successfully!`, "success");
  renderView();
}

function openEditCycleModal(cycleId) {
  currentEditCycleId = cycleId;
  const cycle = cycles.find((c) => c.id === cycleId);
  document.getElementById("editCycleName").value = cycle.name;
  document.getElementById("editCycleWeeks").value = cycle.weeks;
  document.getElementById("editCycleModal").classList.remove("hidden");
}

function closeEditCycleModal() {
  document.getElementById("editCycleModal").classList.add("hidden");
  currentEditCycleId = null;
}

function saveEditCycle() {
  const cycle = cycles.find((c) => c.id === currentEditCycleId);
  const newName = document.getElementById("editCycleName").value.trim();
  const newWeeks = parseInt(document.getElementById("editCycleWeeks").value);

  if (!newName) {
    showToast("Please enter cycle name", "error");
    return;
  }

  const oldWeeks = cycle.weeks;
  cycle.name = newName;
  cycle.weeks = newWeeks;

  // Adjust student data if weeks changed
  if (newWeeks !== oldWeeks) {
    cycle.students.forEach((student) => {
      if (newWeeks > oldWeeks) {
        // Add new weeks
        for (let i = oldWeeks; i < newWeeks; i++) {
          student.attendance.push(Array(SESSIONS_PER_WEEK).fill("empty"));
          student.tasks.push(Array(TASKS_PER_WEEK).fill("empty"));
          student.reviews.push("");
          student.monthly_reviews = student.monthly_reviews || {};
        }
      } else {
        // Remove excess weeks
        student.attendance = student.attendance.slice(0, newWeeks);
        student.tasks = student.tasks.slice(0, newWeeks);
        student.reviews = student.reviews.slice(0, newWeeks);
        if (student.monthly_reviews) {
          Object.keys(student.monthly_reviews).forEach((key) => {
            if (parseInt(key) > newWeeks / 4) {
              delete student.monthly_reviews[key];
            }
          });
        }
      }
    });
  }

  closeEditCycleModal();
  showToast("Cycle updated successfully!", "success");
  renderView();
}

function deleteCycleFromDashboard(cycleId) {
  const cycle = cycles.find((c) => c.id === cycleId);
  if (
    !confirm(
      `Are you sure you want to delete cycle "${cycle.name}"? This will delete all ${cycle.students.length} students in this cycle.`
    )
  )
    return;

  cycles = cycles.filter((c) => c.id !== cycleId);
  if (currentCycleId === cycleId) {
    currentCycleId = null;
    currentView = "dashboard";
  }
  renderView();
  showToast("Cycle deleted successfully", "success");
  saveDataToLocalStorage();
}

function openAddStudentModal() {
  document.getElementById("addStudentModal").classList.remove("hidden");
}

function closeAddStudentModal() {
  document.getElementById("addStudentModal").classList.add("hidden");
  document.getElementById("newStudentName").value = "";
  document.getElementById("newStudentEmail").value = "";
  document.getElementById("newStudentPhone").value = "";
  document.getElementById("newStudentGithub").value = "";
}

function confirmAddStudent() {
  const name = document.getElementById("newStudentName").value.trim();
  const email = document.getElementById("newStudentEmail").value.trim();
  const phone = document.getElementById("newStudentPhone").value.trim();
  const github = document.getElementById("newStudentGithub").value.trim();

  if (!name) {
    showToast("Please enter student name", "error");
    return;
  }

  const cycle = cycles.find((c) => c.id === currentCycleId);

  const newStudent = {
    id: Date.now().toString(),
    name: name,
    email: email,
    phone: phone,
    github: github,
    attendance: Array(cycle.weeks)
      .fill(null)
      .map(() => Array(SESSIONS_PER_WEEK).fill("empty")),
    tasks: Array(cycle.weeks)
      .fill(null)
      .map(() => Array(TASKS_PER_WEEK).fill("empty")),
    reviews: Array(cycle.weeks).fill(""),
    monthly_reviews: {},
  };

  cycle.students.push(newStudent);
  closeAddStudentModal();
  renderTable();
  updateCycleStats();
  showToast(`Student "${name}" added successfully!`, "success");
  saveDataToLocalStorage();
}

function openReviewModal(studentIdx, week) {
  const cycle = cycles.find((c) => c.id === currentCycleId);
  const student = cycle.students[studentIdx];
  currentReviewStudent = studentIdx;
  currentReviewWeek = week;

  // Calculate stats
  let totalAtt = 0,
    totalTasks = 0,
    totalAttCount = 0,
    totalTaskCount = 0;
  for (let w = 0; w < cycle.weeks; w++) {
    for (let s = 0; s < SESSIONS_PER_WEEK; s++) {
      const att = student.attendance[w]?.[s] || "empty";
      if (att !== "empty") {
        totalAttCount++;
        if (att === "present") totalAtt++;
      }
    }
    for (let t = 0; t < TASKS_PER_WEEK; t++) {
      const task = student.tasks[w]?.[t] || "empty";
      if (task !== "empty") {
        totalTaskCount++;
        if (task === "task-done") totalTasks++;
      }
    }
  }

  const attPerc =
    totalAttCount > 0 ? Math.round((totalAtt / totalAttCount) * 100) : 0;
  const taskPerc =
    totalTaskCount > 0 ? Math.round((totalTasks / totalTaskCount) * 100) : 0;
  const overall = Math.round((attPerc + taskPerc) / 2);

  // Monthly review
  const currentMonth = Math.ceil((week + 1) / 4);
  const monthlyReview = student.monthly_reviews[currentMonth] || {
    positive: "",
    improvements: "",
  };

  document.getElementById("reviewContent").innerHTML = `
                <div class="bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-6 rounded-xl mb-6">
                    <h4 class="text-2xl font-bold mb-4">${student.name}</h4>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <div class="text-sm opacity-90">Attendance</div>
                            <div class="text-3xl font-bold">${attPerc}%</div>
                        </div>
                        <div>
                            <div class="text-sm opacity-90">Tasks</div>
                            <div class="text-3xl font-bold">${taskPerc}%</div>
                        </div>
                        <div>
                            <div class="text-sm opacity-90">Present</div>
                            <div class="text-2xl font-bold">${totalAtt}/${totalAttCount}</div>
                        </div>
                        <div>
                            <div class="text-sm opacity-90">Completed</div>
                            <div class="text-2xl font-bold">${totalTasks}/${totalTaskCount}</div>
                        </div>
                    </div>
                </div>

                <div class="bg-gray-50 p-6 rounded-xl mb-6">
                    <h5 class="font-bold text-gray-800 mb-3">Contact Information</h5>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <span class="font-semibold text-gray-600">Email:</span>
                            <p class="text-gray-800">${
                              student.email || "Not provided"
                            }</p>
                        </div>
                        <div>
                            <span class="font-semibold text-gray-600">Phone:</span>
                            <p class="text-gray-800">${
                              student.phone || "Not provided"
                            }</p>
                        </div>
                        <div class="md:col-span-2">
                            <span class="font-semibold text-gray-600">GitHub:</span>
                            <p class="text-gray-800">${
                              student.github
                                ? `<a href="${student.github}" target="_blank" class="text-indigo-600 hover:underline">${student.github}</a>`
                                : "Not provided"
                            }</p>
                        </div>
                    </div>
                </div>

                <div class="bg-gray-100 p-6 rounded-xl mb-6 border-2 border-dashed border-gray-300">
                    <h5 class="font-bold text-gray-800 mb-4">Monthly Review (Month ${currentMonth})</h5>
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Positive Feedback / Strengths:</label>
                            <textarea id="monthlyPositive" rows="4" placeholder="e.g., Great progress on tasks, excellent participation..." class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-green-200 focus:border-green-500">${
                              monthlyReview.positive
                            }</textarea>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Areas for Improvement:</label>
                            <textarea id="monthlyImprovements" rows="4" placeholder="e.g., Needs to focus on attendance, improve task submissions..." class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-red-200 focus:border-red-500">${
                              monthlyReview.improvements
                            }</textarea>
                        </div>
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">Weekly Notes for Week ${
                      currentReviewWeek + 1
                    }:</label>
                    <textarea id="reviewNotes" rows="6" placeholder="Enter your weekly notes..." class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-indigo-200 focus:border-indigo-500">${
                      student.reviews[currentReviewWeek] || ""
                    }</textarea>
                </div>
            `;

  document.getElementById("reviewModal").classList.remove("hidden");
}

function closeReviewModal() {
  document.getElementById("reviewModal").classList.add("hidden");
  currentReviewStudent = null;
  currentReviewWeek = null;
  renderTable(); // Refresh the table to update the review status icon
}

function saveReview() {
  if (currentReviewStudent === null || currentReviewWeek === null) return;

  const cycle = cycles.find((c) => c.id === currentCycleId);
  const student = cycle.students[currentReviewStudent];
  const currentMonth = Math.ceil((currentReviewWeek + 1) / 4);

  student.reviews[currentReviewWeek] =
    document.getElementById("reviewNotes").value;
  student.monthly_reviews[currentMonth] = {
    positive: document.getElementById("monthlyPositive").value,
    improvements: document.getElementById("monthlyImprovements").value,
  };

  showToast("Review saved successfully!", "success");
  closeReviewModal();
  saveDataToLocalStorage();
}

// PDF Export Functions
function exportDashboardPDF() {
  if (cycles.length === 0) {
    showToast("No cycles to export", "error");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Header
  doc.setFillColor(102, 126, 234);
  doc.rect(0, 0, 210, 40, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.text("Dashboard Overview", 105, 20, { align: "center" });
  doc.setFontSize(12);
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, 105, 30, {
    align: "center",
  });

  let y = 55;
  doc.setTextColor(0, 0, 0);

  // Summary
  const totalStudents = cycles.reduce((sum, c) => sum + c.students.length, 0);
  doc.setFontSize(16);
  doc.setFont(undefined, "bold");
  doc.text("System Summary", 14, y);
  y += 10;

  doc.autoTable({
    startY: y,
    head: [["Metric", "Value"]],
    body: [
      ["Total Cycles", cycles.length.toString()],
      ["Total Students", totalStudents.toString()],
      ["Report Date", new Date().toLocaleDateString()],
    ],
    theme: "grid",
    headStyles: { fillColor: [102, 126, 234] },
  });

  y = doc.lastAutoTable.finalY + 15;

  // Cycles Overview
  doc.setFontSize(16);
  doc.setFont(undefined, "bold");
  doc.text("Cycles Overview", 14, y);
  y += 10;

  const cycleData = cycles.map((cycle) => {
    let att = 0,
      attCnt = 0;
    cycle.students.forEach((s) => {
      for (let w = 0; w < cycle.weeks; w++) {
        for (let ses = 0; ses < SESSIONS_PER_WEEK; ses++) {
          const a = s.attendance[w]?.[ses] || "empty";
          if (a !== "empty") {
            attCnt++;
            if (a === "present") att++;
          }
        }
      }
    });
    const attRate = attCnt > 0 ? Math.round((att / attCnt) * 100) : 0;
    return [
      cycle.name,
      cycle.students.length.toString(),
      cycle.weeks.toString(),
      `${attRate}%`,
    ];
  });

  doc.autoTable({
    startY: y,
    head: [["Cycle Name", "Students", "Weeks", "Avg Attendance"]],
    body: cycleData,
    theme: "grid",
    headStyles: { fillColor: [102, 126, 234] },
  });

  doc.save(`Dashboard_Report_${new Date().toISOString().split("T")[0]}.pdf`);
  showToast("Dashboard report exported successfully!", "success");
}

function exportCycleToPDF() {
  const cycle = cycles.find((c) => c.id === currentCycleId);
  if (!cycle || cycle.students.length === 0) {
    showToast("No students to export", "error");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("landscape");

  // Header
  doc.setFillColor(102, 126, 234);
  doc.rect(0, 0, 297, 35, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text(`${cycle.name} - Full Report`, 148.5, 15, { align: "center" });
  doc.setFontSize(12);
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, 148.5, 25, {
    align: "center",
  });

  // Table data
  const tableData = cycle.students.map((student) => {
    let totalAtt = 0,
      totalTasks = 0,
      totalAttCount = 0,
      totalTaskCount = 0;

    for (let w = 0; w < cycle.weeks; w++) {
      for (let s = 0; s < SESSIONS_PER_WEEK; s++) {
        const att = student.attendance[w]?.[s] || "empty";
        if (att !== "empty") {
          totalAttCount++;
          if (att === "present") totalAtt++;
        }
      }
      for (let t = 0; t < TASKS_PER_WEEK; t++) {
        const task = student.tasks[w]?.[t] || "empty";
        if (task !== "empty") {
          totalTaskCount++;
          if (task === "task-done") totalTasks++;
        }
      }
    }

    const attPerc =
      totalAttCount > 0 ? Math.round((totalAtt / totalAttCount) * 100) : 0;
    const taskPerc =
      totalTaskCount > 0 ? Math.round((totalTasks / totalTaskCount) * 100) : 0;

    return [
      student.name,
      student.email || "N/A",
      `${totalAtt}/${totalAttCount}`,
      `${attPerc}%`,
      `${totalTasks}/${totalTaskCount}`,
      `${taskPerc}%`,
      `${Math.round((attPerc + taskPerc) / 2)}%`,
    ];
  });

  doc.autoTable({
    startY: 45,
    head: [
      ["Name", "Email", "Attendance", "Att %", "Tasks", "Tasks %", "Overall %"],
    ],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [102, 126, 234],
      fontSize: 9,
      fontStyle: "bold",
    },
    styles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 40 },
    },
  });

  doc.save(`${cycle.name}_Full_Report.pdf`);
  showToast("Cycle report exported successfully!", "success");
}

function exportStudentReport() {
  if (currentReviewStudent === null) return;

  const { jsPDF } = window.jspdf;
  const cycle = cycles.find((c) => c.id === currentCycleId);
  const student = cycle.students[currentReviewStudent];

  const doc = new jsPDF();

  // ===== HEADER =====
  doc.setFillColor(1, 15, 60); // لون أخضر غامق #010F3C
  doc.rect(0, 0, 210, 40, "F");

  // Logo - تحميل الصورة
  const logoImg = new Image();
  logoImg.src = "./img/logo.jpg";

  doc.addImage(logoImg, "JPEG", 10, 4, 35, 35);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont(undefined, "bold");
  doc.text("Student Report", 105, 18, { align: "center" });
  doc.setFontSize(12);
  doc.setFont(undefined, "normal");
  doc.text(`${cycle.name} - ${student.name}`, 105, 30, {
    align: "center",
  });

  doc.setTextColor(0, 0, 0);
  let y = 55;

  // ===== PERFORMANCE CALCULATION =====
  let totalAtt = 0,
    totalTasks = 0,
    totalAttCount = 0,
    totalTaskCount = 0;
  for (let w = 0; w < cycle.weeks; w++) {
    for (let s = 0; s < SESSIONS_PER_WEEK; s++) {
      const att = student.attendance[w]?.[s] || "empty";
      if (att !== "empty") {
        totalAttCount++;
        if (att === "present") totalAtt++;
      }
    }
    for (let t = 0; t < TASKS_PER_WEEK; t++) {
      const task = student.tasks[w]?.[t] || "empty";
      if (task !== "empty") {
        totalTaskCount++;
        if (task === "task-done") totalTasks++;
      }
    }
  }
  const attPerc =
    totalAttCount > 0 ? Math.round((totalAtt / totalAttCount) * 100) : 0;
  const taskPerc =
    totalTaskCount > 0 ? Math.round((totalTasks / totalTaskCount) * 100) : 0;
  const overallPerc = Math.round((attPerc + taskPerc) / 2);

  // ===== PERFORMANCE CIRCLES (دوائر بنفس شكل الصورة) =====
  const circleY = y + 30;
  const circleRadius = 22;
  const circleThickness = 5;

  // Helper function لرسم دائرة progress
  const drawProgressCircle = (x, y, percentage, color) => {
    // الدائرة الخلفية (رمادي فاتح)
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(circleThickness);
    doc.circle(x, y, circleRadius, "S");

    // الدائرة الملونة (progress)
    doc.setDrawColor(...color);
    doc.setLineWidth(circleThickness);

    // حساب الزاوية بناءً على النسبة المئوية
    const angle = (percentage / 100) * 360;
    const startAngle = -90; // نبدأ من أعلى
    const endAngle = startAngle + angle;

    // رسم القوس
    const segments = 100;
    for (let i = 0; i < segments; i++) {
      const currentAngle = startAngle + (angle * i) / segments;
      const nextAngle = startAngle + (angle * (i + 1)) / segments;

      if (i === 0) continue;

      const x1 = x + circleRadius * Math.cos((currentAngle * Math.PI) / 180);
      const y1 = y + circleRadius * Math.sin((currentAngle * Math.PI) / 180);
      const x2 = x + circleRadius * Math.cos((nextAngle * Math.PI) / 180);
      const y2 = y + circleRadius * Math.sin((nextAngle * Math.PI) / 180);

      doc.line(x1, y1, x2, y2);
    }
  };

  // دائرة الحضور
  const attColor =
    attPerc >= 80
      ? [46, 204, 113]
      : attPerc >= 60
      ? [241, 196, 15]
      : [231, 76, 60];
  drawProgressCircle(35, circleY, attPerc, attColor);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(20);
  doc.setFont(undefined, "bold");
  doc.text(`${attPerc}%`, 35, circleY + 2, { align: "center" });
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.setFont(undefined, "normal");
  doc.text("Attendance", 35, circleY + 35, { align: "center" });

  // دائرة المهام
  const taskColor =
    taskPerc >= 80
      ? [46, 204, 113]
      : taskPerc >= 60
      ? [241, 196, 15]
      : [231, 76, 60];
  drawProgressCircle(105, circleY, taskPerc, taskColor);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(20);
  doc.setFont(undefined, "bold");
  doc.text(`${taskPerc}%`, 105, circleY + 2, { align: "center" });
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.setFont(undefined, "normal");
  doc.text("Tasks", 105, circleY + 35, { align: "center" });

  // دائرة الأداء الكلي
  const overallColor =
    overallPerc >= 80
      ? [46, 204, 113]
      : overallPerc >= 60
      ? [241, 196, 15]
      : [231, 76, 60];
  drawProgressCircle(175, circleY, overallPerc, overallColor);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(20);
  doc.setFont(undefined, "bold");
  doc.text(`${overallPerc}%`, 175, circleY + 2, { align: "center" });
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.setFont(undefined, "normal");
  doc.text("Overall", 175, circleY + 35, { align: "center" });

  y = circleY + 50;

  // ===== PERFORMANCE SUMMARY =====
  doc.setFillColor(236, 240, 241);
  doc.roundedRect(14, y, 182, 35, 3, 3, "F");
  doc.setFontSize(11);
  doc.setTextColor(52, 73, 94);
  doc.setFont(undefined, "bold");
  doc.text("Performance Summary", 20, y + 8);
  doc.setFont(undefined, "normal");
  doc.setFontSize(10);
  doc.text(`Sessions Attended: ${totalAtt} of ${totalAttCount}`, 20, y + 18);
  doc.text(`Tasks Completed: ${totalTasks} of ${totalTaskCount}`, 20, y + 28);

  y += 45;

  // ===== STUDENT INFO =====
  // doc.setFontSize(14);
  // doc.setFont(undefined, "bold");
  // doc.setTextColor(1, 15, 60);
  // doc.text("Student Information", 14, y);
  // y += 8;

  // doc.autoTable({
  //   startY: y,
  //   head: [["Field", "Value"]],
  //   body: [
  //     ["Name", student.name],
  //     ["Email", student.email || "Not provided"],
  //     ["Phone", student.phone || "Not provided"],
  //     ["GitHub", student.github || "Not provided"],
  //   ],
  //   theme: "grid",
  //   headStyles: { fillColor: [1, 15, 60], textColor: 255, fontStyle: "bold" },
  //   styles: { fontSize: 10, cellPadding: 3, textColor: [52, 73, 94] },
  //   alternateRowStyles: { fillColor: [245, 247, 250] },
  // });

  // y = doc.lastAutoTable.finalY + 15;

  // ===== MONTHLY REVIEWS =====
  doc.setFontSize(14);
  doc.setFont(undefined, "bold");
  doc.setTextColor(1, 15, 60);
  doc.text("Monthly Reviews", 14, y);
  y += 8;

  const monthlyData = Object.keys(student.monthly_reviews)
    .sort((a, b) => a - b)
    .map((month) => {
      const review = student.monthly_reviews[month];
      return [
        `Month ${month}`,
        `+ ${review.positive}\n- ${review.improvements}`,
      ];
    });

  doc.autoTable({
    startY: y,
    head: [["Month", "Review Notes"]],
    body: monthlyData,
    theme: "grid",
    headStyles: { fillColor: [1, 15, 60], textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 9, cellPadding: 2, textColor: [52, 73, 94] },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    columnStyles: {
      0: { cellWidth: 28, fontStyle: "bold" },
      1: { cellWidth: "auto", overflow: "linebreak" },
    },
  });

  y = doc.lastAutoTable.finalY + 15;

  // ===== WEEKLY DETAILS =====
  doc.setFontSize(14);
  doc.setFont(undefined, "bold");
  doc.setTextColor(1, 15, 60);
  doc.text("Weekly Details & Reviews", 14, y);
  y += 8;

  const weeklyData = [];
  for (let w = 0; w < cycle.weeks; w++) {
    const s1 =
      student.attendance[w]?.[0] === "present"
        ? "Present"
        : student.attendance[w]?.[0] === "absent"
        ? "Absent"
        : "-";
    const s2 =
      student.attendance[w]?.[1] === "present"
        ? "Present"
        : student.attendance[w]?.[1] === "absent"
        ? "Absent"
        : "-";
    const lab =
      student.attendance[w]?.[2] === "present"
        ? "Present"
        : student.attendance[w]?.[2] === "absent"
        ? "Absent"
        : "-";
    const t1 =
      student.tasks[w]?.[0] === "task-done"
        ? "Done"
        : student.tasks[w]?.[0] === "task-not-done"
        ? "Not Done"
        : "-";
    const t2 =
      student.tasks[w]?.[1] === "task-done"
        ? "Done"
        : student.tasks[w]?.[1] === "task-not-done"
        ? "Not Done"
        : "-";

    weeklyData.push([
      `Week ${w + 1}`,
      s1,
      s2,
      lab,
      t1,
      t2,
      student.reviews[w] || "N/A",
    ]);
  }

  doc.autoTable({
    startY: y,
    head: [
      ["Week", "Session 1", "Session 2", "Lab", "Task 1", "Task 2", "Review"],
    ],
    body: weeklyData,
    theme: "grid",
    headStyles: { fillColor: [1, 15, 60], textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 8, cellPadding: 2, textColor: [52, 73, 94] },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    columnStyles: {
      6: { cellWidth: 55, overflow: "linebreak" },
      0: { fontStyle: "bold" },
    },
  });

  // ===== SAVE PDF =====
  doc.save(`${student.name}_Report_${cycle.name}.pdf`);
  showToast("Student report exported successfully!", "success");
}

// Data Management Functions
function saveDataToLocalStorage() {
  try {
    const data = JSON.stringify({ cycles, currentCycleId });
    localStorage.setItem("studentTrackingData", data);
  } catch (e) {
    console.error("Error saving to local storage", e);
    showToast("Error saving data to local storage", "error");
  }
}

function loadDataFromLocalStorage() {
  try {
    const data = localStorage.getItem("studentTrackingData");
    if (data) {
      const parsedData = JSON.parse(data);
      cycles = parsedData.cycles || [];
      currentCycleId = parsedData.currentCycleId || null;
      // Ensure new monthly_reviews field exists on load
      cycles.forEach((cycle) => {
        cycle.students.forEach((student) => {
          if (!student.monthly_reviews) {
            student.monthly_reviews = {};
          }
        });
      });
      showToast("Data loaded from local storage!", "info");
    }
  } catch (e) {
    console.error("Error loading from local storage", e);
    showToast("Error loading data from local storage", "error");
  }
}

function saveAllData() {
  const data = {
    cycles: cycles,
    currentCycleId: currentCycleId,
    exportDate: new Date().toISOString(),
    version: "4.1",
  };

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `tracking_system_${new Date().toISOString().split("T")[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);

  showToast("Data saved successfully!", "success");
}

function loadAllData() {
  const file = document.getElementById("loadFile").files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const data = JSON.parse(e.target.result);
      if (data.cycles && Array.isArray(data.cycles)) {
        cycles = data.cycles;
        currentCycleId = data.currentCycleId;

        // Ensure all students have the new fields
        cycles.forEach((cycle) => {
          if (!cycle.createdAt) cycle.createdAt = new Date().toISOString();
          cycle.students.forEach((student) => {
            if (!student.email) student.email = "";
            if (!student.phone) student.phone = "";
            if (!student.github) student.github = "";
            if (!student.reviews || student.reviews.length !== cycle.weeks) {
              student.reviews = Array(cycle.weeks).fill("");
            }
            if (!student.monthly_reviews) {
              student.monthly_reviews = {};
            }
          });
        });

        renderView();
        showToast("Data loaded successfully!", "success");
      } else {
        showToast("Invalid file format!", "error");
      }
    } catch (err) {
      showToast("Error reading file: " + err.message, "error");
    }
  };
  reader.readAsText(file);
  document.getElementById("loadFile").value = "";
}

// Initialize on load
init();
