import { GameFormat, RankBracket, TimePeriod } from '@firestone-hs/constructed-deck-stats';
import { BnetRegion, Race, allDuelsHeroes } from '@firestone-hs/reference-data';
import { IPreferences } from '@firestone/shared/framework/common';
import 'reflect-metadata';
import {
	AchievementsCompletedFilterType,
	ArenaCardClassFilterType,
	ArenaCardTypeFilterType,
	ArenaClassFilterType,
	ArenaTimeFilterType,
	BgsActiveTimeFilterType,
	BgsHeroSortFilterType,
	BgsQuestActiveTabType,
	BgsRankFilterType,
	BgsStatsFilterId,
	CollectionCardClassFilterType,
	CollectionCardOwnedFilterType,
	CollectionCardRarityFilterType,
	CollectionPortraitCategoryFilter,
	CollectionPortraitOwnedFilter,
	ConstructedDeckVersions,
	ConstructedMetaDecksDustFilterType,
	ConstructedStatsTab,
	CurrentAppType,
	DeckFilters,
	DuelsDeckSortFilterType,
	DuelsGameModeFilterType,
	DuelsHeroFilterType,
	DuelsHeroSortFilterType,
	DuelsStatTypeFilterType,
	DuelsTimeFilterType,
	DuelsTopDecksDustFilterType,
	DuelsTreasureStatTypeFilterType,
	Ftue,
	LotteryTabType,
	MercenariesFullyUpgradedFilterType,
	MercenariesHeroLevelFilterType,
	MercenariesModeFilterType,
	MercenariesOwnedFilterType,
	MercenariesPersonalHeroesSortCriteria,
	MercenariesPveDifficultyFilterType,
	MercenariesPvpMmrFilterType,
	MercenariesRoleFilterType,
	MercenariesStarterFilterType,
	MmrGroupFilterType,
	StatGameFormatType,
	StatsXpGraphSeasonFilterType,
} from './pref-model';
import { OutOfCardsToken } from './unfit-pref-model';

export const FORCE_LOCAL_PROP = 'forceLocalProp';

export class Preferences implements IPreferences {
	readonly lastUpdateDate: Date | null;
	readonly id: number = 1;

	readonly locale: string = 'enUS';

	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly gameInstallPath: string;

	readonly modsEnabled: boolean;
	readonly disableLocalCache: boolean;

	readonly showLottery: boolean | null = null;
	readonly lotteryOverlay: boolean | null = null;
	readonly lotteryCurrentModule: LotteryTabType = 'lottery';
	readonly lotteryShowHiddenWindowNotification: boolean = true;
	readonly lotteryPosition: { left: number; top: number };
	readonly lotteryScale: number = 100;
	readonly lotteryOpacity: number = 100;

	readonly launchAppOnGameStart: boolean = true;
	readonly showSessionRecapOnExit: boolean = true;
	readonly shareGamesWithVS: boolean = true;
	readonly setAllNotifications: boolean = true;
	readonly contactEmail: string;
	readonly lastSeenReleaseNotes: string;
	readonly dontShowNewVersionNotif: boolean = false;
	readonly globalZoomLevel: number = 100;
	readonly flashWindowOnYourTurn: boolean = true;
	readonly allowGamesShare: boolean = true;
	readonly enableQuestsWidget: boolean = true;
	readonly showQuestsWidgetWhenEmpty: boolean = false;
	readonly showQuestsInGame: boolean = true;
	readonly useStreamerMode: boolean = false;
	readonly regionFilter: BnetRegion | 'all' = 'all';

	readonly enableMailbox: boolean = true;
	readonly enableMailboxUnread: boolean = true;
	readonly mailboxLastVisitDate: Date;

	readonly advancedModeToggledOn: boolean;

	readonly currentMainVisibleSection: CurrentAppType = 'decktracker';

	readonly showCurrentSessionWidgetBgs: boolean = false;
	readonly hideCurrentSessionWidgetWhenFriendsListIsOpen: boolean = true;
	readonly showTurnTimer: boolean = true;
	readonly showTurnTimerMatchLength: boolean = true;
	readonly currentSessionStartDate: Date | null = null;
	readonly sessionWidgetShowGroup: boolean = true;
	readonly sessionWidgetShowMatches: boolean = true;
	readonly sessionWidgetNumberOfMatchesToShow: number = 5;
	readonly sessionWidgetOpacity: number = 100;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly sessionWidgetScale: number = 100;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly currentSessionWidgetPosition: { left: number; top: number };
	readonly turnTimerWidgetOpacity: number = 100;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly turnTimerWidgetScale: number = 100;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly turnTimerWidgetWidth: number = 175;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly turnTimerWidgetPosition: { left: number; top: number };

