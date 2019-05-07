import * as shelljs from 'shelljs';
const LINE = '----------------------------------------------------------------------';
export class Installer {
    shell: any;
    constructor() {
        this.shell = shelljs;
    }

    public build(destFolder) {
        const cwd = process.cwd();
        this.shell.cd(destFolder);
        try {
            const intsallResult = this.shell.exec('npm install').code;
            console.log(LINE);
            console.log('Completed npm install: ' + (intsallResult === 0));
            if (intsallResult !== 0) {
                throw (new Error('npm error'));
            }
            const compileResult = this.shell.exec('tsc').code;
            console.log('Compiled generated code: ' + (compileResult === 0));
            console.log(LINE);

            if (compileResult !== 0) {
                throw (new Error('tsc error'));
            }

            const prodInstallResult = this.shell.exec('npm install --production').code;
            console.log(LINE);
            console.log('Shaking devDependencies: ' + (prodInstallResult === 0));
            if (prodInstallResult !== 0) {
                throw (new Error('npm error'));
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
        this.shell.exec('npm unlink');

        if (this.shell.exec('npm link').code !== 0) {
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
