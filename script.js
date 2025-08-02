document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('.nav-link');
    const pages = document.querySelectorAll('.page');

    const contentArea = document.getElementById('content');
    const navbar = document.getElementById('navbar');
    const body = document.body;
    const themeSelect = document.getElementById('theme-select');
    const customThemeSettings = document.getElementById('custom-theme-settings');
    const contentBgColorInput = document.getElementById('content-bg-color');
    const navbarBgColorInput = document.getElementById('navbar-bg-color');
    const tasksPage = document.getElementById('tasks-page');
    const todayTaskListContainer = document.getElementById('today-task-list');
    const upcomingTaskListContainer = document.getElementById('upcoming-task-list');
    const todayEmptyMessage = document.getElementById('today-empty-message');
    const upcomingEmptyMessage = document.getElementById('upcoming-empty-message');
    const taskForm = document.getElementById('task-form');
    const taskModalEl = document.getElementById('task-modal');
    const taskModal = new bootstrap.Modal(taskModalEl);
    const taskModalLabel = document.getElementById('task-modal-label');
    const addTaskBtn = document.getElementById('add-task-btn');
    const priorityFilter = document.getElementById('priority-filter');
    const exportBtn = document.getElementById('export-data-btn');
    const importBtn = document.getElementById('import-data-btn');
    const importFileInput = document.getElementById('import-file-input');
    const newSubtaskInput = document.getElementById('new-subtask-input');
    const addSubtaskBtnModal = document.getElementById('add-subtask-btn-modal');
    const subtaskListModalDiv = document.getElementById('subtask-list-modal');
    const devModeToggle = document.getElementById('dev-mode-toggle');
    const devSettingsPanel = document.getElementById('dev-settings-panel');
    const launchLastSectionToggle = document.getElementById('launch-last-section-toggle');


    function showPage(pageId) {
        contentArea.classList.remove('no-scroll');

        pages.forEach(page => {
            if (page.id === pageId) {
                page.classList.remove('d-none');
            } else {
                page.classList.add('d-none');
            }
        });

        if (pageId === 'calendar-page') {
            contentArea.classList.add('no-scroll');
        }
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

    const THEME_CLASSES = {
        light: { body: 'bg-light text-dark', navbar: 'bg-light' },
        dark: { body: 'bg-dark text-white', navbar: 'bg-dark' },
        primary: { body: 'bg-primary text-white', navbar: 'bg-primary' },
        success: { body: 'bg-success text-white', navbar: 'bg-success' }
    };

    /**
     * Determines whether to use black or white text based on the brightness of a background hex color.
     * @param {string} hexColor - The background color in hex format (e.g., "#RRGGBB").
     * @returns {string} - Returns '#000000' for light backgrounds and '#ffffff' for dark backgrounds.
     */
    function getContrastColor(hexColor) {
        if (!hexColor || hexColor.length < 7) return '#000000'; // Default to black for invalid colors
        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);
        // Using the HSP color model to determine brightness
        const luminance = Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b));
        return luminance > 127.5 ? '#000000' : '#ffffff';
    }

    function applyTheme(theme) {
        // Remove all potential theme classes and reset styles
        Object.values(THEME_CLASSES).forEach(themeClass => {
            body.classList.remove(...themeClass.body.split(' '));
            navbar.classList.remove(themeClass.navbar);
        });

        // Clear all custom styles and variables
        const rootStyle = document.documentElement.style;
        rootStyle.removeProperty('--app-bg-color');
        rootStyle.removeProperty('--app-text-color');
        rootStyle.removeProperty('--app-navbar-bg-color');
        rootStyle.removeProperty('--app-navbar-text-color');
        rootStyle.removeProperty('--app-striped-bg-color');

        body.style.color = '';
        navbar.style.color = '';
        contentArea.style.backgroundColor = '';
        navbar.style.backgroundColor = '';


        // Reset explicit styles on nav controls that might have been set by custom theme
        const navControls = navbar.querySelectorAll('#calendar-nav-controls button, #calendar-nav-controls span');
        navControls.forEach(control => {
            control.style.color = '';
            if (control.tagName === 'BUTTON') {
                 control.style.borderColor = '';
            }
        });


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
        const bodyTextColor = getContrastColor(contentBg);
        const navbarTextColor = getContrastColor(navbarBg);

        // Set CSS variables on the root element
        const rootStyle = document.documentElement.style;
        rootStyle.setProperty('--app-bg-color', contentBg);
        rootStyle.setProperty('--app-text-color', bodyTextColor);
        rootStyle.setProperty('--app-navbar-bg-color', navbarBg);
        rootStyle.setProperty('--app-navbar-text-color', navbarTextColor);
        // Create a semi-transparent version of the text color for striped tables
        const stripedColor = bodyTextColor === '#000000' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)';
        rootStyle.setProperty('--app-striped-bg-color', stripedColor);


        // Apply the variables directly to the main elements
        contentArea.style.backgroundColor = 'var(--app-bg-color)';
        body.style.color = 'var(--app-text-color)';
        navbar.style.backgroundColor = 'var(--app-navbar-bg-color)';
        navbar.style.color = 'var(--app-navbar-text-color)';

        // Additionally, make sure navbar controls have the right color
        const navControls = navbar.querySelectorAll('#calendar-nav-controls button, #calendar-nav-controls span');
        navControls.forEach(control => {
            control.style.color = 'var(--app-navbar-text-color)';
            if (control.tagName === 'BUTTON') {
                 control.style.borderColor = 'var(--app-navbar-text-color)';
            }
        });
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


    function renderSingleTaskList(tasks, container, emptyMessage, emptyMessageContainer) {
        container.innerHTML = ''; // Clear previous content

        const table = container.closest('table');
        if (tasks.length === 0) {
            emptyMessageContainer.textContent = emptyMessage;
            emptyMessageContainer.classList.remove('d-none');
            if (table) table.classList.add('d-none');
            return;
        }

        if (table) table.classList.remove('d-none');
        emptyMessageContainer.classList.add('d-none');

        tasks.forEach(taskInstance => {
            const priorityColors = { low: '#28a745', medium: '#ffc107', high: '#dc3545' };
            const priorityColor = priorityColors[taskInstance.priority] || '#6c757d';
            const isInstanceComplete = taskInstance.completedOn.includes(taskInstance.dueDate);

            const taskRow = document.createElement('tr');
            taskRow.className = isInstanceComplete ? 'task-complete' : '';
            taskRow.dataset.taskId = taskInstance.id;
            taskRow.dataset.instanceDate = taskInstance.dueDate;
            taskRow.draggable = true;

            const recurrenceHTML = (taskInstance.recurrence && taskInstance.recurrence !== 'none')
                ? `<span class="ms-2" title="Recurring Task"><i class="bi bi-arrow-repeat"></i></span>`
                : '';

            // Using a more compact table layout
            taskRow.innerHTML = `
                <td class="priority-cell" style="border-left: 5px solid ${priorityColor}; width: 45px;">
                    <input class="form-check-input complete-checkbox mx-auto" type="checkbox" ${isInstanceComplete ? 'checked' : ''} title="Mark as complete">
                </td>
                <td>
                    <div class="fw-bold">${taskInstance.title}${recurrenceHTML}</div>
                    <small>Due: ${taskInstance.dueDate || 'N/A'}</small>
                </td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-secondary me-1 edit-btn" title="Edit Task"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-outline-danger delete-btn" title="Delete Task"><i class="bi bi-trash"></i></button>
                </td>
            `;
            container.appendChild(taskRow);
        });
    }


    function renderTasks() {
        const todayStr = getTodayString();

        // 1. Generate all possible instances for today + next 7 days
        const sevenDaysLater = new Date(todayStr);
        sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
        const sevenDaysLaterStr = sevenDaysLater.toISOString().slice(0, 10);

        let allInstances = generateDisplayTasks(todayStr, sevenDaysLaterStr);

        // 2. Apply priority filter
        if (taskFilterState.priority !== 'all') {
            allInstances = allInstances.filter(task => task.priority === taskFilterState.priority);
        }

        // 3. De-duplicate to get only the single next occurrence for each task ID
        const nextOccurrences = [];
        const processedTaskIds = new Set();
        // The list is already sorted by date from generateDisplayTasks
        allInstances.forEach(instance => {
            if (!processedTaskIds.has(instance.id)) {
                nextOccurrences.push(instance);
                processedTaskIds.add(instance.id);
            }
        });

        // 4. Separate into Today and Upcoming lists
        const todayTasks = nextOccurrences.filter(task => task.dueDate === todayStr);
        const upcomingTasks = nextOccurrences.filter(task => task.dueDate !== todayStr);

        // 5. Sort and Render
        todayTasks.sort((a, b) => a.sortOrder - b.sortOrder);
        upcomingTasks.sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.sortOrder - b.sortOrder);

        renderSingleTaskList(todayTasks, todayTaskListContainer, 'No tasks due today that match the current filter.', todayEmptyMessage);
        renderSingleTaskList(upcomingTasks, upcomingTaskListContainer, 'No upcoming tasks for the next 7 days.', upcomingEmptyMessage);
    }


    // --- Drag and Drop Logic for Tables ---
    let draggedElement = null;

    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('tr:not(.dragging)')];
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

    tasksPage.addEventListener('dragstart', e => {
        if (e.target.tagName === 'TR') {
            draggedElement = e.target;
            setTimeout(() => {
                if (draggedElement) draggedElement.classList.add('dragging');
            }, 0);
        }
    });

    tasksPage.addEventListener('dragend', e => {
        if (draggedElement) {
            draggedElement.classList.remove('dragging');
            draggedElement = null;
        }
    });

    tasksPage.addEventListener('dragover', e => {
        e.preventDefault();
        const container = e.target.closest('tbody');
        if (!container || !draggedElement) return;

        const afterElement = getDragAfterElement(container, e.clientY);
        if (afterElement == null) {
            container.appendChild(draggedElement);
        } else {
            container.insertBefore(draggedElement, afterElement);
        }
    });

    tasksPage.addEventListener('drop', e => {
        e.preventDefault();
        if (!draggedElement) return;

        const droppedOnListId = draggedElement.parentElement.id;
        if (droppedOnListId !== 'today-task-list') {
            // For now, only allow reordering within the "Today" list
            renderTasks(); // Re-render to snap back to original position
            return;
        }

        const draggedTaskId = draggedElement.dataset.taskId;
        const afterElement = getDragAfterElement(draggedElement.parentElement, e.clientY);
        let tasks = getTasks();

        const draggedTaskIndex = tasks.findIndex(t => t.id === draggedTaskId);
        if (draggedTaskIndex === -1) return;

        let newSortOrder;
        const reorderedIds = [...draggedElement.parentElement.children].map(row => row.dataset.taskId);
        const currentTaskPos = reorderedIds.indexOf(draggedTaskId);

        if (currentTaskPos === 0) {
            // Dropped at the beginning
            const nextTask = tasks.find(t => t.id === reorderedIds[1]);
            newSortOrder = nextTask ? nextTask.sortOrder / 2 : Date.now();
        } else if (currentTaskPos === reorderedIds.length - 1) {
            // Dropped at the end
            const prevTask = tasks.find(t => t.id === reorderedIds[currentTaskPos - 1]);
            newSortOrder = prevTask.sortOrder + 1000;
        } else {
            // Dropped in the middle
            const prevTask = tasks.find(t => t.id === reorderedIds[currentTaskPos - 1]);
            const nextTask = tasks.find(t => t.id === reorderedIds[currentTaskPos + 1]);
            newSortOrder = (prevTask.sortOrder + nextTask.sortOrder) / 2;
        }

        tasks[draggedTaskIndex].sortOrder = newSortOrder;
        saveTasks(tasks);
        renderTasks(); // Re-render to reflect the confirmed new order
    });


    // Event delegation for task actions (now on the parent page)
    tasksPage.addEventListener('click', (e) => {
        const taskRow = e.target.closest('tr');
        if (!taskRow) return;

        const taskId = taskRow.dataset.taskId;
        const instanceDate = taskRow.dataset.instanceDate;
        let tasks = getTasks();
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        // Handle task deletion
        if (e.target.closest('.delete-btn')) {
            if (confirm('Are you sure you want to permanently delete this task and all its future occurrences?')) {
                tasks = tasks.filter(t => t.id !== taskId);
                saveTasks(tasks);
                renderTasks();
                if (!document.getElementById('calendar-page').classList.contains('d-none')) {
                    renderCalendar(currentYear, currentMonth);
                }
            }
        }
        // Handle task editing
        else if (e.target.closest('.edit-btn')) {
            document.getElementById('task-id').value = task.id;
            document.getElementById('task-title').value = task.title;
            document.getElementById('task-description').value = task.description;
            document.getElementById('task-priority').value = task.priority;
            document.getElementById('task-due-date').value = task.dueDate;
            document.getElementById('task-tags').value = task.tags.join(', ');
            document.getElementById('task-notes').value = task.notes;
            document.getElementById('task-recurrence').value = task.recurrence || 'none';
            subtasksForCurrentTask = task.subtasks ? [...task.subtasks] : [];
            renderSubtasksInModal();
            taskModalLabel.textContent = 'Edit Task';
            taskModal.show();
        }
        // Handle task completion via checkbox
        else if (e.target.classList.contains('complete-checkbox')) {
            const isComplete = e.target.checked;
            if (isComplete) {
                if (!task.completedOn.includes(instanceDate)) {
                    task.completedOn.push(instanceDate);
                }
            } else {
                task.completedOn = task.completedOn.filter(d => d !== instanceDate);
            }
            saveTasks(tasks);
            renderTasks();
        }
        // Handle subtask completion
        else if (e.target.classList.contains('subtask-checkbox')) {
            const subtaskIndex = parseInt(e.target.dataset.subtaskIndex, 10);
            if (task && task.subtasks[subtaskIndex]) {
                task.subtasks[subtaskIndex].isComplete = e.target.checked;
                saveTasks(tasks);
                renderTasks();
            }
        }
    });

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

    document.getElementById('nav-prev-month-btn').addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) { currentMonth = 11; currentYear--; }
        renderCalendar(currentYear, currentMonth);
    });

    document.getElementById('nav-next-month-btn').addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) { currentMonth = 0; currentYear++; }
        renderCalendar(currentYear, currentMonth);
    });

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

        // Dynamically set the grid rows to prevent empty bottom row
        const totalCells = firstDayOfMonth.getDay() + lastDayOfMonth.getDate();
        const numRows = Math.ceil(totalCells / 7);
        // 1 row for the header, `numRows` for the days
        grid.style.gridTemplateRows = `auto repeat(${numRows}, 1fr)`;


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
                tasksList.className = 'day-badge-container'; // For scrolling
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