	readonly achievementsFullEnabled = false;
	readonly achievementsEnabled2 = false;
	readonly achievementsLiveTracking2: boolean = false;
	readonly achievementsDisplayNotifications2 = false;
	readonly achievementsCompletedActiveFilter: AchievementsCompletedFilterType = 'ALL_ACHIEVEMENTS';
	// internal HS achievement ids
	readonly pinnedAchievementIds: readonly number[] = [];

	// TODO: both should be removed
	readonly dontConfirmVideoReplayDeletion: boolean;
	readonly hasSeenVideoCaptureChangeNotif: boolean;

	readonly showXpRecapAtGameEnd: boolean = false;

	readonly collectionUseOverlay: boolean;
	readonly collectionSelectedFormat: StatGameFormatType = 'all';
	readonly collectionEnableNotifications: boolean = true;
	readonly showDust: boolean = true;
	readonly showCommon: boolean = true;
	readonly showCardsOutsideOfPacks: boolean = true;
	readonly collectionHistoryShowOnlyNewCards: boolean = false;
	readonly collectionUseHighResImages: boolean = false;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly collectionCardScale: number = 100;
	readonly collectionSetShowGoldenStats: boolean = false;
	readonly collectionUseAnimatedCardBacks: boolean = false;
	readonly collectionShowOnlyBuyablePacks: boolean = false;
	readonly collectionActivePortraitCategoryFilter: CollectionPortraitCategoryFilter = 'collectible';
	readonly collectionActivePortraitOwnedFilter: CollectionPortraitOwnedFilter = 'all';
	readonly collectionCardRarityFilter: CollectionCardRarityFilterType = 'all';
	readonly collectionCardClassFilter: CollectionCardClassFilterType = 'all';
	readonly collectionCardOwnedFilter: CollectionCardOwnedFilterType = 'all';
	readonly collectionShowRelatedCards: boolean = true;
	readonly collectionSetStatsTypeFilter: CollectionSetStatsTypeFilterType = 'cards-stats';

	readonly collectionPityTimerResets: { [packId: string]: number } = {};

	readonly desktopDeckFilters: DeckFilters = new DeckFilters();
	readonly desktopDeckShowHiddenDecks: boolean = false;
	readonly desktopDeckHiddenDeckCodes: readonly string[] = [];
	readonly desktopDeckShowMatchupAsPercentages: boolean = true;
	readonly desktopStatsShowGoingFirstOnly: boolean = false;
	readonly desktopStatsShowGoingSecondOnly: boolean = false;
	// When impementing this for other areas, don't forget to update the prefs update in app-bootstrap
	readonly desktopDeckStatsReset: { [deckstring: string]: readonly number[] } = {};
	readonly desktopDeckDeletes: { [deckstring: string]: readonly number[] } = {};
	readonly constructedDeckVersions: readonly ConstructedDeckVersions[] = [];
	readonly constructedStatsTab: ConstructedStatsTab = 'overview';
	readonly constructedDecksSearchString: string;
	readonly constructedMetaDecksFormatFilter: GameFormat = 'standard';
	readonly constructedMetaDecksTimeFilter: TimePeriod = 'last-patch';
	readonly constructedMetaDecksRankFilter2: RankBracket = 'legend';
	readonly constructedMetaDecksSampleSizeFilter: number = 200;
	readonly constructedMetaDecksDustFilter: ConstructedMetaDecksDustFilterType = 'all';
	readonly constructedMetaArchetypesSampleSizeFilter: number = 2000;
	readonly constructedMetaDecksUseConservativeWinrate: boolean = false;
	readonly constructedMetaDecksShowRelativeInfo2: boolean = true;
	readonly constructedMetaDecksPlayerClassFilter: readonly string[] = [];
	readonly constructedMetaDecksArchetypeFilter: readonly number[] = [];

	readonly decktrackerShowRanked: boolean = true;
	readonly decktrackerShowDuels: boolean = true;
	readonly decktrackerShowArena: boolean = true;
	readonly decktrackerShowTavernBrawl: boolean = true;
	readonly decktrackerShowPractice: boolean = true;
	readonly decktrackerShowFriendly: boolean = true;
	readonly decktrackerShowCasual: boolean = true;
	readonly decktrackerCloseOnGameEnd: boolean = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly decktrackerScale: number = 100;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly decktrackerPosition: { left: number; top: number };

	readonly decktrackerShowMinionPlayOrderOnBoard: boolean = true;
	readonly dectrackerShowOpponentTurnDraw: boolean = true;
	readonly dectrackerShowOpponentGuess: boolean = true;
	readonly dectrackerShowOpponentBuffInHand: boolean = true;
	readonly overlayHighlightRelatedCards: boolean = true;
	readonly overlayEnableDiscoverHelp: boolean = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly decktrackerOpponentHandScale: number = 100;

