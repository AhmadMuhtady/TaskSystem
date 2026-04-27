import { BusEvent } from '../core/EventBus.js';

export class UIManager {
	constructor() {
		this.isModalOpen = false;
		this.isClearModalOpen = false;
		this.editingTaskId = null;
		this.filterDebounceTimer = null;
		this._init();
		this._applySavedTheme();
		this._updateThemeIcon();
		this._initListeners();

		this._startMidnightRefresh();
	}

	_init() {
		this.searchBar = document.getElementById('search-input');
		this.themeBtn = document.getElementById('theme-btn');
		this.themeIcon = this.themeBtn.querySelector('span');

		this.viewContainer = document.getElementById('view');

		this.typeFilterBtn = document.getElementById('type-filter');
		this.statusFilterBtn = document.getElementById('status-filter');
		this.sortBtn = document.getElementById('sort');

		this.infoBtn = document.getElementById('info-btn');
		this.modal = document.getElementById('info-modal');
		this.modalCard = document.getElementById('info-modal-card');
		this.closeModalBtn = document.getElementById('closeInfo');

		this.clearModal = document.getElementById('confirm-clear-modal');
		this.clearModalCard = document.getElementById('confirm-clear-modal-card');
		this.closeClearModalBtns = document.querySelectorAll(
			'.close-confirm-clear',
		);
		this.showClearModalBtn = document.getElementById('show-clear-modal');

		this.tasksContainer = document.getElementById('tasks-container');
		this.addTaskBtn = document.getElementById('add-task-btn');
		this.clearTaskBtn = document.getElementById('clear-tasks-btn');
		this.createTaskBtn = document.getElementById('create-task');

		this.totalStats = document.getElementById('stat-total');
		this.completedStats = document.getElementById('stat-completed');
		this.pendingStats = document.getElementById('stat-pending');
		this.circleGraph = document.getElementById('progress-ring');
		this.circleGraphPercentage = document.getElementById('progress-percent');

		this.form = document.getElementById('task-form');
		this.titleInput = document.getElementById('title-input');
		this.dueDateInput = document.getElementById('date-input');
		this.priorityInput = document.getElementById('priority-input');
		this.typeInput = document.getElementById('type-input');
		this.descriptionInput = document.getElementById('description-input');
		this.toastContainer = document.getElementById('toast-container');

		this.bottomMessage = document.getElementById('bottom-message');
	}

	_initListeners() {
		this.addTaskBtn.addEventListener('click', this._showForm.bind(this));
		this.themeBtn.addEventListener('click', this._toggleTheme.bind(this));
		this.infoBtn.addEventListener('click', this._showModal.bind(this));
		this.closeModalBtn.addEventListener('click', this._hideModal.bind(this));
		this.clearTaskBtn.addEventListener('click', () => {
			this._reset();
			this._ToggleClearModal();
		});
		document.addEventListener('click', (e) => this._handleClickOutside(e));
		this.viewContainer.addEventListener('click', (e) => this._toggleView(e));
		this.typeFilterBtn.addEventListener('change', this._emitFilters.bind(this));
		this.statusFilterBtn.addEventListener(
			'change',
			this._emitFilters.bind(this),
		);
		this.sortBtn.addEventListener('change', this._emitFilters.bind(this));
		this.searchBar.addEventListener(
			'input',
			this._debouncedEmitFilters.bind(this),
		);

		this.showClearModalBtn.addEventListener(
			'click',
			this._ToggleClearModal.bind(this),
		);
		this.closeClearModalBtns.forEach((b) => {
			b.addEventListener('click', this._ToggleClearModal.bind(this));
		});

		this.form.addEventListener('submit', (e) => {
			e.preventDefault();

			const data = this._getFormData();

			if (!data) return alert('please fill all the form');

			if (this.editingTaskId) {
				BusEvent.emit('form:updated', {
					id: this.editingTaskId,
					...data,
				});
				this.editingTaskId = null;
			} else {
				BusEvent.emit('form:submit', {
					...data,
				});
			}

			this._hideForm();
		});

		BusEvent.on('task:rerender', (data) => {
			const { tasks, isFiltered = false } = data;
			this._rerenderAll(tasks, isFiltered);
		});
		BusEvent.on('task:editForm', (task) => this._editTask(task));
		BusEvent.on('stats:updated', (tasks) => this.updateStats(tasks));
		BusEvent.on('task:created', ({ title }) =>
			this._showToast(`Task created: ${title}`, 'success'),
		);
		BusEvent.on('task:deleted', ({ title }) =>
			this._showToast(`Task deleted: ${title}`, 'error'),
		);
		BusEvent.on('tasks:cleared', () =>
			this._showToast('All tasks deleted', 'error'),
		);
		this._emitFilters();
		BusEvent.on('task:statusUpdated', ({ id, status }) =>
			this._updateTaskCard(id, status),
		);
	}

