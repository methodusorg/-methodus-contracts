
import {
    MethodType
} from '@methodus/client';

import { Simple } from '../../../build_path/@client/simple/index';


(async () => {


    setTimeout(async () => {    
        const result = await Simple.get('1111');
        console.log(result);
    }, 5000)

})();
