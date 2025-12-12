'use strict';

var build = require('../cli/commands/build.cjs');
var dev = require('../cli/commands/dev.cjs');
var index = require('./index.cjs');

var esbuild = () => ({
  name: index.pluginName,
  setup(pluginBuild) {
    let registered = false;
    pluginBuild.onStart(async () => {
      if (!registered) {
        registered = true;
        if (pluginBuild.initialOptions.minify) {
          await build.build();
        } else {
          dev.dev();
        }
      }
    });
  }
});

module.exports = esbuild;
//# sourceMappingURL=esbuild.cjs.map