	readonly decktrackerShowMulliganCardImpact: boolean = true;
	readonly decktrackerShowMulliganDeckOverview: boolean = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly decktrackerMulliganScale: number = 100;

	readonly hsShowQuestsWidget: boolean = true;
	readonly hsShowQuestsWidgetOnHub: boolean = true;
	readonly hsShowQuestsWidgetOnBg: boolean = false;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly hsQuestsWidgetPosition: { left: number; top: number };

	readonly bgsShowQuestsWidget: boolean = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly bgsQuestsWidgetPosition: { left: number; top: number };
	readonly bgsQuestsOverlayScale: number = 100;

	readonly mercsShowQuestsWidget: boolean = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly mercsQuestsWidgetPosition: { left: number; top: number };

	readonly guessOpponentArchetype: boolean = true;

	// readonly overlayDisplayMode: string;
	readonly overlayShowTitleBar: boolean = true;
	readonly overlayShowControlBar: boolean = true;
	readonly overlayShowTooltipsOnHover: boolean = true;
	readonly overlayShowRarityColors: boolean = true;
	readonly overlayShowRelatedCards: boolean = true;
	readonly overlayShowGiftedCardsInSeparateLine: boolean = false;
	readonly overlayGroupSameCardsTogether: boolean = false;
	readonly overlayShowGiftedCardsSeparateZone: boolean = false;
	readonly overlayShowPlaguesOnTop: boolean = true;
	readonly overlayShowBoardCardsSeparateZone: boolean = false;
	readonly overlayResetDeckPositionAfterTrade2: boolean = false;
	readonly overlayShowStatsChange: boolean = true;
	readonly overlayShowDeckWinrate: boolean = true;
	readonly overlayShowMatchupWinrate: boolean = true;
	readonly overlayShowDkRunes: boolean = true;

	readonly overlayGroupByZone: boolean = true;
	// readonly overlayHighlightCardsInHand: boolean = false; // Doesn't have a UI anymore?
	readonly overlayCardsGoToBottom: boolean = false;
	readonly overlayShowGlobalEffects: boolean = true;
	readonly overlayHideGeneratedCardsInOtherZone: boolean = false;
	readonly overlaySortByManaInOtherZone: boolean = false;
	readonly overlayShowTopCardsSeparately: boolean = true;
	readonly overlayShowBottomCardsSeparately: boolean = true;
	readonly overlayDarkenUsedCards: boolean = true;
	readonly decktrackerNoDeckMode: boolean = false;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly overlayOpacityInPercent: number = 100;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly overlayWidthInPx: number = 227; // No UI
	readonly overlayShowCostReduction: boolean = true;
	readonly overlayShowUnknownCards: boolean = true;

	readonly opponentOverlayGroupByZone: boolean = true;
	readonly opponentOverlayCardsGoToBottom: boolean = true;
	readonly opponentOverlayShowGlobalEffects: boolean = true;
	readonly opponentOverlayHideGeneratedCardsInOtherZone: boolean = false;
	readonly opponentOverlaySortByManaInOtherZone: boolean = false;
	readonly opponentOverlayShowBottomCardsSeparately: boolean = true;
	readonly opponentOverlayShowTopCardsSeparately: boolean = true;
	readonly opponentOverlayShowDkRunes: boolean = true;
	readonly opponentOverlayDarkenUsedCards: boolean = true;
	readonly hideOpponentDecktrackerWhenFriendsListIsOpen: boolean = true;
	readonly opponentTracker: boolean = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly opponentOverlayWidthInPx: number = 227;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly opponentOverlayOpacityInPercent: number = 100;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly opponentOverlayScale: number = 100;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly opponentOverlayPosition: { left: number; top: number };
	readonly opponentLoadAiDecklist: boolean = true;

	readonly secretsHelper: boolean = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly secretsHelperOpacity: number = 100;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly secretsHelperScale: number = 80;
	readonly secretsHelperCardsGoToBottom: boolean = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly secretsHelperPosition: { left: number; top: number };
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly secretsHelperWidgetPosition: { left: number; top: number };

	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly countersScale: number = 100;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly countersScaleOpponent: number = 100;
	readonly countersUseExpandedView: boolean = true;

	readonly playerGalakrondCounter: BooleanWithLimited = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly playerGalakrondCounterWidgetPosition: { left: number; top: number };
	readonly opponentGalakrondCounter: BooleanWithLimited = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly opponentGalakrondCounterWidgetPosition: { left: number; top: number };

	readonly playerWatchpostCounter: BooleanWithLimited = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly playerWatchpostCounterWidgetPosition: { left: number; top: number };
	readonly opponentWatchpostCounter: BooleanWithLimited = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly opponentWatchpostCounterWidgetPosition: { left: number; top: number };

