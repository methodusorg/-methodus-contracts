import { Expect, Test, TestCase, TestFixture, Timeout, Focus } from 'alsatian';
import { Builder } from '../build.functions';
import * as path from 'path';


@TestFixture('Build server contracts')
export class ServerTests {
    @Timeout(60 * 1000 * 10)
    @Test('Build all flavours')
    @TestCase('/build_vars/simple/build.json')
    @TestCase('/build_vars/models/build.json')
    @TestCase('/build_vars/inherit/build.json')
    public async testContract(contract) {
        process.chdir(path.join(__dirname, '..', '..'));// reset the cwd, since it changes when generating cotracts
        const result = await Builder(path.join(process.cwd(), contract));
        Expect(result).toBeTruthy();
    }


    @Test('Build from args')
    @TestCase('/build_vars/simple/build.json')
    @TestCase('/build_vars/inherit/build.json')
    @TestCase('/build_vars/models/build.json')
    public async testArgContract(contract) {
        process.chdir(path.join(__dirname, '..', '..'));// reset the cwd, since it changes when generating cotracts
        process.argv[2] = contract;
        await Builder();
    }  

}
