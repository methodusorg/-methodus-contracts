import { AsyncTest, Expect, Test, TestCase, TestFixture, Timeout } from 'alsatian';
import { ClientBuilder } from '../build.client';
import * as path from 'path';

@TestFixture('Build client contracts')
export class Logs {
    @Test('Build simple')
    @TestCase('/build_vars/simple/build.json')
    @TestCase('/build_vars/inherit/build.json')
    @TestCase('/build_vars/model/build.json')
    public async testContract(contract) {
        await ClientBuilder(path.join(process.cwd(), contract));
    }

    @Test('Build from args')
    @TestCase('/build_vars/simple/build.json')
    @TestCase('/build_vars/inherit/build.json')
    @TestCase('/build_vars/model/build.json')
    public async testArgContract(contract) {
        process.argv[2] = contract;
        await ClientBuilder();
    }
}
