import { Interface } from './gameConsole';
import { ConfigLoader } from '../utils/config';

async function main() {
	// use configurations from gameConfig.json
	const config = new ConfigLoader().loadConfig();

	const cli = new Interface(config);
	await cli.startGame();
}

// Run when the file is executed directly
if (require.main === module) {
	main().catch(console.error);
}
