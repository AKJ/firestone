import { ArchetypeConfig } from '@firestone-hs/categorize-deck/dist/archetype-service';
import { BgsBestStat } from '@firestone-hs/compute-bgs-run-stats/dist/model/bgs-best-stat';
import { ArchetypeStats } from '@firestone-hs/cron-build-ranked-archetypes/dist/archetype-stats';
import { GameStats } from './game-stats';

export class StatsState {
	readonly gameStats: GameStats = new GameStats();
	readonly archetypesConfig: readonly ArchetypeConfig[];
	readonly archetypesStats: ArchetypeStats;
	readonly bestBgsUserStats: readonly BgsBestStat[];

	public static create(base: StatsState): StatsState {
		return Object.assign(new StatsState(), base);
	}

	public update(base: StatsState): StatsState {
		return Object.assign(new StatsState(), this, base);
	}
}
