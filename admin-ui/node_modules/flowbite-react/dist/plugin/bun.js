import { build } from '../cli/commands/build.js';
import { dev } from '../cli/commands/dev.js';
import { pluginName } from './index.js';

var bun = {
  name: pluginName,
  setup({ onStart, config }) {
    onStart(async () => {
      if (config.minify) {
        await build();
      } else {
        await dev();
      }
    });
  }
};

export { bun as default };
//# sourceMappingURL=bun.js.map
