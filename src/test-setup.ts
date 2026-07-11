import '@analogjs/vitest-angular/setup-zone';

import { TestBed, getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import fr from '../public/i18n/fr.json';

getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
);

// Global i18n test setup: every TestBed gets Transloco with the real FR
// translations (synchronous), and lang is forced to 'fr' so components that use
// `| transloco` render French text (jsdom's navigator lang would pick 'en').
// See foxugly-ops STANDARD-frontend-layout.md §5.
beforeEach(() => {
  try {
    localStorage.setItem('lang', 'fr');
  } catch {
    /* localStorage unavailable — non-fatal */
  }
  TestBed.configureTestingModule({
    imports: [
      TranslocoTestingModule.forRoot({
        langs: { fr },
        translocoConfig: { availableLangs: ['fr'], defaultLang: 'fr' },
        preloadLangs: true,
      }),
    ],
  });
});
