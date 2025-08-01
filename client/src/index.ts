import { ClientConsole } from './console/clientConsole';

async function main() {
	const serverurl = 'http://localhost:8100/api/v1';
	const client = new ClientConsole(serverurl);
	await client.startGame();
}

if (require.main === module) {
	main().catch(console.error);
}
