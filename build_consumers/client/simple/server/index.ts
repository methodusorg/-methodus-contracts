
import {
    ServerConfiguration, PluginConfiguration,
    ConfiguredServer, ServerType,
} from '@methodus/server';
import * as path from 'path';

@ServerConfiguration(ServerType.Express, { port: process.env.PORT || 6690 })
@PluginConfiguration(path.join(__dirname, 'static'), { path: '/' })
class SetupServer extends ConfiguredServer {
    constructor() {
        super(SetupServer);
    }
}

new SetupServer();
