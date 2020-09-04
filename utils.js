/*
 * Line utils 
 */
exports.isRelativeImport = (path) => path.startsWith('.');

const rootRelativeDirectories = /^(assets|components|containers|entries|forms|helpers|hooks|intl|messages|reduxState|services|styles|types|utils)/;

exports.isRootRelativeImport = (path) => path.match(rootRelativeDirectories) !== null;

/*
 * File utils
 */

// Simple check, could be turned into a more elaborate regexp later
exports.fileHasImports = (file) => file.includes('import ');
