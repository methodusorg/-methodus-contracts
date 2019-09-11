import { Method, MethodConfig, MethodResult, Verbs, Param, MethodMock, SecurityContext } from '@methodus/server';
//import { Mock } from '../../../build_mocks/mock';



@MethodConfig('Simple')
export class Simple {
    //@MethodMock(Mock.simple)
    @Method(Verbs.Get, '/simple/get')
    public static async get(@Param('id') id: string, @SecurityContext() user: any): Promise<MethodResult<any>> {
        // some comments
        let x = 1 + 1;
        let b = x * 10;
        return new MethodResult({ Name: 'roi' });
        //some othe comments
    }

    @Method(Verbs.Post, '/simple/post')
    public static async post(@Param('id') id: string): Promise<MethodResult<any>> {
        return new MethodResult({ Name: 'roi' });
    }
}
