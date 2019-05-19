import * as path from 'path';
import * as fs from 'fs';
import * as shell from 'shelljs';
import { HEADER, Configuration } from './interfaces';
import { Common } from './common';
import { Helper } from '../helper';
const ROOTSRC = 'src';
const Console = console;

export class Clientify {
    configuration: Configuration;
    source: string;
    target: string;
    constructor(configuration: Configuration, source, target) {
        this.source = source;
        this.target = target;
        this.configuration = configuration;
    }

    ProxifyFromFile(controllerPath: any, className: string, packageName?: string) {
        const content = fs.readFileSync(path.join(this.source, controllerPath), 'utf-8');

        shell.mkdir('-p', this.target);
        Console.log('> Generating client contract:', className, packageName);
        let fileHead =
            `import * as M from '@methodus/client';
import { MethodResult } from '@methodus/client';
`;

        /*start custom*/
        const startCustom = content.indexOf('/*start custom*/');
        const endCustom = content.indexOf('/*end custom*/');
        if (startCustom > 0) {
            fileHead += content.substring(startCustom, endCustom);
        }

        if (this.configuration.models) {
            const keys = Object.keys(this.configuration.models);
            fileHead += `import { ${keys.map((elem: string) => {
                return (elem.endsWith('Model') ? elem : elem + 'Model');
            }).join(',')} } from '../';\n`;
        }

        if (this.configuration.includes) {
            Object.keys(this.configuration.includes).forEach((modelKey: string) => {
                const currentBindingInclude = this.configuration.includes[modelKey];
                if (currentBindingInclude.path.indexOf('.ts') > -1) {
                    if (!currentBindingInclude.alias) {
                        fileHead += `import { ${modelKey} } from '../';\n`;
                    } else {
                        fileHead += `import * as ${currentBindingInclude.alias} from '../';\n`;
                    }
                }
            });
        }

        if (packageName) {
            fileHead = fileHead.replace(/\.\.\/\.\.\//g, packageName + '/');
        }

        const classMarker = Common.getClassMarker(content);
        let classDefinition = classMarker + ' {\n';
        classDefinition = classDefinition.replace(/\@MethodConfigBase/g, '@M.MethodConfigBase');
        classDefinition = classDefinition.replace(/\@MethodConfig/g, '@M.MethodConfig');
        classDefinition = classDefinition.replace(/, \[.*?\]/g, '');
        classDefinition += `\n public static base: string;`;

        const classBody = Common.handleMethods(content);

        const fullPath = path.join(this.target, ROOTSRC, 'contracts', `${className.toLocaleLowerCase()}.ts`);
        shell.mkdir('-p', path.join(this.target, ROOTSRC, 'contracts'));
        fs.writeFileSync(fullPath, `${HEADER}${fileHead}${classDefinition}${classBody} \n    }\n`);
    }

}
