import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { BgsFaceOff } from '@firestone-hs/hs-replay-xml-parser/dist/lib/model/bgs-face-off';
import { BgsPlayer } from '../../../models/battlegrounds/bgs-player';

declare let amplitude: any;

@Component({
	selector: 'bgs-hero-face-off',
	styleUrls: [
		`../../../../css/global/reset-styles.scss`,
		`../../../../css/component/battlegrounds/in-game/bgs-hero-face-off.component.scss`,
	],
	template: `
		<div class="face-off entry" [ngClass]="{ 'highlighted': isNextOpponent }">
			<div class="hero">
				<bgs-hero-portrait
					class="portrait"
					[icon]="icon"
					[health]="health"
					[maxHealth]="maxHealth"
					[cardTooltip]="heroPowerIcon"
					[cardTooltipText]="name"
					[cardTooltipClass]="'bgs-hero-power'"
				></bgs-hero-portrait>
			</div>
			<div class="won">{{ wins }}</div>
			<div class="lost">{{ losses }}</div>
			<div class="tied">{{ ties }}</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsHeroFaceOffComponent {
	icon: string;
	heroPowerIcon: string;
	name: string;
	health: number;
	maxHealth: number;
	wins: number;
	losses: number;
	ties: number;

	@Input() isNextOpponent: boolean;

	@Input() set opponent(value: BgsPlayer) {
		this.icon = `https://static.zerotoheroes.com/hearthstone/fullcard/en/256/battlegrounds/${value.getDisplayCardId()}.png?v=2`;
		this.heroPowerIcon = value.getDisplayHeroPowerCardId();
		this.name = value.name;
		this.health = Math.max(value.initialHealth - value.damageTaken, 0);
		this.maxHealth = value.initialHealth;
	}

	@Input() set faceOffs(value: readonly BgsFaceOff[]) {
		// console.log('setting face offs', this.name, value?.length, value);
		this.wins = value?.filter(faceOff => faceOff.result === 'won').length || 0;
		this.losses = value?.filter(faceOff => faceOff.result === 'lost').length || 0;
		this.ties = value?.filter(faceOff => faceOff.result === 'tied').length || 0;
	}
}
