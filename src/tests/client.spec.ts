

import { Builder } from '../build.functions';
import * as path from 'path';


describe('Build server contracts', () => {
    ['simple', 'models', 'inherit'].forEach((contract) => {
        test('Build server contracts', async () => {
            process.chdir(path.join(__dirname, '..', '..'));// reset the cwd, since it changes when generating cotracts
            const result = await Builder(path.join(process.cwd(), `/build_vars/${contract}/build.json`), true);
            expect(result).toBeDefined();
        });
    });
});


 