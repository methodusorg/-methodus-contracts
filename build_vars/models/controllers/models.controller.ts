import { Method, MethodConfig, MethodResult, Verbs, Headers, Query, MethodError, Param, MethodMock } from '@methodus/server';
import { Mock } from '../../../build_mocks/mock';
import { UserModel } from '../models/user.model';
/*start custom*/
import { DataController } from './datacontroller';
/*end custom*/
@MethodConfig('ModelsController', [], UserModel)
export class ModelsController extends DataController {
    
}
