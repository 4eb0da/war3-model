import {parse} from './parsers/mdl';
import {generate} from './generators/mdl';
import {Model} from './model';
import * as fs from 'fs';

let model: Model = parse(fs.readFileSync(process.argv[2]).toString());
console.log(generate(model));
