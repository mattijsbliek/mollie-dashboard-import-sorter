const utils = require('./utils'):

describe('utils' => {
  const imports = [
    [`import { bla } from "./blabla";`, true],
    [`import { bla } from './blabla';`, true],
    [`import { bla } from '../../blabla';`, true],
    [`import { bla } from "../../blabla";`, true],
    [`import * as bla from 'blabla';`, false],
    [`import * as bla from "blabla";`, false],
    [`import bla from 'blabla';`, false],
    [`import bla from "blabla";`, false],
    [`import { bla } from 'blabla';`, false],
    [`import { bla } from "blabla";`, false],
  ];

  test.each(imports)('isRelativeImport', (line, expected) => {
    expect(utils.isRelativeImport(line)).toBe(expected);
  });
})
