import cors from 'cors';
import express, { Request, Response } from 'express';
import http from 'http';
import { GameServer } from './controllers/gameServer';

export class App {
	private app: express.Application;
	private gameServer: GameServer;

	constructor() {
		this.gameServer = new GameServer();
		this.app = express();
		this.middlewares();
		this.routes();
	}

	public getApp(): express.Application {
		return this.app;
	}

	private middlewares(): void {
		this.app.use(express.json({ limit: '10mb' }));
		this.app.use(express.urlencoded({ extended: true }));
		this.app.use(cors());
	}

	public listen(port: number = 8100): void {
		const server = http.createServer(this.app);
		server.listen(port);

		console.log(`Server running on port ${port}`);
		console.log(`Health check: http://localhost:${port}/health`);
		console.log(`API base: http://localhost:${port}/api`);
	}

	private routes(): void {
		// Health Check
		this.app.get('/health', (req: Request, res: Response) => {
			res.json({
				status: 'healthy',
				timestamp: new Date().toISOString(),
			});
		});

		// Create new game
		this.app.post('/api/v1/wordle', (req, res) => this.gameServer.createGame(req, res));

		// Get game status
		this.app.get('/api/v1/wordle/:sessionID', (req, res) =>
			this.gameServer.getGameStatus(req, res)
		);

		// Guess a word
		this.app.post('/api/v1/wordle/:sessionID/guess', (req, res) =>
			this.gameServer.actionGuess(req, res)
		);

		// Delete expired game session
		this.app.delete('/api/v1/wordle/:sessionID', (req, res) =>
			this.gameServer.deleteGame(req, res)
		);

		// Error Handling
		this.app.use('/{*any}', (req: Request, res: Response) => {
			res.status(404).json({
				error: 'Not Found',
				message: `Route ${req.originalUrl} not found`,
			});
		});
	}
}
