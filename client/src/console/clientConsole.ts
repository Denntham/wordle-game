import * as readline from 'readline';
import { APIStatusResponse, GameStatus, WordResult } from '../utils/types';

interface APIResponse<T> {
	data?: T | APIStatusResponse;
	error?: string;
	message?: string;
}

export class ClientHttp {
	private readonly port = process.env.PORT ? parseInt(process.env.PORT) : '8100';
	private baseurl = process.env.BASEURL ?? 'http://localhost:' + this.port + '/api/v1';

	constructor(baseurl: string = this.baseurl) {
		this.baseurl = baseurl;
	}

	// API Request format
	private async request<T>(endpoint: string, options: RequestInit = {}): Promise<APIResponse<T>> {
		try {
			const response = await fetch(`${this.baseurl}${endpoint}`, {
				headers: {
					'Content-Type': 'application/json',
					...options.headers,
				},
				...options,
			});

			const data = await response.json();
			if (!response.ok) {
				return {
					error: data.error,
					message: data.message,
				};
			}
			return { data: data, message: data.message };
		} catch (error) {
			return {
				error: 'Network Error',
				message: error as string,
			};
		}
	}

	async createGame() {
		return this.request('/wordle', {
			method: 'POST',
		});
	}

	async getGameStatus(sessionID: string) {
		return this.request(`/wordle/${sessionID}`);
	}

	async actionGuess(sessionID: string, guess: string) {
		return this.request(`/wordle/${sessionID}/guess`, {
			method: 'POST',
			body: JSON.stringify({ wordGuess: guess }),
		});
	}

	async deleteGame(sessionId: string) {
		return this.request(`/wordle/${sessionId}`, {
			method: 'DELETE',
		});
	}
}

export class ClientConsole {
	private interface: readline.Interface;
	private apiclient: ClientHttp;
	private sessionID: string | null = null;

	constructor(serverurl?: string) {
		this.interface = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		});
		this.apiclient = new ClientHttp(serverurl);
	}

	private formatResult(guess: string, result: WordResult): string {
		const symbols = {
			hit: '🟩',
			present: '🟨',
			miss: '🟥',
		};

		const letters = guess.split('');
		const formatted = letters.map((letter, i) => `${letter}${symbols[result[i]]}`).join(' ');
		return formatted;
	}

	private async displayGame(): Promise<void> {
		if (!this.sessionID) return;

		const response = await this.apiclient.getGameStatus(this.sessionID);

		if (response.error) {
			console.log(`Error: ${response.message}`);
			return;
		}

		console.clear();
		console.log('WORDLE GAME - CLIENT');

		const { gameStatus }: GameStatus | any = response.data;

		// Show remaining attempts
		const remaining = Math.max(0, 6 - gameStatus.attempts);
		console.log(`\nAttempts remaining: ${remaining}\n`);

		// SHow guesses
		for (let i = 0; i < gameStatus.wordGuessed.length; i++) {
			const wordGuessed = gameStatus.wordGuessed[i];
			const guessResult = gameStatus.guessResult[i];
			console.log(`${i + 1}. ${this.formatResult(wordGuessed, guessResult)}`);
		}
	}

	private async getGuess(): Promise<string> {
		return new Promise((res) => {
			this.interface.question('\nEnter your 5-letter guess: ', (answer) => {
				res(answer.trim());
			});
		});
	}

	async startGame(): Promise<void> {
		console.log('\n\n');
		console.log('Welcome to Wordle Client');
		console.log('Connecting to Server ... ');
		try {
			const createResponse = await this.apiclient.createGame();
			if (createResponse.error) {
				console.log(`Failed to create game: ${createResponse.message}`);
				return;
			}

			// Type guard to ensure createResponse.data is an object with expected properties
			const data = createResponse.data as {
				sessionID: string;
				gameConfig: { maxAttempts: number };
			};

			this.sessionID = data.sessionID;

			console.log(`Game session created: ${this.sessionID}`);
			console.log(`Get ${data.gameConfig.maxAttempts} chances to guess a 5-letter word.`);
			console.log('Each guess must be a valid 5-letter word');
			console.log(
				'The color of the tiles will change to show how close your guess was to the word'
			);
			console.log('🟩 means correct character in the word and in the correct spot');
			console.log('🟨 means correct character in the word but in the wrong spot');
			console.log('🟥 means character not in any spot');
			console.log('Press Enter to continue...');
			await new Promise((res) => this.interface.question('', res));
			while (true) {
				await this.displayGame();

				if (!this.sessionID) {
					console.log(`Invalid Session ...`);
					break;
				}

				const statusResponse = await this.apiclient.getGameStatus(this.sessionID);
				if (statusResponse.error) {
					console.log(`Error getting game status: ${statusResponse.message}`);
					break;
				}

				const { gameStatus, correctWord } = statusResponse.data as {
					gameStatus: GameStatus;
					correctWord: string;
				};

				// Check if game has ended, whether winning or losing
				if (gameStatus.isGameEnded) {
					if (gameStatus.isGameWon) console.log('\nCongratulations! You won the game');
					else {
						console.log("\nGame over! You've run out of moves");
						console.log(`The word was: ${correctWord}`);
					}
					console.log('\nPress Enter to continue...');
					await new Promise((res) => this.interface.question('', res));
					break;
				}

				try {
					const guess = await this.getGuess();

					const guessResponse = await this.apiclient.actionGuess(this.sessionID, guess);
					if (guessResponse.error) {
						console.log(`\n${guessResponse.message}`);
						console.log('Press Enter to try again...');
						await new Promise((resolve) => this.interface.question('', resolve));
						continue;
					}
					const { guessedWord, guessResult } = guessResponse.data as {
						guessedWord: string;
						guessResult: WordResult;
					};

					// Brief pause to show the result
					console.log(`\nYour guess: ${this.formatResult(guessedWord, guessResult)}`);

					await new Promise((resolve) => setTimeout(resolve, 1500));
				} catch (error) {
					console.log('An error occured : ', error);
					console.log('Press Enter to try again ...');
					await new Promise((res) => this.interface.question('', res));
				}
			}
		} catch (error) {
			console.log(`Connection error: ${error as string}`);
			console.log('Make sure the server is running');
		} finally {
			// Clean up session
			if (this.sessionID) await this.apiclient.deleteGame(this.sessionID);

			this.interface.close();
		}
	}
}
