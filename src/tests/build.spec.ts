import { Builder } from '../build.functions';
import * as path from 'path';

describe('Build server contracts', () => {
    ['simple', 'models', 'inherit'].forEach((contract) => {
        test('Build server contracts', async () => {
            process.chdir(path.join(__dirname, '..', '..'));// reset the cwd, since it changes when generating cotracts
            const result = await Builder(path.join(process.cwd(), `/build_vars/${contract}/build.json`));
            expect(result).toBeDefined();
        });
    });
});

// @TestCase('/build_vars/simple/build.json')
// // @TestCase()
// // @TestCase('/build_vars/inherit/build.json')

// });


// @TestFixture('Build server contracts')
// export class ServerTests {
//     @Timeout(60 * 1000 * 10)
//     @Test('Build all flavours')

//     public async testContract(contract) {
//         process.chdir(path.join(__dirname, '..', '..'));// reset the cwd, since it changes when generating cotracts
//         const result = await Builder(path.join(process.cwd(), contract));
//         Expect(result).toBeTruthy();
//     }


//     // @Test('Build from args')
//     // @TestCase('/build_vars/simple/build.json')
//     // @TestCase('/build_vars/inherit/build.json')
//     // @TestCase('/build_vars/models/build.json')
//     // public async testArgContract(contract) {
//     //     process.chdir(path.join(__dirname, '..', '..'));// reset the cwd, since it changes when generating cotracts
//     //     process.argv[2] = contract;
//     //     await Builder();
//     // }  

// }
