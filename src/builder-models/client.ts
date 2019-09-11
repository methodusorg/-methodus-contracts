
import { UseTemplate, ModelsIndex, UseCustomTemplate } from './exportify';
import { Installer } from './installer';
import { Configuration } from './interfaces';
import * as path from 'path';
import * as fs from 'fs';
import { Common } from './common';
const ROOTSRC = 'src';
const PKGJSON = 'package.json';
export class Client {
    Installer: Installer;
    constructor(configuration: Configuration, source: string, target: string) {

        this.Installer = new Installer();
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
    public compile(dest) {
        this.Installer.compile(dest);
    }

    public prune(dest) {
        this.Installer.prune(dest);
    }


}
