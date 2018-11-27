
import {
    MethodType
} from '@methodus/client';

import { Simple } from '@client/simple';
import { Models } from '@client/models';
// import { Inherit } from '@client/inherit';

(async () => {
    setTimeout(async () => {
        const result = await Simple.get('1111');
        console.log(result);



        // const result2 = await Models.get('1111');
        // console.log(result2);
    }, 1000 * 10);

    setTimeout(async () => {

        debugger;
        const result1 = await Models.get('1111');
        console.log(result1);

        // const result2 = await Models.get('1111');
        // console.log(result2);
    }, 5000);


})();
