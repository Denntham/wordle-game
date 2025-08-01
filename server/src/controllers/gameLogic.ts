import { CharResult, GameConfig, GameStatus, GuessResponse, WordResult } from '../utils/types';
import { DEFAULT_WORD_LIST } from '../inputs/wordList';

export class Wordle {
	private correctWord: string;
	private gameConfig: GameConfig;
	private gameStatus: GameStatus;

	constructor(config: GameConfig) {
		this.gameConfig = config;
		this.correctWord = this.selectRandomWord(config.wordList);
		this.gameStatus = {
			attempts: 0,
			isGameWon: false,
			isGameEnded: false,
			wordGuessed: [],
			guessResult: [],
		};
	}

	// Select random words from the list of words
	private selectRandomWord(wordList: string[]): string {
		const randomizeIndex = Math.floor(Math.random() * wordList.length);
		return wordList[randomizeIndex];
	}

	// check if input is valid (length is 5 and only alphabet (case insensitive))
	private isValidGuess(guess: string): boolean {
		return guess.length === 5 && /^[A-Za-z]/.test(guess);
	}

	// Make a guess and update the game status
	actionGuess(guess: string): GuessResponse {
		// Check if game has already ended
		if (this.gameStatus.isGameEnded) throw new Error('Game has ended');

		if (!this.isValidGuess(guess))
			throw new Error('Invalid Guess! Guess must be a 5 letter word');

		const normGuess = guess.toUpperCase();
		const result = this.evaluateGuess(normGuess);

		this.gameStatus.attempts++;
		this.gameStatus.wordGuessed.push(normGuess);
		this.gameStatus.guessResult.push(result);

		if (result.every((e) => e === 'hit')) {
			this.gameStatus.isGameEnded = true;
			this.gameStatus.isGameWon = true;
		}

		if (this.gameStatus.attempts >= this.gameConfig.maxAttempts && !this.gameStatus.isGameWon)
			this.gameStatus.isGameEnded = true;

		return {
			guessedWord: normGuess,
			guessResult: result,
			gameStatus: { ...this.gameStatus },
		};
	}

	// evaluate the guess
	private evaluateGuess(guess: string): WordResult {
		const answerChars = this.correctWord.split('');
		const guessChars = guess.split('');
		const result: CharResult[] = new Array(5).fill('miss');

		// Check which positions has been used
		const wordUsed = new Array(5).fill(false);

		// Find all exact matches (hits) first
		for (let i = 0; i < 5; i++) {
			// Finds exact matches
			if (guessChars[i] === answerChars[i]) {
				result[i] = 'hit';
				wordUsed[i] = true;
			}
		}

		// Find present letters (wrong position)
		for (let i = 0; i < 5; i++) {
			// Pass hit letters
			if (result[i] === 'hit') continue;
			// Finds chars present in the word
			for (let j = 0; j < 5; j++) {
				if (!wordUsed[j] && guessChars[i] === answerChars[j]) {
					result[i] = 'present';
					wordUsed[j] = true;
					break;
				}
			}
		}

		return result;
	}

	getGameStatus(): GameStatus {
		return { ...this.gameStatus };
	}

	getCorrectWord(): string {
		return this.gameStatus.isGameEnded ? this.correctWord : '';
	}
}

export function createGameConfig(options: Partial<GameConfig> = {}): GameConfig {
	return {
		maxAttempts: options.maxAttempts ?? 6,
		strictMode: options.strictMode ?? true,
		wordList: options.wordList ?? DEFAULT_WORD_LIST,
	};
}
