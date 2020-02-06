

import { Builder } from '../build.functions';
import * as path from 'path';


describe('Build server contracts', () => {
    for (const contract of ['simple', 'models', 'inherit']) {
        test('Build server contracts', async () => {
            try {
                process.chdir(path.join(__dirname, '..', '..'));// reset the cwd, since it changes when generating cotracts
                const result = await Builder(path.join(process.cwd(), `/build_vars/${contract}/build.json`), true);
                expect(result).toBeDefined();
            } catch (error) {
                expect(false).toBeTruthy();
                debugger;
            }
        });
    };
});
