

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



// @TestFixture('Build client contracts')
// export class ClientTests {
//     @Test('Build client contracts')
//     @TestCase('/build_vars/simple/build.json')
//     // @TestCase('/build_vars/inherit/build.json')
//     // @TestCase('/build_vars/models/build.json')
//     public async testContract(contract) {
//         let result = false;

//         process.chdir(path.join(__dirname, '..', '..'));// reset the cwd, since it changes when generating cotracts
         

//         await Builder(path.join(process.cwd(), contract), true);
//         result = true;

//         Expect(result).toBeTruthy();
//     }


//     // @Test('Build from args')
//     // @TestCase('/build_vars/simple/build.json')
//     // @TestCase('/build_vars/inherit/build.json')
//     // @TestCase('/build_vars/models/build.json')
//     // public async testArgContract(contract) {
//     //     process.argv[2] = contract;
//     //     process.chdir(path.join(__dirname, '..', '..'));// reset the cwd, since it changes when generating cotracts

//     //     let result = false;
//     //     await Builder();
//     //     result = true;
//     //     Expect(result).toBeTruthy();

//     // }
// }
