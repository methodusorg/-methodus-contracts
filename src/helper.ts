import * as path from 'path';
import * as fs from 'fs';
import * as shell from 'shelljs';
import { HEADER, Configuration } from './builder-models/interfaces';

export class Helper {
    /**
     *
     */
    static source;
    static target;
    public static CopyFromFile(controllerPath: any, className: string, packageName?: string) {

        const content = fs.readFileSync(path.join(this.source, controllerPath), 'utf-8');
        shell.mkdir('-p', this.target);
        console.log('> Copying file:', className, packageName);

        // get the extension
        const arr = controllerPath.split('.');
        const ext = arr[arr.length - 1];

        const fullPath = path.join(this.target, 'includes', `${className.toLocaleLowerCase()}.${ext}`);
        shell.mkdir('-p', path.join(this.target, 'includes'));
        fs.writeFileSync(fullPath, `${HEADER}${content}\n`);

    }
}
