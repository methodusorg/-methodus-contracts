import { Proxify } from './proxify';
import { Modelify } from './modelify';
import { UseTemplate, Exportify, ModelsIndex } from './exportify';
import { Installer } from './installer';
import { HEADER, Configuration, KeysConfiguration, ModelConfiguration } from './interfaces';

import * as path from 'path';
import * as colors from 'colors';
import * as fs from 'fs';
 

export class Server {
    modelify: Modelify;
    proxify: Proxify;
    Installer: Installer;

    constructor(configuration: Configuration, packageName: string, source: string, target: string) {
        this.modelify = new Modelify(configuration, source, target);
        this.proxify = new Proxify(configuration, source, target);
        this.Installer = new Installer();

        for (let modelKey in configuration.models) {
            const model = configuration.models[modelKey];
            this.modelify.ProxifyFromModel(model.path, modelKey, packageName);
        }

        for (let contractKey in configuration.contracts) {
            const contract = configuration.contracts[contractKey];
            this.proxify.ProxifyFromFile(contract.path, contractKey, packageName);

        }    

        for (let contractKey in configuration.bindings) {
            const contract = configuration.bindings[contractKey];
            this.proxify.ProxifyFromBinding(contract.path, contractKey, packageName);
        }

        for (let contractKey in configuration.includes) {
            const contract = configuration.includes[contractKey];
            this.proxify.CopyFromFile(contract.path, contractKey, packageName);
        }
        for (let contractKey in configuration.declarations) {
            const contract = configuration.declarations[contractKey];
            this.proxify.CopyFromFile(contract.path, contractKey, packageName);
        }

        Exportify(configuration, target, packageName);

        let originalPackage = require(path.join(source, 'package.json'));
        UseTemplate('_package.json', 'package.json', target, { name: configuration.contractNameServer, version: originalPackage.version });
        UseTemplate('_tsconfig.json', 'tsconfig.json', target, { name: configuration.contractNameServer, version: originalPackage.version });
        UseTemplate('_.gitignore', '.gitignore', target);
        UseTemplate('_.npmignore', '.npmignore', target);
        UseTemplate('_.npmrc', '.npmrc', target);

        //add, dependencies: configuration.dependencies
        //load package.json
        if (configuration.dependencies) {
            const packageData = require(path.join(target, 'package.json'));
            packageData.dependencies = configuration.dependencies;
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