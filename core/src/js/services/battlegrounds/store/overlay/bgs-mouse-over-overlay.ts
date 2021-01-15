import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { Preferences } from '../../../../models/preferences';
import { FeatureFlags } from '../../../feature-flags';
import { OverwolfService } from '../../../overwolf.service';
import { PreferencesService } from '../../../preferences.service';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { BattlegroundsOverlay } from './battlegrounds-overlay';

export class BgsMouseOverOverlay implements BattlegroundsOverlay {
	private bgsActive = true;

	constructor(private readonly prefs: PreferencesService, private readonly ow: OverwolfService) {}

	public async processEvent(gameEvent: BattlegroundsStoreEvent) {
		// Do nothing
	}

	public async handleDisplayPreferences(preferences: Preferences) {
		this.bgsActive =
			FeatureFlags.ENABLE_BG_OPPONENT_MOUSE_OVER &&
			preferences.bgsEnableOpponentBoardMouseOver &&
			preferences.bgsFullToggle;
	}

	// TODO: closing the window when BG game ends is not well tested yet
	public async updateOverlay(state: BattlegroundsState) {
		const windowId = OverwolfService.BATTLEGROUNDS_WINDOW_MOUSE_OVER_OVERLAY;
		const battlegroundsWindow = await this.ow.getWindowState(windowId);
		const inGame = state && state.inGame && !state.gameEnded;
		// console.log('[bgs-mouse-overlay] should close?', inGame, this.bgsActive, state);
		if (inGame && this.bgsActive) {
			if (battlegroundsWindow.window_state_ex !== 'normal' && battlegroundsWindow.stateEx !== 'normal') {
				await this.ow.obtainDeclaredWindow(windowId);
				await this.ow.restoreWindow(windowId);
			}
		} else {
			// console.log(
			// 	'[bgs-mouse-overlay] closing window',
			// 	battlegroundsWindow,
			// 	inGame,
			// 	this.bgsActive,
			// 	state.forceOpen,
			// );
			await this.ow.closeWindow(windowId);
		}
	}

	public async handleHotkeyPressed(state: BattlegroundsState, force = false) {
		// Do nothing
	}
}
