import { GameEvent } from '../../game-event';

export class ChoosingOptionsGameEvent extends GameEvent {
	readonly additionalData: {
		readonly options: {
			readonly EntityId: number;
			readonly CardId: string;
			readonly QuestDifficulty?: number;
		}[];
		readonly context: {
			readonly DataNum1: number;
		};
	};
}
