import * as shelljs from 'shelljs';
import * as exec from 'shelljs.exec';
import * as rimraf from 'rimraf';
import * as path from 'path';

const LINE = '----------------------------------------------------------------------';
const Console = console;
export class Installer {
    shell: any;
    constructor() {
        this.shell = shelljs;
    }


    // public prune(destFolder) {
    //     this.shell.cd(destFolder);
    //     rimraf.sync(path.join(destFolder, 'node_modules','*'));
    //     rimraf.sync(path.join(destFolder, 'node_modules','.bin'));
        
    //     let commandStr = 'npm install --production --ignore-scripts --no-package-lock';
    //     if (process.env.YARN) {
    //         commandStr = 'yarn install --production --ignore-scripts';
    //     }

    //     const intsallResult = exec(commandStr).code;
    //     Console.log(LINE);
    //     Console.log('Completed prune: ' + (intsallResult === 0));
    //     if (intsallResult !== 0) {
    //         throw (new Error('install error'));
    //     }

    // }

    // public compile(destFolder) {
    //     console.log(`>>>> compile`);
    //     this.shell.cd(destFolder);
    //     rimraf.sync(path.join(destFolder, 'build'));
    //     console.log(`>>>> rimraf`);
    //     const execRes = exec('npm run compile');
    //     const compileResult = execRes.code;
    //     if (execRes.stderr) {
    //         console.warn('error', execRes.stderr);
    //     }

    //     console.log(`>>>> stderr ${execRes.stderr}`);

    //     Console.log('Compiled generated code: ' + (compileResult === 0));

    //     if (compileResult !== 0) {
    //         throw (new Error(execRes.stderr));
    //     }
    // }


    // public build(destFolder) {
    //     const cwd = process.cwd();
    //     this.shell.cd(destFolder);

    //     let commandName = 'npm';
    //     let commandStr = 'npm install --no-package-lock';
    //     if (process.env.YARN) {
    //         commandStr = 'yarn install';
    //         commandName = 'yarn';
    //     }

    //     const intsallResult = exec(commandStr);
    //     Console.log(LINE);
    //     Console.log(`Completed ${commandName} install: ` + (intsallResult.code === 0));
    //     if (intsallResult.code !== 0) {
    //         throw (new Error(`${commandName} error ${intsallResult.stderr}`));
    //     }
    //     this.shell.cd(cwd);

    // }

    public link(destFolder) {
        const cwd = process.cwd();
        this.shell.cd(destFolder);
        let commandStr = 'npm unlink';
        if (process.env.YARN) {
            commandStr = 'yarn unlink';
        }


        exec(commandStr);

        commandStr = 'npm link';
        if (process.env.YARN) {
            commandStr = 'yarn link';
        }

        if (exec(commandStr).code !== 0) {
            this.shell.cd(cwd);
            throw (new Error('could not link contract'));
        }

        this.shell.cd(cwd);
    }

    public publish(destFolder) {
        const cwd = process.cwd();
        this.shell.cd(destFolder);

        let commandStr = 'npm publish';
        if (process.env.YARN) {
            commandStr = 'yarn publish';
        }

        if (exec(commandStr).code !== 0) {
            this.shell.cd(cwd);
            throw (new Error('could not publish contract'));
        }
        this.shell.cd(cwd);
    }
}
