import { Injectable } from '@angular/core';
import {
	AbstractFacadeService,
	AppInjector,
	OverwolfService,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { PreferencesService } from '@legacy-import/src/lib/js/services/preferences.service';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class GameStatusService extends AbstractFacadeService<GameStatusService> {
	public inGame$$: BehaviorSubject<boolean>;

	private startListeners = [];
	private exitListeners = [];

	private ow: OverwolfService;
	private prefs: PreferencesService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'gameStatus', () => !!this.inGame$$);
	}

	protected override assignSubjects() {
		this.inGame$$ = this.mainInstance.inGame$$;
	}

	protected async init() {
		this.inGame$$ = new BehaviorSubject<boolean>(false);
		this.ow = AppInjector.get(OverwolfService);
		this.prefs = AppInjector.get(PreferencesService);

		this.ow.addGameInfoUpdatedListener(async (res) => {
			if (this.ow.exitGame(res)) {
				this.inGame$$.next(false);
				this.exitListeners.forEach((cb) => cb(res));
			} else if ((await this.ow.inGame()) && (res.gameChanged || res.runningChanged)) {
				this.inGame$$.next(true);
				console.debug('[game-status] game launched', res);
				this.startListeners.forEach((cb) => cb(res));
				this.updateExecutionPathInPrefs(res.gameInfo?.executionPath);
			}
		});

		const gameInfo = await this.ow.getRunningGameInfo();
		this.updateExecutionPathInPrefs(gameInfo?.executionPath);

		if (await this.ow.inGame()) {
			this.inGame$$.next(true);
		}
	}

	public async onGameStart(callback) {
		this.startListeners.push(callback);
		if (await this.inGame()) {
			callback();
		}
	}

	public onGameExit(callback) {
		this.exitListeners.push(callback);
	}

	public async inGame(): Promise<boolean> {
		return this.ow.inGame();
	}

	private async updateExecutionPathInPrefs(executionPath: string) {
		if (!executionPath?.length) {
			return;
		}

		let gameLocation = executionPath.split('Hearthstone.exe')[0]?.replaceAll('/', '\\');
		if (gameLocation?.endsWith('\\')) {
			gameLocation = gameLocation.substring(0, gameLocation.length - 1);
		}
		const prefs = await this.prefs.getPreferences();
		console.debug('[game-status] updating install path?', prefs.gameInstallPath, gameLocation);
		if (prefs.gameInstallPath !== gameLocation) {
			const newPrefs = {
				...prefs,
				gameInstallPath: gameLocation,
			};
			await this.prefs.savePreferences(newPrefs);
			console.debug('[game-status] updated install path?', newPrefs.gameInstallPath);
		}
	}
}
