import { access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { createRequire } from 'node:module';

export async function browserRuntime(environment=process.env){
  const candidates=environment.CHROMIUM_EXECUTABLE?[environment.CHROMIUM_EXECUTABLE]:['/usr/bin/chromium','/usr/bin/chromium-browser','/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/opt/google/chrome/chrome','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',...(environment.PROGRAMFILES?[`${environment.PROGRAMFILES}/Google/Chrome/Application/chrome.exe`]:[])];
  let executablePath;for(const candidate of candidates)try{await access(candidate,constants.X_OK);executablePath=candidate;break;}catch{/* Try another installed browser. */}
  if(!executablePath)throw new Error('Browser smoke requires installed Chromium/Chrome. Set CHROMIUM_EXECUTABLE to its executable; no browser tests were skipped.');
  const {chromium}=createRequire(import.meta.url)(environment.PLAYWRIGHT_MODULE??'playwright-core');return {chromium,executablePath};
}
