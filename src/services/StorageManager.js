import { Task } from '../model/Tasks.js';
export class StorageManagement {
	constructor() {
		this.tasks = this._loadAndRestoreTasks();
	}

	_loadAndRestoreTasks() {
		const data = JSON.parse(localStorage.getItem('tasks'));
		if (!data) return [];

		return data.map((task) => {
			const newTask = new Task(
				task.title,
				task.dueDate,
				task.priority,
				task.type,
				task.description,
			);

			newTask.id = task.id;
			newTask.createdAt = task.createdAt;
			if (newTask.EditedAt) newTask.editedAt = task.editedAt;

			return newTask;
		});
	}

	addTask(task) {
		this.tasks.push(task);
		this.saveTasks();
	}

	saveTasks() {
		localStorage.setItem('tasks', JSON.stringify(this.tasks));
	}

	reset() {
		this.tasks = [];
		localStorage.removeItem('tasks');
	}

	deleteTask(taskId) {
		this.tasks = this.tasks.filter((t) => t.id !== taskId);
		this.saveTasks();
		return this.tasks;
	}
}
