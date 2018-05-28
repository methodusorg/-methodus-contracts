import { Client } from './builder-models/client';
import { Configuration, KeysConfiguration } from './builder-models/interfaces';
import * as path from 'path';
import * as colors from 'colors';

process.env.NODE_CONFIG_DIR = path.join(process.cwd(), 'config');


export function ClientBuilder() {

    var buildConfiguration = null;
    // process.argv.forEach((val, index) => {
    //     console.log(`${index}: ${val}`);
    // });

    console.log(colors.blue('> methodus client contract builder.'));
    let publish = false;
    if (process.argv.length === 2) {
        buildConfiguration = <Configuration>require('../build.json');
    }
    else {
        let filePath = path.resolve(path.join(process.cwd(), process.argv[2]))
        console.log(colors.green('> loading build configuration from:'), filePath);
        buildConfiguration = <KeysConfiguration>require(filePath);
        // singleTarget = process.argv[3];
        publish = process.argv[3] === '-p' || publish;
    }

    let checkList = [];
    Object.keys(buildConfiguration).forEach(singleConfiguration => {
        const configurationItem = buildConfiguration[singleConfiguration];
        
        
        console.log(colors.green(`> ${singleConfiguration}`));
        try {
            let sourcePath = process.cwd();
            if (!configurationItem.buildPath)
                configurationItem.buildPath = '../../';

            if (configurationItem.path) {
                sourcePath = path.resolve(configurationItem.path);
            }

            const destPath = path.resolve(path.join(configurationItem.buildPath, configurationItem.contractNameClient));

            console.log(colors.cyan('> source:'), sourcePath);
            console.log(colors.cyan('> target:'), destPath);


            const builder = new Client(buildConfiguration[singleConfiguration], singleConfiguration, sourcePath, destPath);
            builder.install(destPath);
            builder.link(destPath);
            if (publish) {
                builder.publish(destPath);
            }
            checkList.push(`${singleConfiguration}: ok`);
        } catch (error) {
            checkList.push(`${singleConfiguration}: error`);
            console.error(error);
        }

    })
    console.log(checkList.join('\n'));
    console.log('completed build plan, exiting.');


}