	// These are turned off by default because you can quite easily see the info from the tracker
	readonly playerLibramCounter: BooleanWithLimited = false;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly playerLibramCounterWidgetPosition: { left: number; top: number };
	readonly opponentLibramCounter: BooleanWithLimited = false;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly opponentLibramCounterWidgetPosition: { left: number; top: number };

	readonly playerPogoCounter: BooleanWithLimited = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly playerPogoCounterWidgetPosition: { left: number; top: number };
	readonly opponentPogoCounter: BooleanWithLimited = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly opponentPogoCounterWidgetPosition: { left: number; top: number };

	readonly playerAstralAutomatonCounter: BooleanWithLimited = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly playerAstralAutomatonCounterWidgetPosition: { left: number; top: number };
	readonly opponentAstralAutomatonCounter: BooleanWithLimited = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly opponentAstralAutomatonCounterWidgetPosition: { left: number; top: number };

	readonly playerEarthenGolemCounter: BooleanWithLimited = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly playerEarthenGolemCounterWidgetPosition: { left: number; top: number };
	readonly opponentEarthenGolemCounter: BooleanWithLimited = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly opponentEarthenGolemCounterWidgetPosition: { left: number; top: number };

	readonly playerTreantCounter: BooleanWithLimited = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly playerTreantCounterWidgetPosition: { left: number; top: number };

	readonly playerDragonsSummonedCounter: BooleanWithLimited = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly playerDragonsSummonedCounterWidgetPosition: { left: number; top: number };

	readonly playerChainedGuardianCounter: BooleanWithLimited = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly playerChainedGuardianCounterWidgetPosition: { left: number; top: number };

	readonly playerJadeGolemCounter: BooleanWithLimited = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly playerJadeGolemCounterWidgetPosition: { left: number; top: number };
	readonly opponentJadeGolemCounter: BooleanWithLimited = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly opponentJadeGolemWidgetPosition: { left: number; top: number };

	readonly playerAttackCounter: boolean = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly playerAttackCounterWidgetPosition: { left: number; top: number };
	readonly opponentAttackCounter: boolean = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly opponentAttackCounterWidgetPosition: { left: number; top: number };

	readonly playerCthunCounter: BooleanWithLimited = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly playerCthunCounterWidgetPosition: { left: number; top: number };
	readonly opponentCthunCounter: BooleanWithLimited = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly opponentCthunCounterWidgetPosition: { left: number; top: number };

	readonly playerFatigueCounter: boolean = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly playerFatigueCounterWidgetPosition: { left: number; top: number };
	readonly opponentFatigueCounter: boolean = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly opponentFatigueCounterWidgetPosition: { left: number; top: number };

	readonly playerAbyssalCurseCounter: BooleanWithLimited = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly playerAbyssalCurseCounterWidgetPosition: { left: number; top: number };
	readonly opponentAbyssalCurseCounter: BooleanWithLimited = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly opponentAbyssalCurseCounterWidgetPosition: { left: number; top: number };

	readonly playerSpellCounter: BooleanWithLimited = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly playerSpellCounterWidgetPosition: { left: number; top: number };
	readonly opponentSpellCounter: BooleanWithLimited = false;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly opponentSpellCounterWidgetPosition: { left: number; top: number };

	readonly playerElementalCounter: BooleanWithLimited = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly playerElementalCounterWidgetPosition: { left: number; top: number };

	readonly playerMulticasterCounter: BooleanWithLimited = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly playerMulticasterCounterWidgetPosition: { left: number; top: number };
	readonly opponentMulticasterCounter: BooleanWithLimited = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly opponentMulticasterCounterWidgetPosition: { left: number; top: number };

	readonly playerHeroPowerDamageCounter: BooleanWithLimited = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly playerHeroPowerDamageCounterWidgetPosition: { left: number; top: number };
	readonly opponentHeroPowerDamageCounter: BooleanWithLimited = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly opponentHeroPowerDamageCounterWidgetPosition: { left: number; top: number };

	readonly playerElwynnBoarCounter: BooleanWithLimited = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly playerElwynnBoarCounterWidgetPosition: { left: number; top: number };
	readonly opponentElwynnBoarCounter: BooleanWithLimited = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly opponentElwynnBoarCounterWidgetPosition: { left: number; top: number };

	readonly playerVolatileSkeletonCounter: BooleanWithLimited = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly playerVolatileSkeletonCounterWidgetPosition: { left: number; top: number };
	readonly opponentVolatileSkeletonCounter: BooleanWithLimited = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly opponentVolatileSkeletonCounterWidgetPosition: { left: number; top: number };

	readonly playerRelicCounter: BooleanWithLimited = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly playerRelicCounterWidgetPosition: { left: number; top: number };
	readonly opponentRelicCounter: BooleanWithLimited = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly opponentRelicCounterWidgetPosition: { left: number; top: number };

