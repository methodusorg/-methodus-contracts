#!/usr/bin/env node
process.env.NODE_LOG_SILENT = 'true';
import { ClientBuilder } from './src/build.client';
(async () => {
    await ClientBuilder();
})();
