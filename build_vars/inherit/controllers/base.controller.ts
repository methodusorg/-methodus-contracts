
import { Method, MethodConfig, MethodResult, Verbs, Headers, Query, MethodError, Param, MethodMock } from '@methodus/server';
import { Mock } from '../';



export class BaseController {
    @MethodMock(Mock.simple)
    @Method(Verbs.Get, '/simple/get')
    public static async get(@Param('id') id: string): Promise<MethodResult<any>> {
        return new MethodResult({});
    }
}