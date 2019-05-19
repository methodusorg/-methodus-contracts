
import { Modelify } from './modelify';
import { UseTemplate, Exportify, ModelsIndex, UseCustomTemplate } from './exportify';
import { Installer } from './installer';
import { Clientify } from './clientify';
import { Configuration } from './interfaces';
import * as path from 'path';
import * as fs from 'fs';
import { Common } from './common';
const ROOTSRC = 'src';
const PKGJSON = 'package.json';
export class Client {
    modelify: Modelify;
    Installer: Installer;
    proxify: Clientify;
    constructor(configuration: Configuration, packageName: string, source: string, target: string) {

        this.Installer = new Installer();
        this.proxify = new Clientify(configuration, source, target);
        this.modelify = new Modelify(configuration, source, target, true);
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

        Common.commonFlow(configuration, this, packageName, target, source, true);

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
