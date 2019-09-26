import { Expect, Test, TestCase, TestFixture, Focus } from 'alsatian';
import { Builder } from '../build.functions';
import * as path from 'path';

@TestFixture('Build client contracts')
export class ClientTests {
    @Test('Build client contracts')
    @TestCase('/build_vars/simple/build.json')
    @TestCase('/build_vars/inherit/build.json')
    @TestCase('/build_vars/models/build.json')
    public async testContract(contract) {
        let result = false;

        process.chdir(path.join(__dirname, '..', '..'));// reset the cwd, since it changes when generating cotracts
        console.log(process.cwd());

        await Builder(path.join(process.cwd(), contract), true);
        result = true;

        Expect(result).toBeTruthy();
    }


    @Test('Build from args')
    @TestCase('/build_vars/simple/build.json')
    @TestCase('/build_vars/inherit/build.json')
    @TestCase('/build_vars/models/build.json')
    public async testArgContract(contract) {
        process.argv[2] = contract;
        process.chdir(path.join(__dirname, '..', '..'));// reset the cwd, since it changes when generating cotracts

        let result = false;
        await Builder();
        result = true;
        Expect(result).toBeTruthy();

    }
}
