import { AsyncTest, Expect, Test, TestCase, TestFixture, Timeout } from 'alsatian';
import { Rule } from './contracts/rule';



@TestFixture('Test the contracts')
export class Logs {
    @Test('Test contract')
    
    @TestCase(Rule)
    public async testContract(contract) {
        let proxy = new contract();
        let result = await proxy.byId('11111', {});
        console.log(result);
        Expect(result).toBeDefined();
    }




}
