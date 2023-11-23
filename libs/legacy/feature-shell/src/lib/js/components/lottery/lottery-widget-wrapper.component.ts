import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Renderer2,
} from '@angular/core';
import { AbstractWidgetWrapperComponent } from '@components/overlays/_widget-wrapper.component';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { OverwolfService } from '@firestone/shared/framework/core';
import { Observable, combineLatest } from 'rxjs';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';

@Component({
	selector: 'lottery-widget-wrapper',
	styleUrls: ['../../../css/component/overlays/decktracker-player-widget-wrapper.component.scss'],
	template: `
		<lottery
			class="widget"
			*ngIf="showWidget$ | async"
			cdkDrag
			(cdkDragStarted)="startDragging()"
			(cdkDragReleased)="stopDragging()"
			(cdkDragEnded)="dragEnded($event)"
		></lottery>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LotteryWidgetWrapperComponent extends AbstractWidgetWrapperComponent implements AfterContentInit {
	protected defaultPositionLeftProvider = (gameWidth: number, gameHeight: number) => 200;
	protected defaultPositionTopProvider = (gameWidth: number, gameHeight: number) => 400;
	protected positionUpdater = (left: number, top: number) => this.prefs.updateLotteryPosition(left, top);
	protected positionExtractor = async (prefs: Preferences) => prefs.lotteryPosition;
	protected getRect = () => this.el.nativeElement.querySelector('.widget')?.getBoundingClientRect();
	protected bounds = {
		left: 0,
		top: -20,
		right: 0,
		bottom: 0,
	};

	showWidget$: Observable<boolean>;

	constructor(
		protected readonly ow: OverwolfService,
		protected readonly el: ElementRef,
		protected readonly prefs: PreferencesService,
		protected readonly renderer: Renderer2,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(ow, el, prefs, renderer, store, cdr);
		this.forceKeepInBounds = true;
	}

	ngAfterContentInit(): void {
		this.showWidget$ = combineLatest([
			this.store.shouldShowLotteryOverlay$(),
			this.store.listenPrefs$((prefs) => prefs.lotteryOverlay),
		]).pipe(
			this.mapData(([shouldShowLotteryOverlay, [overlay]]) => shouldShowLotteryOverlay && overlay),
			this.handleReposition(),
		);
	}
}
