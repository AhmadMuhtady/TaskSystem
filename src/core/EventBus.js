class EventBus {
	storage = {};

	on(eventName, callback) {
		if (!this.storage[eventName]) {
			this.storage[eventName] = [];
		}

		if (!this.storage[eventName].includes(callback)) {
			this.storage[eventName].push(callback);
		}

		console.log(eventName, callback);
		console.log(this.storage);
	}

	emit(eventName, data) {
		const events = this.storage[eventName];

		if (!events) return;

		events.forEach((callback) => {
			callback(data);
		});

		console.log(eventName, data);
		console.log(this.storage);
	}

	off(eventName, callback) {
		const events = this.storage[eventName];
		if (!events) return;

		this.storage[eventName] = events.filter((cb) => cb !== callback);

		console.log(eventName, callback);
		console.log(this.storage);
	}
}

export const BusEvent = new EventBus();
