import { Method, MethodConfig, MethodResult, Verbs, Headers, Query, MethodError, Param, MethodMock } from '@methodus/server';
import { Mock } from '../../../build_mocks/mock';
import { BaseController } from './base.controller';

@MethodConfig('Inherit')
export class Inherit extends BaseController {

}
