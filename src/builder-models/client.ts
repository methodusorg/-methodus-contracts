
import { Modelify } from './modelify';
import { UseTemplate, Exportify, ModelsIndex, UseCustomTemplate } from './exportify';
import { Installer } from './installer';
import { Clientify } from './clientify';
import { HEADER, Configuration, KeysConfiguration, ModelConfiguration } from './interfaces';
import * as path from 'path';
import * as colors from 'colors';
import * as fs from 'fs';





export class Client {
    modelify: Modelify;

    Installer: Installer;
    clientify: Clientify;
    constructor(configuration: Configuration, packageName: string, source: string, target: string) {
        //this.modelify = new Modelify(configuration, source, target);

        this.Installer = new Installer();
        this.clientify = new Clientify(configuration, source, target);
        this.modelify = new Modelify(configuration, source, target, true);
        for (let modelKey in configuration.models) {
            const model = configuration.models[modelKey];
            this.modelify.ProxifyFromModel(model.path, modelKey, packageName);
        }


        for (let contractKey in configuration.contracts) {
            const contract = configuration.contracts[contractKey];
            this.clientify.ProxifyFromFile(contract.path, contractKey, packageName)
        }

        for (let contractKey in configuration.includes) {
            const contract = configuration.includes[contractKey];
            this.clientify.CopyFromFile(contract.path, contractKey, packageName);
        }

        Exportify(configuration, target, packageName, true);

        let originalPackage = require(path.join(source, 'package.json'));
        UseTemplate('_package.client.json', 'package.json', target, { name: configuration.contractNameClient, version: originalPackage.version })
        UseTemplate('_tsconfig.client.json', 'tsconfig.json', target, { name: configuration.contractNameClient, version: originalPackage.version })
        UseTemplate('_.gitignore', '.gitignore', target);
        UseTemplate('_.npmignore', '.npmignore', target);
        if (configuration.npmrc) {
            UseCustomTemplate(path.join(source, configuration.npmrc), '.npmrc', target);
        } else {
            UseTemplate('_.npmrc', '.npmrc', target);
        }


        //add, dependencies: configuration.dependencies
        //load package.json
        if (configuration.dependencies) {
            const packageData = require(path.join(target, 'package.json'));
            packageData.dependencies = configuration.dependencies;
            Object.keys(packageData.dependencies).forEach((key) => {
                packageData.dependencies[key.replace('@tmla-contracts/', '@tmla-client/')] = packageData.dependencies[key];
                delete packageData.dependencies[key];
            })
            fs.writeFileSync(path.join(path.join(target, 'package.json')), JSON.stringify(packageData, null, 2));

        }


        ModelsIndex(configuration, source, path.join(target, 'models'), packageName);

    }
    public link(dest) {
        this.Installer.link(dest);
    }

    public publish(dest) {
        this.Installer.publish(dest);
    }
    public install(dest) {
        this.Installer.build(dest);
    }
}