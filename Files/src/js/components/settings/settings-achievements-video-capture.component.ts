import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { OverwolfService } from '../../services/overwolf.service';
import { Events } from '../../services/events.service';
import { PreferencesService } from '../../services/preferences.service';

declare var overwolf;

@Component({
	selector: 'settings-achievements-video-capture',
	styleUrls: [
		`../../../css/global/components-global.scss`,
		`../../../css/component/settings/settings-common.component.scss`,
		`../../../css/component/settings/settings-achievements-video-capture.component.scss`
	],
	template: `
        <div class="video-capture">
            <div class="title">Video quality</div>
            <form class="video-quality-form" [formGroup]="settingsForm">
                <input type="radio" formControlName="videoQuality" value="low" id="video-quality-low">
                <label for="video-quality-low">
                    <i class="unselected" *ngIf="settingsForm.value.videoQuality !== 'low'">
                        <svg>
                            <use xlink:href="/Files/assets/svg/sprite.svg#radio_unselected"/>
                        </svg>
                    </i>
                    <i class="checked" *ngIf="settingsForm.value.videoQuality === 'low'">
                        <svg>
                            <use xlink:href="/Files/assets/svg/sprite.svg#radio_selected"/>
                        </svg>
                    </i>
                    <p>Low (480p 10fps)</p>
                </label>

                <input type="radio" formControlName="videoQuality" value="medium" id="video-quality-medium">
                <label for="video-quality-medium">
                    <i class="unselected" *ngIf="settingsForm.value.videoQuality !== 'medium'">
                        <svg>
                            <use xlink:href="/Files/assets/svg/sprite.svg#radio_unselected"/>
                        </svg>
                    </i>
                    <i class="checked" *ngIf="settingsForm.value.videoQuality === 'medium'">
                        <svg>
                            <use xlink:href="/Files/assets/svg/sprite.svg#radio_selected"/>
                        </svg>
                    </i>
                    <p>Medium (720p 30fps)</p>
                </label>

                <input type="radio" formControlName="videoQuality" value="high" id="video-quality-high">
                <label for="video-quality-high">
                    <i class="unselected" *ngIf="settingsForm.value.videoQuality !== 'high'">
                        <svg>
                            <use xlink:href="/Files/assets/svg/sprite.svg#radio_unselected"/>
                        </svg>
                    </i>
                    <i class="checked" *ngIf="settingsForm.value.videoQuality === 'high'">
                        <svg>
                            <use xlink:href="/Files/assets/svg/sprite.svg#radio_selected"/>
                        </svg>
                    </i>
                    <p>High (1080p 60fps)</p>
                </label>

                <input type="radio" formControlName="videoQuality" value="custom" id="video-quality-custom">
                <label for="video-quality-custom">
                    <i class="unselected" *ngIf="settingsForm.value.videoQuality !== 'custom'">
                        <svg>
                            <use xlink:href="/Files/assets/svg/sprite.svg#radio_unselected"/>
                        </svg>
                    </i>
                    <i class="checked" *ngIf="settingsForm.value.videoQuality === 'custom'">
                        <svg>
                            <use xlink:href="/Files/assets/svg/sprite.svg#radio_selected"/>
                        </svg>
                    </i>
                    <div class="custom-video-quality" [ngClass]="{'unselected': settingsForm.value.videoQuality !== 'custom'}"> 
						<div class="label-custom">Custom</div>
						<div *ngIf="settingsForm.value.videoQuality === 'custom'" class="custom-info">
							<div>({{resolution}}p {{fps}}fps).</div> 
							<a href="overwolf://settings/capture">Edit</a>
						</div>
                    </div>
                </label>
            </form>
            <a class="advanced" href="overwolf://settings/capture">Advanced video settings</a>
        </div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsAchievementsVideoCaptureComponent {

	private readonly RESOLUTION_ENUM = {
		0: overwolf.settings.enums.ResolutionSettings.Original,
		1: overwolf.settings.enums.ResolutionSettings.R1080p,
		2: overwolf.settings.enums.ResolutionSettings.R720p,
		3: overwolf.settings.enums.ResolutionSettings.R480p
	  };
	
	settingsForm = new FormGroup({
		videoQuality: new FormControl('low'), // TODO: update with actual settings
	});

	resolution: number;
	fps: number;

	constructor(
			private owService: OverwolfService, 
			private prefs: PreferencesService, 
			private cdr: ChangeDetectorRef, 
			private events: Events) {
		this.updateDefaultValues();
		overwolf.settings.OnVideoCaptureSettingsChanged.addListener((data) => this.handleVideoSettingsChange(data));
		this.settingsForm.controls['videoQuality'].valueChanges.subscribe((value) => this.changeVideoCaptureSettings(value));
	}

	private async changeVideoCaptureSettings(value: string) {
		switch (value) {
			case 'low':
				this.resolution = 480;
				this.fps = 10;
				break;
			case 'medium':
				this.resolution = 720;
				this.fps = 30;
				break;
			case 'high':
				this.resolution = 1080;
				this.fps = 60;
				break;
		}
		const settings = {
			resolution: this.owResolution(),
			fps: this.fps
		}
		console.log('changing settings with', settings);
		const result = await this.owService.setVideoCaptureSettings(settings.resolution, settings.fps);
		await this.owService.sendMessage('MainWindow', 'capture-settings-updated');
		console.log('recording settings changed', result);
		if (!(await this.prefs.getPreferences()).hasSeenVideoCaptureChangeNotif) {
			this.events.broadcast(Events.SETTINGS_DISPLAY_MODAL, 'video-capture');
		}
	}

	private owResolution() {
		switch (this.resolution) {
			case 480: return this.RESOLUTION_ENUM[3];
			case 720: return this.RESOLUTION_ENUM[2];
			case 1080: return this.RESOLUTION_ENUM[1];
			default: console.error('Unexpected resolution', this.resolution);
		}
	}

	private async updateDefaultValues() {
		const settings = await this.owService.getVideoCaptureSettings();
		const oldResolution = this.resolution;
		const oldFps = this.fps;
		this.resolution = this.convertToResolution(settings.resolution);
		this.fps = settings.fps || 10;
		if (oldResolution !== this.resolution || oldFps !== this.fps) {
			if (this.resolution === 480 && this.fps === 10) {
				this.settingsForm.controls['videoQuality'].setValue('low', {emitEvent: false});
			}
			else if (this.resolution === 720 && this.fps === 30) {
				this.settingsForm.controls['videoQuality'].setValue('medium', {emitEvent: false});
			}
			else if (this.resolution === 1080 && this.fps === 60) {
				this.settingsForm.controls['videoQuality'].setValue('high', {emitEvent: false});
			}
			else {
				this.settingsForm.controls['videoQuality'].setValue('custom', {emitEvent: false});
			}
			console.log('set default capture values', settings, this.resolution, this.fps, this.settingsForm.controls['videoQuality'].value);
			this.cdr.detectChanges();
		}
	}

	private convertToResolution(from: number): number {
		if (from >= 0 && from <= 3) {
			const resolutionEnum = this.RESOLUTION_ENUM[from] as string;
			return parseInt(resolutionEnum.substring(1, resolutionEnum.length - 1));
		}
		return from || 480;
	}

    private handleVideoSettingsChange(data) {
		console.log('[recording] video capture settings changed', data);
		this.updateDefaultValues();
    }
}
