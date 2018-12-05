
import {
    ServerConfiguration, PluginConfiguration,
    ClientConfiguration, ConfiguredServer, MethodType, ServerType,
} from '@methodus/server';

(global as any).methodus = {
    config: {
        'Inherit': { 'transport': 'Http' },
        'Inherit2': { 'transport': 'Http' },
        'BaseController': { 'transport': 'Http' },
    }
};
import { Inherit, Inherit2 } from '@server/inherit';

@ServerConfiguration(ServerType.Express, { port: process.env.PORT || 6690 })
@ClientConfiguration(Inherit, MethodType.Http, ServerType.Express, 'http://localhost:6200')
@ClientConfiguration(Inherit2, MethodType.Http, ServerType.Express, 'http://localhost:6200')
// @PluginConfiguration('@methodus/describe')
class SetupServer extends ConfiguredServer {
    constructor() {
        super(SetupServer);
    }
}


(async () => {
    new SetupServer();
    setTimeout(async () => {
        const result = await Inherit.get('1111');
        console.log(result);

        const result2 = await Inherit2.get('1111');
        console.log(result2);
        process.exit(0);
    }, 1000);
})();
