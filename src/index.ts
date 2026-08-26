import { register, start } from './core';
import count from './utilities/count';
import year from './utilities/year';

register(count, year);
start();
