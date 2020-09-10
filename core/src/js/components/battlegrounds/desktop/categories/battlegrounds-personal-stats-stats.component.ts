import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	EventEmitter,
	Input,
} from '@angular/core';
import { BattlegroundsPersonalStatsCategory } from '../../../../models/mainwindow/battlegrounds/categories/battlegrounds-personal-stats-category';
import { MainWindowState } from '../../../../models/mainwindow/main-window-state';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../../services/overwolf.service';

@Component({
	selector: 'battlegrounds-personal-stats-stats',
	styleUrls: [
		`../../../../../css/component/battlegrounds/desktop/categories/battlegrounds-personal-stats-stats.component.scss`,
		`../../../../../css/global/components-global.scss`,
	],
	template: `
		<div class="stats-recap" scrollable>
			<stat-cell
				label="Total dmg dealt (minions)"
				[value]="totalMinionsDamageDealt.value"
				[heroCardId]="totalMinionsDamageDealt.hero"
				[reviewId]="totalMinionsDamageDealt.reviewId"
			></stat-cell>
			<stat-cell
				label="Total dmg taken (minions)"
				[value]="totalMinionsDamageTaken.value"
				[heroCardId]="totalMinionsDamageTaken.hero"
				[reviewId]="totalMinionsDamageTaken.reviewId"
			></stat-cell>
			<stat-cell
				label="Total dmg dealt (hero)"
				tooltipText="Doesn't include fights against the ghost"
				[value]="totalHeroDamageDealt.value"
				[heroCardId]="totalHeroDamageDealt.hero"
				[reviewId]="totalHeroDamageDealt.reviewId"
			></stat-cell>
			<stat-cell
				label="Max dmg dealt (hero)"
				tooltipText="Doesn't include fights against the ghost"
				[value]="maxSingleTurnHeroDamageDealt.value"
				[heroCardId]="maxSingleTurnHeroDamageDealt.hero"
				[reviewId]="maxSingleTurnHeroDamageDealt.reviewId"
			></stat-cell>
			<stat-cell
				label="Highest Win streak"
				[value]="winStreak.value"
				[heroCardId]="winStreak.hero"
				[reviewId]="winStreak.reviewId"
			></stat-cell>
			<stat-cell
				label="Triples created"
				[value]="triples.value"
				[heroCardId]="triples.hero"
				[reviewId]="triples.reviewId"
			></stat-cell>
			<stat-cell
				label="Max board stats"
				[value]="maxBoardStats.value"
				[heroCardId]="maxBoardStats.hero"
				[reviewId]="maxBoardStats.reviewId"
				tooltipText="The maximum total stats (attack + health) of your board at the beginning of a battle"
			></stat-cell>
			<stat-cell
				label="Coins wasted"
				[value]="coinsWasted.value"
				[heroCardId]="coinsWasted.hero"
				[reviewId]="coinsWasted.reviewId"
			></stat-cell>
			<stat-cell
				label="Rerolls"
				[value]="rerolls.value"
				[heroCardId]="rerolls.hero"
				[reviewId]="rerolls.reviewId"
			></stat-cell>
			<stat-cell
				label="Freezes"
				[value]="freezes.value"
				[heroCardId]="freezes.hero"
				[reviewId]="freezes.reviewId"
			></stat-cell>
			<stat-cell
				label="Hero Power used"
				[value]="heroPowers.value"
				[heroCardId]="heroPowers.hero"
				[reviewId]="heroPowers.reviewId"
			></stat-cell>
			<stat-cell
				label="Minions bought"
				[value]="minionsBought.value"
				[heroCardId]="minionsBought.hero"
				[reviewId]="minionsBought.reviewId"
			></stat-cell>
			<stat-cell
				label="Minions sold"
				[value]="minionsSold.value"
				[heroCardId]="minionsSold.hero"
				[reviewId]="minionsSold.reviewId"
			></stat-cell>
			<stat-cell
				label="Enemy Minions killed"
				[value]="minionsKilled.value"
				[heroCardId]="minionsKilled.hero"
				[reviewId]="minionsKilled.reviewId"
			></stat-cell>
			<stat-cell
				label="Enemy Heroes killed"
				[value]="heroesKilled.value"
				[heroCardId]="heroesKilled.hero"
				[reviewId]="heroesKilled.reviewId"
			></stat-cell>
			<stat-cell
				label="Battles going first"
				[value]="percentageOfBattlesGoingFirst.value?.toFixed(1) + '%'"
				[heroCardId]="percentageOfBattlesGoingFirst.hero"
				[reviewId]="percentageOfBattlesGoingFirst.reviewId"
			></stat-cell>
			<div class="entry cell battle-luck">
				<div class="record-icon">
					<svg class="svg-icon-fill">
						<use xlink:href="assets/svg/sprite.svg#new_record" />
					</svg>
				</div>
				<div class="label">
					Battle luck
					<a
						class="explain-link"
						href="https://github.com/Zero-to-Heroes/firestone/wiki/Battlegrounds-Battle-Luck-stat"
						helpTooltip="An indicator that tells you how lucky you were in your battles during the run. Click for more info"
						target="_blank"
						>What is this?</a
					>
				</div>
				<div class="value">{{ battleLuck.value?.toFixed(1) }}%</div>
			</div>
			<div class="entry cell battle-luck">
				<div class="record-icon">
					<svg class="svg-icon-fill">
						<use xlink:href="assets/svg/sprite.svg#new_record" />
					</svg>
				</div>
				<div class="label">
					Negative Battle luck
					<a
						class="explain-link"
						href="https://github.com/Zero-to-Heroes/firestone/wiki/Battlegrounds-Battle-Luck-stat"
						helpTooltip="An indicator that tells you how lucky you were in your battles during the run. Click for more info"
						target="_blank"
						>What is this?</a
					>
				</div>
				<div class="value">{{ negativeBattleLuck.value?.toFixed(1) }}%</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsPersonalStatsStatsComponent implements AfterViewInit {
	_category: BattlegroundsPersonalStatsCategory;
	_state: MainWindowState;

	totalMinionsDamageDealt: NumberValue = {} as NumberValue;
	totalMinionsDamageTaken: NumberValue = {} as NumberValue;
	totalHeroDamageDealt: NumberValue = {} as NumberValue;
	maxSingleTurnHeroDamageDealt: NumberValue = {} as NumberValue;
	winStreak: NumberValue = {} as NumberValue;
	triples: NumberValue = {} as NumberValue;
	maxBoardStats: NumberValue = {} as NumberValue;
	coinsWasted: NumberValue = {} as NumberValue;
	rerolls: NumberValue = {} as NumberValue;
	freezes: NumberValue = {} as NumberValue;
	heroPowers: NumberValue = {} as NumberValue;
	minionsBought: NumberValue = {} as NumberValue;
	minionsSold: NumberValue = {} as NumberValue;
	minionsKilled: NumberValue = {} as NumberValue;
	heroesKilled: NumberValue = {} as NumberValue;
	percentageOfBattlesGoingFirst: NumberValue = {} as NumberValue;
	battleLuck: NumberValue = {} as NumberValue;
	negativeBattleLuck: NumberValue = {} as NumberValue;

	@Input() set category(value: BattlegroundsPersonalStatsCategory) {
		if (value === this._category) {
			return;
		}
		this._category = value;
		this.updateValues();
	}

	@Input() set state(value: MainWindowState) {
		if (value === this._state) {
			return;
		}
		this._state = value;
		this.updateValues();
	}

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly ow: OverwolfService,
		private readonly el: ElementRef,
		private readonly cdr: ChangeDetectorRef,
	) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	private updateValues() {
		if (!this._state || !this._category) {
			return;
		}
		console.log('top stats', this._state.stats.bestBgsUserStats);
		this.totalMinionsDamageDealt = this.getStat('totalDamageDealtToMinions');
		this.totalMinionsDamageTaken = this.getStat('totalDamageTakenByMinions');
		this.totalHeroDamageDealt = this.getStat('totalDamageDealtToHeroes');
		this.maxSingleTurnHeroDamageDealt = this.getStat('maxDamageDealtToHero');
		this.winStreak = this.getStat('highestWinStreak');
		this.triples = this.getStat('triplesCreated');
		this.maxBoardStats = this.getStat('maxBoardStats');
		this.coinsWasted = this.getStat('coinsWasted');
		this.rerolls = this.getStat('rerolls');
		this.freezes = this.getStat('freezes');
		this.heroPowers = this.getStat('heroPowerUsed');
		this.minionsBought = this.getStat('minionsBought');
		this.minionsSold = this.getStat('minionsSold');
		this.minionsKilled = this.getStat('enemyMinionsKilled');
		this.heroesKilled = this.getStat('enemyHeroesKilled');
		this.percentageOfBattlesGoingFirst = this.getStat('percentageOfBattlesGoingFirst');
		this.battleLuck = this.getStat('battleLuck');
		const negativeBattleLuckStat = this.getStat('negativeBattleLuck');
		this.negativeBattleLuck = {
			value: Math.max(negativeBattleLuckStat.value, 0),
			hero: negativeBattleLuckStat.hero,
			reviewId: negativeBattleLuckStat.reviewId,
		};
	}

	private getStat(statName: string): NumberValue {
		const stat = this._state.stats.bestBgsUserStats.find(stat => stat.statName === statName);
		const result = {
			value: stat?.value || 0,
			hero: stat?.heroCardId,
			reviewId: stat?.reviewId,
		};
		// console.log('getting stat', statName, this._state.stats.bestBgsUserStats);
		return result;
	}
}

interface NumberValue {
	value: number;
	hero: string;
	reviewId: string;
}
