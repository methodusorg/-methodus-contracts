import { Proxify } from './proxify';
import { Modelify } from './modelify';
import { UseTemplate, Exportify, ModelsIndex, UseCustomTemplate } from './exportify';
import { Installer } from './installer';
import { Configuration } from './interfaces';

import * as path from 'path';
import * as fs from 'fs';
const PKGJSON = 'package.json';

export class Server {
    modelify: Modelify;
    proxify: Proxify;
    Installer: Installer;

    constructor(configuration: Configuration, packageName: string, source: string, target: string) {
        this.modelify = new Modelify(configuration, source, target);
        this.proxify = new Proxify(configuration, source, target);
        this.Installer = new Installer();

        if (configuration.models) {
            Object.keys(configuration.models).forEach((modelKey) => {
                const model = configuration.models[modelKey];
                this.modelify.ProxifyFromModel(model.path, modelKey, packageName);
            });
        }

        if (configuration.contracts) {
            Object.keys(configuration.contracts).forEach((contractKey) => {
                const contract = configuration.contracts[contractKey];
                this.proxify.ProxifyFromFile(contract.path, contractKey, packageName);

            });
        }

        if (configuration.bindings) {
            Object.keys(configuration.bindings).forEach((contractKey) => {
                const contract = configuration.bindings[contractKey];
                this.proxify.ProxifyFromBinding(contract.path, contractKey, packageName);
            });
        }

        if (configuration.includes) {
            Object.keys(configuration.includes).forEach((contractKey) => {
                const contract = configuration.includes[contractKey];
                this.proxify.CopyFromFile(contract.path, contractKey, packageName);
            });
        }

        if (configuration.declarations) {
            Object.keys(configuration.declarations).forEach((contractKey) => {
                const contract = configuration.declarations[contractKey];
                this.proxify.CopyFromFile(contract.path, contractKey, packageName);
            });
        }

        Exportify(configuration, target, packageName);

        const originalPackage = require(path.join(source, PKGJSON));
        UseTemplate('_package.json', PKGJSON, target,
            { name: configuration.contractNameServer, version: originalPackage.version });
        UseTemplate('_tsconfig.json', 'tsconfig.json', target,
            { name: configuration.contractNameServer, version: originalPackage.version });
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
