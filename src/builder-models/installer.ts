const shelljs = require('shelljs');
import { HEADER, Configuration, KeysConfiguration, ModelConfiguration } from './interfaces';


export class Installer {
    shell: any;
    constructor() {
        this.shell = shelljs;
    }

    public build(destFolder) {
        const cwd = process.cwd();
        this.shell.cd(destFolder);
        try {
            let intsallResult = this.shell.exec('yarn').code
            console.log('----------------------------------------------------------------------');
            console.log('installing deps: ' + (intsallResult === 0));
            if (intsallResult !== 0) {
                throw (new Error('yarn error'));
            }
            let compileResult = this.shell.exec('tsc').code
            console.log('compiling generated code: ' + (compileResult === 0));
            console.log('----------------------------------------------------------------------');

            if (compileResult !== 0) {

                throw (new Error('tsc error'));
            }

            let prodInstallResult = this.shell.exec('yarn --production').code
            console.log('----------------------------------------------------------------------');
            console.log('installing production deps: ' + (prodInstallResult === 0));
            if (prodInstallResult !== 0) {
                throw (new Error('yarn error'));
            }
        } catch (error) {
            this.shell.cd(cwd);
            throw (error);
        } finally {
            this.shell.cd(cwd);
        }


    }


    public link(destFolder) {
        const cwd = process.cwd();
        this.shell.cd(destFolder);
        this.shell.exec('yarn unlink');

        if (this.shell.exec('yarn link').code !== 0) {
            this.shell.cd(cwd);
            throw (new Error('could not link contract'));
        }

        this.shell.cd(cwd);
    }
    public publish(destFolder) {
        const cwd = process.cwd();
        this.shell.cd(destFolder);
        if (this.shell.exec('npm publish').code !== 0) {
            this.shell.cd(cwd);
            throw (new Error('could not publish contract'));
        }
        this.shell.cd(cwd);
    }

}