
import {
    ServerConfiguration, PluginConfiguration,
    ClientConfiguration, ConfiguredServer, MethodType, ServerType,
} from '@methodus/server';

import { Simple } from '../../../build_path/@server/simple/index';

@ServerConfiguration(ServerType.Express, { port: process.env.PORT || 6690 })
@PluginConfiguration('@methodus/describe', { path: '/manage' })
@ClientConfiguration(Simple, MethodType.Local, ServerType.Express)
class SetupServer extends ConfiguredServer {
    constructor() {
        super(SetupServer);
    }
}

(async () => {
    new SetupServer();

    setTimeout(async () => {
        debugger
        const result = await Simple.get('1111');
        console.log(result);
    }, 5000)

})();
