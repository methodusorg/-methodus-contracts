import { Server } from './builder-models/server';
import { Configuration, KeysConfiguration } from './builder-models/interfaces';
import * as path from 'path';
import * as colors from 'colors';
import * as del from 'del';

process.env.NODE_CONFIG_DIR = path.join(process.cwd(), 'config');

export async function ServerBuilder(contract?: string) {

    let buildConfiguration: Configuration | KeysConfiguration;

    // tslint:disable-next-line:no-console
    console.log(colors.blue('> methodus contract builder.'));
    let publish = false;
    if (contract) {
        buildConfiguration = require(contract) as Configuration;
    } else {
        const filePath = path.resolve(path.join(process.cwd(), process.argv[2]));
        // tslint:disable-next-line:no-console
        console.log(colors.green('> loading build configuration from:'), filePath);
        buildConfiguration = require(filePath) as KeysConfiguration;

        publish = process.argv[3] === '-p' || publish;
    }

    if (!buildConfiguration) {
        throw (new Error('fatal error, no configuration found'));

    }
    const checkList: string[] = [];
    Object.keys(buildConfiguration).forEach((singleConfiguration) => {
        const configurationItem = buildConfiguration[singleConfiguration];
        // tslint:disable-next-line:no-console
        console.log(colors.green(` > ${singleConfiguration}`));

        let sourcePath = process.cwd();
        if (!configurationItem.buildPath) {
            configurationItem.buildPath = '../../';
        }

        if (configurationItem.path) {
            sourcePath = path.resolve(configurationItem.path);
        }

        const destPath = path.resolve(path.join(configurationItem.buildPath, configurationItem.contractNameServer));

        // tslint:disable-next-line:no-console
        console.log(colors.cyan('> source:'), sourcePath);
        // tslint:disable-next-line:no-console
        console.log(colors.cyan('> target:'), destPath);
        try {
            if (buildConfiguration !== null) {
                const builder = new Server(buildConfiguration[singleConfiguration],
                    singleConfiguration, sourcePath, destPath);
                builder.install(destPath);
                builder.link(destPath);
                if (publish) {
                    builder.publish(destPath);
                }

                setTimeout(() => {
                    const baseDeletePath = path.join(configurationItem.buildPath,
                        configurationItem.contractNameServer);
                    const delPath = path.normalize(baseDeletePath + '/**/*.ts');
                    const delPathNegate = '!' + path.normalize(baseDeletePath + '/**/*.d.ts');
                    const methodusPath = path.normalize(baseDeletePath + '/node_modules/@methodus');

                    del([delPath, delPathNegate, methodusPath], { force: true }).then((paths) => {
                        // tslint:disable-next-line:no-console
                        console.log('Deleted files and folders:\n', paths.join('\n'));
                        process.exit();
                    }).catch((error) => {
                        // tslint:disable-next-line:no-console
                        console.error(error);
                        process.exit();
                    });
                }, 100);
                checkList.push(`${singleConfiguration}: ok`);
            }

        } catch (error) {
            checkList.push(`${singleConfiguration}: error`);
            // tslint:disable-next-line:no-console
            console.error(error);
        }
    });
    // tslint:disable-next-line:no-console
    console.log(checkList.join('\n'));
    // tslint:disable-next-line:no-console
    console.log('completed build plan, exiting.');

}
