export class Task {
	constructor(title, dueDate, priority, type, description) {
		this.id = crypto.randomUUID();
		this.createdAt = dateFormat(new Date());
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
		this.title = title;
		this.dueDate = dueDate;
		this.priority = priority;
		this.type = type;
		this.description = description;
		this.editedAt = this.dateFormat(new Date());
	}

	dateFormat(date) {
		const formattedDate = date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
		});

		return formattedDate;
	}
}
