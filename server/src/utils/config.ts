import * as fs from 'fs';
import { DEFAULT_WORD_LIST } from '../inputs/wordList';
import { GameConfig } from './types';

interface CustomGameConfig {
	maxAttempts: number;
	strictMode?: boolean;
	customList?: string[];
}

export class ConfigLoader {
	private configPath: string;

	constructor(configPath: string = './src/inputs/gameConfig.json') {
		this.configPath = configPath;
	}

	private getDefaultConfig(): GameConfig {
		return {
			maxAttempts: 6,
			strictMode: true,
			wordList: DEFAULT_WORD_LIST,
		};
	}

	loadConfig(): GameConfig {
		try {
			// check if config file exists and use the config if exists
			if (!fs.existsSync(this.configPath)) {
				console.warn(`Config file not found at ${this.configPath}, using default config`);
			}

			const configFile: CustomGameConfig = JSON.parse(
				fs.readFileSync(this.configPath, 'utf-8')
			);

			return {
				maxAttempts: configFile.maxAttempts,
				strictMode: configFile.strictMode ?? true,
				wordList:
					configFile.customList && configFile.customList.length > configFile.maxAttempts
						? configFile.customList
						: DEFAULT_WORD_LIST,
			};
		} catch (error) {
			console.log(`Error loading config: ${error}`);
			return this.getDefaultConfig();
		}
	}
}
