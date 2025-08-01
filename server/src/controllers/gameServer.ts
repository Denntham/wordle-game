import { Request, Response } from 'express';
import { GameConfig, GameStatus } from '../utils/types';
import { Wordle } from './gameLogic';
import { ConfigLoader } from '../utils/config';

interface GameSession {
	sessionID: string;
	gameInstance: Wordle;
	createdAt: Date;
	lastUpdated: Date;
}

interface GameSessionResponse {
	sessionID: string;
	gameStatus: GameStatus;
	gameConfig: {
		maxAttempts: number;
	};
}

export class GameServer {
	private gameConfig: GameConfig;
	private gameSession: Map<string, GameSession> = new Map();
	private readonly SESSION_TIMEOUT = 60 * 60 * 1000; // invalidate session after timeout

	constructor() {
		this.gameConfig = new ConfigLoader().loadConfig();
		this.cleanupTimer();
	}

	private generateSessionID(): string {
		return Math.random().toString(36).substring(2) + Date.now().toString(36);
	}

	createGame(req: Request, res: Response): void {
		try {
			const gameConfig = new ConfigLoader('./src/inputs/gameConfig.json').loadConfig();
			const gameInstance = new Wordle(gameConfig);
			const sessionID = this.generateSessionID();

			const session: GameSession = {
				sessionID: sessionID,
				gameInstance: gameInstance,
				createdAt: new Date(),
				lastUpdated: new Date(),
			};

			this.gameSession.set(sessionID, session);

			const response: GameSessionResponse = {
				sessionID: sessionID,
				gameStatus: gameInstance.getGameStatus(),
				gameConfig: {
					maxAttempts: gameConfig.maxAttempts,
				},
			};

			res.status(201).json(response);
		} catch (error) {
			res.status(400).json({
				error: 'Bad Request',
				message: error,
			});
		}
	}

	getGameStatus(req: Request, res: Response): void {
		try {
			const { sessionID } = req.params;
			const gameSession = this.gameSession.get(sessionID);

			if (gameSession) {
				gameSession.lastUpdated = new Date();
				const gameStatus = gameSession.gameInstance.getGameStatus();
				res.status(200).json({
					sessionID: sessionID,
					gameStatus,
					correctWord: gameStatus.isGameEnded
						? gameSession.gameInstance.getCorrectWord()
						: undefined,
				});
			} else {
				res.status(404).json({
					error: 'Not Found',
					message: 'Game session not found',
				});
				return;
			}
		} catch (error) {
			res.status(400).json({
				error: 'Bad Request',
				message: error,
			});
		}
	}

	actionGuess(req: Request, res: Response): void {
		try {
			const { sessionID } = req.params;
			const { wordGuess } = req.body;

			// input validation
			if (!wordGuess || typeof wordGuess !== 'string') {
				res.status(400).json({
					error: 'Bad Request',
					message: 'Guess must be a string',
				});
				return;
			} else if (wordGuess.length !== 5) {
				res.status(400).json({
					error: 'Bad Request',
					message: 'Guess must be a 5-letter word',
				});
				return;
			} else if (!/^[A-Za-z]+$/.test(wordGuess)) {
				res.status(400).json({
					error: 'Bad Request',
					message: 'Guess must contain only letters',
				});
				return;
			} else if (
				this.gameConfig.strictMode &&
				!this.gameConfig.wordList.includes(wordGuess.toUpperCase())
			) {
				res.status(400).json({
					error: 'Bad Request',
					message: 'Word is not included in list',
				});
				return;
			}

			const gameSession = this.gameSession.get(sessionID);
			if (!gameSession) {
				res.status(404).json({
					error: 'Not Found',
					message: 'Game session not found',
				});
				return;
			}

			gameSession.lastUpdated = new Date();

			// make the guess
			const guessResponse = gameSession.gameInstance.actionGuess(wordGuess);
			const response = {
				sessionID: sessionID,
				...guessResponse,
				correctWord: guessResponse.gameStatus.isGameEnded
					? gameSession.gameInstance.getCorrectWord()
					: undefined,
			};

			res.json(response);
		} catch (error) {
			res.status(400).json({
				error: 'Bad Request',
				message: error,
			});
		}
	}

	deleteGame(req: Request, res: Response): void {
		const { sessionID } = req.params;
		if (this.gameSession.delete(sessionID)) res.status(200).send();
		else {
			res.status(404).json({
				error: 'Not Found',
				message: 'Game session not found',
			});
		}
	}

	private cleanupTimer(): void {
		setInterval(() => {
			const now = new Date().getTime();
			for (const [sessionID, session] of this.gameSession.entries()) {
				if (now - session.lastUpdated.getTime() > this.SESSION_TIMEOUT) {
					this.gameSession.delete(sessionID);
					console.log(`Cleaned up inactive session: ${sessionID}`);
				}
			}
		}, 10 * 60 * 1000);
	}
}
