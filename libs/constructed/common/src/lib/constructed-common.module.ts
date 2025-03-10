import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedCommonViewModule } from '@firestone/shared/common/view';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { StatsDataAccessModule } from '@firestone/stats/data-access';
import { ConstructedMulliganComponent } from './components/constructed-mulligan.component';
import { MulliganDetailedInfoComponent } from './components/mulligan-detailed-info.component';
import { MulliganInfoPremiumComponent } from './components/mulligan-info-premium.component';
import { ConstructedArchetypeService } from './services/constructed-archetype.service';
import { ConstructedMetaDecksStateService } from './services/constructed-meta-decks-state-builder.service';
import { ConstructedMulliganGuideGuardianService } from './services/constructed-mulligan-guide-guardian.service';
import { ConstructedMulliganGuideService } from './services/constructed-mulligan-guide.service';
import { ConstructedNavigationService } from './services/constructed-navigation.service';
import { ConstructedPersonalDecksService } from './services/constructed-personal-decks.service';
import { GameStateFacadeService } from './services/game-state-facade.service';

const components = [ConstructedMulliganComponent, MulliganDetailedInfoComponent, MulliganInfoPremiumComponent];

@NgModule({
	imports: [CommonModule, StatsDataAccessModule, SharedFrameworkCoreModule, SharedCommonViewModule],
	declarations: components,
	exports: components,
	providers: [
		ConstructedPersonalDecksService,
		ConstructedArchetypeService,
		GameStateFacadeService,
		ConstructedNavigationService,
		ConstructedMetaDecksStateService,
		ConstructedMulliganGuideService,
		ConstructedMulliganGuideGuardianService,
	],
})
export class ConstructedCommonModule {}
