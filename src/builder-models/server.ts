import { Proxify } from './proxify';
import { Modelify } from './modelify';
import { UseTemplate, Exportify, ModelsIndex, UseCustomTemplate } from './exportify';
import { Installer } from './installer';
import { Configuration } from './interfaces';

import * as path from 'path';
import * as fs from 'fs';
import { Common } from './common';
const PKGJSON = 'package.json';
const ROOTSRC = 'src';

export class Server {
    modelify: Modelify;
    proxify: Proxify;
    Installer: Installer;

    constructor(configuration: Configuration, packageName: string, source: string, target: string) {
        this.modelify = new Modelify(configuration, source, target);
        this.proxify = new Proxify(configuration, source, target);
        this.Installer = new Installer();

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

        Common.commonFlow(configuration, this, packageName, target, source, false);

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
