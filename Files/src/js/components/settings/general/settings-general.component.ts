import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

@Component({
	selector: 'settings-general',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/settings/general/settings-general.component.scss`,
	],
	template: `
		<ul class="general">
			<settings-general-menu [selectedMenu]="_selectedMenu" (onMenuSelected)="onMenuSelected($event)">
			</settings-general-menu>
			<ng-container [ngSwitch]="_selectedMenu">
				<settings-general-launch *ngSwitchCase="'launch'"></settings-general-launch>
				<settings-general-bug-report *ngSwitchCase="'bugreport'"></settings-general-bug-report>
			</ng-container>
		</ul>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsGeneralComponent {
	_selectedMenu: string;
	@Input() set selectedMenu(value: string) {
		this._selectedMenu = value || 'launch';
	}

	onMenuSelected(selectedMenuItem) {
		this.selectedMenu = selectedMenuItem;
	}
}
