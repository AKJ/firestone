import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { GameType, SceneMode, isBattlegrounds } from '@firestone-hs/reference-data';
import { OverwolfService } from '@firestone/shared/framework/core';
import { Observable, combineLatest } from 'rxjs';
import { debounceTime, filter } from 'rxjs/operators';
import { BgsPlayer } from '../../models/battlegrounds/bgs-player';
import { SceneService } from '../../services/game/scene.service';
import { PreferencesService } from '../../services/preferences.service';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractWidgetWrapperComponent } from './_widget-wrapper.component';

@Component({
	selector: 'bgs-leaderboard-widget-wrapper',
	styleUrls: ['../../../css/component/overlays/bgs-leaderboard-widget-wrapper.component.scss'],
	template: `
		<!-- So that we avoid showing other players infos before the start of the match -->
		<ng-container
			*ngIf="{
				bgsPlayers: bgsPlayers$ | async,
				currentTurn: currentTurn$ | async,
				lastOpponentPlayerId: lastOpponentPlayerId$ | async,
				showLastOpponentIcon: showLastOpponentIcon$ | async,
				opponentBoardMouseOver: opponentBoardMouseOver$ | async,
				buddiesEnabled: buddiesEnabled$ | async
			} as value"
		>
			<div class="bgs-leaderboard" *ngIf="showWidget$ | async">
				<bgs-leaderboard-empty-card
					class="opponent-overlay"
					*ngFor="let bgsPlayer of value.bgsPlayers; let i = index; trackBy: trackByFunction"
					[bgsPlayer]="bgsPlayer"
					[currentTurn]="value.currentTurn"
					[lastOpponentPlayerId]="value.lastOpponentPlayerId"
					[showLastOpponentIcon]="value.showLastOpponentIcon"
					[opponentBoardMouseOver]="value.opponentBoardMouseOver"
					[buddiesEnabled]="value.buddiesEnabled"
				>
				</bgs-leaderboard-empty-card>
				<div class="mouse-leave-fix top"></div>
				<div class="mouse-leave-fix right"></div>
			</div>
		</ng-container>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsLeaderboardWidgetWrapperComponent extends AbstractWidgetWrapperComponent implements AfterContentInit {
	protected defaultPositionLeftProvider = (gameWidth: number, gameHeight: number, dpi: number) => 0;
	protected defaultPositionTopProvider = (gameWidth: number, gameHeight: number, dpi: number) => gameHeight * 0.15;
	protected positionUpdater = null;
	protected positionExtractor = null;
	protected getRect = () => this.el.nativeElement.querySelector('.bgs-leaderboard')?.getBoundingClientRect();

	showWidget$: Observable<boolean>;
	bgsPlayers$: Observable<readonly BgsPlayer[]>;
	lastOpponentPlayerId$: Observable<number>;
	currentTurn$: Observable<number>;
	showLastOpponentIcon$: Observable<boolean>;
	opponentBoardMouseOver$: Observable<boolean>;
	buddiesEnabled$: Observable<boolean>;
	windowWidth: number;
	windowHeight: number;

	constructor(
		protected readonly ow: OverwolfService,
		protected readonly el: ElementRef,
		protected readonly prefs: PreferencesService,
		protected readonly renderer: Renderer2,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly scene: SceneService,
	) {
		super(ow, el, prefs, renderer, store, cdr);
	}

	async ngAfterContentInit() {
		await this.scene.isReady();

		this.showWidget$ = combineLatest([
			this.scene.currentScene$$,
			this.store.listenDeckState$((state) => state.metadata),
			this.store.listenBattlegrounds$(
				([state]) => state?.inGame,
				([state]) => state?.currentGame?.players?.length,
			),
		]).pipe(
			this.mapData(
				([currentScene, [metadata], [inGame, playerCount]]) =>
					isBattlegrounds(metadata.gameType) &&
					currentScene === SceneMode.GAMEPLAY &&
					inGame &&
					(GameType.GT_BATTLEGROUNDS_FRIENDLY === metadata.gameType ||
						(GameType.GT_BATTLEGROUNDS === metadata.gameType && playerCount === 8)),
			),
			this.handleReposition(),
		);
		this.buddiesEnabled$ = this.store
			.listenBattlegrounds$(([state]) => state?.currentGame?.hasBuddies)
			.pipe(this.mapData(([hasBuddies]) => hasBuddies));
		this.bgsPlayers$ = this.store
			.listenBattlegrounds$(([state]) => state?.currentGame?.players)
			.pipe(
				debounceTime(1000),
				filter(([players]) => !!players?.length),
				this.mapData(([players]) =>
					[...players].sort((a: BgsPlayer, b: BgsPlayer) => a.leaderboardPlace - b.leaderboardPlace),
				),
			);
		this.lastOpponentPlayerId$ = this.store
			.listenBattlegrounds$(([state]) => state.currentGame?.lastOpponentPlayerId)
			.pipe(this.mapData(([lastOpponentCardId]) => lastOpponentCardId));
		this.currentTurn$ = this.store
			.listenBattlegrounds$(([state]) => state.currentGame?.currentTurn)
			.pipe(this.mapData(([currentTurn]) => currentTurn));
		this.showLastOpponentIcon$ = this.listenForBasicPref$((prefs) => prefs.bgsShowLastOpponentIconInOverlay);
		this.opponentBoardMouseOver$ = this.listenForBasicPref$((prefs) => prefs.bgsEnableOpponentBoardMouseOver);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	trackByFunction(index: number, player: BgsPlayer) {
		return player.cardId;
	}

	protected async doResize(): Promise<void> {
		const gameInfo = await this.ow.getRunningGameInfo();
		if (!gameInfo) {
			return;
		}
		const gameHeight = gameInfo.height;
		this.windowWidth = gameHeight * 1.12;
		this.windowHeight = gameHeight * 0.4;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
