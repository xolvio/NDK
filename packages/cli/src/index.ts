#!/usr/bin/env ts-node
import { Builder } from './command-controller-builder';
// import { serve } from './serve';
import watcher from '@parcel/watcher';
import ParcelWatcher, { Event } from '@parcel/watcher';
import process from 'process';
import { BUILDING, ConsoleTools, WATCHING } from './console-tools';
import { queuedFunction } from './queue';

function getFiles(events: ParcelWatcher.Event[]) {
  return events.filter((event) => event.path.indexOf('.ts~') === -1).map((event) => event.path);
}

const builder = new Builder();
const consoleTools = new ConsoleTools();
// consoleTools.clear().hide().animate('DDK is watching for changes.', WATCHING);
consoleTools
  .clear()
  .hide()
  .animate('DDK Running http://localhost:4000/graphql ⠸ http://localhost:4000/debug ⠸ Watching...', WATCHING);

async function build(consoleTools: ConsoleTools, events: Event[]) {
  consoleTools.stopAnimation().log('\n📂 Files changed!');
  consoleTools.animate('Building...', BUILDING);
  await builder.build(getFiles(events));
  consoleTools.stopAnimation().log('\n✅ Build complete.');
  setTimeout(() => {
    consoleTools.clear().hide().animate('DDK is watching for changes...', WATCHING);
  }, 300);
}

(async () => {
  await watcher.subscribe(
    process.cwd(),
    queuedFunction(async (_err, events) => await build(consoleTools, events)),
    { ignore: ['**/.command-controllers/**', '**/.command-handlers/**'] },
  );

  // stop server
  // loop to restart whenever files change

  // await serve();
  // if (Math.random() > 1) await serve();
})();