	readonly playerBolnerCounter: BooleanWithLimited = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly playerBolnerCounterWidgetPosition: { left: number; top: number };

	readonly playerBrilliantMacawCounter: BooleanWithLimited = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly playerBrilliantMacawCounterWidgetPosition: { left: number; top: number };

	readonly playerMonstrousParrotCounter: BooleanWithLimited = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly playerMonstrousParrotCounterWidgetPosition: { left: number; top: number };

	readonly playerVanessaVanCleefCounter: BooleanWithLimited = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly playerVanessaVanCleefCounterWidgetPosition: { left: number; top: number };

	readonly playerElementalStreakCounter: BooleanWithLimited = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly playerElementalStreakCounterWidgetPosition: { left: number; top: number };

	readonly playerTramHeistCounter: BooleanWithLimited = 'limited';
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly playerTramHeistCounterWidgetPosition: { left: number; top: number };

	readonly playerExcavateCounter: BooleanWithLimited = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly playerExcavateCounterWidgetPosition: { left: number; top: number };
	readonly opponentExcavateCounter: BooleanWithLimited = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly opponentExcavateCounterWidgetPosition: { left: number; top: number };

	readonly playerChaoticTendrilCounter: BooleanWithLimited = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly playerChaoticTendrilCounterWidgetPosition: { left: number; top: number };
	readonly opponentChaoticTendrilCounter: BooleanWithLimited = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly opponentChaoticTendrilCounterWidgetPosition: { left: number; top: number };

	readonly playerSecretsPlayedCounter: BooleanWithLimited = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly playerSecretsPlayedCounterWidgetPosition: { left: number; top: number };

	readonly playerLightrayCounter: BooleanWithLimited = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly playerLightrayCounterWidgetPosition: { left: number; top: number };

	readonly playerMenagerieCounter: BooleanWithLimited = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly playerMenagerieCounterWidgetPosition: { left: number; top: number };

	readonly playerCorpseSpentCounter: BooleanWithLimited = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly playerCorpseSpentCounterWidgetPosition: { left: number; top: number };
	readonly opponentCorpseSpentCounter: BooleanWithLimited = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly opponentCorpseSpentCounterWidgetPosition: { left: number; top: number };

	readonly playerOverdraftCounter: BooleanWithLimited = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly playerOverdraftCounterWidgetPosition: { left: number; top: number };

	readonly playerAsvedonCounter: BooleanWithLimited = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly playerAsvedonCounterWidgetPosition: { left: number; top: number };

	readonly playerMurozondTheInfiniteCounter: BooleanWithLimited = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly playerMurozondTheInfiniteCounterWidgetPosition: { left: number; top: number };

	readonly playerNagaGiantCounter: BooleanWithLimited = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly playerNagaGiantCounterWidgetPosition: { left: number; top: number };

	readonly playerGardensGraceCounter: BooleanWithLimited = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly playerGardensGraceCounterWidgetPosition: { left: number; top: number };

	readonly playerAnachronosCounter: BooleanWithLimited = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly playerAnachronosCounterWidgetPosition: { left: number; top: number };

	readonly opponentAnachronosCounter: BooleanWithLimited = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly opponentAnachronosCounterWidgetPosition: { left: number; top: number };

	readonly playerBonelordFrostwhisperCounter: BooleanWithLimited = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly playerBonelordFrostwhisperCounterWidgetPosition: { left: number; top: number };

	readonly opponentBonelordFrostwhisperCounter: BooleanWithLimited = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly opponentBonelordFrostwhisperCounterWidgetPosition: { left: number; top: number };

	readonly playerShockspitterCounter: BooleanWithLimited = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly playerShockspitterCounterWidgetPosition: { left: number; top: number };

	readonly opponentShockspitterCounter: BooleanWithLimited = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly opponentShockspitterCounterWidgetPosition: { left: number; top: number };

	readonly playerParrotMascotCounter: BooleanWithLimited = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly playerParrotMascotCounterWidgetPosition: { left: number; top: number };

	readonly playerQueensguardCounter: BooleanWithLimited = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly playerQueensguardCounterWidgetPosition: { left: number; top: number };

	readonly playerSpectralPillagerCounter: BooleanWithLimited = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly playerSpectralPillagerCounterWidgetPosition: { left: number; top: number };

	readonly playerLadyDarkveinCounter: BooleanWithLimited = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly playerLadyDarkveinCounterWidgetPosition: { left: number; top: number };

	readonly playerGreySageParrotCounter: BooleanWithLimited = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly playerGreySageParrotCounterWidgetPosition: { left: number; top: number };

