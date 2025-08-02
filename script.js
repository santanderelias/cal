document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('.nav-link');
    const pages = document.querySelectorAll('.page');

    function showPage(pageId) {
        pages.forEach(page => {
            if (page.id === pageId) {
                page.classList.remove('d-none');
            } else {
                page.classList.add('d-none');
            }
        });
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const pageId = link.getAttribute('data-page');

            navLinks.forEach(navLink => navLink.classList.remove('active'));
            link.classList.add('active');

            showPage(pageId);
            // Store the last visited page
            localStorage.setItem('lastVisitedPage', pageId);
        });
    });

    // --- Developer Mode Settings ---
    function getDevSettings() {
        const settings = localStorage.getItem('devSettings');
        return settings ? JSON.parse(settings) : {
            devModeEnabled: false,
            launchToLastSection: true // Default to old behavior
        };
    }

    function saveDevSettings(settings) {
        localStorage.setItem('devSettings', JSON.stringify(settings));
    }

    // Check for a stored last visited page (respecting dev setting)
    const devSettings = getDevSettings();
    let initialPage = 'start-page'; // Default
    if (devSettings.launchToLastSection) {
        const lastVisitedPage = localStorage.getItem('lastVisitedPage');
        if (lastVisitedPage) {
            initialPage = lastVisitedPage;
        }
    }

    // Set the active link and show the corresponding page
    const activeLink = document.querySelector(`.nav-link[data-page="${initialPage}"]`);
    if (activeLink) {
        // Remove active class from all links first
        navLinks.forEach(link => link.classList.remove('active'));
        activeLink.classList.add('active');
        showPage(initialPage);
    } else {
        // Fallback to start page if the stored page is invalid
        document.querySelector('.nav-link[data-page="start-page"]').classList.add('active');
        showPage('start-page');
    }

    // Centralized state management for today's date for consistency
    const getTodayString = () => new Date().toISOString().slice(0, 10);

    // Theming Engine
    const themeSelect = document.getElementById('theme-select');
    const customThemeSettings = document.getElementById('custom-theme-settings');
    const contentBgColorInput = document.getElementById('content-bg-color');
    const navbarBgColorInput = document.getElementById('navbar-bg-color');
    const contentArea = document.getElementById('content');
    const navbar = document.getElementById('navbar');
    const body = document.body;

    const THEME_CLASSES = {
        light: { body: 'bg-light text-dark', navbar: 'bg-light' },
        dark: { body: 'bg-dark text-white', navbar: 'bg-dark' },
        primary: { body: 'bg-primary text-white', navbar: 'bg-primary' }
    };

    function applyTheme(theme) {
        // Remove all potential theme classes and reset styles
        Object.values(THEME_CLASSES).forEach(themeClass => {
            body.classList.remove(...themeClass.body.split(' '));
            navbar.classList.remove(themeClass.navbar);
        });
        contentArea.style.backgroundColor = '';
        navbar.style.backgroundColor = '';
        body.style.backgroundColor = ''; // Also reset body background
        body.style.color = ''; // and text color

        if (theme === 'custom') {
            customThemeSettings.classList.remove('d-none');
            const customSettings = getThemeSettings();
            applyCustomColors(customSettings.contentBg, customSettings.navbarBg);
        } else {
            customThemeSettings.classList.add('d-none');
            const themeClasses = THEME_CLASSES[theme];
            if (themeClasses) {
                const bodyClasses = themeClasses.body.split(' ');
                body.classList.add(...bodyClasses);
                navbar.classList.add(themeClasses.navbar);
            }
        }
    }

    function applyCustomColors(contentBg, navbarBg) {
        contentArea.style.backgroundColor = contentBg;
        navbar.style.backgroundColor = navbarBg;
    }

    function saveThemeSettings(settings) {
        localStorage.setItem('themeSettings', JSON.stringify(settings));
    }

    function getThemeSettings() {
        const settings = localStorage.getItem('themeSettings');
        return settings ? JSON.parse(settings) : {
            theme: 'light',
            contentBg: '#ffffff',
            navbarBg: '#f8f9fa'
        };
    }

    // Event Listeners for Theming
    themeSelect.addEventListener('change', () => {
        const selectedTheme = themeSelect.value;
        const settings = getThemeSettings();
        settings.theme = selectedTheme;
        saveThemeSettings(settings);
        applyTheme(selectedTheme);
    });

    contentBgColorInput.addEventListener('input', () => {
        const settings = getThemeSettings();
        settings.contentBg = contentBgColorInput.value;
        saveThemeSettings(settings);
        applyCustomColors(settings.contentBg, settings.navbarBg);
    });

    navbarBgColorInput.addEventListener('input', () => {
        const settings = getThemeSettings();
        settings.navbarBg = navbarBgColorInput.value;
        saveThemeSettings(settings);
        applyCustomColors(settings.contentBg, settings.navbarBg);
    });

    // Initial Theme Load
    function loadTheme() {
        const settings = getThemeSettings();
        themeSelect.value = settings.theme;
        contentBgColorInput.value = settings.contentBg;
        navbarBgColorInput.value = settings.navbarBg;
        applyTheme(settings.theme);
    }

    loadTheme();

    // Data Management (Import/Export)
    const exportBtn = document.getElementById('export-data-btn');
    const importBtn = document.getElementById('import-data-btn');
    const importFileInput = document.getElementById('import-file-input');

    exportBtn.addEventListener('click', () => {
        const dataToExport = {
            themeSettings: getThemeSettings(),
            lastVisitedPage: localStorage.getItem('lastVisitedPage'),
            tasks: JSON.parse(localStorage.getItem('tasks') || '[]') // Assume tasks are stored here
        };

        const dataStr = JSON.stringify(dataToExport, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `task-tracker-data-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    importBtn.addEventListener('click', () => {
        importFileInput.click();
    });

    importFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) {
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);

                if (importedData.themeSettings) {
                    saveThemeSettings(importedData.themeSettings);
                }
                if (importedData.lastVisitedPage) {
                    localStorage.setItem('lastVisitedPage', importedData.lastVisitedPage);
                }
                if (importedData.tasks && Array.isArray(importedData.tasks)) {
                    localStorage.setItem('tasks', JSON.stringify(importedData.tasks));
                }

                alert('Data imported successfully! The app will now reload.');
                location.reload();

            } catch (error) {
                alert('Error importing data: Invalid JSON file.');
                console.error('Import error:', error);
            }
        };
        reader.readAsText(file);
        importFileInput.value = '';
    });

    // Task Management
    const taskForm = document.getElementById('task-form');
    const taskModalEl = document.getElementById('task-modal');
    const taskModal = new bootstrap.Modal(taskModalEl);
    const taskModalLabel = document.getElementById('task-modal-label');
    const addTaskBtn = document.getElementById('add-task-btn');

    function getTasks() {
        let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        // Migration for new properties
        let needsSave = false;
        tasks.forEach((task, index) => {
            if (task.sortOrder === undefined) {
                task.sortOrder = (index + 1) * 1000; // Give existing tasks a spread-out order
                needsSave = true;
            }
            if (task.subtasks === undefined) {
                task.subtasks = [];
                needsSave = true;
            }
        });
        if(needsSave) saveTasks(tasks);
        return tasks;
    }

    function saveTasks(tasks) {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const taskId = document.getElementById('task-id').value;
        const task = {
            id: taskId || Date.now().toString(),
            title: document.getElementById('task-title').value,
            description: document.getElementById('task-description').value,
            priority: document.getElementById('task-priority').value,
            dueDate: document.getElementById('task-due-date').value,
            tags: document.getElementById('task-tags').value.split(',').map(tag => tag.trim()).filter(tag => tag),
            notes: document.getElementById('task-notes').value,
            recurrence: document.getElementById('task-recurrence').value,
            // isComplete is deprecated for this new model, use completedOn
        };

        let tasks = getTasks();
        const existingTaskIndex = tasks.findIndex(t => t.id === task.id);

        if (existingTaskIndex > -1) {
            // Preserve existing completion data
            task.completedOn = tasks[existingTaskIndex].completedOn || [];
            tasks[existingTaskIndex] = task;
        } else {
            task.completedOn = []; // New tasks start with no completions
            tasks.push(task);
        }
        task.subtasks = subtasksForCurrentTask; // Add subtasks

        saveTasks(tasks);
        taskModal.hide();
        // renderTasks(); // To be implemented
    });

    // --- Subtask management in Modal ---
    const newSubtaskInput = document.getElementById('new-subtask-input');
    const addSubtaskBtnModal = document.getElementById('add-subtask-btn-modal');
    const subtaskListModalDiv = document.getElementById('subtask-list-modal');
    let subtasksForCurrentTask = [];

    function renderSubtasksInModal() {
        subtaskListModalDiv.innerHTML = '';
        subtasksForCurrentTask.forEach((subtask, index) => {
            const subtaskEl = document.createElement('div');
            subtaskEl.className = 'd-flex justify-content-between align-items-center mb-1 p-2 border rounded';
            subtaskEl.innerHTML = `
                <span class="flex-grow-1">${subtask.text}</span>
                <button type="button" class="btn btn-sm btn-outline-danger remove-subtask-btn" data-index="${index}">&times;</button>
            `;
            subtaskListModalDiv.appendChild(subtaskEl);
        });
    }

    addSubtaskBtnModal.addEventListener('click', () => {
        const text = newSubtaskInput.value.trim();
        if (text) {
            subtasksForCurrentTask.push({ text, isComplete: false });
            newSubtaskInput.value = '';
            renderSubtasksInModal();
        }
    });

    subtaskListModalDiv.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-subtask-btn')) {
            const index = parseInt(e.target.dataset.index, 10);
            subtasksForCurrentTask.splice(index, 1);
            renderSubtasksInModal();
        }
    });

    // Reset form and modal title when modal is about to be shown for adding a new task
    addTaskBtn.addEventListener('click', () => {
        taskModalLabel.textContent = 'Add Task';
        taskForm.reset();
        document.getElementById('task-id').value = '';
        subtasksForCurrentTask = [];
        renderSubtasksInModal();
    });

    // Clear form when modal is hidden
    taskModalEl.addEventListener('hidden.bs.modal', () => {
        taskForm.reset();
        document.getElementById('task-id').value = '';
        subtasksForCurrentTask = [];
    });

    // Task Filtering
    let taskFilterState = { priority: 'all' };
    const priorityFilter = document.getElementById('priority-filter');

    if (priorityFilter) {
        priorityFilter.addEventListener('change', () => {
            taskFilterState.priority = priorityFilter.value;
            saveFilterState();
            renderTasks();
        });
    }

    function saveFilterState() {
        localStorage.setItem('taskFilterState', JSON.stringify(taskFilterState));
    }

    function loadFilterState() {
        const savedState = localStorage.getItem('taskFilterState');
        if (savedState) {
            taskFilterState = JSON.parse(savedState);
        }
        priorityFilter.value = taskFilterState.priority;
    }

    priorityFilter.addEventListener('change', () => {
        taskFilterState.priority = priorityFilter.value;
        saveFilterState();
        renderTasks();
    });

    // Task Rendering
    const tasksPage = document.getElementById('tasks-page');
    const todayTaskListContainer = document.getElementById('today-task-list');
    const upcomingTaskListContainer = document.getElementById('upcoming-task-list');

    function renderSingleTaskList(tasks, container, emptyMessage) {
        container.innerHTML = '';
        if (tasks.length === 0) {
            container.innerHTML = `<p class="text-center text-muted">${emptyMessage}</p>`;
            return;
        }

        tasks.forEach(taskInstance => {
            const priorityColors = { low: 'success', medium: 'warning', high: 'danger' };
            const priorityColor = priorityColors[taskInstance.priority] || 'secondary';
            const tagsHTML = taskInstance.tags.map(tag => `<span class="badge bg-secondary me-1">${tag}</span>`).join('');

            const taskCard = document.createElement('div');
            const isInstanceComplete = taskInstance.completedOn.includes(taskInstance.dueDate);
            taskCard.className = `card mb-3 ${isInstanceComplete ? 'task-complete' : ''}`;
            taskCard.dataset.taskId = taskInstance.id;
            taskCard.dataset.instanceDate = taskInstance.dueDate;
            taskCard.draggable = true;

            const recurrenceHTML = taskInstance.recurrence !== 'none'
                ? `<span class="badge bg-info me-2 text-capitalize">${taskInstance.recurrence}</span>`
                : '';

            const subtasksHTML = (taskInstance.subtasks && taskInstance.subtasks.length > 0)
                ? `
                <div class="mt-3">
                    <h6 class="mb-1">Subtasks:</h6>
                    ${taskInstance.subtasks.map((subtask, index) => `
                        <div class="form-check">
                            <input class="form-check-input subtask-checkbox" type="checkbox" ${subtask.isComplete ? 'checked' : ''} id="subtask-${taskInstance.id}-${index}" data-subtask-index="${index}">
                            <label class="form-check-label ${subtask.isComplete ? 'text-decoration-line-through text-muted' : ''}" for="subtask-${taskInstance.id}-${index}">
                                ${subtask.text}
                            </label>
                        </div>
                    `).join('')}
                </div>
                ` : '';

            taskCard.innerHTML = `
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start">
                        <h5 class="card-title mb-1">${taskInstance.title}</h5>
                        <div>
                            ${recurrenceHTML}
                            <span class="badge bg-${priorityColor} text-capitalize">${taskInstance.priority}</span>
                        </div>
                    </div>
                    <p class="card-text text-muted mb-2"><small>Due: ${taskInstance.dueDate || 'N/A'}</small></p>
                    <p class="card-text">${taskInstance.description || ''}</p>
                    ${subtasksHTML}
                    ${taskInstance.notes ? `<p class="card-text fst-italic border-start border-2 ps-2 mt-3"><strong>Notes:</strong> ${taskInstance.notes}</p>` : ''}
                    <div class="mt-3">${tagsHTML}</div>
                    <div class="d-flex justify-content-end mt-3">
                        <button class="btn btn-sm btn-success complete-btn me-2" ${isInstanceComplete ? 'disabled' : ''}>Complete</button>
                        <button class="btn btn-sm btn-outline-secondary me-2 edit-btn">Edit</button>
                        <button class="btn btn-sm btn-outline-danger delete-btn">Delete</button>
                    </div>
                </div>
            `;
            container.appendChild(taskCard);
        });
    }

    function renderTasks() {
        // --- Today's Tasks ---
        const todayStr = getTodayString();
        let todayTasks = generateDisplayTasks(todayStr, todayStr);
        if (taskFilterState.priority !== 'all') {
            todayTasks = todayTasks.filter(task => task.priority === taskFilterState.priority);
        }
        todayTasks.sort((a, b) => a.sortOrder - b.sortOrder);
        renderSingleTaskList(todayTasks, todayTaskListContainer, 'No tasks due today that match the current filter.');

        // --- Upcoming Tasks (Next 7 Days) ---
        const tomorrow = new Date(todayStr);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const sevenDaysLater = new Date(todayStr);
        sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

        const tomorrowStr = tomorrow.toISOString().slice(0, 10);
        const sevenDaysLaterStr = sevenDaysLater.toISOString().slice(0, 10);

        let upcomingTasks = generateDisplayTasks(tomorrowStr, sevenDaysLaterStr);
        if (taskFilterState.priority !== 'all') {
            upcomingTasks = upcomingTasks.filter(task => task.priority === taskFilterState.priority);
        }
        upcomingTasks.sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.sortOrder - b.sortOrder);
        renderSingleTaskList(upcomingTasks, upcomingTaskListContainer, 'No upcoming tasks for the next 7 days.');
    }

    // --- Drag and Drop Logic ---
    let draggedTaskId = null;

    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.card:not(.dragging)')];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    if (tasksPage) {
        tasksPage.addEventListener('dragstart', e => {
            if (e.target.classList.contains('card')) {
                draggedTaskId = e.target.dataset.taskId;
                // Timeout to allow the browser to create a drag image before applying the class
                setTimeout(() => e.target.classList.add('dragging'), 0);
             }
        });
    }

    tasksPage.addEventListener('dragend', e => {
        if (e.target.classList.contains('card')) {
            e.target.classList.remove('dragging');
            draggedTaskId = null;
        }
    });

    tasksPage.addEventListener('dragover', e => {
        e.preventDefault();
        const container = e.target.closest('#today-task-list, #upcoming-task-list');
        if (!container) return;

        const afterElement = getDragAfterElement(container, e.clientY);
        const draggingElement = document.querySelector('.dragging');
        if (draggingElement) {
            if (afterElement == null) {
                container.appendChild(draggingElement);
            } else {
                container.insertBefore(draggingElement, afterElement);
            }
        }
    });

    tasksPage.addEventListener('drop', e => {
        e.preventDefault();
        if (!draggedTaskId) return;

        const afterElement = getDragAfterElement(taskListContainer, e.clientY);
        let tasks = getTasks();
        const draggedTaskIndex = tasks.findIndex(t => t.id === draggedTaskId);
        if (draggedTaskIndex === -1) return;

        let newSortOrder;
        if (afterElement === null) {
            // Dropped at the very end
            const maxSortOrder = Math.max(...tasks.map(t => t.sortOrder));
            newSortOrder = maxSortOrder + 1000;
        } else {
            const afterElementId = afterElement.dataset.taskId;
            const afterTask = tasks.find(t => t.id === afterElementId);

            const afterTaskSortOrder = afterTask.sortOrder;
            const sortedTasks = tasks.sort((a,b) => a.sortOrder - b.sortOrder);
            const afterTaskPos = sortedTasks.findIndex(t => t.id === afterElementId);

            if (afterTaskPos === 0) {
                // Dropped at the beginning
                newSortOrder = afterTaskSortOrder / 2;
            } else {
                // Dropped between two elements
                const beforeTask = sortedTasks[afterTaskPos - 1];
                newSortOrder = (beforeTask.sortOrder + afterTaskSortOrder) / 2;
            }
        }

        tasks[draggedTaskIndex].sortOrder = newSortOrder;
        saveTasks(tasks);
        renderTasks(); // Re-render with new order
    });
    


    // Event delegation for task actions (now on the parent page)
    if (tasksPage) {
        tasksPage.addEventListener('click', (e) => {
            const card = e.target.closest('.card');
            if (!card) return;
        })
        const taskId = card.dataset.taskId;
        const instanceDate = card.dataset.instanceDate;

        if (e.target.classList.contains('delete-btn')) {
            if (confirm('Are you sure you want to permanently delete this task and all its future occurrences?')) {
                let tasks = getTasks();
                tasks = tasks.filter(t => t.id !== taskId);
                saveTasks(tasks);
                renderTasks();
                // Also need to re-render calendar if visible
                if (document.getElementById('calendar-page').classList.contains('d-none') === false) {
                    renderCalendar(currentYear, currentMonth);
                }
            }
        } else if (e.target.classList.contains('edit-btn')) {
            const tasks = getTasks();
            const taskToEdit = tasks.find(t => t.id === taskId);
            if (taskToEdit) {
                document.getElementById('task-id').value = taskToEdit.id;
                document.getElementById('task-title').value = taskToEdit.title;
                document.getElementById('task-description').value = taskToEdit.description;
                document.getElementById('task-priority').value = taskToEdit.priority;
                document.getElementById('task-due-date').value = taskToEdit.dueDate;
                document.getElementById('task-tags').value = taskToEdit.tags.join(', ');
                document.getElementById('task-notes').value = taskToEdit.notes;
                document.getElementById('task-recurrence').value = taskToEdit.recurrence || 'none';

                subtasksForCurrentTask = taskToEdit.subtasks ? [...taskToEdit.subtasks] : [];
                renderSubtasksInModal();

                taskModalLabel.textContent = 'Edit Task';
                taskModal.show();
            }
        } else if (e.target.classList.contains('complete-btn')) {
            let tasks = getTasks();
            const taskToComplete = tasks.find(t => t.id === taskId);
            if (taskToComplete) {
                if (!taskToComplete.completedOn.includes(instanceDate)) {
                    taskToComplete.completedOn.push(instanceDate);
                    saveTasks(tasks);
                    renderTasks();
                }
            }
        } else if (e.target.classList.contains('subtask-checkbox')) {
            const subtaskIndex = parseInt(e.target.dataset.subtaskIndex, 10);
            let tasks = getTasks();
            const parentTask = tasks.find(t => t.id === taskId);
            if (parentTask && parentTask.subtasks[subtaskIndex]) {
                parentTask.subtasks[subtaskIndex].isComplete = e.target.checked;
                saveTasks(tasks);
                renderTasks();
            }
        }
    };

    // Initial render call
    loadFilterState();
    renderTasks();

    // Update renderTasks call in form submit
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const taskId = document.getElementById('task-id').value;
        const task = {
            id: taskId || Date.now().toString(),
            title: document.getElementById('task-title').value,
            description: document.getElementById('task-description').value,
            priority: document.getElementById('task-priority').value,
            dueDate: document.getElementById('task-due-date').value,
            tags: document.getElementById('task-tags').value.split(',').map(tag => tag.trim()).filter(tag => tag),
            notes: document.getElementById('task-notes').value,
            recurrence: document.getElementById('task-recurrence').value,
            subtasks: subtasksForCurrentTask,
        };

        let tasks = getTasks();
        const existingTaskIndex = tasks.findIndex(t => t.id === task.id);

        if (existingTaskIndex > -1) {
            task.completedOn = tasks[existingTaskIndex].completedOn || [];
            task.sortOrder = tasks[existingTaskIndex].sortOrder; // Preserve existing sort order
            tasks[existingTaskIndex] = task;
        } else {
            task.completedOn = [];
            task.sortOrder = Date.now(); // Assign sort order for new tasks
            tasks.push(task);
        }

        saveTasks(tasks);
        taskModal.hide();
        renderTasks();
        if (document.getElementById('calendar-page').classList.contains('d-none') === false) {
            renderCalendar(currentYear, currentMonth);
        }
    });

    // --- Recurrence Logic ---
    function generateDisplayTasks(startDateStr, endDateStr) {
        const allTasks = getTasks();
        const displayTasks = [];
        const startDate = new Date(startDateStr + 'T00:00:00');
        const endDate = new Date(endDateStr + 'T00:00:00');

        for (const task of allTasks) {
            if (task.recurrence === 'none' || !task.recurrence) {
                // Non-recurring tasks are only added if their due date is within the range
                if (task.dueDate >= startDateStr && task.dueDate <= endDateStr) {
                    displayTasks.push({ ...task, dueDate: task.dueDate });
                }
            } else {
                // Recurring tasks: generate instances within the date range
                let currentDate = new Date(startDate);
                const taskStartDate = new Date(task.dueDate + 'T00:00:00');

                while (currentDate <= endDate) {
                    const currentDayStr = currentDate.toISOString().slice(0, 10);
                    if (currentDate >= taskStartDate) { // Only generate from task's start date onwards
                        let shouldAdd = false;
                        switch (task.recurrence) {
                            case 'daily':
                                shouldAdd = true;
                                break;
                            case 'weekly':
                                if (currentDate.getDay() === taskStartDate.getDay()) {
                                    shouldAdd = true;
                                }
                                break;
                            case 'monthly':
                                if (currentDate.getDate() === taskStartDate.getDate()) {
                                    shouldAdd = true;
                                }
                                break;
                            case 'yearly':
                                if (currentDate.getMonth() === taskStartDate.getMonth() && currentDate.getDate() === taskStartDate.getDate()) {
                                    shouldAdd = true;
                                }
                                break;
                        }
                        if (shouldAdd) {
                            displayTasks.push({
                                ...task,
                                dueDate: currentDayStr, // This instance's specific due date
                                isInstance: true
                            });
                        }
                    }
                    currentDate.setDate(currentDate.getDate() + 1);
                }
            }
        }
        return displayTasks.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    }


    // Calendar Rendering
    let currentYear = new Date().getFullYear();
    let currentMonth = new Date().getMonth();

    function renderCalendar(year, month) {
        const calendarContainer = document.getElementById('calendar-container');
        if (!calendarContainer) return;

        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);

        const tasksForMonth = generateDisplayTasks(
            firstDayOfMonth.toISOString().slice(0, 10),
            lastDayOfMonth.toISOString().slice(0, 10)
        );

        calendarContainer.innerHTML = '';

        // Update the navbar controls instead of a header in the page
        const navMonthYear = document.getElementById('nav-month-year');
        if (navMonthYear) {
            navMonthYear.textContent = `${monthNames[month]} ${year}`;
        }

        const grid = document.createElement('div');
        grid.className = 'calendar-grid';

        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayNames.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-day-header';
            dayHeader.textContent = day;
            grid.appendChild(dayHeader);
        });

        for (let i = 0; i < firstDayOfMonth.getDay(); i++) {
            grid.appendChild(document.createElement('div'));
        }

        for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
            const daySquare = document.createElement('div');
            daySquare.className = 'calendar-day';
            daySquare.innerHTML = `<div class="day-number">${day}</div>`;

            const dayString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const tasksForDay = tasksForMonth.filter(task => task.dueDate === dayString);

            if (tasksForDay.length > 0) {
                const tasksList = document.createElement('div');
                tasksForDay.forEach(task => {
                    const isComplete = task.completedOn.includes(dayString);
                    if(isComplete) return; // Don't show completed tasks on calendar

                    const priorityColors = { low: 'success', medium: 'warning', high: 'danger' };
                    const taskItem = document.createElement('div');
                    taskItem.className = `badge bg-${priorityColors[task.priority]} w-100 mb-1`;
                    taskItem.textContent = task.title;
                    taskItem.title = task.title;
                    tasksList.appendChild(taskItem);
                });
                daySquare.appendChild(tasksList);
            }
            grid.appendChild(daySquare);
        }
        calendarContainer.appendChild(grid);

        document.getElementById('prev-month-btn').addEventListener('click', () => {
            currentMonth--;
            if (currentMonth < 0) { currentMonth = 11; currentYear--; }
            renderCalendar(currentYear, currentMonth);
        });

        document.getElementById('next-month-btn').addEventListener('click', () => {
            currentMonth++;
            if (currentMonth > 11) { currentMonth = 0; currentYear++; }
            renderCalendar(currentYear, currentMonth);
        });
    }

    // Trigger calendar render when page is shown
    const originalShowPage = showPage;
    showPage = (pageId) => {
        originalShowPage(pageId);
        if (pageId === 'calendar-page') {
            currentYear = new Date().getFullYear();
            currentMonth = new Date().getMonth();
            renderCalendar(currentYear, currentMonth);
        }
    };

    // --- Dev Mode UI Logic ---
    const devModeToggle = document.getElementById('dev-mode-toggle');
    const devSettingsPanel = document.getElementById('dev-settings-panel');
    const launchLastSectionToggle = document.getElementById('launch-last-section-toggle');

    function applyDevSettingsUI() {
        const settings = getDevSettings();
        devModeToggle.checked = settings.devModeEnabled;
        launchLastSectionToggle.checked = settings.launchToLastSection;

        if (settings.devModeEnabled) {
            devSettingsPanel.classList.remove('d-none');
        } else {
            devSettingsPanel.classList.add('d-none');
        }
    }

    devModeToggle.addEventListener('change', () => {
        const settings = getDevSettings();
        settings.devModeEnabled = devModeToggle.checked;
        saveDevSettings(settings);
        applyDevSettingsUI();
    });

    launchLastSectionToggle.addEventListener('change', () => {
        const settings = getDevSettings();
        settings.launchToLastSection = launchLastSectionToggle.checked;
        saveDevSettings(settings);
    });

    // Initial UI setup for Dev Mode
    applyDevSettingsUI();
});
