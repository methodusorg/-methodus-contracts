#!/usr/bin/env node
import { Builder } from './build.functions';
const logger = console;
(async () => {
    try {
        await Builder('', false);
    } catch (error) {
        logger.error(error);
    } finally {
        process.exit();
    }
})();
