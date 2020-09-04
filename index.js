const fg = require('fast-glob');
const fs = require('fs').promises;
const { findLastIndex } = require('lodash');
const utils = require('./utils');

class ImportSorter {
	processFile = (file) => {
		if (!utils.fileHasImports(file)) {
			return;
		}

		const lines = file.split('\n');

		const lastLineWithImport = findLastIndex(lines, utils.lineIsImport);

		const rest = lines.slice(lastLineWithImport + 1);

		// Collect different import types
		const nodeImports = [];
		const rootRelativeImports = [];
		const relativeImports = [];

		lines.slice(0, lastLineWithImport + 1).map(line => {
			if (!utils.lineIsImport(line)) {
				return;
			}

			const path = utils.getPathFromImport(line);

			if (utils.isRelativeImport(path)) {
				relativeImports.push(line);
				return;
			}

			if (utils.isRootRelativeImport(path)) {
				rootRelativeImports.push(line);
				return;
			}

			nodeImports.push(line);
		});

		// Sort imports and append rest of the file
		return [...nodeImports, ...rootRelativeImports, ...relativeImports, ...rest].join('\n');
	}

	async run() {
		const stream = fg.stream(['!node_modules', 'src/components/**/*.{ts,tsx}']);
		for await (const filename of stream) {
			console.log(`Processing ${filename}`);

			fs.readFile(filename, 'utf-8')
			.then(this.processFile)
			.then(file => {
				// processFile will only return changed files, so we can skip unnecessary writess
				if (!file) {
					return;
				}

				fs.writeFile(filename, file, 'utf-8').then(() => {
					console.log(`Sorted imports for file ${filename}`);
				});
			})
			.catch(err => {
				console.log(`Could not read ${filename}: ${err}`);
			});
		}
	}
};

const importSorter = new ImportSorter();

importSorter.run();