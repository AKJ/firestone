export interface Update {
	readonly sections: readonly UpdateSection[];
	readonly force: boolean;
	readonly version: string;
}

export interface UpdateSection {
	readonly type: 'intro' | 'main' | 'minor' | 'beta' | 'future';
	readonly header?: string;
	readonly updates?: readonly UpdateSectionItem[];
	readonly text?: string;
}

export interface UpdateSectionItem {
	readonly category:
		| 'general'
		| 'replays'
		| 'achievements'
		| 'duels'
		| 'arena'
		| 'decktracker'
		| 'battlegrounds'
		| 'mercenaries'
		| 'profile'
		| 'collection';
	readonly details: UpdateSectionItemDetails[];
}

export interface UpdateSectionItemDetails {
	readonly type: 'feature' | 'bug' | 'ui' | 'content' | 'misc';
	readonly text: string;
}

export const updates: readonly Update[] = [
	{
		version: '12.5.0',
		force: false,
		sections: [
			// {
			// 	type: 'intro',
			// 	header: 'Message from the dev',
			// 	text: `This release for now mostly contains technical updates. I'm trying to make the app load faster, and decrease the memory it uses overall, especially if you're only using one or two modes. It will take a while to get there, so expect the improvements to be very gradual. </br>
			// 	This first phase focuses on making the app load faster when on desktop (i.e. HS is not running).
			// 	`,
			// },
			{
				type: 'main',
				header: 'Main updates',
				updates: [
					{
						category: 'general',
						details: [
							{
								type: 'bug',
								text: `The app has been updated for Hearthstone patch 28.0.`,
							},
						],
					},
				],
			},
			// {
			// 	type: 'minor',
			// 	header: 'Minor updates',
			// 	updates: [
			// 		{
			// 			category: 'decktracker',
			// 			details: [
			// 				{
			// 					type: 'bug',
			// 					text: `Fix an issue where the deckbuilder would not show up anymore.`,
			// 				},
			// 			],
			// 		},
			// 		{
			// 			category: 'duels',
			// 			details: [
			// 				{
			// 					type: 'bug',
			// 					text: `Fix an issue where some data was sent incorrectly to the server during the run, leading to runs being categorized as "Casual" instead of "Heroic", thus preventing them from appearing in the high-wins list.`,
			// 				},
			// 			],
			// 		},
			// 	],
			// },
			// {
			// 	type: 'future',
			// 	header: 'Under the Hood',
			// 	text: `
			// 		This release
			// 	`,
			// },
		],
	},
];
