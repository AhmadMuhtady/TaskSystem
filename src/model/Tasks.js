export class Task {
	constructor(title, dueDate, priority, type, description) {
		this.id = crypto.randomUUID();
		this.createdAt = this.dateFormat(new Date());
		this.title = title;
		this.dueDate = dueDate;
		this.priority = priority;
		this.type = type;
		this.description = description;
		this.status = 'pending';
	}

	get priorityStyles() {
		const p = this.priority?.toLowerCase();
		if (p === 'high') return 'bg-red-500/10 text-red-600 border-red-500/20';
		if (p === 'low')
			return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';

		return 'bg-tertiary-container/20 text-tertiary border-tertiary/20';
	}

	get priorityBorder() {
		const p = this.priority?.toLowerCase();
		if (p === 'high') return 'border-r-red-500/50';
		if (p === 'low') return 'border-r-emerald-500/50';
		return 'border-r-tertiary/50';
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
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
		});
	}
}
