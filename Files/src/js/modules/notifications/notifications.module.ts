import { NgModule, ErrorHandler }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpModule }    from '@angular/http';

import { SimpleNotificationsModule } from 'angular2-notifications';

import { NotificationsComponent }  from '../../components/notifications.component';
import { DebugService } from '../../services/debug.service';
import { init } from '@sentry/browser';

init({
	dsn: "https://53b0813bb66246ae90c60442d05efefe@sentry.io/1338840",
	enabled: process.env.NODE_ENV === 'production',
	release: process.env.APP_VERSION
});

console.log('version is ' + process.env.APP_VERSION);

@NgModule({
	imports: [
		BrowserModule,
		HttpModule,
        BrowserAnimationsModule,
        SimpleNotificationsModule.forRoot(),
	],
	declarations: [
		NotificationsComponent,
	],
	bootstrap: [
		NotificationsComponent,
	],
	providers: [
		DebugService,
	],
})

export class NotificationsModule { }