	readonly playerBgsPogoCounter: boolean = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly playerBgsPogoCounterWidgetPosition: { left: number; top: number };

	readonly playerBgsLordOfGainsCounter: boolean = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly playerBgsLordOfGainsCounterWidgetPosition: { left: number; top: number };

	readonly playerBgsGoldDeltaCounter: boolean = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly playerBgsGoldDeltaCounterWidgetPosition: { left: number; top: number };

	readonly playerBgsBloodGemCounter: boolean = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly playerBgsBloodGemCounterWidgetPosition: { left: number; top: number };
	readonly playerBgsSouthseaCounter: boolean = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly playerBgsSouthseaCounterWidgetPosition: { left: number; top: number };
	readonly playerBgsMagmalocCounter: boolean = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly playerBgsMagmalocCounterWidgetPosition: { left: number; top: number };
	readonly playerBgsMajordomoCounter: boolean = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly playerBgsMajordomoCounterWidgetPosition: { left: number; top: number };

	readonly replaysLoadPeriod: 'all-time' | 'past-100' | 'last-patch' | 'season-start' | 'past-7' = 'past-100';
	readonly replaysShowNotification: boolean = false;
	readonly replaysFilterDeckstring: string;
	readonly replaysFilterGameMode: string;
	readonly replaysFilterBgHero: string;
	readonly replaysFilterPlayerClass: string;
	readonly replaysFilterOpponentClass: string;
	readonly replaysShowClassIcon: boolean = false;
	readonly replaysShowMercDetails: boolean = true;
	readonly replaysActiveGameModeFilter: string | null = null;
	readonly replaysActiveDeckstringsFilter: readonly string[] = [];
	readonly replaysActiveBgHeroFilter: string | null = null;
	readonly replaysActivePlayerClassFilter: string | null = null;
	readonly replaysActiveOpponentClassFilter: string | null = null;

	readonly bgsFullToggle = true;
	readonly bgsEnableApp = true;
	readonly bgsUseOverlay = false;
	readonly bgsEnableBattleSimulationOverlay = true;
	readonly bgsShowBannedTribesOverlay = true;
	readonly bgsShowHeroTipsOverlay = true;
	readonly bgsShowAvailableTribesOverlay = false;
	readonly bgsShowQuestStatsOverlay = true;
	readonly bgsTribesOverlaySingleRow = false;
	readonly bgsForceShowPostMatchStats2 = false;
	readonly bgsUseRemoteSimulator = false;
	readonly bgsEnableSimulation = true;
	readonly bgsShowHeroSelectionAchievements = true;
	readonly bgsShowHeroSelectionTooltip: boolean = true;
	readonly bgsShowHeroSelectionTiers: boolean = true;
	readonly bgsShowNextOpponentRecapSeparately = true;
	readonly bgsHideSimResultsOnRecruit: boolean = true;
	readonly bgsShowSimResultsOnlyOnRecruit: boolean = false;
	readonly bgsEnableSimulationSampleInOverlay = false;
	readonly bgsSimulatorNumberOfSims = 8000;
	readonly bgsShowEndGameNotif: boolean = true;
	readonly bgsEnableMinionAutoHighlight: boolean = true;
	readonly bgsEnableTribeAutoHighlight: boolean = true;
	// No way to change it for now
	readonly bgsIgnoreGamesEndingBeforeHeroSelection = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly bgsSimulationWidgetPosition: { left: number; top: number };
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly bgsBannedTribesWidgetPosition: { left: number; top: number };
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly bgsHeroTipsWidgetPosition: { left: number; top: number };
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly bgsBannedTribeScale = 101.6;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly bgsSimulatorScale = 100;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly bgsMinionsListScale = 100;
	readonly bgsBannedTribesShowVertically: boolean;
	readonly bgsEnableOpponentBoardMouseOver: boolean = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly bgsOpponentBoardScale = 101.6;
	readonly bgsEnableMinionListOverlay: boolean = true;
	readonly bgsEnableTurnNumbertOverlay: boolean = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly bgsMinionsListPosition: { left: number; top: number };
	readonly bgsEnableMinionListMouseOver: boolean = true;
	readonly bgsShowTribesHighlight: boolean = true;
	readonly bgsShowMechanicsHighlight: boolean = true;
	readonly bgsShowMechanicsTiers: boolean = true;
	readonly bgsShowTribeTiers: boolean = true;
	readonly bgsGroupMinionsIntoTheirTribeGroup: boolean = false;
	readonly bgsMinionListShowGoldenCard: boolean = true;
	readonly bgsMinionListShowSpellsAtBottom: boolean = false;
	readonly bgsShowLastOpponentIconInOverlay: boolean = true;
	readonly bgsShowHeroSelectionScreen: boolean = true;
	readonly bgsShowOverlayButton: boolean = true;
	readonly bgsOpponentOverlayAtTop: boolean = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly bgsOverlayButtonPosition: { left: number; top: number };
	readonly bgsQuestsCollapsed: readonly string[] = [];

