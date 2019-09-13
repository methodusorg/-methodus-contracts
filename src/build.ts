#!/usr/bin/env node
process.env.NODE_LOG_SILENT = 'true';
import { Builder } from './build.functions';
const logger = console;
(async () => {
    try {
        await Builder();
    } catch (error) {
        logger.error(error);
    } finally {
        process.exit();
    }
})();
