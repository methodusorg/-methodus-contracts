import { AsyncTest, Expect, Test, TestCase, TestFixture, Timeout, FocusTest } from 'alsatian';
import { ServerBuilder } from '../build.server';
import * as path from 'path';
const logger = console;
@TestFixture('Build server contracts')
export class Logs {

    @Timeout(60 * 1000)
    @Test('Build simple')
    @TestCase('/build_vars/simple/build.json')
    @TestCase('/build_vars/inherit/build.json')
    @TestCase('/build_vars/models/build.json')
    public async testContract(contract) {
        try {
            const result = await ServerBuilder(path.join(process.cwd(), contract));
            logger.warn(result);
            Expect(result).toBeTruthy();
        } catch (error) {
            logger.error(error);
        }

    }

    @Test('Build from args')
    @TestCase('/build_vars/simple/build.json')
    @TestCase('/build_vars/inherit/build.json')
    @TestCase('/build_vars/models/build.json')
    public async testArgContract(contract) {
        process.argv[2] = contract;
        await ServerBuilder();
    }
}
