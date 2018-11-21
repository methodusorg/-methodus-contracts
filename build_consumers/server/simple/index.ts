
import {
    ServerConfiguration, PluginConfiguration,
    ClientConfiguration, ConfiguredServer, MethodType, ServerType,
} from '@methodus/server';

global.methodus = { config: { 'Simple': { 'transport': 'Mock' } } };
import { Simple } from '@server/simple';

@ServerConfiguration(ServerType.Express, { port: process.env.PORT || 6690 })
@ClientConfiguration(Simple, MethodType.Mock, ServerType.Express)
class SetupServer extends ConfiguredServer {
    constructor() {
        super(SetupServer);
    }
}


(async () => {
    new SetupServer();
    setTimeout(async () => {
        const result = await Simple.get('1111');
        console.log(result);
        process.exit(0);
    }, 1000);
})();
