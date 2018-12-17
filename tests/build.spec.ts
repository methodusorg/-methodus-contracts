import { AsyncTest, Expect, Test, TestCase, TestFixture, Timeout } from 'alsatian';
import { ServerBuilder } from '../src/build.server';
import * as path from 'path';


@TestFixture('Build server contracts')
export class Logs {
    @Test('Build simple')
    @TestCase('/build_vars/simple/build.json')
    @TestCase('/build_vars/inherit/build.json')
    @TestCase('/build_vars/model/build.json')
    public async testContract(contract) {
        await ServerBuilder(path.join(process.cwd(), contract));
    }

    @Test('Build from args')
    @TestCase('/build_vars/simple/build.json')
    @TestCase('/build_vars/inherit/build.json')
    @TestCase('/build_vars/model/build.json')
    public async testArgContract(contract) {
        process.argv[2] = contract;
        await ServerBuilder();
    }
}