	_getFormData() {
		const type = this.typeInput.value;
		const title = this.titleInput.value;
		const dueDate = this.dueDateInput.value;
		const priority = this.priorityInput.value;
		const description = this.descriptionInput.value;

		if (!title || !dueDate || !priority || !type) return false;

		return { title, dueDate, priority, type, description };
	}

	_editTask(task) {
		this._showForm();

		this.typeInput.value = task.type;
		this.titleInput.value = task.title;
		this.dueDateInput.value = task.dueDate;
		this.priorityInput.value = task.priority;
		this.descriptionInput.value = task.description;
		this.editingTaskId = task.id;
	}

	_showForm() {
		this.form.classList.remove('hidden');
		this.titleInput.focus();
	}

	_hideForm() {
		this.titleInput.value =
			this.dueDateInput.value =
			this.descriptionInput.value =
				'';

		this.priorityInput.selectedIndex = 0;
		this.typeInput.selectedIndex = 0;
		this.editingTaskId = null;

		this.form.classList.add('hidden');
	}

	_renderTask(task) {
		const taskHtml = `
    <div data-id="${task.id}" data-date="${task.dueDate}" class="task glass rounded-xl p-md flex flex-col gap-md task-card-hover transition-all duration-300 border-r-4 ${task.priorityBorder}">
    <div class="flex items-start justify-between">
        <span class="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${task.priorityStyles}">
            ${task.priority}
        </span>
        <span class="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border border-outline/20">
            ${task.type}
        </span>

				 <span data-late-badge class="hidden px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border border-red-500/20 bg-red-500/10 text-red-600">	
    </span>
        <div class="flex items-center gap-1 text-outline">
            <span class="material-symbols-outlined text-sm">calendar_month</span>
            <span class="text-body-sm">${task.formattedDate}</span>
        </div>
    </div>

    <div>
        <h4 class="font-h2 text-body-base font-semibold text-on-surface mb-xs">
            ${task.title}
        </h4>
        <p class="description text-body-sm text-on-surface-variant line-clamp-2">
            ${task.description}
        </p>
    </div>

    <div id="task-btn--control" class="mt-auto pt-md border-t border-outline/10 flex items-center justify-between">
        <div class="flex items-center gap-3">
            <input data-btn="completion" ${task.status === 'completed' ? 'checked' : ''} 
                class="w-5 h-5 rounded border-outline-variant bg-surface-container text-primary focus:ring-primary/50 cursor-pointer" 
                type="checkbox" />
            <span class="text-body-sm font-medium text-primary capitalize">${task.status}</span>
        </div>

        <div class="flex items-center gap-1">
            ${task.editedAt ? `<span class="text-[10px] text-slate-400 italic mr-1">Edited ${task.editedAt}</span>` : ''}
            
            <button data-btn="edit" class="p-1.5 hover:bg-sky-100 rounded transition-colors text-outline hover:text-primary">
                <span class="material-symbols-outlined text-lg">edit</span>
            </button>
            <button data-btn="delete" class="p-1.5 hover:bg-red-50 rounded transition-colors text-outline hover:text-error">
                <span class="material-symbols-outlined text-lg">delete</span>
            </button>
        </div>
    </div>
</div>`;

		this.tasksContainer.insertAdjacentHTML('beforeend', taskHtml);

		const taskEl = this.tasksContainer.querySelector(`[data-id="${task.id}"]`);
		taskEl.querySelector('[data-btn="edit"]').addEventListener('click', () => {
			BusEvent.emit('task:edit', task.id);
		});
		taskEl
			.querySelector('[data-btn="delete"]')
			.addEventListener('click', () => {
				BusEvent.emit('task:delete', task.id);
			});
		taskEl
			.querySelector('[data-btn="completion"]')
			.addEventListener('change', () => {
				BusEvent.emit('task:toggleComplete', task.id);
			});

		this._updateTaskCard(task.id, task.status);
	}

