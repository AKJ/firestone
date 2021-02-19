import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	EventEmitter,
	HostListener,
	Input,
	OnDestroy,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { BehaviorSubject, Subscriber, Subscription } from 'rxjs';
import { CardTooltipPositionType } from '../../../directives/card-tooltip-position.type';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { StatsRecap } from '../../../models/decktracker/stats-recap';
import { Preferences } from '../../../models/preferences';
import { DebugService } from '../../../services/debug.service';
import { Events } from '../../../services/events.service';
import { OverwolfService } from '../../../services/overwolf.service';
import { PreferencesService } from '../../../services/preferences.service';

declare let amplitude;

@Component({
	selector: 'decktracker-overlay-root',
	styleUrls: [
		'../../../../css/global/components-global.scss',
		`../../../../css/global/cdk-overlay.scss`,
		'../../../../css/component/decktracker/overlay/decktracker-overlay.component.scss',
		`../../../../css/themes/decktracker-theme.scss`,
	],
	template: `
		<div
			class="root overlay-container-parent {{ player }}"
			[activeTheme]="'decktracker'"
			[style.opacity]="opacity"
			[ngClass]="{ 'active': active }"
		>
			<decktracker-widget-icon
				class="icon"
				(decktrackerToggle)="onDecktrackerToggle($event)"
				[decktrackerToggled]="active"
			></decktracker-widget-icon>
			<!-- Never remove the scalable from the DOM so that we can perform resizing even when not visible -->
			<div class="scalable">
				<div class="decktracker-container">
					<div
						class="decktracker"
						*ngIf="showTracker"
						[style.width.px]="overlayWidthInPx"
						[ngClass]="{ 'hide-control-bar': !showControlBar }"
					>
						<div class="background"></div>
						<decktracker-control-bar
							[windowId]="windowId"
							[settingsCategory]="player"
							[closeEvent]="closeEvent"
							(onMinimize)="onMinimize()"
						></decktracker-control-bar>
						<decktracker-title-bar
							[deck]="deck"
							[showTitleBar]="showTitleBar"
							[showDeckWinrate]="showDeckWinrate"
							[showMatchupWinrate]="showMatchupWinrate"
							[deckWinrate]="deckStatsRecap"
							[matchupWinrate]="matchupStatsRecap"
						></decktracker-title-bar>
						<decktracker-deck-list
							[deckState]="deck"
							[displayMode]="displayMode"
							[colorManaCost]="colorManaCost"
							[showGlobalEffectsZone]="showGlobalEffectsZone"
							[showGiftsSeparately]="showGiftsSeparately"
							[cardsGoToBottom]="cardsGoToBottom"
							[tooltipPosition]="tooltipPosition"
							[darkenUsedCards]="darkenUsedCards"
							[hideGeneratedCardsInOtherZone]="hideGeneratedCardsInOtherZone"
							[sortCardsByManaCostInOtherZone]="sortCardsByManaCostInOtherZone"
							[side]="player"
						>
						</decktracker-deck-list>
						<div class="backdrop" *ngIf="showBackdrop"></div>
					</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckTrackerOverlayRootComponent implements AfterViewInit, OnDestroy {
	@Input() overlayWidthExtractor: (prefs: Preferences) => number;
	@Input() overlayDisplayModeExtractor: (prefs: Preferences) => string;
	@Input() opacityExtractor: (prefs: Preferences) => number;
	@Input() cardsGoToBottomExtractor: (prefs: Preferences) => boolean;
	@Input() showGlobalEffectsExtractor: (prefs: Preferences) => boolean;
	@Input() darkenUsedCardsExtractor: (prefs: Preferences) => boolean;
	@Input() hideGeneratedCardsInOtherZoneExtractor: (prefs: Preferences) => boolean;
	@Input() sortCardsByManaCostInOtherZoneExtractor: (prefs: Preferences) => boolean;
	@Input() scaleExtractor: (prefs: Preferences) => number;
	@Input() deckExtractor: (state: GameState) => DeckState;
	@Input() trackerPositionUpdater: (left: number, top: number) => void;
	@Input() trackerPositionExtractor: (prefs: Preferences) => { left: number; top: number };
	@Input() defaultTrackerPositionLeftProvider: (gameWidth: number, width: number, dpi: number) => number;
	@Input() defaultTrackerPositionTopProvider: (gameWidth: number, width: number, dpi: number) => number;
	@Input() showDeckWinrateExtractor: (prefs: Preferences) => boolean;
	@Input() showMatchupWinrateExtractor: (prefs: Preferences) => boolean;
	@Input() closeEvent: string;
	@Input() player: 'player' | 'opponent';

	deck: DeckState;

	// gameState: GameState;
	active = true;
	windowId: string;
	activeTooltip: string;
	// overlayDisplayed: boolean;
	displayMode: string;
	showTitleBar: boolean;
	showControlBar: boolean;
	overlayWidthInPx: number;
	opacity: number;
	// showTracker: boolean;
	// highlightCardsInHand: boolean;
	colorManaCost: boolean;
	showGiftsSeparately: boolean;
	cardsGoToBottom: boolean;
	showGlobalEffectsZone: boolean;
	darkenUsedCards: boolean;
	hideGeneratedCardsInOtherZone: boolean;
	sortCardsByManaCostInOtherZone: boolean;
	showDeckWinrate: boolean;
	showMatchupWinrate: boolean;

	tooltipPosition: CardTooltipPositionType = 'left';
	showBackdrop: boolean;

	showTracker: boolean;
	deckStatsRecap: StatsRecap;
	matchupStatsRecap: StatsRecap;

	// private hasBeenMovedByUser: boolean;
	private showTooltips = true;

	private scale;
	private gameInfoUpdatedListener: (message: any) => void;
	private showTooltipSubscription: Subscription;
	private hideTooltipSubscription: Subscription;
	private deckSubscription: Subscription;
	private preferencesSubscription: Subscription;
	// private displaySubscription: Subscription;

	constructor(
		private prefs: PreferencesService,
		private cdr: ChangeDetectorRef,
		private ow: OverwolfService,
		private el: ElementRef,
		private renderer: Renderer2,
		private events: Events,
		private init_DebugService: DebugService,
		private cards: AllCardsService,
	) {}

	async ngAfterViewInit() {
		this.cards.initializeCardsDb();
		this.windowId = (await this.ow.getCurrentWindow()).id;

		const deckEventBus: BehaviorSubject<any> = this.ow.getMainWindow().deckEventBus;
		const subscriber = new Subscriber<any>(async event => {
			this.showTracker = event.state != null;
			this.deckStatsRecap = (event.state as GameState).deckStatsRecap;
			this.matchupStatsRecap = (event.state as GameState).matchupStatsRecap;
			// this.gameState = event ? event.state : undefined;
			// console.log('received game state', event);
			this.deck = event.state ? this.deckExtractor(event.state) : null;
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		});
		subscriber['identifier'] = 'decktracker-overlay-root';
		this.deckSubscription = deckEventBus.subscribe(subscriber);

		const preferencesEventBus: EventEmitter<any> = this.ow.getMainWindow().preferencesEventBus;
		this.preferencesSubscription = preferencesEventBus.subscribe(event => {
			this.handleDisplayPreferences(event.preferences);
		});
		this.gameInfoUpdatedListener = this.ow.addGameInfoUpdatedListener(async (res: any) => {
			if (res && res.resolutionChanged) {
				console.log('[decktracker-overlay] received new game info', res);
				await this.changeWindowSize();
				await this.restoreWindowPosition(true);
			}
		});
		this.events.on(Events.SHOW_MODAL).subscribe(() => {
			this.showBackdrop = true;
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		});
		this.events.on(Events.HIDE_MODAL).subscribe(() => {
			this.showBackdrop = false;
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		});

		await this.handleDisplayPreferences();
		await this.changeWindowSize();
		amplitude.getInstance().logEvent('match-start', {
			'display-mode': this.displayMode,
			'player': this.player,
		});
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
		// console.log('handled after view init');
	}

	@HostListener('window:beforeunload')
	ngOnDestroy(): void {
		this.ow.removeGameInfoUpdatedListener(this.gameInfoUpdatedListener);
		this.showTooltipSubscription?.unsubscribe();
		this.hideTooltipSubscription?.unsubscribe();
		this.deckSubscription?.unsubscribe();
		this.preferencesSubscription?.unsubscribe();
		this.deckStatsRecap = null;
		this.matchupStatsRecap = null;
		console.log('[shutdown] unsubscribed from decktracker-ovelray-root');
	}

	onMinimize() {
		console.log('minimizing in root');
		this.onDecktrackerToggle(false);
	}

	async onDecktrackerToggle(toggled: boolean) {
		this.active = toggled;
		// Avoid artifacts when minimizing
		this.showTooltips = this.active;
		await this.updateTooltipPosition();
	}

	@HostListener('mousedown')
	dragMove() {
		// console.log('starting drag');
		this.tooltipPosition = 'none';
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
		this.ow.dragMove(this.windowId, async result => {
			// console.log('drag finished, updating position');
			await this.updateTooltipPosition();
			const window = await this.ow.getCurrentWindow();
			// console.log('retrieved window', window);
			if (!window) {
				return;
			}
			// console.log('updating tracker position', window.left, window.top);
			this.trackerPositionUpdater(window.left, window.top);
			// this.prefs.updateTrackerPosition(window.left, window.top);
			// console.log('updated tracker position', window.left, window.top);
		});
	}

	private async handleDisplayPreferences(preferences: Preferences = null) {
		preferences = preferences || (await this.prefs.getPreferences());
		// console.log('updating prefs', preferences);
		this.displayMode = this.overlayDisplayModeExtractor(preferences);
		this.showTitleBar = preferences.overlayShowTitleBar;
		this.showControlBar = preferences.overlayShowControlBar;
		this.overlayWidthInPx = 227; // this.overlayWidthExtractor(preferences);
		this.opacity = this.opacityExtractor(preferences) / 100;
		this.scale = this.scaleExtractor(preferences);
		this.el.nativeElement.style.setProperty('--decktracker-scale', this.scale / 100);
		this.el.nativeElement.style.setProperty('--decktracker-max-height', this.player === 'player' ? '90vh' : '70vh');
		this.colorManaCost = preferences.overlayShowRarityColors;
		this.showGiftsSeparately = preferences.overlayShowGiftedCardsInSeparateLine;
		this.cardsGoToBottom = this.cardsGoToBottomExtractor(preferences);
		this.showGlobalEffectsZone = this.showGlobalEffectsExtractor(preferences);
		this.showDeckWinrate = this.showDeckWinrateExtractor(preferences);
		this.showMatchupWinrate = this.showMatchupWinrateExtractor(preferences);
		this.darkenUsedCards = this.darkenUsedCardsExtractor(preferences);
		this.hideGeneratedCardsInOtherZone = this.hideGeneratedCardsInOtherZoneExtractor(preferences);
		this.sortCardsByManaCostInOtherZone = this.sortCardsByManaCostInOtherZoneExtractor(preferences);
		this.showTooltips = preferences.overlayShowTooltipsOnHover;
		await this.updateTooltipPosition();
		// console.log('showing tooltips?', this.showTooltips, this.tooltipPosition);
		this.onResized();
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private onResized() {
		const newScale = this.scale / 100;
		const element = this.el.nativeElement.querySelector('.scalable');
		this.renderer.setStyle(element, 'transform', `scale(${newScale})`);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private async restoreWindowPosition(forceTrackerReposition = false): Promise<void> {
		const width = 252 * 2;
		const gameInfo = await this.ow.getRunningGameInfo();
		if (!gameInfo) {
			return;
		}
		const gameWidth = gameInfo.logicalWidth;
		const dpi = gameWidth / gameInfo.width;
		const prefs = await this.prefs.getPreferences();
		const trackerPosition = this.trackerPositionExtractor(prefs);
		console.log('window position', await this.ow.getCurrentWindow(), gameInfo);
		console.log('loaded tracker position', trackerPosition, this.player);
		// https://stackoverflow.com/questions/8388440/converting-a-double-to-an-int-in-javascript-without-rounding
		const newLeft =
			trackerPosition && !forceTrackerReposition
				? trackerPosition.left || 0
				: this.defaultTrackerPositionLeftProvider(gameWidth, width, dpi);
		const newTop =
			trackerPosition && !forceTrackerReposition
				? trackerPosition.top || 0
				: this.defaultTrackerPositionTopProvider(gameWidth, width, dpi);
		console.log('updating tracker position', newLeft, newTop);
		await this.ow.changeWindowPosition(this.windowId, newLeft, newTop);
		console.log('after window position update', await this.ow.getCurrentWindow());
		// console.log('monitors list', await this.ow.getMonitorsList());
		// console.log('game info', await this.ow.getRunningGameInfo());
		await this.updateTooltipPosition();
	}

	private async changeWindowSize(): Promise<void> {
		const width = 252 * 3; // Max scale
		const gameInfo = await this.ow.getRunningGameInfo();
		if (!gameInfo) {
			return;
		}
		const gameHeight = gameInfo.logicalHeight;
		await this.ow.changeWindowSize(this.windowId, width, gameHeight);
		await this.restoreWindowPosition();
		await this.updateTooltipPosition();
	}

	private async updateTooltipPosition() {
		// console.log('updating tooltip position');
		const window = await this.ow.getCurrentWindow();
		if (!window) {
			return;
		}
		// console.log('retrieved current window', window);
		if (!this.showTooltips) {
			this.tooltipPosition = 'none';
		} else if (window.left < 0) {
			this.tooltipPosition = 'right';
		} else {
			this.tooltipPosition = 'left';
		}
		// console.log('[decktracker-overlay] tooltip position updated', this.tooltipPosition);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
