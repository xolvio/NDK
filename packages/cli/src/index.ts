#!/usr/bin/env ts-node
import { Builder } from './command-controller-builder';
// import { serve } from './serve';
import watcher from '@parcel/watcher';
import process from 'process';
import readline from 'readline';

// Function to update the console in situ
function updateConsole(message: string) {
  readline.cursorTo(process.stdout, 0); // Move cursor to start of the line
  readline.clearLine(process.stdout, 0); // Clear the current line
  process.stdout.write(message); // Write the new message
}

type FrameType = 'A' | 'B' | 'C' | 'D' | 'E';
const frames: Record<FrameType, string[]> = {
  A: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
  B: ['⠋', '⠙', '⠚', '⠞', '⠖', '⠦', '⠴', '⠲', '⠳', '⠓'],
  C: ['▏', '▎', '▍', '▌', '▋', '▊', '▉', '█', '▉', '▊', '▋', '▌', '▍', '▎'],
  D: ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█', '▇', '▆', '▅', '▄', '▃', '▁'],
  E: ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'],
};

function animateConsole(message: string, type: FrameType, delay = 100) {
  let index = 0;
  return setInterval(() => {
    updateConsole(`${frames[type][index]} ${message}`);
    index = (index + 1) % frames[type].length;
  }, delay);
}

const builder = new Builder();

(async () => {
  // eslint-disable-next-line no-console
  console.clear();
  process.stdout.write('\x1B[?25l'); // Hide cursor
  let animation = animateConsole('DDK is watching for changes...', 'B');
  await watcher.subscribe(
    process.cwd(),
    async (_err, events) => {
      clearInterval(animation);
      // eslint-disable-next-line no-console
      console.log('\n📂 Files changed!');
      const files = events.filter((event) => event.path.indexOf('.ts~') === -1).map((event) => event.path);
      animation = animateConsole('Building...', 'D');
      await builder.build(files);
      clearInterval(animation);
      // eslint-disable-next-line no-console
      console.log('\n✅ Build complete.');
      setTimeout(() => {
        // eslint-disable-next-line no-console
        console.clear();
        clearInterval(animation);
        animation = animateConsole('DDK is watching for changes...', 'B');
      }, 300);
    },
    { ignore: ['**/.command-controllers/**'] },
  );

  // stop server
  // loop to restart whenever files change

  // await serve();
  // if (Math.random() > 1) await serve();
})();
