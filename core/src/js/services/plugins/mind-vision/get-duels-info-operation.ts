import { DuelsInfo } from '../../../models/duels-info';
import { OverwolfService } from '../../overwolf.service';
import { MindVisionOperationFacade } from './mind-vision-operation-facade';
import { MindVisionService } from './mind-vision.service';

export class GetDuelsInfoOperation extends MindVisionOperationFacade<DuelsInfo> {
	constructor(mindVision: MindVisionService, ow: OverwolfService) {
		super(
			ow,
			'getDuelsInfo',
			(forceReset?: boolean) => mindVision.getDuelsInfo(forceReset),
			info => false,
			info =>
				({
					...info,
				} as DuelsInfo),
			3,
			1500,
		);
	}
}
