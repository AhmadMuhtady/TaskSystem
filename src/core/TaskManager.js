import { BusEvent } from './EventBus.js';
import { Task } from '../model/Tasks.js';

export class TaskManager {
	constructor(storage) {
		this.storage = storage;
		this.tasks = storage.tasks;
		this.currentFilters = {
			type: 'all',
			status: 'all',
			sort: 'all',
			search: '',
		};
		this._initListeners();
	}
	_initListeners() {
		BusEvent.on('form:submit', (data) => this._newTask(data));

		BusEvent.on('task:edit', (id) => this._editTask(id));

		BusEvent.on('task:delete', (id) => this._deleteTask(id));

		BusEvent.on('tasks:reset', () => this._reset());

		BusEvent.on('task:toggleComplete', (id) => this._toggleComplete(id));

		BusEvent.on('filters:changed', (filters) => this._changeFilter(filters));

		BusEvent.on('form:updated', (data) => this._updateTask(data));
	}

	_newTask(data) {
		const { title, dueDate, priority, type, description } = data;

		const task = new Task(title, dueDate, priority, type, description);
		this.storage.addTask(task);
		this.tasks = this.storage.tasks;
		this._changeFilter(this.currentFilters);
		this.updateStats();
	}

	_updateTask(data) {
		const { title, dueDate, priority, type, description, id } = data;

		const oldTask = this.tasks.find((t) => t.id === data.id);
		oldTask.updateTask(title, dueDate, priority, type, description);
		this.storage.saveTasks();
		this._changeFilter(this.currentFilters);
		this.updateStats();
	}

	_toggleComplete(id) {
		const task = this.tasks.find((t) => t.id === id);
		if (!task) return;

		if (task.status === 'pending') {
			task.status = 'completed';
		} else {
			task.status = 'pending';
		}

		this.storage.saveTasks();
		BusEvent.emit('task:statusUpdated', { id, status: task.status });
		this.updateStats();
	}

	_changeFilter({ type, status, sort, search }) {
		this.currentFilters = { type, status, sort, search };
		const searchTerm = search?.toLowerCase() || '';

		const priorityMap = { low: 1, medium: 2, high: 3 };

		const filtered = this.tasks
			.filter((t) => {
				const matchesSearch =
					!searchTerm ||
					t.title?.toLowerCase().includes(searchTerm) ||
					t.description?.toLowerCase().includes(searchTerm);
				const matchesType = type === 'all' || t.type === type;
				const matchesStatus = status === 'all' || t.status === status;

				return matchesSearch && matchesType && matchesStatus;
			})
			.sort((a, b) => {
				switch (sort) {
					case 'newest':
						return new Date(b.createdAt) - new Date(a.createdAt);
					case 'oldest':
						return new Date(a.createdAt) - new Date(b.createdAt);
					case 'asc':
						return (
							priorityMap[a.priority?.toLowerCase()] -
							priorityMap[b.priority?.toLowerCase()]
						);
					case 'desc':
						return (
							priorityMap[b.priority?.toLowerCase()] -
							priorityMap[a.priority?.toLowerCase()]
						);
					default:
						return 0;
				}
			});

		BusEvent.emit('task:rerender', filtered);
		this.updateStats();
	}

	_deleteTask(id) {
		const updatedTasks = this.storage.deleteTask(id);
		this.tasks = updatedTasks;
		this._changeFilter(this.currentFilters);
		this.updateStats();
	}

	updateStats() {
		const totalTasks = this.tasks.length;
		const pendingTasks = this.tasks.filter(
			(t) => t.status === 'pending',
		).length;
		const completedTasks = this.tasks.filter(
			(t) => t.status === 'completed',
		).length;
		const percentage =
			totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

		const tasksStats = {
			totalTasks: totalTasks,
			pendingTasks: pendingTasks,
			completedTasks: completedTasks,
			percentage: percentage,
		};

		BusEvent.emit('stats:updated', tasksStats);
	}

	_editTask(id) {
		const task = this.tasks.find((t) => t.id === id);
		if (!task) return;

		BusEvent.emit('task:editForm', task);
	}

	_reset() {
		this.storage.reset();
		this.tasks = [];
		BusEvent.emit('task:rerender', []);
		this.updateStats();
	}
}
