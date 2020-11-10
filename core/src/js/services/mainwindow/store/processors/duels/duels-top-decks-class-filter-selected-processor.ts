import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { DuelsStateBuilderService } from '../../../../duels/duels-state-builder.service';
import { PreferencesService } from '../../../../preferences.service';
import { DuelsTopDecksClassFilterSelectedEvent } from '../../events/duels/duels-top-decks-class-filter-selected-event';
import { Processor } from '../processor';

export class DuelsTopDecksClassFilterSelectedProcessor implements Processor {
	constructor(private readonly duelsService: DuelsStateBuilderService, private readonly prefs: PreferencesService) {}

	public async process(
		event: DuelsTopDecksClassFilterSelectedEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		await this.prefs.updateDuelsTopDecksClassFilter(event.value);
		const duels = await this.duelsService.updateState(
			currentState.duels,
			currentState.stats.gameStats,
			currentState.binder,
		);
		console.log('updated duels hero sort filter', event.value);
		return [
			currentState.update({
				duels: duels,
			} as MainWindowState),
			null,
		];
	}
}
