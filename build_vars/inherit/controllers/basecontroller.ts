
import { Method, MethodConfigBase, MethodResult, Verbs, Param, MethodMock } from '@methodus/server';
import { Mock } from '../';

@MethodConfigBase('BaseController')
export class BaseController {
    @MethodMock(Mock.simple)
    @Method(Verbs.Get, '/simple/get')
    public async get(@Param('id') id: string): Promise<MethodResult> {
        return new MethodResult({});
    }
}
