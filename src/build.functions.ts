import { Configuration, KeysConfiguration } from './builder-models/interfaces';
import * as path from 'path';
import * as colors from 'colors';
import * as rimraf from 'rimraf';
import { Client } from './builder-models/client';
import { Common } from './builder-models/common';
import { Server } from './builder-models/server';

const Console = console;

process.env.NODE_CONFIG_DIR = path.join(process.cwd(), 'config');

export async function Builder(contract?: string, isClient: boolean = false) {
    let buildConfiguration: Configuration | KeysConfiguration;

    Console.log(colors.blue(`> methodus ${isClient ? 'client' : 'server'} contract builder.`));
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
    await build(buildConfiguration, checkList, isClient, publish);
    Console.log(checkList.join('\n'));

    Console.log('completed build plan, exiting.');
    return true;
}



async function singleBuild(configurationItem, destPath, isClient, checkList: string[]) {

    let sourcePath = process.cwd();
    if (!configurationItem.buildPath) {
        configurationItem.buildPath = '../../';
    }

    if (configurationItem.path) {
        sourcePath = path.resolve(configurationItem.path);
    }

    Console.log(colors.cyan('> source:'), sourcePath);

    //delete the src folder
    rimraf.sync(path.join(destPath, 'src'));

    Console.log(colors.cyan('> target:'), destPath);
    try {
        if (configurationItem !== null) {
            let builder: any = null;
            if (isClient) {
                builder = new Client(configurationItem,
                    sourcePath, destPath);

            } else {
                builder = new Server(configurationItem, '', sourcePath, destPath);

            }

            const targetProject = Common.newCommonFlow(configurationItem, '', destPath, sourcePath, isClient);
            await targetProject.project.emit();
            return builder;
        }

    } catch (error) {
        checkList.push(`${configurationItem}: error`);

        Console.error(error);
    }
    return null;

}

async function postBuild(destPath, checkList, builder, singleConfiguration, publish) {

    if (!process.env.KEEP_SRC) {
        rimraf.sync(path.join(destPath, 'src'));
    }

    if (publish) {
        builder.publish(destPath);
    }

    checkList.push(`${singleConfiguration}: ok`);
}

async function build(buildConfiguration: any, checkList: string[], isClient: boolean, publish: boolean) {
    for (const singleConfiguration of Object.keys(buildConfiguration)) {

        const configurationItem = buildConfiguration[singleConfiguration];
        Console.log(colors.green(` > ${singleConfiguration}`));

        const destPath = path.resolve(path.join(configurationItem.buildPath, isClient ? configurationItem.contractNameClient : configurationItem.contractNameServer));
        const builder = await singleBuild(configurationItem, destPath, isClient, checkList);
        try {
            await postBuild(destPath, checkList, builder, singleConfiguration, publish);
        } catch (error) {
            console.error(error)
        }
    };
    return true;
}

