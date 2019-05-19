import { Client } from './builder-models/client';
import { Configuration, KeysConfiguration } from './builder-models/interfaces';
import * as path from 'path';
import * as colors from 'colors';
const Console = console;

process.env.NODE_CONFIG_DIR = path.join(process.cwd(), 'config');

export async function ClientBuilder(contract?: string) {
    let buildConfiguration: Configuration | KeysConfiguration;

    Console.log(colors.blue('> methodus client contract builder.'));
    let publish = false;
    if (contract) {
        buildConfiguration = require(contract) as Configuration;
    } else {
        const filePath = path.resolve(path.join(process.cwd(), process.argv[2]));
        Console.log(colors.green('> loading build configuration from:'), filePath);
        buildConfiguration = require(filePath) as KeysConfiguration;

        publish = process.argv[3] === '-p' || publish;
    }

    const checkList: string[] = [];
    Object.keys(buildConfiguration).forEach(async (singleConfiguration) => {
        const configurationItem = buildConfiguration[singleConfiguration];
        Console.log(colors.green(`> ${singleConfiguration}`));
        try {
            let sourcePath = process.cwd();
            if (!configurationItem.buildPath) {
                configurationItem.buildPath = '../../';
            }

            if (configurationItem.path) {
                sourcePath = path.resolve(configurationItem.path);
            }

            const destPath = path.resolve(path.join(configurationItem.buildPath, configurationItem.contractNameClient));

            Console.log(colors.cyan('> source:'), sourcePath);

            Console.log(colors.cyan('> target:'), destPath);

            const builder = new Client(buildConfiguration[singleConfiguration],
                singleConfiguration, sourcePath, destPath);
            builder.install(destPath);

            if (publish) {
                builder.publish(destPath);
            }

            checkList.push(`${singleConfiguration}: ok`);
        } catch (error) {
            checkList.push(`${singleConfiguration}: error`);
            Console.error(error);
        }

    });
    Console.log(checkList.join('\n'));
    Console.log('completed build plan, exiting.');
}