	readonly bgsActiveTimeFilter: BgsActiveTimeFilterType = 'last-patch';
	readonly bgsActiveRankFilter: BgsRankFilterType = 100;
	// readonly bgsCurrentGameRankFilter: BgsRankFilterType = 100;
	readonly bgsActiveTribesFilter: readonly Race[] = [];
	readonly bgsActiveAnomaliesFilter: readonly string[] = [];
	readonly bgsActiveHeroSortFilter: BgsHeroSortFilterType = 'average-position';
	readonly bgsActiveHeroFilter: string = 'all';
	readonly bgsActiveMmrGroupFilter: MmrGroupFilterType = 'per-match';
	readonly bgsSelectedTabs2: readonly BgsStatsFilterId[] = [
		'hp-by-turn',
		'winrate-per-turn',
		'warband-total-stats-by-turn',
		'warband-composition-by-turn',
	];
	readonly bgsNumberOfDisplayedTabs: number = 1;
	readonly bgsActiveSimulatorMinionTribeFilter: 'all' | 'blank' | string = 'all';
	readonly bgsActiveSimulatorMinionTierFilter: 'all' | '1' | '2' | '3' | '4' | '5' | '6' | '7' = 'all';
	readonly bgsSavedRankFilter: BgsRankFilterType = 100;
	readonly bgsSavedTribesFilter: readonly Race[] = [];
	readonly bgsSavedAnomaliesFilter: readonly string[] = [];
	readonly bgsHeroesUseConservativeEstimate: boolean = true;
	readonly bgsShowBuddiesInSimulatorSelection: boolean = false;
	readonly bgsQuestsActiveTab: BgsQuestActiveTabType = 'quests';
	readonly bgsGroupQuestsByDifficulty: boolean = false;
	readonly bgsActiveUseMmrFilterInHeroSelection: boolean = true;
	readonly bgsActiveUseAnomalyFilterInHeroSelection: boolean = true;
	readonly bgsSavedUseMmrFilterInHeroSelection: boolean = false;
	readonly bgsSavedUseAnomalyFilterInHeroSelection: boolean = false;

	// readonly duelsRunUuid: string;
	readonly duelsActiveHeroSortFilter: DuelsHeroSortFilterType = 'global-winrate';
	readonly duelsActiveDeckSortFilter: DuelsDeckSortFilterType = 'last-played';
	readonly duelsActiveStatTypeFilter: DuelsStatTypeFilterType = 'hero';
	// readonly duelsActiveTreasureSortFilter: DuelsTreasureSortFilterType = 'global-winrate';
	readonly duelsActiveTreasureStatTypeFilter: DuelsTreasureStatTypeFilterType = 'treasure-1';
	readonly duelsActiveTimeFilter: DuelsTimeFilterType = 'last-patch';
	readonly duelsActiveGameModeFilter: DuelsGameModeFilterType = 'all';
	readonly duelsActivePassiveTreasuresFilter: readonly string[] = [];
	readonly duelsActiveTopDecksDustFilter: DuelsTopDecksDustFilterType = 'all';
	readonly duelsActiveMmrFilter: 100 | 50 | 25 | 10 | 1 = 100;
	readonly duelsActiveHeroesFilter2: DuelsHeroFilterType = allDuelsHeroes;
	readonly duelsActiveHeroPowerFilter2: readonly string[] = [];
	readonly duelsActiveSignatureTreasureFilter2: readonly string[] = [];
	readonly duelsActiveLeaderboardModeFilter: 'paid-duels' | 'duels' = 'paid-duels';
	readonly duelsPersonalDeckNames: { [deckstring: string]: string } = {};
	readonly duelsPersonalDeckHiddenDeckCodes: readonly string[] = [];
	readonly duelsPersonalDeckShowHiddenDecks: boolean;
	readonly duelsHideStatsBelowThreshold: boolean;
	readonly duelsShowMaxLifeWidget2: 'off' | 'mouseover' | 'blink' = 'mouseover';
	readonly duelsShowOocTracker: boolean = true;
	readonly duelsShowOocDeckSelect: boolean = true;
	readonly duelsHighlightTreasureSynergies: boolean = true;
	readonly duelsShowInfoOnHeroSelection: boolean = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly duelsOocTrackerPosition: { left: number; top: number };
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly duelsOocDeckSelectPosition: { left: number; top: number };
	readonly duelsDeckbuilderShowBuckets: boolean;
	readonly duelsDeckDeletes: { [deckstring: string]: readonly number[] } = {};

