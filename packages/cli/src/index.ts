#!/usr/bin/env ts-node
import { Builder } from './command-controller-builder';
// import { serve } from './serve';
import watcher from '@parcel/watcher';
import ParcelWatcher, { Event } from '@parcel/watcher';
import process from 'process';
import { BUILDING, ConsoleTools, WATCHING } from './console-tools';
import { queuedFunction } from './queue';
import { ChildProcess, spawn } from 'child_process';
import path from 'path';

function getFiles(events: ParcelWatcher.Event[]) {
  return events.filter((event) => event.path.indexOf('.ts~') === -1).map((event) => event.path);
}

const builder = new Builder();
const consoleTools = new ConsoleTools();

// consoleTools.clear().hide().animate('DDK is watching for changes.', WATCHING);

function waitingMessage(delay = 0) {
  setTimeout(
    () =>
      consoleTools
        .clear()
        .hide()
        .animate('DDK Running ⠸ http://localhost:4000/graphql ⠸ http://localhost:4000/debug ⠸ Watching...', WATCHING),
    delay,
  );
}

async function build(consoleTools: ConsoleTools, events: Event[]) {
  consoleTools.stopAnimation();
  if (events.length > 0) consoleTools.log('\n📂 Files changed!');
  consoleTools.animate('Building...', BUILDING);
  await builder.build(getFiles(events));
  consoleTools.stopAnimation().log('\n✅ Build complete.');
}

let serverProcess: ChildProcess;

function restartServer() {
  if (serverProcess) {
    serverProcess.kill('SIGINT');
  }
  serverProcess = spawn('ts-node', [path.join(__dirname, 'serve.ts')], {
    stdio: 'inherit',
  });
  serverProcess.on('exit', function (code /*signal*/) {
    if (code === 0) {
      consoleTools.stopAnimation().log('\n🔄 Server restarted successfully');
    }
  });
}

async function buildLoop(events: Event[]): Promise<void> {
  await build(consoleTools, events);
  restartServer();
  waitingMessage(300);
}

(async () => {
  consoleTools.clear().hide().animate('DDK is starting...', WATCHING);
  await watcher.subscribe(
    process.cwd(),
    queuedFunction(async (_err, events) => await buildLoop(events)),
    { ignore: ['**/.command-controllers/**', '**/.command-handlers/**'] },
  );
  // if (Math.random()) return;
  await buildLoop([]);
})();
