import { Builder } from '../build.functions';
import * as path from 'path';

describe('Build server contracts', () => {

    async function tester(contract: string) {
        try {
            process.chdir(path.join(__dirname, '..', '..'));// reset the cwd, since it changes when generating cotracts
            const result = await Builder(path.join(process.cwd(), `/build_vars/${contract}/build.json`), true);
            expect(result).toBeDefined();
        } catch (error) {
            expect(false).toBeTruthy();
        }
    }

    test('Build simple server contracts', async () => {
        await tester('simple');
    });

    test('Build models server contracts', async () => {
        await tester('models');
    });

    test('Build inherit server contracts', async () => {
        await tester('inherit');
    });

});
