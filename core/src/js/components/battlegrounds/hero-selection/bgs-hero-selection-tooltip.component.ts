import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { BgsHeroStat } from '../../../models/battlegrounds/stats/bgs-hero-stat';

declare let amplitude: any;

@Component({
	selector: 'bgs-hero-selection-tooltip',
	styleUrls: [
		`../../../../css/global/reset-styles.scss`,
		`../../../../css/component/battlegrounds/hero-selection/bgs-hero-selection-layout.component.scss`,
		`../../../../css/component/battlegrounds/hero-selection/bgs-hero-selection-tooltip.component.scss`,
	],
	template: `
		<div class="hero-selection-tooltip">
			<img class="hero-power" [src]="heroPowerImage" />
			<div class="infos">
				<div class="name">{{ _hero.name }}</div>
				<bgs-hero-stats [hero]="_hero"></bgs-hero-stats>
				<bgs-hero-tribes [hero]="_hero"></bgs-hero-tribes>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsHeroSelectionTooltipComponent {
	_hero: BgsHeroStat;
	heroPowerImage: string;
	tribes: readonly { tribe: string; percent: string }[];

	@Input() set config(value: BgsHeroStat) {
		this._hero = value;
		this.heroPowerImage = `https://static.zerotoheroes.com/hearthstone/fullcard/en/256/${value.heroPowerCardId}.png?v=2`;
		this.tribes = [...value.tribesStat]
			.sort((a, b) => b.percent - a.percent)
			.map(stat => ({ tribe: this.getTribe(stat.tribe), percent: stat.percent.toFixed(1) }))
			.slice(0, 5);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	constructor(private readonly cdr: ChangeDetectorRef) {}

	getIcon(tribe: string): string {
		let referenceCardId: string;
		switch (tribe) {
			case 'Mech':
				referenceCardId = 'GVG_027';
				break;
			case 'Beast':
				referenceCardId = 'BGS_021';
				break;
			case 'Demon':
				referenceCardId = 'TB_BaconUps_060';
				break;
			case 'Dragon':
				referenceCardId = 'BGS_036';
				break;
			case 'Murloc':
				referenceCardId = 'BGS_030';
				break;
			case 'Pirate':
				referenceCardId = 'BGS_080';
				break;
			default:
				referenceCardId = 'BGS_009';
				break;
		}
		return `https://static.zerotoheroes.com/hearthstone/cardart/256x/${referenceCardId}.jpg`;
	}

	private getTribe(tribe: string): string {
		if (tribe === 'mechanical') {
			tribe = 'mech';
		} else if (tribe === 'blank') {
			tribe = 'no tribe';
		}
		return tribe.charAt(0).toUpperCase() + tribe.slice(1);
	}
}
