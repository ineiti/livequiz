import { ApplicationConfig } from '@angular/core';
import { PreloadAllModules, provideRouter, withComponentInputBinding, withDebugTracing, withPreloading } from '@angular/router';

import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes,
    // withDebugTracing(),
    withComponentInputBinding(),
    withPreloading(PreloadAllModules)),
  provideAnimationsAsync()]
};
export const GRID_MAX_WIDTH = 13;
