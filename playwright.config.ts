import {defineConfig} from '@playwright/test';

export default defineConfig({
  timeout: 10000,
  use:{
    baseURL: 'https://freetrade.io',
    headless: true,
    viewport: {width: 1280, height: 720},
    actionTimeout: 5000,
    navigationTimeout: 10000
  },
projects: [
  {name: 'chromium', use: {browserName: 'chromium'}},
  {name: 'firefox', use: {browserName: 'firefox'}},
  {name: 'webkit', use: {browserName: 'webkit'}}
],
    expect: {
        timeout: 5000
    },
    retries:1,
    reporter:[['html'],['list']],
});