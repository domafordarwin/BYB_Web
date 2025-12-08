(() => {
  const DB_NAME = "focusFusionDB";
  const DB_VERSION = 1;
  const ADMIN_EMAIL = "domaman@naver.com";
  const ADMIN_PASS = "1111";

  const THEMES = ["dark", "light", "pastel"];
  const VIEW_RANGES = ["7d", "30d"];
  const DURATION_PRESETS = [15, 25, 50];
  const ANALOG_THEMES = ["a1", "a2", "a3"];
  const DIGITAL_THEMES = ["d1", "d2", "d3"];

  const TIMER_STATUS = { RUNNING: "running", PAUSED: "paused", FINISHED: "finished" };

  let db = null;
  let currentUser = null;
  let settings = { viewRange: "7d", theme: "dark" };
  let tasks = [];
  let focusByDate = {};
  let activeTimers = [];
  let rafId = null;
  let timerModalContext = null;

  const $ = (id) => document.getElementById(id);
  const authPanel = $("authPanel");
  const appPanel = $("appPanel");
  const workspacePage = $("workspacePage");
  const adminPage = $("adminPage");
  const workspaceTab = $("workspaceTab");
  const adminTab = $("adminTab");
  const themeSelect = $("themeSelect");
  const adminButton = $("adminButton");
  const logoutButton = $("logoutButton");
  const userInfo = $("userInfo");
  const backToWorkspaceBtn = $("backToWorkspace");
  const loginEmail = $("loginEmail");
  const loginPassword = $("loginPassword");
  const loginButton = $("loginButton");
  const registerEmail = $("registerEmail");
  const registerPassword = $("registerPassword");
  const registerButton = $("registerButton");
  const addTaskButton = $("addTaskButton");
  const taskTitleInput = $("taskTitleInput");
  const taskDueInput = $("taskDueInput");
  const taskListEl = $("taskList");
  const durationChips = $("durationChips");
  const activeTimersEl = $("activeTimers");
  const viewToggleButtons = Array.from(document.querySelectorAll(".view-toggle .chip"));
  const heatmapEl = $("heatmap");
  const barChartEl = $("barChart");
  const barAxisEl = $("barAxis");
  const todayMinutesEl = $("todayMinutes");
  const rangeTotalEl = $("rangeTotal");
  const rangeAverageEl = $("rangeAverage");
  const calendarMonthEl = $("calendarMonth");
  const calendarGridEl = $("calendarGrid");
  const noDueListEl = $("noDueList");
  const toastEl = $("toast");
  const backdropEl = $("backdrop");

  // Timer modal elements
  const timerModal = $("timerModal");
  const closeTimerModalBtn = $("closeTimerModal");
  const timerModalTask = $("timerModalTask");
  const timerModalTitle = $("timerModalTitle");
  const durationInput = $("durationInput");
  const secondsInput = $("secondsInput");
  const timerModeToggle = $("timerModeToggle");
  const digitalThemesEl = $("digitalThemes");
  const analogThemesEl = $("analogThemes");
  const startTimerConfirm = $("startTimerConfirm");
  const timerConfig = $("timerConfig");
  const timerRunning = $("timerRunning");
  const timerVisual = $("timerVisual");
  const digitalDisplay = $("digitalDisplay");
  const analogMin = $("analogMin");
  const analogSec = $("analogSec");
  const analogProgress = $("analogProgress");
  const pauseTimerBtn = $("pauseTimer");
  const resumeTimerBtn = $("resumeTimer");
  const finishTimerBtn = $("finishTimer");
  const timerMeta = $("timerMeta");

  const adminUserTable = $("adminUserTable");
  const adminUsageCards = $("adminUsageCards");
  const adminActivityBoard = $("adminActivityBoard");

  const dueModal = $("dueModal");
  const openDueModalBtn = $("openDueModal");
  const closeDueModalBtn = $("closeDueModal");
  const dueYearSelect = $("dueYear");
  const dueMonthSelect = $("dueMonth");
  const dueDaySelect = $("dueDay");
  const applyDueDateBtn = $("applyDueDate");
  const dueTodayBtn = $("dueToday");
  const dueNextWeekBtn = $("dueNextWeek");
  const dueClearBtn = $("dueClear");

  function showToast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add("show");
    setTimeout(() => toastEl.classList.remove("show"), 2400);
  }

  function uuid() {
    if (crypto.randomUUID) return crypto.randomUUID();
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function setActivePage(page) {
    if (!workspacePage || !adminPage || !workspaceTab || !adminTab) return;
    const isAdmin = page === "admin";
    workspacePage.classList.toggle("hidden", isAdmin);
    adminPage.classList.toggle("hidden", !isAdmin);
    workspaceTab.classList.toggle("active", !isAdmin);
    adminTab.classList.toggle("active", isAdmin);
  }

  // IndexedDB helpers
  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains("users")) {
          const users = db.createObjectStore("users", { keyPath: "id", autoIncrement: true });
          users.createIndex("email", "email", { unique: true });
        }
        if (!db.objectStoreNames.contains("tasks")) {
          const tasks = db.createObjectStore("tasks", { keyPath: "id" });
          tasks.createIndex("ownerId", "ownerId", { unique: false });
        }
        if (!db.objectStoreNames.contains("focus")) {
          const focus = db.createObjectStore("focus", { keyPath: "id" });
          focus.createIndex("ownerId", "ownerId", { unique: false });
        }
        if (!db.objectStoreNames.contains("sessions")) {
          const sessions = db.createObjectStore("sessions", { keyPath: "id" });
          sessions.createIndex("ownerId", "ownerId", { unique: false });
        }
        if (!db.objectStoreNames.contains("settings")) {
          db.createObjectStore("settings", { keyPath: "id" });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  function getStore(name, mode = "readonly") {
    const tx = db.transaction(name, mode);
    return tx.objectStore(name);
  }

  function getByKey(storeName, key) {
    return new Promise((resolve, reject) => {
      const req = getStore(storeName).get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  function getByIndex(storeName, indexName, value) {
    return new Promise((resolve, reject) => {
      const store = getStore(storeName);
      const idx = store.index(indexName);
      const req = idx.get(value);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  function getAllFromIndex(storeName, indexName, value) {
    return new Promise((resolve, reject) => {
      const store = getStore(storeName);
      const idx = store.index(indexName);
      const req = idx.getAll(value);
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  function getAll(storeName) {
    return new Promise((resolve, reject) => {
      const req = getStore(storeName).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  function put(storeName, value) {
    return new Promise((resolve, reject) => {
      const req = getStore(storeName, "readwrite").put(value);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  function del(storeName, key) {
    return new Promise((resolve, reject) => {
      const req = getStore(storeName, "readwrite").delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async function ensureAdminUser() {
    const existing = await getByIndex("users", "email", ADMIN_EMAIL).catch(() => null);
    if (!existing) {
      await put("users", {
        email: ADMIN_EMAIL,
        password: ADMIN_PASS,
        isAdmin: true,
        createdAt: Date.now()
      });
    }
  }

  async function loadSession() {
    const id = sessionStorage.getItem("currentUserId");
    if (!id) return;
    const user = await getByKey("users", Number(id));
    if (user) {
      currentUser = user;
    } else {
      sessionStorage.removeItem("currentUserId");
    }
  }

  function setSession(user) {
    currentUser = user;
    sessionStorage.setItem("currentUserId", user.id);
  }

  function clearSession() {
    currentUser = null;
    sessionStorage.removeItem("currentUserId");
    tasks = [];
    focusByDate = {};
    activeTimers = [];
    stopTicker();
    renderAll();
  }

  async function register() {
    const email = (registerEmail.value || "").trim();
    const password = (registerPassword.value || "").trim();
    if (!email || !password) return showToast("이메일과 패스워드를 입력하세요");
    const exists = await getByIndex("users", "email", email).catch(() => null);
    if (exists) return showToast("이미 가입된 이메일이에요");
    const id = await put("users", { email, password, isAdmin: false, createdAt: Date.now() });
    showToast("가입 완료! 로그인해 주세요");
    registerPassword.value = "";
    registerEmail.value = "";
    return id;
  }

  async function login() {
    const email = (loginEmail.value || "").trim();
    const password = (loginPassword.value || "").trim();
    if (!email || !password) return showToast("이메일과 패스워드를 입력하세요");
    const user = await getByIndex("users", "email", email).catch(() => null);
    if (!user || user.password !== password) return showToast("이메일 또는 패스워드가 맞지 않아요");
    setSession(user);
    await loadUserData();
    await loadSettings();
    applyTheme(settings.theme || "dark");
    renderAll();
    showToast("로그인 성공");
  }

  async function loadSettings() {
    if (!currentUser) return;
    const saved = await getByKey("settings", currentUser.id).catch(() => null);
    settings = {
      viewRange: saved?.viewRange || "7d",
      theme: saved?.theme || document.documentElement.getAttribute("data-theme") || "dark"
    };
    themeSelect.value = settings.theme;
    viewToggleButtons.forEach((btn) => btn.classList.toggle("active", btn.dataset.range === settings.viewRange));
  }

  async function saveSettings() {
    if (!currentUser) return;
    await put("settings", { id: currentUser.id, ...settings });
  }

  async function loadUserData() {
    if (!currentUser) return;
    tasks = await getAllFromIndex("tasks", "ownerId", currentUser.id);
    focusByDate = {};
    const focusRecords = await getAllFromIndex("focus", "ownerId", currentUser.id);
    focusRecords.forEach((rec) => {
      focusByDate[rec.dateKey] = rec.minutes;
    });
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    settings.theme = theme;
    themeSelect.value = theme;
    saveSettings();
  }

  function renderAuth() {
    const loggedIn = !!currentUser;
    authPanel.classList.toggle("hidden", loggedIn);
    appPanel.classList.toggle("hidden", !loggedIn);
    userInfo.textContent = loggedIn ? `${currentUser.email}${currentUser.isAdmin ? " (admin)" : ""}` : "로그인이 필요합니다";
    adminButton.classList.toggle("hidden", !loggedIn || !currentUser.isAdmin);
    adminTab?.classList.toggle("hidden", !currentUser?.isAdmin);
    logoutButton.classList.toggle("hidden", !loggedIn);
    if (loggedIn) setActivePage("workspace");
  }

  function recalcTaskProgress(task) {
    const totalWeight = task.subTasks.reduce((acc, s) => acc + (Number(s.weight) || 0), 0) || 1;
    task.subTasks = task.subTasks.map((s) => {
      const target = Number(s.targetMinutes) || 0;
      const spent = Number(s.spentMinutes) || 0;
      const progress = target > 0 ? Math.min(1, spent / target) * 100 : 0;
      return { ...s, progress };
    });
    task.progress = task.subTasks.reduce((acc, s) => {
      const weight = Number(s.weight) || 0;
      const normalized = weight / totalWeight;
      return acc + normalized * (s.progress || 0);
    }, 0);
  }

  async function saveTask(task) {
    recalcTaskProgress(task);
    await put("tasks", task);
  }

  async function addTask() {
    if (!currentUser) return;
    const title = (taskTitleInput.value || "").trim();
    if (!title) return showToast("주작업 제목을 입력하세요");
    const dueDate = taskDueInput.value || null;
    const newTask = {
      id: uuid(),
      ownerId: currentUser.id,
      title,
      dueDate,
      createdAt: Date.now(),
      subTasks: [],
      progress: 0
    };
    tasks.push(newTask);
    await saveTask(newTask);
    taskTitleInput.value = "";
    taskDueInput.value = "";
    renderTasks();
    renderCalendar();
  }

  async function addSubTask(taskId, title, weight, targetMinutes) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const sub = {
      id: uuid(),
      title,
      weight: Number(weight) || 0,
      targetMinutes: targetMinutes ? Number(targetMinutes) : null,
      spentMinutes: 0,
      progress: 0
    };
    task.subTasks.push(sub);
    await saveTask(task);
    renderTasks();
    renderCalendar();
  }

  async function updateSubTaskMeta(taskId, subId) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const sub = task.subTasks.find((s) => s.id === subId);
    if (!sub) return;
    const weight = prompt("보조작업 비중(%)을 입력하세요", sub.weight ?? 0);
    const target = prompt("목표 시간(분)을 입력하세요 (없으면 비워두기)", sub.targetMinutes ?? "");
    sub.weight = Number(weight) || 0;
    sub.targetMinutes = target ? Number(target) : null;
    await saveTask(task);
    renderTasks();
    renderCalendar();
  }

  function renderTasks() {
    taskListEl.innerHTML = "";
    if (!tasks.length) {
      const empty = document.createElement("p");
      empty.className = "helper";
      empty.textContent = "주작업을 추가해 보세요";
      taskListEl.appendChild(empty);
      return;
    }

    const sorted = [...tasks].sort((a, b) => a.createdAt - b.createdAt);
    sorted.forEach((task) => {
      const card = document.createElement("div");
      card.className = "task-card";

      const head = document.createElement("div");
      head.className = "task-head";

      const titleWrap = document.createElement("div");
      const titleEl = document.createElement("h3");
      titleEl.textContent = task.title;
      titleWrap.appendChild(titleEl);
      const meta = document.createElement("div");
      meta.className = "task-meta";
      meta.textContent = task.dueDate ? `마감 ${task.dueDate}` : "마감 없음";
      titleWrap.appendChild(meta);
      head.appendChild(titleWrap);

      const progressWrap = document.createElement("div");
      progressWrap.className = "task-progress";
      const bar = document.createElement("div");
      bar.className = "task-progress__bar";
      const fill = document.createElement("div");
      fill.className = "task-progress__fill";
      fill.style.width = `${Math.round(task.progress || 0)}%`;
      bar.appendChild(fill);
      const label = document.createElement("div");
      label.textContent = `${Math.round(task.progress || 0)}%`;
      progressWrap.appendChild(bar);
      progressWrap.appendChild(label);
      head.appendChild(progressWrap);
      card.appendChild(head);

      const subList = document.createElement("div");
      subList.className = "subtasks";
      if (!task.subTasks.length) {
        const emptySub = document.createElement("p");
        emptySub.className = "helper";
        emptySub.textContent = "보조작업을 추가해 타이머를 시작하세요";
        subList.appendChild(emptySub);
      } else {
        task.subTasks.forEach((sub) => {
          const row = document.createElement("div");
          row.className = "subtask-row";
          row.dataset.id = sub.id;

          const info = document.createElement("div");
          info.className = "subtask-info";
          const name = document.createElement("div");
          name.className = "subtask-title";
          name.textContent = sub.title;
          info.appendChild(name);
          const metaLine = document.createElement("div");
          metaLine.className = "subtask-meta";
          metaLine.textContent = `${sub.weight || 0}% · 목표 ${sub.targetMinutes || "미정"}분 · 누적 ${Math.round(sub.spentMinutes || 0)}분`;
          info.appendChild(metaLine);
          const prog = document.createElement("div");
          prog.className = "subtask-progress";
          const progFill = document.createElement("div");
          progFill.className = "subtask-progress__fill";
          progFill.style.width = `${Math.round(sub.progress || 0)}%`;
          prog.appendChild(progFill);
          info.appendChild(prog);

          const actions = document.createElement("div");
          actions.className = "subtask-actions";
          const startBtn = document.createElement("button");
          startBtn.className = "primary";
          startBtn.textContent = "타이머";
          startBtn.addEventListener("click", () => openTimerModal(task.id, sub.id));
          actions.appendChild(startBtn);

          const editBtn = document.createElement("button");
          editBtn.className = "ghost";
          editBtn.textContent = "비중/목표";
          editBtn.addEventListener("click", () => updateSubTaskMeta(task.id, sub.id));
          actions.appendChild(editBtn);

          row.appendChild(info);
          row.appendChild(actions);
          subList.appendChild(row);
        });
      }
      card.appendChild(subList);

      const subForm = document.createElement("div");
      subForm.className = "subtask-form";
      const subTitle = document.createElement("input");
      subTitle.placeholder = "보조작업 제목";
      const subWeight = document.createElement("input");
      subWeight.type = "number";
      subWeight.placeholder = "비중%";
      const subTarget = document.createElement("input");
      subTarget.type = "number";
      subTarget.placeholder = "목표 분 (선택)";
      const addSubBtn = document.createElement("button");
      addSubBtn.textContent = "보조 추가";
      addSubBtn.className = "secondary";
      addSubBtn.addEventListener("click", async () => {
        const title = (subTitle.value || "").trim();
        const weight = subWeight.value;
        const target = subTarget.value;
        if (!title) return showToast("보조작업 제목을 입력하세요");
        await addSubTask(task.id, title, weight, target);
        subTitle.value = "";
        subWeight.value = "";
        subTarget.value = "";
      });
      subForm.appendChild(subTitle);
      subForm.appendChild(subWeight);
      subForm.appendChild(subTarget);
      subForm.appendChild(addSubBtn);
      card.appendChild(subForm);

      taskListEl.appendChild(card);
    });
  }

  function renderDurationChips() {
    durationChips.innerHTML = "";
    DURATION_PRESETS.forEach((min) => {
      const btn = document.createElement("button");
      btn.className = "chip";
      btn.textContent = `${min}분`;
      btn.addEventListener("click", () => {
        durationInput.value = String(min);
        secondsInput.value = "0";
        showToast(`${min}분 프리셋이 선택되었습니다`);
      });
      durationChips.appendChild(btn);
    });
  }

  function renderActiveTimers() {
    activeTimersEl.innerHTML = "";
    if (!activeTimers.length) {
      const empty = document.createElement("p");
      empty.className = "helper";
      empty.textContent = "진행 중인 타이머가 없습니다";
      activeTimersEl.appendChild(empty);
      return;
    }

    activeTimers.forEach((timer) => {
      const card = document.createElement("div");
      card.className = "timer-card";

      const info = document.createElement("div");
      const title = document.createElement("div");
      title.textContent = timer.displayName;
      const meta = document.createElement("div");
      meta.className = "timer-meta";
      meta.textContent = `${timer.mode === "digital" ? "디지털" : "아날로그"} · ${Math.round(timer.durationMs / 60000)}분`;
      info.appendChild(title);
      info.appendChild(meta);

      const actions = document.createElement("div");
      actions.className = "subtask-actions";
      const remain = document.createElement("div");
      remain.className = "timer-remaining";
      remain.textContent = formatDuration(timer.durationMs - timer.elapsedMs);
      actions.appendChild(remain);

      const openBtn = document.createElement("button");
      openBtn.className = "ghost";
      openBtn.textContent = "보기";
      openBtn.addEventListener("click", () => openTimerModal(null, null, timer.id));
      actions.appendChild(openBtn);

      const pauseResume = document.createElement("button");
      pauseResume.className = timer.status === TIMER_STATUS.RUNNING ? "secondary" : "primary";
      pauseResume.textContent = timer.status === TIMER_STATUS.RUNNING ? "일시정지" : "재개";
      pauseResume.addEventListener("click", () => {
        if (timer.status === TIMER_STATUS.RUNNING) pauseTimer(timer.id);
        else resumeTimer(timer.id);
      });
      actions.appendChild(pauseResume);

      card.appendChild(info);
      card.appendChild(actions);
      activeTimersEl.appendChild(card);
    });
  }

  function formatDuration(ms) {
    const clamped = Math.max(ms, 0);
    const totalSeconds = Math.floor(clamped / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const centis = Math.floor((clamped % 1000) / 10);
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(centis).padStart(2, "0")}`;
  }

  function getLocalDateKey(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function getRangeDates(rangeKey) {
    const days = rangeKey === "30d" ? 30 : 7;
    const dates = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = days - 1; i >= 0; i -= 1) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      dates.push({ key: getLocalDateKey(d), label: `${d.getMonth() + 1}/${d.getDate()}` });
    }
    return dates;
  }

  function renderHeatmap(rangeKey) {
    const dates = getRangeDates(rangeKey);
    heatmapEl.innerHTML = "";
    heatmapEl.style.gridTemplateColumns = `repeat(${dates.length}, minmax(18px, 1fr))`;
    dates.forEach(({ key, label }) => {
      const minutes = focusByDate[key] || 0;
      const cell = document.createElement("div");
      cell.className = "heatmap__cell";
      cell.dataset.level = minutes >= 30 ? "high" : minutes >= 10 ? "mid" : "low";
      cell.dataset.label = `${label} · ${minutes}분`;
      cell.setAttribute("tabindex", "0");
      heatmapEl.appendChild(cell);
    });
    return dates;
  }

  function renderBarChart(dates) {
    barChartEl.innerHTML = "";
    barAxisEl.innerHTML = "";
    const values = dates.map(({ key }) => focusByDate[key] || 0);
    const max = Math.max(...values, 1);
    values.forEach((minutes) => {
      const bar = document.createElement("div");
      bar.className = "bar";
      bar.style.height = `${(minutes / max) * 100}%`;
      const label = document.createElement("div");
      label.className = "bar__value";
      label.textContent = minutes ? `${minutes}` : "";
      bar.appendChild(label);
      barChartEl.appendChild(bar);
    });
    dates.forEach(({ label }) => {
      const axis = document.createElement("div");
      axis.textContent = label;
      barAxisEl.appendChild(axis);
    });
  }

  function renderSummary(dates) {
    const todayKey = getLocalDateKey();
    const todayMinutes = focusByDate[todayKey] || 0;
    todayMinutesEl.textContent = `${todayMinutes}분`;
    const values = dates.map(({ key }) => focusByDate[key] || 0);
    const total = values.reduce((acc, cur) => acc + cur, 0);
    const average = Math.round(total / values.length);
    rangeTotalEl.textContent = `${total}분`;
    rangeAverageEl.textContent = `${average}분`;
  }

  function renderInsights() {
    const dates = renderHeatmap(settings.viewRange);
    renderBarChart(dates);
    renderSummary(dates);
  }

  function setViewRange(rangeKey) {
    settings.viewRange = rangeKey;
    viewToggleButtons.forEach((btn) => btn.classList.toggle("active", btn.dataset.range === rangeKey));
    saveSettings();
    renderInsights();
  }

  function renderCalendar() {
    const now = new Date();
    const monthName = `${now.getFullYear()}년 ${now.getMonth() + 1}월`;
    calendarMonthEl.textContent = monthName;
    calendarGridEl.innerHTML = "";
    noDueListEl.innerHTML = "";

    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    const startDay = first.getDay();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    for (let i = 0; i < startDay; i += 1) {
      const emptyCell = document.createElement("div");
      emptyCell.className = "calendar__cell";
      calendarGridEl.appendChild(emptyCell);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const cell = document.createElement("div");
      cell.className = "calendar__cell";
      const dateObj = new Date(now.getFullYear(), now.getMonth(), day);
      const key = getLocalDateKey(dateObj);
      const header = document.createElement("strong");
      header.textContent = String(day);
      cell.appendChild(header);

      const dueTasks = tasks.filter((t) => t.dueDate === key);
      dueTasks.forEach((t) => {
        const tag = document.createElement("div");
        tag.className = "calendar__tag due";
        tag.textContent = t.title;
        cell.appendChild(tag);
      });

      calendarGridEl.appendChild(cell);
    }

    const nodue = tasks.filter((t) => !t.dueDate);
    if (nodue.length) {
      const title = document.createElement("p");
      title.innerHTML = `<strong>마감 없음</strong>`;
      noDueListEl.appendChild(title);
      nodue.forEach((t) => {
        const tag = document.createElement("div");
        tag.className = "calendar__tag nodue";
        tag.textContent = t.title;
        noDueListEl.appendChild(tag);
      });
    } else {
      noDueListEl.textContent = "모든 작업에 마감일이 설정되어 있어요";
    }
  }

  function showBackdrop(show) {
    backdropEl.classList.toggle("show", show);
    document.body.classList.toggle("modal-open", show);
  }

  function syncBackdrop() {
    const shouldShow = (!timerModal?.classList.contains("hidden")) || (!dueModal?.classList.contains("hidden"));
    showBackdrop(shouldShow);
  }

  function initDuePickerOptions() {
    if (!dueYearSelect || !dueMonthSelect || !dueDaySelect) return;
    const currentYear = new Date().getFullYear();
    dueYearSelect.innerHTML = "";
    for (let y = currentYear - 1; y <= currentYear + 2; y += 1) {
      const opt = document.createElement("option");
      opt.value = String(y);
      opt.textContent = `${y}년`;
      dueYearSelect.appendChild(opt);
    }
    dueMonthSelect.innerHTML = "";
    for (let m = 1; m <= 12; m += 1) {
      const opt = document.createElement("option");
      opt.value = String(m);
      opt.textContent = `${m}월`;
      dueMonthSelect.appendChild(opt);
    }
  }

  function buildDayOptions(year, month, selectedDay) {
    if (!dueDaySelect) return;
    dueDaySelect.innerHTML = "";
    const daysInMonth = new Date(year, month, 0).getDate();
    for (let d = 1; d <= daysInMonth; d += 1) {
      const opt = document.createElement("option");
      opt.value = String(d);
      opt.textContent = `${d}일`;
      if (selectedDay && Number(selectedDay) === d) opt.selected = true;
      dueDaySelect.appendChild(opt);
    }
  }

  function setDuePickerFromDate(date) {
    if (!date || Number.isNaN(date.getTime())) return;
    dueYearSelect.value = String(date.getFullYear());
    dueMonthSelect.value = String(date.getMonth() + 1);
    buildDayOptions(date.getFullYear(), date.getMonth() + 1, date.getDate());
  }

  function getSelectedDueDate() {
    if (!dueYearSelect || !dueMonthSelect || !dueDaySelect) return null;
    const year = Number(dueYearSelect.value);
    const month = Number(dueMonthSelect.value);
    const day = Number(dueDaySelect.value);
    if (!year || !month || !day) return null;
    const date = new Date(year, month - 1, day);
    if (Number.isNaN(date.getTime())) return null;
    return date;
  }

  function openDueModal() {
    if (!dueModal) return;
    const base = taskDueInput.value ? new Date(taskDueInput.value) : new Date();
    const date = Number.isNaN(base.getTime()) ? new Date() : base;
    setDuePickerFromDate(date);
    dueModal.classList.remove("hidden");
    syncBackdrop();
  }

  function closeDueModal() {
    if (!dueModal) return;
    dueModal.classList.add("hidden");
    syncBackdrop();
  }

  function applyDueDate() {
    const date = getSelectedDueDate();
    if (!date) return showToast("올바른 날짜를 선택하세요");
    const key = getLocalDateKey(date);
    taskDueInput.value = key;
    closeDueModal();
    showToast(`마감일이 ${key}으로 설정되었습니다`);
  }

  function clearDueDate() {
    taskDueInput.value = "";
    closeDueModal();
    showToast("마감일이 비워졌어요");
  }

  function quickDue(days) {
    const base = new Date();
    base.setDate(base.getDate() + days);
    setDuePickerFromDate(base);
  }

  function openTimerModal(taskId, subTaskId, existingTimerId = null) {
    const isExisting = Boolean(existingTimerId);
    timerConfig.classList.toggle("hidden", isExisting);
    timerRunning.classList.toggle("hidden", !isExisting);

    if (isExisting) {
      const timer = activeTimers.find((t) => t.id === existingTimerId);
      if (!timer) return;
      timerModalContext = { mode: "view", timerId: timer.id };
      timerVisual.dataset.mode = timer.mode;
      timerVisual.dataset.digitalTheme = timer.digitalTheme;
      timerVisual.dataset.analogTheme = timer.analogTheme;
      timerModalTask.textContent = timer.parentTitle || "타이머";
      timerModalTitle.textContent = timer.displayName;
      updateTimerVisual(timer);
      togglePauseResumeButtons(timer.status);
    } else {
      const task = tasks.find((t) => t.id === taskId);
      const sub = task?.subTasks.find((s) => s.id === subTaskId);
      if (!task || !sub) return;
      timerModalContext = {
        mode: "create",
        taskId,
        subTaskId,
        timerMode: timerVisual.dataset.mode || "digital",
        analogTheme: timerVisual.dataset.analogTheme || "a1",
        digitalTheme: timerVisual.dataset.digitalTheme || "d1"
      };
      timerModalTask.textContent = task.title;
      timerModalTitle.textContent = sub.title;
      durationInput.value = String(sub.targetMinutes || 25);
      secondsInput.value = "0";
      timerModeToggle.querySelectorAll("button").forEach((btn) => btn.classList.toggle("active", btn.dataset.mode === timerModalContext.timerMode));
      selectThemeChip(digitalThemesEl, timerModalContext.digitalTheme);
      selectThemeChip(analogThemesEl, timerModalContext.analogTheme);
    }

    timerModal.classList.remove("hidden");
    syncBackdrop();
  }

  function closeTimerModal() {
    timerModal.classList.add("hidden");
    syncBackdrop();
    timerModalContext = null;
  }

  function selectThemeChip(container, value) {
    container.querySelectorAll("button").forEach((btn) => btn.classList.toggle("active", btn.dataset.value === value));
  }

  function togglePauseResumeButtons(status) {
    pauseTimerBtn.disabled = status !== TIMER_STATUS.RUNNING;
    resumeTimerBtn.disabled = status !== TIMER_STATUS.PAUSED;
  }

  function setupThemeChips() {
    digitalThemesEl.innerHTML = "";
    DIGITAL_THEMES.forEach((key) => {
      const btn = document.createElement("button");
      btn.className = "chip" + (key === "d1" ? " active" : "");
      btn.dataset.value = key;
      btn.textContent = key.toUpperCase();
      btn.addEventListener("click", () => {
        timerVisual.dataset.digitalTheme = key;
        if (timerModalContext) timerModalContext.digitalTheme = key;
        selectThemeChip(digitalThemesEl, key);
      });
      digitalThemesEl.appendChild(btn);
    });

    analogThemesEl.innerHTML = "";
    ANALOG_THEMES.forEach((key) => {
      const btn = document.createElement("button");
      btn.className = "chip" + (key === "a1" ? " active" : "");
      btn.dataset.value = key;
      btn.textContent = key.toUpperCase();
      btn.addEventListener("click", () => {
        timerVisual.dataset.analogTheme = key;
        if (timerModalContext) timerModalContext.analogTheme = key;
        selectThemeChip(analogThemesEl, key);
      });
      analogThemesEl.appendChild(btn);
    });
  }

  function setupModeToggle() {
    timerModeToggle.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => {
        timerModeToggle.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const mode = btn.dataset.mode;
        timerVisual.dataset.mode = mode;
        if (timerModalContext) timerModalContext.timerMode = mode;
      });
    });
  }

  function createTimer(task, sub, config) {
    const durationMs = config.durationMs;
    const timer = {
      id: uuid(),
      taskId: task.id,
      subTaskId: sub.id,
      parentTitle: task.title,
      displayName: sub.title,
      durationMs,
      elapsedMs: 0,
      offsetMs: 0,
      status: TIMER_STATUS.RUNNING,
      mode: config.mode || "digital",
      analogTheme: config.analogTheme || "a1",
      digitalTheme: config.digitalTheme || "d1",
      startedAt: performance.now(),
      createdAt: Date.now()
    };
    return timer;
  }

  async function startTimerFromModal() {
    if (!timerModalContext || timerModalContext.mode !== "create") return;
    const task = tasks.find((t) => t.id === timerModalContext.taskId);
    const sub = task?.subTasks.find((s) => s.id === timerModalContext.subTaskId);
    if (!task || !sub) return;
    const minutes = Number(durationInput.value) || 0;
    const seconds = Number(secondsInput.value) || 0;
    const totalSeconds = minutes * 60 + seconds;
    if (totalSeconds < 1) return showToast("1초 이상 설정하세요");
    const durationMs = totalSeconds * 1000;
    const timer = createTimer(task, sub, {
      durationMs,
      mode: timerModalContext.timerMode || "digital",
      analogTheme: timerModalContext.analogTheme || "a1",
      digitalTheme: timerModalContext.digitalTheme || "d1"
    });

    if (!sub.targetMinutes) {
      sub.targetMinutes = Math.round(durationMs / 60000);
      await saveTask(task);
    }

    activeTimers.push(timer);
    ensureTicker();
    renderActiveTimers();
    openTimerModal(null, null, timer.id);
    showToast("타이머가 시작되었습니다");
  }

  function ensureTicker() {
    if (rafId) return;
    const step = (timestamp) => {
      tickTimers(timestamp);
      rafId = activeTimers.some((t) => t.status === TIMER_STATUS.RUNNING) ? requestAnimationFrame(step) : null;
    };
    rafId = requestAnimationFrame(step);
  }

  function stopTicker() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  }

  function tickTimers(timestamp) {
    activeTimers.forEach((timer) => {
      if (timer.status !== TIMER_STATUS.RUNNING) return;
      const elapsed = timestamp - timer.startedAt + (timer.offsetMs || 0);
      timer.elapsedMs = Math.min(elapsed, timer.durationMs);
      if (timer.elapsedMs >= timer.durationMs) {
        completeTimer(timer.id);
      }
    });
    updateRunningView();
    renderActiveTimers();
  }

  async function completeTimer(timerId) {
    const timer = activeTimers.find((t) => t.id === timerId);
    if (!timer || timer.status === TIMER_STATUS.FINISHED) return;
    const elapsedMs = Math.min(timer.elapsedMs || 0, timer.durationMs);
    const minutes = Math.max(1, Math.round(elapsedMs / 60000));
    timer.status = TIMER_STATUS.FINISHED;
    timer.elapsedMs = elapsedMs;
    const dateKey = getLocalDateKey();
    focusByDate[dateKey] = (focusByDate[dateKey] || 0) + minutes;
    await put("focus", { id: `${currentUser.id}-${dateKey}`, ownerId: currentUser.id, dateKey, minutes: focusByDate[dateKey] });
    await logSession(timer, minutes);
    await updateSubTaskProgress(timer, minutes);
    activeTimers = activeTimers.filter((t) => t.id !== timerId);
    renderInsights();
    renderTasks();
    renderActiveTimers();
    showToast(`${timer.displayName} 완료! ${minutes}분 기록`);
    if (!activeTimers.some((t) => t.status === TIMER_STATUS.RUNNING)) stopTicker();
    if (timerModalContext?.timerId === timerId) closeTimerModal();
  }

  async function logSession(timer, minutes) {
    await put("sessions", {
      id: uuid(),
      ownerId: currentUser.id,
      taskId: timer.taskId,
      subTaskId: timer.subTaskId,
      minutes,
      completedAt: Date.now()
    });
  }

  async function updateSubTaskProgress(timer, minutes) {
    const task = tasks.find((t) => t.id === timer.taskId);
    const sub = task?.subTasks.find((s) => s.id === timer.subTaskId);
    if (!task || !sub) return;
    sub.spentMinutes = (sub.spentMinutes || 0) + minutes;
    recalcTaskProgress(task);
    await saveTask(task);
    renderCalendar();
  }

  function pauseTimer(timerId) {
    const timer = activeTimers.find((t) => t.id === timerId);
    if (!timer || timer.status !== TIMER_STATUS.RUNNING) return;
    timer.offsetMs = timer.elapsedMs;
    timer.status = TIMER_STATUS.PAUSED;
    renderActiveTimers();
    if (timerModalContext?.timerId === timerId) togglePauseResumeButtons(timer.status);
  }

  function resumeTimer(timerId) {
    const timer = activeTimers.find((t) => t.id === timerId);
    if (!timer || timer.status !== TIMER_STATUS.PAUSED) return;
    timer.startedAt = performance.now();
    timer.status = TIMER_STATUS.RUNNING;
    ensureTicker();
    renderActiveTimers();
    if (timerModalContext?.timerId === timerId) togglePauseResumeButtons(timer.status);
  }

  function finishTimerEarly() {
    if (!timerModalContext || !timerModalContext.timerId) return;
    completeTimer(timerModalContext.timerId);
  }

  function updateRunningView() {
    if (!timerModalContext || !timerModalContext.timerId) return;
    const timer = activeTimers.find((t) => t.id === timerModalContext.timerId);
    if (!timer) return;
    updateTimerVisual(timer);
    togglePauseResumeButtons(timer.status);
  }

  function updateTimerVisual(timer) {
    const remaining = timer.durationMs - timer.elapsedMs;
    digitalDisplay.textContent = formatDuration(remaining);
    timerMeta.textContent = `${timer.parentTitle} · ${timer.displayName}`;
    const progressRatio = Math.max(1 - remaining / timer.durationMs, 0);
    const minDeg = (progressRatio * 360) % 360;
    const secDeg = ((timer.elapsedMs / 1000) * 6) % 360;
    analogMin.style.transform = `translate(-50%, -100%) rotate(${minDeg}deg)`;
    analogSec.style.transform = `translate(-50%, -100%) rotate(${secDeg}deg)`;
    analogProgress.style.borderColor = "transparent";
    analogProgress.style.background = `conic-gradient(var(--primary) ${progressRatio * 360}deg, rgba(255,255,255,0.05) 0deg)`;
  }

  function attachEvents() {
    loginButton.addEventListener("click", login);
    registerButton.addEventListener("click", register);
    logoutButton.addEventListener("click", () => { clearSession(); renderAuth(); });
    addTaskButton.addEventListener("click", addTask);
    taskDueInput.addEventListener("click", (e) => { e.preventDefault(); openDueModal(); });
    openDueModalBtn?.addEventListener("click", openDueModal);

    themeSelect.addEventListener("change", (e) => applyTheme(e.target.value));

    viewToggleButtons.forEach((btn) => btn.addEventListener("click", () => setViewRange(btn.dataset.range)));

    startTimerConfirm.addEventListener("click", startTimerFromModal);
    closeTimerModalBtn.addEventListener("click", closeTimerModal);
    pauseTimerBtn.addEventListener("click", () => timerModalContext?.timerId && pauseTimer(timerModalContext.timerId));
    resumeTimerBtn.addEventListener("click", () => timerModalContext?.timerId && resumeTimer(timerModalContext.timerId));
    finishTimerBtn.addEventListener("click", finishTimerEarly);

    workspaceTab?.addEventListener("click", () => setActivePage("workspace"));
    adminTab?.addEventListener("click", openAdminPage);
    adminButton.addEventListener("click", openAdminPage);
    backToWorkspaceBtn?.addEventListener("click", () => setActivePage("workspace"));

    closeDueModalBtn?.addEventListener("click", closeDueModal);
    applyDueDateBtn?.addEventListener("click", applyDueDate);
    dueYearSelect?.addEventListener("change", () => buildDayOptions(Number(dueYearSelect.value), Number(dueMonthSelect.value), Number(dueDaySelect.value)));
    dueMonthSelect?.addEventListener("change", () => buildDayOptions(Number(dueYearSelect.value), Number(dueMonthSelect.value), Number(dueDaySelect.value)));
    dueTodayBtn?.addEventListener("click", () => setDuePickerFromDate(new Date()));
    dueNextWeekBtn?.addEventListener("click", () => { const d = new Date(); d.setDate(d.getDate() + 7); setDuePickerFromDate(d); });
    dueClearBtn?.addEventListener("click", clearDueDate);

    backdropEl.addEventListener("click", () => {
      if (!timerModal.classList.contains("hidden")) closeTimerModal();
      if (!dueModal.classList.contains("hidden")) closeDueModal();
    });
  }

  async function openAdminPage() {
    if (!currentUser?.isAdmin) return;
    setActivePage("admin");
    await renderAdminDashboard();
  }

  function buildUserUsageRows(users, focus, sessions, allTasks) {
    const now = Date.now();
    return users.map((u) => {
      const minutes = focus.filter((f) => f.ownerId === u.id).reduce((acc, cur) => acc + (cur.minutes || 0), 0);
      const userSessions = sessions.filter((s) => s.ownerId === u.id);
      const sessionCount = userSessions.length;
      const taskCount = allTasks.filter((t) => t.ownerId === u.id).length;
      const lastSessionAt = userSessions.reduce((acc, s) => Math.max(acc, s.completedAt || 0), 0);
      const daysAgo = lastSessionAt ? Math.floor((now - lastSessionAt) / 86400000) : null;
      let status = "미사용";
      if (daysAgo === null) status = "미사용";
      else if (daysAgo <= 3) status = "활성";
      else if (daysAgo <= 7) status = "주의";
      else status = "휴면";
      return { ...u, minutes, sessionCount, taskCount, lastSessionAt, daysAgo, status };
    });
  }

  function renderAdminUsage(rows, sessions) {
    if (!adminUsageCards || !adminActivityBoard) return;
    adminUsageCards.innerHTML = "";
    adminActivityBoard.innerHTML = "";

    const totalMinutes = rows.reduce((acc, r) => acc + r.minutes, 0);
    const activeUsers = rows.filter((r) => r.daysAgo !== null && r.daysAgo <= 7).length;
    const avgPerSession = sessions.length ? Math.round(totalMinutes / sessions.length) : 0;

    const cardData = [
      { label: "총 회원", value: `${rows.length}명`, helper: "가입된 전체 사용자" },
      { label: "최근 7일 활성", value: `${activeUsers}명`, helper: "최근 7일 세션 기록" },
      { label: "누적 집중 시간", value: `${totalMinutes}분`, helper: "모든 사용자의 누적 분" },
      { label: "세션당 평균", value: sessions.length ? `${avgPerSession}분` : "데이터 없음", helper: "기록된 세션 기준" }
    ];

    cardData.forEach((item) => {
      const card = document.createElement("div");
      card.className = "stat-card";
      card.innerHTML = `<p class="eyebrow">${item.label}</p><div class="summary__value">${item.value}</div><p class="helper">${item.helper}</p>`;
      adminUsageCards.appendChild(card);
    });

    if (!rows.length) {
      const empty = document.createElement("p");
      empty.className = "helper";
      empty.textContent = "아직 가입된 사용자가 없습니다";
      adminActivityBoard.appendChild(empty);
      return;
    }

    const sorted = [...rows].sort((a, b) => {
      const aScore = a.daysAgo === null ? 999 : a.daysAgo;
      const bScore = b.daysAgo === null ? 999 : b.daysAgo;
      return aScore - bScore;
    });

    sorted.forEach((r) => {
      const card = document.createElement("div");
      card.className = "activity-card";
      const left = document.createElement("div");
      const title = document.createElement("div");
      title.textContent = r.email;
      const meta = document.createElement("div");
      meta.className = "helper";
      const lastSeen = r.daysAgo === null ? "기록 없음" : r.daysAgo === 0 ? "오늘" : `${r.daysAgo}일 전`;
      meta.textContent = `${r.isAdmin ? "관리자" : "사용자"} · 최근 ${lastSeen}`;
      left.appendChild(title);
      left.appendChild(meta);

      const right = document.createElement("div");
      const status = document.createElement("span");
      const statusKey = r.status === "활성" ? "active" : r.status === "주의" ? "warm" : r.status === "휴면" ? "idle" : "new";
      status.className = `status-badge status-${statusKey}`;
      status.textContent = r.status;
      right.appendChild(status);
      const statsLine = document.createElement("div");
      statsLine.className = "helper";
      statsLine.textContent = `세션 ${r.sessionCount} · 누적 ${r.minutes}분 · 작업 ${r.taskCount}`;
      right.appendChild(statsLine);

      card.appendChild(left);
      card.appendChild(right);
      adminActivityBoard.appendChild(card);
    });
  }

  async function renderAdminDashboard() {
    if (!currentUser?.isAdmin) return;
    const users = await getAll("users");
    const focus = await getAll("focus");
    const sessions = await getAll("sessions");
    const allTasks = await getAll("tasks");
    const rows = buildUserUsageRows(users, focus, sessions, allTasks);
    renderAdminUsage(rows, sessions);
    renderAdminTable(rows);
  }

  function renderAdminTable(rows) {
    if (!adminUserTable) return;
    const table = document.createElement("table");
    const thead = document.createElement("thead");
    thead.innerHTML = "<tr><th>이메일</th><th>권한</th><th>상태</th><th>세션수</th><th>누적 분</th><th>작업수</th><th>최근 활동</th><th>비번 변경</th></tr>";
    table.appendChild(thead);
    const tbody = document.createElement("tbody");
    rows.forEach((r) => {
      const lastSeen = r.daysAgo === null ? "-" : r.daysAgo === 0 ? "오늘" : `${r.daysAgo}일 전`;
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${r.email}</td><td>${r.isAdmin ? "관리자" : "사용자"}</td><td>${r.status}</td><td>${r.sessionCount}</td><td>${r.minutes}</td><td>${r.taskCount}</td><td>${lastSeen}</td>`;
      const actionTd = document.createElement("td");
      const btn = document.createElement("button");
      btn.textContent = "재설정";
      btn.className = "ghost";
      btn.addEventListener("click", async () => {
        const pw = prompt("새 비밀번호", "");
        if (!pw) return;
        await put("users", { ...r, password: pw });
        showToast("비밀번호가 변경되었습니다");
      });
      actionTd.appendChild(btn);
      tr.appendChild(actionTd);
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    adminUserTable.innerHTML = "";
    adminUserTable.appendChild(table);
  }

  function renderAll() {
    renderAuth();
    if (!currentUser) return;
    renderTasks();
    renderDurationChips();
    renderActiveTimers();
    renderInsights();
    renderCalendar();
    if (!adminPage?.classList.contains("hidden") && currentUser.isAdmin) {
      renderAdminDashboard();
    }
  }

  async function init() {
    db = await openDatabase();
    await ensureAdminUser();
    await loadSession();
    if (currentUser) {
      await loadUserData();
      await loadSettings();
      applyTheme(settings.theme || "dark");
    }
    setupThemeChips();
    setupModeToggle();
    initDuePickerOptions();
    setActivePage("workspace");
    renderAll();
    attachEvents();
  }

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) renderActiveTimers();
  });

  init();
})();
