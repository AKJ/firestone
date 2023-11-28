import { SceneMode } from '@firestone-hs/reference-data';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import { debounceTime, distinctUntilChanged, filter, map, merge, tap, throttleTime } from 'rxjs';
import { MemoryUpdate } from '../../../models/memory/memory-update';
import { Events } from '../../events.service';
import { SceneService } from '../../game/scene.service';

export abstract class AbstractCollectionInternalService<T, U = T> {
	public collection$$ = new SubscriberAwareBehaviorSubject<readonly T[]>([]);

	protected abstract type: () => string;
	protected abstract memoryInfoCountExtractor: (update: MemoryUpdate) => number;
	protected abstract memoryReadingOperation: () => Promise<readonly U[]>;
	protected abstract isMemoryInfoEmpty: (collection: readonly U[]) => boolean;
	protected abstract localDbRetrieveOperation: () => Promise<readonly T[]>;
	protected abstract localDbSaveOperation: (collection: readonly T[]) => Promise<any>;

	constructor(protected readonly events: Events, protected readonly scene: SceneService) {
		this.init();
	}

	protected preInit(): void | Promise<void> {
		// Do nothing
	}
	protected postInit(): void | Promise<void> {
		// Do nothing
	}

	protected updateMemoryInfo(collection: readonly U[]): readonly T[] {
		return collection as any;
	}

	private async init() {
		this.collection$$.onFirstSubscribe(async () => {
			console.log('[collection-manager] init', this.type());
			console.debug('[collection-manager] init', this.type(), new Error().stack);
			await this.scene.isReady();

			// So that the protected methods are initialized in the child class
			// await sleep(1);
			await this.preInit();
			const collectionUpdate$ = this.events.on(Events.MEMORY_UPDATE).pipe(
				filter((event) => this.memoryInfoCountExtractor(event.data[0]) != null),
				map((event) => {
					const changes: MemoryUpdate = event.data[0];
					return this.memoryInfoCountExtractor(changes);
				}),
				distinctUntilChanged(),
			);
			const goToCollectionScene$ = this.scene.currentScene$$.pipe(
				filter((scene) => scene === SceneMode.COLLECTIONMANAGER),
				throttleTime(120_000),
				tap(() => console.log('[collection-manager] going to collection scene', this.type())),
			);
			merge(collectionUpdate$, goToCollectionScene$)
				.pipe(debounceTime(5000))
				.subscribe(async (newCount) => {
					const collection = await this.memoryReadingOperation();
					if (!this.isMemoryInfoEmpty(collection)) {
						const updated = this.updateMemoryInfo(collection);
						console.debug(
							`[collection-manager] [${this.type()}] updating collection`,
							newCount,
							collection.length,
							updated.length,
						);
						this.collection$$.next(updated);
					}
				});
			this.collection$$.pipe(filter((collection) => !!collection.length)).subscribe(async (collection) => {
				console.debug(
					`[collection-manager] [${this.type()}] updating collection in db`,
					collection.length,
					collection,
				);
				await this.localDbSaveOperation(collection);
			});

			const collectionFromDb = await this.localDbRetrieveOperation();
			if (collectionFromDb?.length) {
				console.debug(
					`[collection-manager] [${this.type()}] init collection from db`,
					collectionFromDb.length,
					collectionFromDb,
				);
				this.collection$$.next(collectionFromDb);
			}
			await this.postInit();
		});
	}
}
