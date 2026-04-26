import { BusEvent } from '../core/EventBus.js';

export class UIManager {
	constructor() {
		this.isModalOpen = false;
		this.editingTaskId = null;
		this._init();
		this._applySavedTheme();
		this._updateThemeIcon();
		this._initListeners();
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
	}

	_initListeners() {
		this.addTaskBtn.addEventListener('click', this._showForm.bind(this));
		this.themeBtn.addEventListener('click', this._toggleTheme.bind(this));
		this.infoBtn.addEventListener('click', this._showModal.bind(this));
		this.closeModalBtn.addEventListener('click', this._hideModal.bind(this));
		this.clearTaskBtn.addEventListener('click', this._reset.bind(this));
		document.addEventListener('click', (e) => this._handleClickOutside(e));
		this.viewContainer.addEventListener('click', (e) => this._toggleView(e));
		this.typeFilterBtn.addEventListener('change', this._emitFilters.bind(this));
		this.statusFilterBtn.addEventListener(
			'change',
			this._emitFilters.bind(this),
		);
		this.sortBtn.addEventListener('change', this._emitFilters.bind(this));
		this.searchBar.addEventListener('input', this._emitFilters.bind(this));

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

		BusEvent.on('task:created', (task) => this._renderTask(task));
		BusEvent.on('task:deleted', (id) => this._removeTask(id));
		BusEvent.on('task:rerender', (tasks) => this._rerenderAll(tasks));
		BusEvent.on('task:editForm', (task) => this._editTask(task));
		BusEvent.on('stats:updated', (tasks) => this.updateStats(tasks));
		this._emitFilters();
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
    <div data-id="${task.id}" class="task glass rounded-xl p-md flex flex-col gap-md task-card-hover transition-all duration-300 border-r-4 ${task.priorityBorder}">
    <div class="flex items-start justify-between">
        <span class="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${task.priorityStyles}">
            ${task.priority}
        </span>
        <span class="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border border-outline/20">
            ${task.type}
        </span>
        <div class="flex items-center gap-1 text-outline">
            <span class="material-symbols-outlined text-sm">calendar_month</span>
            <span class="text-body-sm">${task.dueDate}</span>
        </div>
    </div>

    <div>
        <h4 class="font-h2 text-body-base font-semibold text-on-surface mb-xs">
            ${task.title}
        </h4>
        <p class="text-body-sm text-on-surface-variant line-clamp-2">
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
	}

	_rerenderAll(tasks) {
		const taskEl = document.querySelectorAll('.task');
		taskEl.forEach((el) => el.remove());

		tasks.forEach((task) => this._renderTask(task));
	}

	_removeTask(id) {
		const taskEL = document.querySelector(`[data-id="${id}"]`);

		if (!taskEL) return;

		taskEL.remove();
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

	_handleClickOutside(e) {
		const clickedModalCard = document
			.getElementById('info-modal-card')
			.contains(e.target);
		const clickedModalBtn = this.infoBtn.contains(e.target);

		if (this.isModalOpen && !clickedModalCard && !clickedModalBtn) {
			this._hideModal();
		}
	}

	_toggleView(e) {
		const btn = e.target.closest('[data-view]');

		if (!btn) return;

		document.querySelectorAll('[data-view]').forEach((b) => {
			b.classList.remove('bg-slate-800', 'text-primary');
			b.classList.add('text-on-surface-variant');
		});

		btn.classList.add('bg-slate-800', 'text-primary');
		btn.classList.remove('text-on-surface-variant');

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
}
