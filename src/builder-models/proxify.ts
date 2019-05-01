
import * as path from 'path';
import * as fs from 'fs';
import * as shell from 'shelljs';
import { HEADER, Configuration } from './interfaces';
import { Helper } from '../helper';

export class Proxify {
    configuration: Configuration;
    source: string;
    target: string;
    constructor(configuration: Configuration, source, target) {
        this.source = source;
        this.target = target;
        this.configuration = configuration;
    }

    CopyFromFile(controllerPath: any, className: string, packageName?: string) {
        Helper.CopyFromFile.bind(this)(controllerPath, className, packageName);
    }

    ProxifyFromFile(controllerPath: any, className: string, packageName?: string) {
        // read controller file
        const content = fs.readFileSync(path.join(this.source, controllerPath), 'utf-8');
        shell.mkdir('-p', this.target);
        console.log('> Generating contract:', className, packageName);

        // tslint:disable-next-line:max-line-length
        let fileHead = `import { Proxy, Method, MethodPipe, MethodConfig, MethodConfigBase,
MethodConfigExtend, Verbs, MethodType, Body, Param, Query, Response, Request, Files, Cookies,
Headers, SecurityContext, MethodResult, MethodError } from '@methodus/server';\n`;

        /*start custom*/
        const startCustom = content.indexOf('/*start custom*/');
        const endCustom = content.indexOf('/*end custom*/');
        if (startCustom > 0) {
            fileHead += content.substring(startCustom, endCustom);
            fileHead += '/*end custom*/\n';
        }

        if (this.configuration.models) {
            const keys = Object.keys(this.configuration.models);
            // tslint:disable-next-line:max-line-length
            fileHead += `import { ${keys.map((elem: string) => (elem.endsWith('Model') ? elem : elem + 'Model')).join(', ')} } from '../';\n`;
        }

        if (this.configuration.includes) {
            Object.keys(this.configuration.includes).forEach((key) => {
                const currentInclude = this.configuration.includes[key];
                if (currentInclude.alias) {
                    fileHead += `import * as ${currentInclude.alias} from '../';\n`;
                } else {
                    fileHead += `import { ${key} } from '../';\n`;
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

        // tslint:disable-next-line:max-line-length
        const proxyDecorator = `@Proxy.ProxyClass('${packageName}', '${className}', '${controllerPath.replace(/\.\.\//g, '').replace('.ts', '')}')\n`;

        let classMarker = content.substring(indexOfMethodConfig, content.indexOf('{', indexOfMethodConfig));
        if (classMarker.indexOf(',') > -1) {
            const arr = classMarker.split(',');
            classMarker = arr[0] + arr[arr.length - 1].substr(arr[arr.length - 1].indexOf(')'));
        }
        const classDefinition = `${proxyDecorator}${classMarker} {\n`;
        const methodResult = `return new MethodResult({} as any);`;
        let classBody = '';

        const mocksAndMethods = this.parseSignatures(content);
        const jsonSchema = {};

        Object.values(mocksAndMethods).forEach((tuple: any) => {
            jsonSchema[tuple.method] = jsonSchema[tuple.method] || {};
            if (tuple.comment) {
                jsonSchema[tuple.method].comment = tuple.comment;
                classBody += `\n  ${tuple.comment}`;
            }
            if (tuple.method) {
                jsonSchema[tuple.method].contract = tuple.contract;
                // tslint:disable-next-line:max-line-length
                classBody += `\n  ${tuple.method}\n    ${tuple.contract}\n        ${(tuple.result ? tuple.result : methodResult)}
    }
    `;
            }
        });

        const fullPath = path.join(this.target, 'contracts', `${className.toLocaleLowerCase()}.ts`);
        shell.mkdir('-p', path.join(this.target, 'contracts'));
        fs.writeFileSync(fullPath, `${HEADER}${fileHead}${classDefinition}${classBody} \n    }\n`);
        const jsonPath = path.join(this.target, 'contracts', `${className.toLocaleLowerCase()}.json`);
        fs.writeFileSync(jsonPath, JSON.stringify(jsonSchema, null, 2) + '\n');
    }

    ProxifyFromBinding(controllerPath: any, className: string, packageName?: string) {
        const content = fs.readFileSync(path.join(this.source, controllerPath), 'utf-8');
        shell.mkdir('-p', this.target);
        console.log('> Generating binding contract:', className, packageName);

        // tslint:disable-next-line:max-line-length
        let fileHead = `import { Proxy, MessageConfig, MessageHandler, MessageWorker, MessageWorkers,
Files, Verbs, MethodType, Body, Response, Request, Param, Query,
SecurityContext, MethodError, MethodResult } from '@methodus/server'; \n`;

        /*start custom*/
        const startCustom = content.indexOf('/*start custom*/');
        const endCustom = content.indexOf('/*end custom*/');
        if (startCustom > 0) {
            fileHead += content.substring(startCustom, endCustom);
            fileHead += '/*end custom*/\n';
        }

        if (this.configuration.models) {
            const keys = Object.keys(this.configuration.models);
            // tslint:disable-next-line:max-line-length
            fileHead += `import { ${keys.map((elem: string) => {
                return (elem.endsWith('Model') ? elem : elem + 'Model');
            }).join(', ')} } from '../'; \n`;
        }

        if (this.configuration.includes) {
            Object.keys(this.configuration.includes).forEach((key) => {
                const currentBindingInclude = this.configuration.includes[key];
                if (currentBindingInclude.alias) {
                    fileHead += `import * as ${currentBindingInclude.alias} from '../';\n`;
                } else {
                    fileHead += `import { ${key} } from '../';\n`;
                }
            });
        }

        if (packageName) {
            fileHead = fileHead.replace(/\.\.\/\.\.\//g, packageName + '/');
        }

        const indexOfMethodConfig = content.indexOf('@MessageConfig(') || content.indexOf('@MessageConfigBase(');
        // tslint:disable-next-line:max-line-length
        const proxyDecorator = `@Proxy.ProxyClass('${packageName}', '${className}', '${controllerPath.replace(/\.\.\//g, '').replace('.ts', '')}')\n`;
        // tslint:disable-next-line:max-line-length
        const classDefinition = `${proxyDecorator}${content.substring(indexOfMethodConfig, content.indexOf('{', indexOfMethodConfig))}{\n`;

        const methodResult = `return new MethodResult({} as any);`;
        let classBody = '';
        const mocksAndMethods = this.parseSignatures(content);

        Object.values(mocksAndMethods).forEach((tuple: any) => {
            if (tuple.comment) {
                classBody += `\n ${tuple.comment}`;
            }

            if (tuple.method) {
                // tslint:disable-next-line:max-line-length
                classBody += `\n ${tuple.method}\n    ${tuple.contract}\n        ${(tuple.result ? tuple.result : methodResult)}
    }
`;
            }
        });
        const fullPath = path.join(this.target, 'contracts', `${className.toLocaleLowerCase()}.ts`);
        shell.mkdir('-p', path.join(this.target, 'contracts'));
        fs.writeFileSync(fullPath, `${HEADER}${fileHead}${classDefinition}${classBody} \n    }\n`);

    }

    parseSignatures(content) {
        let Tuple: any = {};
        const mocksAndMethods = {};
        // tslint:disable-next-line:max-line-length
        const regex = /\/\*\*\s*\n([^\*]*(\*[^\/])?)*\*\/|@MethodMock\(.*\)|@Method\(.*\)|@MethodPipe\(.*\)|public (.)*? {/g;
        const mockRegex = /@MethodMock\((.*)\)/gmi;
        let m;

        // tslint:disable-next-line:no-conditional-assignment
        while ((regex.exec(content)) !== null) {
            m = regex.exec(content);
            if (!m) { break; }
            // This is necessary to avoid infinite loops with zero-width matches
            if (m.index === regex.lastIndex) {
                regex.lastIndex++;
            }
            m.forEach((match: any, groupIndex: number) => {

                if (!match) {
                    return;
                }

                if (match.indexOf('/*') === 0) {
                    Tuple.comment = match;
                }

                if (match.indexOf('@MethodMock') === 0) {
                    Tuple.mock = true;
                    if (match) {
                        const ematch = mockRegex.exec(match);
                        if (ematch && ematch.length > 0) {
                            const resolveKey = ematch[1];
                            if (resolveKey) {
                                Tuple.result = `
                                const methodArgs = arguments;
                                return new Promise<any>(function (resolve, reject) {
                                    resolve(${resolveKey}.apply(this, methodArgs));
                                });`;
                            }
                        }

                    }

                }

                if (match.indexOf('@MessageWorker(') === 0 ||
                    match.indexOf('@MessageWorkers(') === 0 ||
                    match.indexOf('@MessageHandler(') === 0) {
                    Tuple.method = match;
                }

                if (match.indexOf('public') === 0) {
                    if (Tuple.mock) {
                        Tuple.contract = match.replace(' async ', ' ');
                    } else {
                        Tuple.contract = match;
                    }
                    mocksAndMethods[Tuple.method] = Tuple;
                    Tuple = {};
                }
            });
        }
        return mocksAndMethods;
    }
}
