import { UIManager } from './services/UIManager.js';
import { StorageManagement } from './services/StorageManager.js';
import { TaskManager } from './core/TaskManager.js';

class App {
	constructor() {
		this.storage = new StorageManagement();
		this.taskManager = new TaskManager(this.storage);
		this.ui = new UIManager();
	}
}

const app = new App();
