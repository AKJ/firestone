import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

declare let amplitude;

@Component({
	selector: 'generic-counter',
	styleUrls: [
		'../../../css/global/components-global.scss',
		`../../../css/global/cdk-overlay.scss`,
		'../../../css/component/game-counters/counters-common.scss',
		'../../../css/component/game-counters/generic-counter.component.scss',
		'../../../css/component/game-counters/jade-counter.component.scss',
		'../../../css/component/game-counters/attack-counter.component.scss',
		'../../../css/component/game-counters/pogo-counter.component.scss',
		`../../../css/themes/decktracker-theme.scss`,
	],
	template: `
		<div *ngIf="standardCounter" class="counter generic-counter {{ counterClass }}" [helpTooltip]="helpTooltipText">
			<img class="image" [src]="image" />
			<div class="frame"></div>
			<div class="value">{{ value }}</div>
		</div>
		<div
			*ngIf="!standardCounter"
			class="counter generic-counter {{ counterClass }}"
			[helpTooltip]="helpTooltipText"
		>
			<div class="frame">{{ value }}</div>
			<div class="value" [inlineSVG]="image"></div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenericCountersComponent {
	@Input() value: number;
	@Input() image: string;
	@Input() helpTooltipText: string;
	@Input() counterClass: string;
	@Input() standardCounter: boolean;
}
