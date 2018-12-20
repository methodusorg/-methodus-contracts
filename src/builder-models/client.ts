
import { Modelify } from './modelify';
import { UseTemplate, Exportify, ModelsIndex, UseCustomTemplate } from './exportify';
import { Installer } from './installer';
import { Clientify } from './clientify';
import { Configuration } from './interfaces';
import * as path from 'path';
import * as fs from 'fs';

const PKGJSON = 'package.json';
export class Client {
    modelify: Modelify;
    Installer: Installer;
    clientify: Clientify;
    constructor(configuration: Configuration, packageName: string, source: string, target: string) {

        this.Installer = new Installer();
        this.clientify = new Clientify(configuration, source, target);
        this.modelify = new Modelify(configuration, source, target, true);

        if (configuration.models) {
            Object.keys(configuration.models).forEach((modelKey) => {
                const model = configuration.models[modelKey];
                this.modelify.ProxifyFromModel(model.path, modelKey, packageName);
            });
        }

        if (configuration.contracts) {
            Object.keys(configuration.contracts).forEach((contractKey) => {
                const contract = configuration.contracts[contractKey];
                this.clientify.ProxifyFromFile(contract.path, contractKey, packageName);
            });
        }
        if (configuration.includes) {
            Object.keys(configuration.includes).forEach((contractKey) => {
                const contract = configuration.includes[contractKey];
                this.clientify.CopyFromFile(contract.path, contractKey, packageName);
            });
        }
        Exportify(configuration, target, packageName, true);

        const originalPackage = require(path.join(source, PKGJSON));
        UseTemplate('_package.client.json', PKGJSON, target,
            { name: configuration.contractNameClient, version: originalPackage.version });
        UseTemplate('_tsconfig.client.json', 'tsconfig.json', target,
            { name: configuration.contractNameClient, version: originalPackage.version });
        UseTemplate('_.gitignore', '.gitignore', target);
        UseTemplate('_.npmignore', '.npmignore', target);
        if (configuration.npmrc) {
            UseCustomTemplate(path.join(source, configuration.npmrc), '.npmrc', target);
        } else {
            UseTemplate('_.npmrc', '.npmrc', target);
        }

        if (configuration.dependencies) {
            const packageData = require(path.join(target, PKGJSON));
            packageData.dependencies = configuration.dependencies;
            fs.writeFileSync(path.join(path.join(target, PKGJSON)), JSON.stringify(packageData, null, 2) + '\n');
        }
        ModelsIndex(configuration, source, path.join(target, 'models'), packageName);
    }
    public link(dest: string) {
        this.Installer.link(dest);
    }

    public publish(dest: string) {
        this.Installer.publish(dest);
    }
    public install(dest: string) {
        this.Installer.build(dest);
    }
}
