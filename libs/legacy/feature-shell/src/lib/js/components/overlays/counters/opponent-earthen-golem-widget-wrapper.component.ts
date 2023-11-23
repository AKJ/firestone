import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Renderer2,
} from '@angular/core';
import { CardIds } from '@firestone-hs/reference-data';
import { PreferencesService } from '@firestone/shared/common/service';
import { OverwolfService } from '@firestone/shared/framework/core';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractCounterWidgetWrapperComponent, templateBase } from './abstract-counter-widget-wrapper.component';

export const EARTHEN_GOLEM_CARDS = [
	CardIds.DiscipleOfAmitus,
	CardIds.StoneheartKing,
	CardIds.StoneheartKing_EarthenGolemToken,
];

@Component({
	selector: 'opponent-earthen-golem-widget-wrapper',
	styleUrls: ['../../../../css/component/overlays/decktracker-player-widget-wrapper.component.scss'],
	template: templateBase,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpponentEarthenGolemWidgetWrapperComponent
	extends AbstractCounterWidgetWrapperComponent
	implements AfterContentInit
{
	constructor(
		protected readonly ow: OverwolfService,
		protected readonly el: ElementRef,
		protected readonly prefs: PreferencesService,
		protected readonly renderer: Renderer2,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(ow, el, prefs, renderer, store, cdr);
		this.side = 'opponent';
		this.activeCounter = 'earthenGolem';
		this.prefExtractor = (prefs) => prefs.opponentEarthenGolemCounter;
		this.deckStateExtractor = (state) =>
			!!state.opponentDeck?.earthenGolemsSummoned ||
			state.opponentDeck?.hasRelevantCard(EARTHEN_GOLEM_CARDS, { onlyLimited: true });
	}
}
