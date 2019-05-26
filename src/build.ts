#!/usr/bin/env node
process.env.NODE_LOG_SILENT = 'true';
import { ServerBuilder } from './build.server';
const logger = console;
(async () => {
    try {
        await ServerBuilder();
    } catch (error) {
        logger.error(error);
    } finally {
        process.exit();
    }
})();
