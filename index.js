#!/usr/bin/env node

const fg = require('fast-glob');
const fs = require('fs').promises;
const utils = require('./utils');

// Matches ES6 imports
// https://regexr.com/47jlq
const importRegexp = /^import\s+?(?:(?:(?:[\w*\s{},]*)\s+from\s+?)|)(?:(?:".*?")|(?:'.*?'))[\s]*?(?:;|$|)/;
// Matches text between two single quotes
const pathRegexp = /(?<=')[^']+(?=')/;
// Matches comment blocks
const commentBlockRegexp = /^\/\*(\*(?!\/)|[^*])*\*\//;

class ImportSorter {
	numberOfChangedFiles = 0;

	processFile = (file) => {
		if (!utils.fileHasImports(file)) {
			return;
		}

		const initialCommentBlock = file.match(new RegExp(commentBlockRegexp));
		const imports = file.match(new RegExp(importRegexp, 'gm'));
		const lastImport = imports[imports.length - 1];

		const rest = file.slice(file.indexOf(lastImport) + lastImport.length);

		// Collect different import types
		const comments = [
			...(initialCommentBlock && initialCommentBlock.length > 0
				? initialCommentBlock
				: []),
		];
		const nodeImports = [];
		const rootRelativeImports = [];
		const relativeImports = [];

		imports.map(imp => {
			const [path] = imp.match(new RegExp(pathRegexp, "m"));

			if (utils.isRelativeImport(path)) {
				relativeImports.push(imp);
				return;
			}

			if (utils.isRootRelativeImport(path)) {
				rootRelativeImports.push(imp);
				return;
			}

			nodeImports.push(imp);
		});

		this.numberOfChangedFiles++;

		// Sort imports and append rest of the file
		return [
			...comments, 
			...nodeImports, 
			...rootRelativeImports, 
			...relativeImports
		].join('\n').concat(rest);
	}

	async run() {
		const directory = process.argv[2];

		if (!directory) {
			console.error('Missing a directory argument, add it like so: "./node_modules/.bin/mollie-import-sorter src/components/UI"');
			return;
		}

		const stream = fg.stream(['!node_modules', `${directory.replace(/\/$/, "")}/**/*.{ts,tsx}`]);
		for await (const filename of stream) {
			console.log(`Processing ${filename}`);

			fs.readFile(filename, 'utf-8')
			.then(this.processFile)
			.then(file => {
				// processFile will only return changed files, so we can skip unnecessary writess
				if (!file) {
					return;
				}

				fs.writeFile(filename, file, 'utf-8');
			})
			.catch(err => {
				console.warn(`Something went wrong while processing ${filename}: ${err}`);
			});
		}

		console.log(`Done processing, ${this.numberOfChangedFiles} files were updated`);
	}
};

const importSorter = new ImportSorter();

importSorter.run();