import { AsyncTest, Expect, Test, TestCase, TestFixture, Focus } from 'alsatian';
import { ClientBuilder } from '../build.client';
import * as path from 'path';

@TestFixture('Build client contracts')
export class Logs {
    @AsyncTest('Build simple')
    @TestCase('/build_vars/simple/build.json')
    @TestCase('/build_vars/inherit/build.json')
    @TestCase('/build_vars/models/build.json')
    public async testContract(contract) {
        let result = false;
        try {
            await ClientBuilder(path.join(process.cwd(), contract));
            result = true;
        } catch (error) {
            result = false;
        }
        Expect(result).toBeTruthy();
    }


    @AsyncTest('Build from args')
    @TestCase('/build_vars/simple/build.json')
    @TestCase('/build_vars/inherit/build.json')
    @TestCase('/build_vars/models/build.json')
    public async testArgContract(contract) {
        process.argv[2] = contract;

        let result = false;
        try {
            await ClientBuilder();
            result = true;
        } catch (error) {
            console.log(error);
            result = false;
        }
        Expect(result).toBeTruthy();

    }
}
