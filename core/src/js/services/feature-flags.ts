// When changing these feature flags, don't forget to update the new-version component
export class FeatureFlags {
	public static readonly ENABLE_CONSTRUCTED_RANKING_GRAPH = false;
	public static readonly ENABLE_BGS_FULL_SIMULATOR = false;
	public static readonly ENABLE_STATS_TAB = false;
	public static readonly ENABLE_DUELS_LEADERBOARD = false;

	// Shelved for now
	public static readonly ENABLE_MULTI_GRAPHS = false;
	// Properly test the memory footprint of these features before release
	public static readonly SHOW_CONSTRUCTED_SECONDARY_WINDOW = false; // Doesn't work anymore?
	public static readonly ENABLE_RANKED_ARCHETYPE = false; // Doesn't work anymore?
}