	_rerenderAll(tasks, isFiltered = false) {
		const taskEl = document.querySelectorAll('.task');
		taskEl.forEach((el) => el.remove());

		if (tasks.length > 0) {
			tasks.forEach((task) => this._renderTask(task));
			this.bottomMessage.classList.add('hidden');
		} else {
			this.bottomMessage.classList.remove('hidden');
			// Update the message based on whether we're filtering or not
			const messageEl = this.bottomMessage.querySelector('h3');
			if (isFiltered) {
				messageEl.textContent = 'No tasks found';
			} else {
				messageEl.textContent = "Let's start adding some tasks...";
			}
		}
	}

	_reset() {
		BusEvent.emit('tasks:reset');
	}

	_applySavedTheme() {
		const saved = localStorage.getItem('theme');

		document.documentElement.classList.toggle('dark', saved === 'dark');
	}

	_updateThemeIcon() {
		const isDark = document.documentElement.classList.contains('dark');
		this.themeIcon.textContent = isDark ? 'light_mode' : 'dark_mode';
	}

	_toggleTheme() {
		const isDark = document.documentElement.classList.toggle('dark');

		localStorage.setItem('theme', isDark ? 'dark' : 'light');
		this._updateThemeIcon();
	}

	_showModal() {
		this.modal.classList.remove('hidden');
		this.modal.classList.add('flex');
		this.isModalOpen = true;
	}

	_hideModal() {
		this.modal.classList.add('hidden');
		this.modal.classList.remove('flex');
		this.isModalOpen = false;
	}

	_ToggleClearModal() {
		this.clearModal.classList.toggle('hidden');

		this.isClearModalOpen = !this.isClearModalOpen;
	}

	_handleClickOutside(e) {
		const clickedModalCard = document
			.getElementById('info-modal-card')
			.contains(e.target);
		const clickedModalBtn = this.infoBtn.contains(e.target);

		if (this.isModalOpen && !clickedModalCard && !clickedModalBtn) {
			this._hideModal();
		}

		const clickedClearModalCard = document
			.getElementById('confirm-clear-modal-card')
			.contains(e.target);
		const clickedClearModalBtn = this.showClearModalBtn.contains(e.target);

		if (
			this.isClearModalOpen &&
			!clickedClearModalCard &&
			!clickedClearModalBtn
		) {
			this._ToggleClearModal();
		}
	}

	_toggleView(e) {
		const btn = e.target.closest('[data-view]');

		if (!btn) return;

		document.querySelectorAll('[data-view]').forEach((b) => {
			b.classList.remove('bg-primary', 'text-on-primary');
			b.classList.add('bg-transparent', 'text-outline');
		});

		btn.classList.add('bg-primary', 'text-on-primary');
		btn.classList.remove('bg-transparent', 'text-outline');

		if (btn.dataset.view === 'grid') {
			this.tasksContainer.classList.add('md:grid-cols-2', 'lg:grid-cols-3');
		} else {
			this.tasksContainer.classList.remove('md:grid-cols-2', 'lg:grid-cols-3');
		}
	}

	_emitFilters() {
		BusEvent.emit('filters:changed', {
			type: this.typeFilterBtn.value,
			status: this.statusFilterBtn.value,
			sort: this.sortBtn.value,
			search: this.searchBar.value,
		});
	}

	_debouncedEmitFilters() {
		clearTimeout(this.filterDebounceTimer);
		this.filterDebounceTimer = setTimeout(() => {
			this._emitFilters();
		}, 100);
	}

