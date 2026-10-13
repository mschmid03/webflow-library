import { register, start } from './core';
import count from './utilities/count';
import timespan from './utilities/timespan';
import year from './utilities/year';

register(count, timespan, year);
start();
