#!/usr/bin/env node
process.env.NODE_LOG_SILENT = 'true';
import { ServerBuilder } from './src/build.server';
(async () => {
    await ServerBuilder();
})();
