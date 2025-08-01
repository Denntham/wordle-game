import { App } from './app';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8100;

const app = new App();
app.listen(PORT);

process.on('SIGTERM', () => {
	console.log('Received SIGTERM, shutting down');
	process.exit(0);
});

process.on('SIGINT', () => {
	console.log('Received SIGINT, shutting down');
	process.exit(0);
});
