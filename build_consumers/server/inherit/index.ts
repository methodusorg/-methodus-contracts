
import {
    ServerConfiguration, PluginConfiguration,
    ClientConfiguration, ConfiguredServer, MethodType, ServerType,
} from '@methodus/server';

(global as any).methodus = {
    config: {
        'Inherit': { 'transport': 'Http', resolver: 'http://localhost:6200' },
        'Inherit2': { 'transport': 'Http', resolver: 'http://localhost:6200' },
        'BaseController': { 'transport': 'Http', resolver: 'http://localhost:6200' },
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
        console.log('calling inherit contract');
        try {
            const result = await Inherit.get('1111');
            console.log(result);
        } catch (error) {
            console.error(error);
        }

        try {
            console.log('calling inherit2 contract');
            const result2 = await Inherit2.get('2222');
            console.log(result2);
        } catch (error) {
            console.error(error);
        }
        process.exit(0);
    }, 1000);
})();
