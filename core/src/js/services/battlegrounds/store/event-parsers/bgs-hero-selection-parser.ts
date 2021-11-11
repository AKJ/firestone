import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsGame } from '../../../../models/battlegrounds/bgs-game';
import { BgsPanel } from '../../../../models/battlegrounds/bgs-panel';
import { BgsHeroSelectionOverviewPanel } from '../../../../models/battlegrounds/hero-selection/bgs-hero-selection-overview';
import { MemoryInspectionService } from '../../../plugins/memory-inspection.service';
import { BgsHeroSelectionEvent } from '../events/bgs-hero-selection-event';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { BgsGlobalInfoUpdatedParser } from './bgs-global-info-updated-parser';
import { EventParser } from './_event-parser';

export class BgsHeroSelectionParser implements EventParser {
	constructor(private readonly memoryService: MemoryInspectionService) {}

	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsHeroSelectionEvent';
	}

	public async parse(currentState: BattlegroundsState, event: BgsHeroSelectionEvent): Promise<BattlegroundsState> {
		const bgsInfo = await this.memoryService.getBattlegroundsInfo(10);
		console.log('[bgs-game-init] retrieved bgs info', bgsInfo?.game?.AvailableRaces);
		const [availableRaces, bannedRaces] = BgsGlobalInfoUpdatedParser.buildRaces(bgsInfo?.game?.AvailableRaces) ?? [
			null,
			null,
		];
		const newHeroSelectionPanel: BgsHeroSelectionOverviewPanel = await this.buildHeroSelectionPanel(
			currentState,
			event.heroCardIds,
		);
		const panels: readonly BgsPanel[] = currentState.panels.map((panel) =>
			panel.id === 'bgs-hero-selection-overview' ? newHeroSelectionPanel : panel,
		);
		return currentState.update({
			currentPanelId: 'bgs-hero-selection-overview',
			panels: panels,
			inGame: true,
			currentGame: currentState.currentGame.update({
				availableRaces: availableRaces,
				bannedRaces: bannedRaces,
			} as BgsGame),
		} as BattlegroundsState);
	}

	private async buildHeroSelectionPanel(
		currentState: BattlegroundsState,
		heroCardIds: readonly string[],
	): Promise<BgsHeroSelectionOverviewPanel> {
		return BgsHeroSelectionOverviewPanel.create({
			heroOptionCardIds: heroCardIds,
		} as BgsHeroSelectionOverviewPanel);
	}
}
