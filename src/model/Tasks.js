export class Task {
	constructor(title, dueDate, priority, type, description) {
		this.id = crypto.randomUUID();
		this.createdAt = dateFormat();
		this.title = title;
		this.dueDate = dueDate;
		this.priority = priority;
		this.type = type;
		this.description = description;
		this.status = 'pending';
	}

	markComplete() {
		this.status = 'completed';
	}

	updateTask(title, dueDate, priority, type, description) {
		this.editedAt = dateFormat();
		this.title = title;
		this.dueDate = dueDate;
		this.priority = priority;
		this.type = type;
		this.description = description;
	}

	dateFormat() {
		const formattedDate = new Date().toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
		});

		return formattedDate;
	}
}
