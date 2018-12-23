#!/usr/bin/env node

import { ClientBuilder } from './src/build.client';
(async () => {
    await ClientBuilder();
})();
