#!/usr/bin/env node
process.env.NODE_LOG_SILENT = 'true';
import { Builder } from './build.functions';
(async () => {
    await Builder(undefined , true);
})();
