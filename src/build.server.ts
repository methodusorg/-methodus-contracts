import { Server } from './builder-models/server';
import { Configuration, KeysConfiguration } from './builder-models/interfaces';
import * as path from 'path';
import * as colors from 'colors';
const Console = console;

process.env.NODE_CONFIG_DIR = path.join(process.cwd(), 'config');

export async function ServerBuilder(contract?: string) {

    let serverBuildConfiguration: Configuration | KeysConfiguration;

    Console.log(colors.blue('> methodus server contract builder.'));
    let publish = false;
    if (contract) {
        serverBuildConfiguration = require(contract) as Configuration;
    } else {
        const filePath = path.resolve(path.join(process.cwd(), process.argv[2]));

        Console.log(colors.green('> loading server build configuration from:'), filePath);
        serverBuildConfiguration = require(filePath) as KeysConfiguration;

        publish = process.argv[3] === '-p' || publish;
    }

    if (!serverBuildConfiguration) {
        throw (new Error('fatal error, no configuration found'));

    }
    const checkList: string[] = [];
    await build(serverBuildConfiguration, checkList, publish);
    Console.log(checkList.join('\n'));

    Console.log('completed server build plan, exiting.');
    return true;
}

async function build(buildConfiguration: any, checkList: string[], publish: boolean) {
    Object.keys(buildConfiguration).forEach((singleConfiguration) => {
        const configurationItem = buildConfiguration[singleConfiguration];

        Console.log(colors.green(` > ${singleConfiguration}`));

        let sourcePath = process.cwd();
        if (!configurationItem.buildPath) {
            configurationItem.buildPath = '../../';
        }

        if (configurationItem.path) {
            sourcePath = path.resolve(configurationItem.path);
        }

        const destPath = path.resolve(path.join(configurationItem.buildPath, configurationItem.contractNameServer));

        Console.log(colors.cyan('> source:'), sourcePath);

        Console.log(colors.cyan('> target:'), destPath);
        try {
            if (buildConfiguration !== null) {
                const builder = new Server(buildConfiguration[singleConfiguration],
                    singleConfiguration, sourcePath, destPath);
                builder.install(destPath);

                if (publish) {
                    builder.publish(destPath);
                }

                checkList.push(`${singleConfiguration}: ok`);
            }

        } catch (error) {
            checkList.push(`${singleConfiguration}: error`);

            Console.error(error);
        }
    });
    return true;
}
