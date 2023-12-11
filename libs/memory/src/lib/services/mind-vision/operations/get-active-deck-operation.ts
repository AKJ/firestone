import { OverwolfService } from '@firestone/shared/framework/core';
import { DeckInfoFromMemory } from '../../../models/deck-info-from-memory';
import { MindVisionFacadeService } from '../mind-vision-facade.service';
import { MindVisionOperationFacade } from '../mind-vision-operation-facade';

export class GetActiveDeckOperation extends MindVisionOperationFacade<DeckInfoFromMemory> {
	constructor(mindVision: MindVisionFacadeService, ow: OverwolfService) {
		super(
			ow,
			'getActiveDeck',
			(forceReset?: boolean, selectedDeckId?: number) => mindVision.getActiveDeck(selectedDeckId, forceReset),
			(deck) => !deck,
			(deck) => deck,
			5,
			2000,
		);
	}
}
