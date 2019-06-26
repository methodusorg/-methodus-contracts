
import * as path from 'path';
import * as fs from 'fs';
import * as shell from 'shelljs';
import { HEADER, Configuration } from './interfaces';
const ROOTSRC = 'src';
const Console = console;
const baseImportStr = `import { Proxy, Method, MethodPipe, MethodConfig, MethodConfigBase,
    MethodConfigExtend, Verbs, MethodType, Body, Param, Query, Response, Request, Files, Cookies,
    Headers, SecurityContext, MethodResult, MethodError } from '@methodus/server';\n`;
const mockRegex = /@MethodMock\((.*)\)/gmi;

let Tuple: any = {};

export class Proxify {
    configuration: Configuration;
    source: string;
    target: string;

    className = '';
    content = '';
    fileHead = '';
    controllerPath = '';
    packageName = '';
    constructor(configuration: Configuration, source: any, target: any) {
        this.source = source;
        this.target = target;
        this.configuration = configuration;
    }

    ProxifyFromFile(controllerPath: any, className: string, packageName?: string) {
        // read controller file
        const content = fs.readFileSync(path.join(this.source, controllerPath), 'utf-8');
        shell.mkdir('-p', this.target);
        Console.log('> Generating contract:', className, packageName);

        // tslint:disable-next-line:max-line-length
        let fileHead = baseImportStr;

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
        this.content = content;
        this.fileHead = fileHead;
        this.className = className;
        this.controllerPath = controllerPath;
        if (packageName) {
            this.packageName = packageName;
        }
        this.buildProxy();
    }
    buildProxy() {

        let indexOfMethodConfig = this.content.indexOf('@MethodConfigBase(');
        if (indexOfMethodConfig === -1) {
            indexOfMethodConfig = this.content.indexOf('@MethodConfig(');
        }

        // tslint:disable-next-line:max-line-length
        const proxyDecorator = `@Proxy.ProxyClass('${this.packageName}', '${this.className}', '${this.controllerPath.replace(/\.\.\//g, '').replace('.ts', '')}')\n`;

        let classMarker = this.content.substring(indexOfMethodConfig, this.content.indexOf('{', indexOfMethodConfig));
        if (classMarker.indexOf(',') > -1) {
            const arr = classMarker.split(',');
            classMarker = arr[0] + arr[arr.length - 1].substr(arr[arr.length - 1].indexOf(')'));
        }
        const classDefinition = `${proxyDecorator}${classMarker} {\n`;
        const methodResult = `return new MethodResult({} as any);`;
        let classBody = '';

        const mocksAndMethods = this.parseSignatures(this.content);
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

        const fullPath = path.join(this.target, ROOTSRC, 'contracts', `${this.className.toLocaleLowerCase()}.ts`);
        shell.mkdir('-p', path.join(this.target, ROOTSRC, 'contracts'));
        fs.writeFileSync(fullPath, `${HEADER}${this.fileHead}${classDefinition}${classBody} \n    }\n`);
        const jsonPath = path.join(this.target, ROOTSRC, 'contracts', `${this.className.toLocaleLowerCase()}.json`);
        fs.writeFileSync(jsonPath, JSON.stringify(jsonSchema, null, 2) + '\n');
    }

    parseSignatures(content) {

        const mocksAndMethods = {};
        // tslint:disable-next-line:max-line-length
        const regex = /\/\*\*\s*\n([^\*]*(\*[^\/])?)*\*\/|@MethodMock\(.*\)|@Method\(.*\)|@MethodPipe\(.*\)|public (.|\n|\r)*? {/g;

        let m;

        // tslint:disable-next-line:no-conditional-assignment
        while ((m = regex.exec(content)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (m.index === regex.lastIndex) {
                regex.lastIndex++;
            }

            m.forEach((match, groupIndex) => {
                this.handleMatch(match, mocksAndMethods);
            });
        }
        return mocksAndMethods;
    }
    handleMatch(match, mocksAndMethods) {
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
        if (match.indexOf('@Method(') === 0) {
            Tuple = {};
            Tuple.method = match;
        }
        if (match.indexOf('public') === 0) {
            if (Tuple.mock) {
                Tuple.contract = match.replace(' async ', ' ');
            } else {
                Tuple.contract = match;
            }
            mocksAndMethods[Tuple.method] = JSON.parse(JSON.stringify(Tuple));

        }
    }
}
