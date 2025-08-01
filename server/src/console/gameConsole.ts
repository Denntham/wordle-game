import * as readline from 'readline';
import { Wordle } from '../controllers/gameLogic';
import { GameConfig, WordResult } from '../utils/types';

export class Interface {
	private interface: readline.Interface;
	private gameConfig: GameConfig;
	private game: Wordle;

	constructor(config: GameConfig) {
		this.interface = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		});
		this.gameConfig = config;
		this.game = new Wordle(config);
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

	private displayGame(): void {
		console.clear();
		console.log('WORDLE GAME');

		const gameStatus = this.game.getGameStatus();

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
		console.log(this.gameConfig);
		console.log('\n\n');
		console.log('Wordle');
		console.log(`Get ${this.gameConfig.maxAttempts} chances to guess a 5-letter word.`);
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
			this.displayGame();

			const gameStatus = this.game.getGameStatus();
			// Check if game has ended, whether winning or losing
			if (gameStatus.isGameEnded) {
				if (gameStatus.isGameWon) console.log('\nCongratulations! You won the game');
				else {
					console.log("\nGame over! You've run out of moves");
					console.log(`The word was: ${this.game.getCorrectWord()}`);
				}
				console.log('\nPress Enter to continue...');
				await new Promise((res) => this.interface.question('', res));
				break;
			}

			try {
				const guess = await this.getGuess();
				let error: string | null = null;

				if (!guess || typeof guess !== 'string') error = 'Guess must be a string';
				else if (guess.length !== 5) error = 'Guess must be a 5-letter word';
				else if (!/^[A-Za-z]+$/.test(guess)) error = 'Guess must contain only letters';
				else if (
					this.gameConfig.strictMode &&
					!this.gameConfig.wordList.includes(guess.toUpperCase())
				)
					error = 'Word is not included in list';

				if (error) {
					console.log(`\n${error}`);
					console.log('Press Enter to try again...');
					await new Promise((resolve) => this.interface.question('', resolve));
					continue;
				} else {
					const result = this.game.actionGuess(guess);

					// Brief pause to show the result
					console.log(
						`\nYour guess: ${this.formatResult(result.guessedWord, result.guessResult)}`
					);
					await new Promise((resolve) => setTimeout(resolve, 1500));
				}
			} catch (error) {
				console.log('An error occured : ', error);
				console.log('Press Enter to try again ...');
				await new Promise((res) => this.interface.question('', res));
			}
		}

		this.interface.close();
	}
}
