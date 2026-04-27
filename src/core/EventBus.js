class EventBus {
	storage = {};

	on(eventName, callback) {
		if (!this.storage[eventName]) {
			this.storage[eventName] = [];
		}

		if (!this.storage[eventName].includes(callback)) {
			this.storage[eventName].push(callback);
		}
	}

	emit(eventName, data) {
		const events = this.storage[eventName];

		if (!events) return;

		events.forEach((callback) => {
			callback(data);
		});
	}

	off(eventName, callback) {
		const events = this.storage[eventName];
		if (!events) return;

		this.storage[eventName] = events.filter((cb) => cb !== callback);
	}
}

export const BusEvent = new EventBus();
