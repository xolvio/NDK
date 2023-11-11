#!/usr/bin/env ts-node
import { Builder } from './command-controller-builder';
// import { serve } from './serve';
import watcher from '@parcel/watcher';
import process from 'process';
import { BUILDING, ConsoleTools, WATCHING } from './console-tools';

(async () => {
  const builder = new Builder();
  const consoleTools = new ConsoleTools();
  let isBuilding = false;

  consoleTools.clear().hide().animate('DDK is watching for changes...', WATCHING);
  await watcher.subscribe(
    process.cwd(),
    async (_err, events) => {
      // TODO create a queue and a cancel function
      if (isBuilding) return;
      isBuilding = true;
      consoleTools.stopAnimation().log('\n📂 Files changed!');
      const files = events.filter((event) => event.path.indexOf('.ts~') === -1).map((event) => event.path);
      consoleTools.animate('Building...', BUILDING);
      await builder.build(files);
      consoleTools.stopAnimation().log('\n✅ Build complete.');
      setTimeout(() => {
        consoleTools.clear().hide().animate('DDK is watching for changes...', WATCHING);
        isBuilding = false;
      }, 300);
    },
    { ignore: ['**/.command-controllers/**', '**/.command-handlers/**'] },
  );

  // stop server
  // loop to restart whenever files change

  // await serve();
  // if (Math.random() > 1) await serve();
})();
