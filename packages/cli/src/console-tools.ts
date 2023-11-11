import kleur from 'kleur';
import readline from 'readline';
import process from 'process';

const COLORS = [kleur.red, kleur.yellow, kleur.green, kleur.cyan, kleur.blue, kleur.magenta];

const repeat = (arr: string[], n: number) => Array(n).fill(arr).flat();

const SEQUENCES: Record<number, string[]> = {
  0: ['⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏', '⠋', '⠙', '⠹'],
  1: ['⠴', '⠲', '⠳', '⠓', '⠋', '⠙', '⠚', '⠞', '⠖', '⠦'],
  2: ['▏', '▎', '▍', '▌', '▋', '▊', '▉', '█', '▉', '▊', '▋', '▌', '▍', '▎'],
  3: ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█', '▇', '▆', '▅', '▄', '▃', '▁'],
  4: ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'],
};

export const WATCHING = [
  ...repeat(SEQUENCES[0], 3),
  ...repeat(SEQUENCES[0], 3).reverse(),
  ...repeat(SEQUENCES[1], 3),
  ...repeat(SEQUENCES[1], 3).reverse(),
];
export const BUILDING = [...SEQUENCES[2], ...SEQUENCES[3]];
export const WAITING = [...SEQUENCES[4], ...SEQUENCES[4], ...SEQUENCES[4].reverse(), ...SEQUENCES[4]];

export class ConsoleTools {
  animation: NodeJS.Timeout | undefined;

  updateConsole(message: string): ConsoleTools {
    readline.cursorTo(process.stdout, 0);
    readline.clearLine(process.stdout, 0);
    process.stdout.write(message);
    return this;
  }

  animate(message: string, sequence: string[], delay = 100): ConsoleTools {
    let index = 0;
    let colorIndex = 0;
    this.animation = setInterval(() => {
      const colorFunction = COLORS[colorIndex];
      this.updateConsole(`${colorFunction(sequence[index])} ${message}`);
      index = (index + 1) % sequence.length;
      colorIndex = (colorIndex + 1) % COLORS.length;
    }, delay);
    return this;
  }

  stopAnimation(): ConsoleTools {
    if (this.animation) clearInterval(this.animation);
    return this;
  }

  clear(): ConsoleTools {
    // eslint-disable-next-line no-console
    console.clear();
    return this;
  }

  hide(): ConsoleTools {
    // eslint-disable-next-line no-console
    process.stdout.write('\x1B[?25l');
    return this;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  log(...args: any[]): ConsoleTools {
    // eslint-disable-next-line no-console
    console.log(...args);
    return this;
  }
}
