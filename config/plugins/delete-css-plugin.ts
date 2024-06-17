// @ts-nocheck
const fs = require('fs');
const path = require('path');

class DeleteCssPlugin {
  constructor(options) {
    this.options = options || {};
  }

  apply(compiler) {
    compiler.hooks.done.tap('DeleteCssPlugin', (stats) => {
      const outputPath =
        this.options.outputPath || path.resolve(__dirname, 'dist');

      fs.readdir(outputPath, (err, files) => {
        if (err) {
          console.error(`Failed to read directory: ${outputPath}`, err);
          return;
        }

        files.forEach((file) => {
          if (file.endsWith('.css')) {
            const filePath = path.join(outputPath, file);
            fs.unlink(filePath, (err) => {
              if (err) {
                console.error(`Failed to delete file: ${filePath}`, err);
              } else {
                console.log(`Deleted: ${filePath}`);
              }
            });
          }
        });
      });
    });
  }
}

module.exports = DeleteCssPlugin;