	_showToast(message, variant = 'info') {
		if (!this.toastContainer) return;

		const toast = document.createElement('div');
		toast.className = `max-w-xs w-full rounded-2xl border px-4 py-3 text-sm font-medium shadow-lg transition-all duration-300 transform opacity-0 translate-y-3 ${
			variant === 'success'
				? 'bg-emerald-600 border-emerald-500/20 text-white'
				: variant === 'error'
					? 'bg-red-600 border-red-500/20 text-white'
					: 'bg-slate-900 border-slate-700 text-white'
		}`;
		toast.textContent = message;
		this.toastContainer.appendChild(toast);

		requestAnimationFrame(() => {
			toast.classList.remove('opacity-0', 'translate-y-3');
			toast.classList.add('opacity-100', 'translate-y-0');
		});

		setTimeout(() => {
			toast.classList.remove('opacity-100');
			toast.classList.add('opacity-0', 'translate-y-3');
			setTimeout(() => toast.remove(), 300);
		}, 3000);
	}

	updateStats(tasks) {
		this.totalStats.textContent = tasks.totalTasks;
		this.pendingStats.textContent = tasks.pendingTasks;
		this.completedStats.textContent = tasks.completedTasks;
		this.circleGraphPercentage.textContent = `${tasks.percentage}%`;
		this.circleGraph.setAttribute(
			'stroke-dasharray',
			`${tasks.percentage}, 100`,
		);
	}

	_updateTaskCard(id, status) {
		const card = this.tasksContainer.querySelector(`[data-id="${id}"]`);
		if (!card) return;

		const isCompleted = status === 'completed';

		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const dueDate = new Date(card.dataset.date);
		dueDate.setHours(0, 0, 0, 0);

		const diffDays = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24)); // past
		const daysLeft = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24)); // future
		const isOverdue = !isCompleted && diffDays > 0;

		const title = card.querySelector('h4');
		const description = card.querySelector('p');
		const checkbox = card.querySelector('[data-btn="completion"]');
		const statusText = checkbox.nextElementSibling;
		const lateBadge = card.querySelector('[data-late-badge]');

		card.classList.toggle('opacity-60', isCompleted);
		card.classList.toggle('grayscale-[0.5]', isCompleted);
		title.classList.toggle('line-through', isCompleted);
		description.classList.toggle('line-through', isCompleted);

		card.classList.toggle('border-red-500', isOverdue);
		card.classList.toggle('bg-red-50/10', isOverdue);
		title.classList.toggle('text-red-700', isOverdue);

		checkbox.checked = isCompleted;
		statusText.textContent = status;
		statusText.classList.toggle('text-green-600', isCompleted);
		statusText.classList.toggle('text-primary', !isCompleted && !isOverdue);
		statusText.classList.toggle('text-red-600', isOverdue);

		lateBadge.classList.remove(
			'hidden',
			'border-red-500/20',
			'bg-red-500/10',
			'text-red-600',
			'border-emerald-500/20',
			'bg-emerald-500/10',
			'text-emerald-600',
			'border-amber-500/20',
			'bg-amber-500/10',
			'text-amber-600',
		);

		if (isCompleted) {
			lateBadge.classList.add('hidden');
		} else if (isOverdue) {
			lateBadge.classList.add(
				'border-red-500/20',
				'bg-red-500/10',
				'text-red-600',
			);
			lateBadge.textContent = `${diffDays}d late`;
		} else if (daysLeft === 0) {
			lateBadge.classList.add(
				'border-amber-500/20',
				'bg-amber-500/10',
				'text-amber-600',
			);
			lateBadge.textContent = 'Due today';
		} else if (daysLeft > 0) {
			lateBadge.classList.add(
				'border-emerald-500/20',
				'bg-emerald-500/10',
				'text-emerald-600',
			);
			lateBadge.textContent = `${daysLeft}d left`;
		} else {
			lateBadge.classList.add('hidden');
		}
	}

	_startMidnightRefresh() {
		const now = new Date();

		const nextMidnight = new Date();
		nextMidnight.setHours(24, 0, 0, 0);

		const msUntilMidnight = nextMidnight - now;

		setTimeout(() => {
			this._refreshAllTasks();

			setInterval(
				() => {
					this._refreshAllTasks();
				},
				24 * 60 * 60 * 1000,
			);
		}, msUntilMidnight);
	}

	_refreshAllTasks() {
		const cards = this.tasksContainer.querySelectorAll('.task');

		cards.forEach((card) => {
			const id = card.dataset.id;

			const checkbox = card.querySelector('[data-btn="completion"]');
			const status = checkbox.checked ? 'completed' : 'pending';

			this._updateTaskCard(id, status);
		});
	}
}
