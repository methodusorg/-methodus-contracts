import * as shelljs from 'shelljs';

const LINE = '----------------------------------------------------------------------';
const Console = console;
export class Installer {
    shell: any;
    constructor() {
        this.shell = shelljs;
    }


    public prune(destFolder) {
        this.shell.cd(destFolder);
        let commandStr = 'npm install --production --ignore-scripts';
        if (process.env.YARN) {
            commandStr = 'yarn install --production --ignore-scripts';
        }

        const intsallResult = this.shell.exec(commandStr).code;
        Console.log(LINE);
        Console.log('Completed prune: ' + (intsallResult === 0));
        if (intsallResult !== 0) {
            throw (new Error('install error'));
        }

    }

    public compile(destFolder) {
        this.shell.cd(destFolder);
        const execRes = this.shell.exec('tsc -p tsconfig.json');
        const compileResult = execRes.code;
        Console.log('Compiled generated code: ' + (compileResult === 0));

        if (compileResult !== 0) {
            console.error('tsc Error', compileResult);
        }
    }


    public build(destFolder) {
        const cwd = process.cwd();
        this.shell.cd(destFolder);

        let commandStr = 'npm install';
        if (process.env.YARN) {
            commandStr = 'yarn install';
        }

        const intsallResult = this.shell.exec(commandStr).code;
        Console.log(LINE);
        Console.log('Completed yarn install: ' + (intsallResult === 0));
        if (intsallResult !== 0) {
            throw (new Error('yarn error'));
        }
        this.shell.cd(cwd);
         
    }

    public link(destFolder) {
        const cwd = process.cwd();
        this.shell.cd(destFolder);
        let commandStr = 'npm unlink';
        if (process.env.YARN) {
            commandStr = 'yarn unlink';
        }


        this.shell.exec(commandStr);

        commandStr = 'npm link';
        if (process.env.YARN) {
            commandStr = 'yarn link';
        }

        if (this.shell.exec(commandStr).code !== 0) {
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

        if (this.shell.exec(commandStr).code !== 0) {
            this.shell.cd(cwd);
            throw (new Error('could not publish contract'));
        }
        this.shell.cd(cwd);
    }
}
