import { ModuleWithProviders, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AchievementConfService } from '../../services/achievement/achievement-conf.service';
import { AchievementHistoryStorageService } from '../../services/achievement/achievement-history-storage.service';
import { AchievementsRepository } from '../../services/achievement/achievements-repository.service';
import { AchievementsStorageService } from '../../services/achievement/achievements-storage.service';
import { ChallengeBuilderService } from '../../services/achievement/achievements/challenges/challenge-builder.service';
import { AchievementsLoaderService } from '../../services/achievement/data/achievements-loader.service';
import { IndexedDbService as AchievementsDb } from '../../services/achievement/indexed-db.service';
import { AllCardsService } from '../../services/all-cards.service';
import { CardHistoryStorageService } from '../../services/collection/card-history-storage.service';
import { CollectionManager } from '../../services/collection/collection-manager.service';
import { IndexedDbService } from '../../services/collection/indexed-db.service';
import { PackHistoryService } from '../../services/collection/pack-history.service';
import { DebugService } from '../../services/debug.service';
import { Events } from '../../services/events.service';
import { GenericIndexedDbService } from '../../services/generic-indexed-db.service';
import { LogsUploaderService } from '../../services/logs-uploader.service';
import { OwNotificationsService } from '../../services/notifications.service';
import { OverwolfService } from '../../services/overwolf.service';
import { MemoryInspectionService } from '../../services/plugins/memory-inspection.service';
import { SimpleIOService } from '../../services/plugins/simple-io.service';
import { PreferencesService } from '../../services/preferences.service';
import { S3FileUploadService } from '../../services/s3-file-upload.service';

@NgModule({
	imports: [BrowserModule],
	declarations: [],
	entryComponents: [],
	exports: [],
})
export class SharedServicesModule {
	static forRoot(): ModuleWithProviders {
		return {
			ngModule: SharedServicesModule,
			providers: [
				AllCardsService,
				DebugService,
				Events,
				GenericIndexedDbService,
				LogsUploaderService,
				MemoryInspectionService,
				OverwolfService,
				OwNotificationsService,
				PreferencesService,
				S3FileUploadService,
				SimpleIOService,

				AchievementConfService,
				AchievementHistoryStorageService,
				AchievementsRepository,
				AchievementsStorageService,
				ChallengeBuilderService,
				AchievementsLoaderService,
				AchievementsDb,

				CardHistoryStorageService,
				CollectionManager,
				IndexedDbService,
				PackHistoryService,
			],
		};
	}
}