	readonly mercenariesActiveModeFilter: MercenariesModeFilterType = 'pve';
	readonly mercenariesActiveRoleFilter: MercenariesRoleFilterType = 'all';
	readonly mercenariesActivePveDifficultyFilter: MercenariesPveDifficultyFilterType = 'all';
	readonly mercenariesActivePvpMmrFilter: MercenariesPvpMmrFilterType = 100;
	readonly mercenariesActiveStarterFilter: MercenariesStarterFilterType = 'all';
	readonly mercenariesActiveFullyUpgradedFilter: MercenariesFullyUpgradedFilterType = 'all';
	readonly mercenariesActiveOwnedFilter: MercenariesOwnedFilterType = 'all';
	readonly mercenariesActiveHeroLevelFilter2: MercenariesHeroLevelFilterType = 30;
	readonly mercenariesHighlightSynergies: boolean = true;
	readonly mercenariesShowTurnCounterInBattle: boolean = true;
	// For now only for PvE
	// readonly mercenariesShowTaskButton: boolean = true;
	readonly mercenariesPersonalHeroesSortCriterion: MercenariesPersonalHeroesSortCriteria = {
		criteria: 'name',
		direction: 'asc',
	};
	readonly mercenariesShowHiddenTeams: boolean = true;
	readonly mercenariesHiddenTeamIds: readonly string[] = [];
	readonly mercenariesShowMercNamesInTeams: boolean = true;
	readonly mercenariesBackupTeam: readonly number[] = [];

	readonly mercenariesEnablePlayerTeamWidget = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly mercenariesPlayerTeamOverlayScale: number = 100;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly mercenariesPlayerTeamOverlayPosition: { left: number; top: number };

	readonly mercenariesEnableOpponentTeamWidget = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly mercenariesOpponentTeamOverlayScale: number = 100;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly mercenariesOpponentTeamOverlayPosition: { left: number; top: number };

	readonly mercenariesEnableActionsQueueWidgetPvE = true;
	readonly mercenariesEnableActionsQueueWidgetPvP = false;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly mercenariesActionsQueueOverlayScale: number = 100;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly mercenariesActionsQueueOverlayPosition: { left: number; top: number };

	readonly mercenariesEnableOutOfCombatPlayerTeamWidget = true;
	readonly mercenariesEnableOutOfCombatPlayerTeamWidgetOnVillage = true;
	// @Reflect.metadata(FORCE_LOCAL_PROP, true)
	// readonly mercenariesOutOfCombatPlayerTeamOverlayScale: number = 100;
	// @Reflect.metadata(FORCE_LOCAL_PROP, true)
	// readonly mercenariesOutOfCombatPlayerTeamOverlayPosition: { left: number; top: number };

	readonly arenaActiveClassFilter: ArenaClassFilterType = 'all';
	readonly arenaActiveTimeFilter: ArenaTimeFilterType = 'all-time';
	readonly arenaActiveCardClassFilter: ArenaCardClassFilterType = 'all';
	readonly arenaActiveCardTypeFilter: ArenaCardTypeFilterType = 'all';
	readonly arenaActiveWinsFilter: number = 10;
	// TODO: add settings
	readonly arenaShowHeroSelectionOverlay: boolean = true;
	readonly arenaShowCardSelectionOverlay: boolean = true;
	readonly arenaShowOocTracker: boolean = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly arenaOocTrackerScale: number = 100;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly arenaOocTrackerPosition: { left: number; top: number };
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly arenaDraftOverlayScale: number = 100;

	readonly statsXpGraphSeasonFilter: StatsXpGraphSeasonFilterType = 'all-seasons';

	readonly discordRichPresence: boolean = true;
	readonly discordRpcEnableCustomInMatchText: boolean = false;
	readonly discordRpcEnableCustomInGameText: boolean = false;
	readonly discordRpcCustomInGameText: string;
	readonly discordRpcCustomInMatchText: string;

	readonly twitchAccessToken: string;
	readonly twitchUserName: string;
	readonly twitchLoginName: string;
	readonly twitchDelay: number = 0;
	readonly appearOnLiveStreams: boolean = true;

	// TODO: move somewhere else
	readonly outOfCardsToken: OutOfCardsToken;
	readonly outOfCardsShowNotifOnSync: boolean = false;

	readonly d0nkeySync: boolean = true;
	readonly hearthstoneDecksSync: boolean = true;

	readonly ftue: Ftue = new Ftue();

	public static deserialize(input: Preferences): Preferences {
		return {
			...input,
			lastUpdateDate: input.lastUpdateDate ? new Date(input.lastUpdateDate) : null,
			currentSessionStartDate: input.currentSessionStartDate ? new Date(input.currentSessionStartDate) : null,
		};
	}
}

export type CollectionSetStatsTypeFilterType = 'cards-stats' | 'cards-history';
export type BooleanWithLimited = boolean | 'limited';
