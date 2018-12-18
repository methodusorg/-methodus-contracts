import { Method, MethodConfig, MethodResult, Verbs, Headers, Query, MethodError, Param, MethodMock } from '@methodus/server';
import { Mock } from '../../../build_mocks/mock';

@MethodConfig('Simple')
export class Simple {
    @MethodMock(Mock.simple)
    @Method(Verbs.Get, '/simple/get')
    public static async get(@Param('id') id: string): Promise<MethodResult> {
        return new MethodResult({});
    }
}
