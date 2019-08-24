import * as shelljs from 'shelljs';
const LINE = '----------------------------------------------------------------------';
const Console = console;
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
            Console.log(LINE);
            Console.log('Completed npm install: ' + (intsallResult === 0));
            if (intsallResult !== 0) {
                throw (new Error('npm error'));
            }

            const deleteBuildResult = this.shell.exec('rm -rf ./build').code;
            Console.log('Deleted build folder: ' + (deleteBuildResult === 0));


            const compileResult = this.shell.exec('tsc').code;
            Console.log('Compiled generated code: ' + (compileResult === 0));

            if (compileResult !== 0) {
                console.error('tsc Error', compileResult);
            }



            const deleteSrcResult = this.shell.exec('rm -rf ./src').code;
            Console.log('Deleted src folder: ' + (deleteSrcResult === 0));
            Console.log(LINE);

            if (deleteSrcResult !== 0) {
                console.error('delete Error');
            }

            const prodInstallResult = this.shell.exec('npm prune --production').code;
            Console.log(LINE);
            Console.log('Shaking devDependencies: ' + (prodInstallResult === 0));
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
