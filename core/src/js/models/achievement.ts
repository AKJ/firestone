import { ReplayInfo } from './replay-info';

export class Achievement {
	readonly id: string;
	readonly type: string;
	readonly name: string;
	readonly icon: string;
	readonly root: boolean;
	readonly canBeCompletedOnlyOnce: boolean;
	readonly priority: number; // Used to sort the achievements
	readonly displayName: string;
	readonly text: string;
	readonly emptyText: string;
	readonly completedText: string;
	readonly displayCardId: string;
	readonly displayCardType: string;
	readonly difficulty: string;
	readonly maxNumberOfRecords: number;
	readonly points: number;
	readonly numberOfCompletions: number = 0;
	readonly linkedAchievementIds: readonly string[] = [];
	readonly replayInfo: readonly ReplayInfo[] = [];

	public update(value: Achievement): Achievement {
		return Object.assign(new Achievement(), this, value);
	}
}
