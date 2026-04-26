import { UIManager } from './services/UIManager.js';
import { StorageManagement } from './services/StorageManager.js';

class App {
	constructor() {
		this.ui = new UIManager();
		this.storage = new StorageManagement();
	}
}

const app = new App();
