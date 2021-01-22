import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Input,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { Entity } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { BgsPlayer } from '../../models/battlegrounds/bgs-player';
import { BgsTavernUpgrade } from '../../models/battlegrounds/in-game/bgs-tavern-upgrade';
import { BgsTriple } from '../../models/battlegrounds/in-game/bgs-triple';
import { FeatureFlags } from '../../services/feature-flags';

declare let amplitude: any;

@Component({
	selector: 'bgs-player-capsule',
	styleUrls: [
		`../../../css/global/reset-styles.scss`,
		`../../../css/component/battlegrounds/bgs-player-capsule.component.scss`,
	],
	template: `
		<div class="player-overview">
			<div class="background-additions">
				<div class="top"></div>
				<div class="bottom"></div>
			</div>
			<div class="portrait">
				<bgs-hero-portrait
					class="icon"
					[icon]="icon"
					[health]="health"
					[maxHealth]="maxHealth"
					[cardTooltip]="heroPowerCardId"
					[cardTooltipText]="name"
					[cardTooltipClass]="'bgs-hero-power'"
					[rating]="rating"
				></bgs-hero-portrait>
				<tavern-level-icon [level]="tavernTier" class="tavern" *ngIf="tavernTier"></tavern-level-icon>
				<div
					class="last-opponent-icon"
					*ngIf="enableLastOpponentIcon && showLastOpponentIcon"
					helpTooltip="Was last round's opponent"
					inlineSVG="assets/svg/last_opponent.svg"
				></div>
			</div>
			<div class="player-info">
				<ng-content></ng-content>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsPlayerCapsuleComponent {
	enableLastOpponentIcon: boolean = FeatureFlags.ENABLE_BG_LAST_ROUND_OPPONENT_ICON;

	icon: string;
	health: number;
	maxHealth: number;
	heroPowerCardId: string;
	name: string;
	tavernTier: number;
	boardMinions: readonly Entity[];
	boardTurn: number;
	tavernUpgrades: readonly BgsTavernUpgrade[];
	triples: readonly BgsTriple[];

	@Input() rating: number;
	@Input() showLastOpponentIcon: boolean;
	@Input() displayTavernTier: boolean;

	@Input() set player(value: BgsPlayer) {
		if (value === this._player) {
			return;
		}
		this._player = value;
		if (!value) {
			console.warn('[opponent-big] setting empty value');
			return;
		}
		// console.log('setting next opponent info', value, value.getCurrentTavernTier());
		this.icon = `https://static.zerotoheroes.com/hearthstone/fullcard/en/256/battlegrounds/${value.getDisplayCardId()}.png`;
		this.health = value.initialHealth - value.damageTaken;
		this.maxHealth = value.initialHealth;
		this.heroPowerCardId = value.getDisplayHeroPowerCardId();
		this.name = value.name;
		this.tavernTier = this.displayTavernTier ? value.getCurrentTavernTier() : undefined;
		this.boardMinions = value.getLastKnownBoardState();
		this.boardTurn = value.getLastBoardStateTurn();
		this.triples = value.tripleHistory;
		this.tavernUpgrades = value.tavernUpgradeHistory;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private _player: BgsPlayer;

	constructor(private readonly cdr: ChangeDetectorRef, private el: ElementRef, private renderer: Renderer2) {}

	trackByUpgradeFn(index, item: BgsTavernUpgrade) {
		return item.tavernTier;
	}
}
