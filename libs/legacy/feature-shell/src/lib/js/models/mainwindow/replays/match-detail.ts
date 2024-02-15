import { BgsPostMatchStatsPanel } from '@firestone/battlegrounds/common';
import { GameStat } from '@firestone/stats/data-access';

export class MatchDetail {
	readonly replayInfo: GameStat;
	readonly bgsPostMatchStatsPanel?: BgsPostMatchStatsPanel;
}
