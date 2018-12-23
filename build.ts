#!/usr/bin/env node

import { ServerBuilder } from './src/build.server';
(async () => {
    await ServerBuilder();
})();
