import { Injectable } from '@angular/core';
import { LocalStorageService } from '@firestone/shared/framework/core';
import { Preferences } from '../models/preferences';

@Injectable()
export class GenericStorageService {
	constructor(private readonly localStorageService: LocalStorageService) {}

	public async saveUserPreferences(preferences: Preferences): Promise<Preferences> {
		this.localStorageService.setItem(LocalStorageService.LOCAL_STORAGE_USER_PREFERENCES, preferences);
		return preferences;
	}

	public getUserPreferences(): Preferences {
		const strPrefs = localStorage.getItem(LocalStorageService.LOCAL_STORAGE_USER_PREFERENCES);
		const result = !!strPrefs ? Object.assign(new Preferences(), JSON.parse(strPrefs)) : new Preferences();
		const resultWithDate: Preferences = Preferences.deserialize(result);
		return resultWithDate;
	}
}
