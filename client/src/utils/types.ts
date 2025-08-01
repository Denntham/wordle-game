export type CharResult = 'hit' | 'present' | 'miss';
export type WordResult = CharResult[];

export type GuessResponse = {
	guessedWord: string;
	guessResult: WordResult;
	gameStatus: GameStatus;
};

export type GameStatus = {
	attempts: number;
	isGameWon: boolean;
	isGameEnded: boolean;
	wordGuessed: string[];
	guessResult: WordResult[];
};

export type APIStatusResponse = {
	session: string;
	gameStatus: GameStatus;
	correctWord?: string | undefined;
};
