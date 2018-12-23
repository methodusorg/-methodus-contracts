import { Method, MethodConfig, MethodResult, Verbs, Param, MethodMock } from '@methodus/server';
import { Mock } from '../../../build_mocks/mock';

 

@MethodConfig('Simple')
export class Simple {
    @MethodMock(Mock.simple)
    @Method(Verbs.Get, '/simple/get')
    public static async get(@Param('id') id: string): Promise<MethodResult<any>> {
        return new MethodResult({ Name: 'roi' });
    }

    @Method(Verbs.Post, '/simple/post')
    public static async post(@Param('id') id: string): Promise<MethodResult<any>> {
        return new MethodResult({ Name: 'roi' });
    }
}
