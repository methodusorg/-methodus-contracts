import * as path from 'path';
import * as fs from 'fs';
import * as shell from 'shelljs';
import { HEADER, Configuration } from './interfaces';

export class Clientify {
    configuration: Configuration;
    source: string;
    target: string;
    constructor(configuration: Configuration, source, target) {
        this.source = source;
        this.target = target;
        this.configuration = configuration;
    }
    capitalize(str) {
        str = str.toLowerCase();
        return str[0].toUpperCase() + str.substr(1);
    }

    splice(str, start, delCount, newSubStr) {
        return str.slice(0, start) + newSubStr + str.slice(start + Math.abs(delCount));
    }

    CopyFromFile(controllerPath: any, className: string, packageName?: string) {

        const content = fs.readFileSync(path.join(this.source, controllerPath), 'utf-8');
        shell.mkdir('-p', this.target);
        console.log('> Copying file:', className, packageName);
        const fullPath = path.join(this.target, 'includes', `${className.toLocaleLowerCase()}.ts`);
        shell.mkdir('-p', path.join(this.target, 'includes'));
        fs.writeFileSync(fullPath, `${HEADER}${content}\n`);

    }

    ProxifyFromFile(controllerPath: any, className: string, packageName?: string) {
        const content = fs.readFileSync(path.join(this.source, controllerPath), 'utf-8');

        shell.mkdir('-p', this.target);
        console.log('> Generating client contract:', className, packageName);
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
                if (!currentBindingInclude.alias) {
                    fileHead += `import { ${modelKey} } from '../';\n`;
                } else {
                    fileHead += `import * as ${currentBindingInclude.alias} from '../';\n`;
                }
            });
        }

        if (packageName) {
            fileHead = fileHead.replace(/\.\.\/\.\.\//g, packageName + '/');
        }

        let indexOfMethodConfig = content.indexOf('@MethodConfigBase(');
        if (indexOfMethodConfig === -1) {
            indexOfMethodConfig = content.indexOf('@MethodConfig(');
        }

        let classMarker = content.substring(indexOfMethodConfig, content.indexOf('{', indexOfMethodConfig));

        const classRows = classMarker.split('\n');

        if (classRows[0].indexOf(',') > -1) {
            const arr = classRows[0].split(',');
            classRows[0] = arr[0] + arr[arr.length - 1].substr(arr[arr.length - 1].indexOf(')'));
        }
        classMarker = classRows.join('\n');

        let classDefinition = classMarker + ' {\n';
        classDefinition = classDefinition.replace(/\@MethodConfigBase/g, '@M.MethodConfigBase');
        classDefinition = classDefinition.replace(/\@MethodConfig/g, '@M.MethodConfig');
        classDefinition = classDefinition.replace(/, \[.*?\]/g, '');
        classDefinition += `\n public static base: string;`;
        let methodResult = `return new M.MethodResult({} as any);`;

        let classBody = '';
        const regex = /\/\*\*\s*\n([^\*]*(\*[^\/])?)*\*\/|@MethodMock\(.*\)|@Method\(.*\)|public (.|\n|\r)*? {/g;
        const mockRegex = /@MethodMock\((.*)\)/;
        let m;
        const mocksAndMethods = {};
        let Tuple: any = {};

        // tslint:disable-next-line:no-conditional-assignment
        while ((m = regex.exec(content)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (m.index === regex.lastIndex) {
                regex.lastIndex++;
            }
            m.forEach((match, groupIndex) => {

                if (!match) {
                    return;
                }

                if (match.indexOf('/*') === 0) {
                    Tuple.comment = match;
                }

                if (match.indexOf('@MethodMock') === 0) {
                    Tuple.mock = `${mockRegex.exec(match)[1]}`;
                }

                if (match.indexOf('@Method(') === 0) {
                    Tuple.method = match;
                }
                if (match.indexOf('public') === 0) {
                    Tuple.contract = match;
                    mocksAndMethods[Tuple.method] = Tuple;
                    Tuple = {};
                }
            });
        }

        Object.values(mocksAndMethods).forEach((tuple: any) => {
            if (tuple.comment) {
                classBody += `\n  ${tuple.comment}`;
            }
            if (tuple.mock) {
                const str = tuple.contract.split('@');
                const args = str.map((param) => {
                    if (param.indexOf(':') === -1) {
                        return;
                    }
                    return param.split(')')[1].split(':')[0];
                }).join(', ');
                tuple.result = `

                return new Promise<any>(function (resolve, reject) {
                    resolve(${tuple.mock}.apply(this, [${args}]));
                });`;

            }
            if (tuple.method) {
                const resultRegex = /(\<.*\>)./;
                const mo = resultRegex.exec(tuple.contract);
                if (!mo) {
                    throw (new Error('all methods should return a promise of MethodResult object'));
                }
                if (mo.length > 1) {
                    let returnType = mo[1];
                    if (returnType.startsWith('<')) {
                        returnType = returnType.substr(1, returnType.length - 2);
                    }
                    let finalType = returnType;
                    const innerTypeRegex = /\<(.*)\>/;
                    const mox = innerTypeRegex.exec(returnType);
                    if (mox && mox.length > 1) {
                        finalType = mox[1];
                    } else {
                        finalType = 'any';
                    }
                    methodResult = `return {} as ${finalType};`;
                    tuple.contract = tuple.contract.replace(returnType, finalType);
                }
                // tslint:disable-next-line:max-line-length
                classBody += `\n  ${tuple.method}\n    ${tuple.contract}\n        ${(tuple.result ? tuple.result : methodResult)}
        }
        `;
            }
        });

        const replaceList = ['Method', 'Param', 'Proxy', 'MethodConfig',
            'MethodConfigBase', 'Body', 'Query', 'Response', 'Request', 'Files',
            'Cookies', 'Headers', 'MethodResult', 'MethodError'];
        classBody = classBody.replace(/\Verbs./g, 'M.Verbs.');
        classBody = classBody.replace(/, \[.*?\]/g, '');
        classBody = classBody.replace(/, @SecurityContext\(\) securityContext: any/g, '');
        replaceList.forEach((value: string) => {
            classBody = classBody.replace(new RegExp('@' + value, 'g'), '@M.' + value);
        });

        const fullPath = path.join(this.target, 'contracts', `${className.toLocaleLowerCase()}.ts`);
        shell.mkdir('-p', path.join(this.target, 'contracts'));
        fs.writeFileSync(fullPath, `${HEADER}${fileHead}${classDefinition}${classBody} \n    }\n`);
    }
}
