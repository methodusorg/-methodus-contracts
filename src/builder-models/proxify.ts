const excludedProps = ['constructor'];
const debug = require('debug')('contracts');
const path = require('path');
const fs = require('fs');
var shell = require('shelljs');
import { HEADER, Configuration, KeysConfiguration, ModelConfiguration } from './interfaces';
import * as jsdoc from 'jsdoc-regex';

export class Proxify {
    configuration: Configuration
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
    };


    CopyFromFile(controllerPath: any, className: string, packageName?: string) {
        let content = fs.readFileSync(path.join(this.source, controllerPath), 'utf-8');
        shell.mkdir('-p', this.target);
        console.log('> Copying file:', className, packageName);
        let fullPath = path.join(this.target, 'includes', `${className.toLocaleLowerCase()}.ts`);
        shell.mkdir('-p', path.join(this.target, 'includes'));
        fs.writeFileSync(fullPath, HEADER + content);


    }

    ProxifyFromFile(controllerPath: any, className: string, packageName?: string) {
        //read controller file
        let content = fs.readFileSync(path.join(this.source, controllerPath), 'utf-8');

        
        shell.mkdir('-p', this.target);
        console.log('> Generating contract:', className, packageName);

        //find the @MethodConfig

        let fileHead = `import { Proxy, logger, Method, MethodPipe, MethodConfig, Verbs, MethodType, Body, Param, Query, Response, Request, Files, Cookies, Headers, SecurityContext, MethodResult, MethodError } from '@methodus/server';\n`;

        /*start custom*/
        let startCustom = content.indexOf('/*start custom*/');
        let endCustom = content.indexOf('/*end custom*/');
        if (startCustom > 0) {
            fileHead += content.substring(startCustom, endCustom);
            fileHead += '/*end custom*/\n';
        }

        if (this.configuration.models) {
            const keys = Object.keys(this.configuration.models);
            fileHead += `import { ${keys.map((elem: string) => { return (elem.endsWith('Model') ? elem : elem + 'Model') }).join(', ')} } from '../';\n`;
        }

        if (this.configuration.includes) {
            Object.keys(this.configuration.includes).forEach((key) => {
                const currentInclude = this.configuration.includes[key];
                if (currentInclude.alias) {
                    fileHead += `import * as ${currentInclude.alias} from '../';\n`;
                }
                else {
                    fileHead += `import { ${key} } from '../';\n`;
                }
            })
        }


        if (packageName)
            fileHead = fileHead.replace(/\.\.\/\.\.\//g, packageName + '/');

        let indexOfMethodConfig = content.indexOf('@MethodConfig(');
        let proxyDecorator = `@Proxy.ProxyClass('${className}', '${controllerPath.replace(/\.\.\//g, '').replace('.ts', '')}')\n`
        let classDefinition = proxyDecorator + content.substring(indexOfMethodConfig, content.indexOf('{', indexOfMethodConfig)) + ' {\n';
        //classDefinition = splice(classDefinition, classDefinition.indexOf('export'), 0, proxyDecorator);

        let notClean = true;
        let methodResult = `return new MethodResult({});`;
        let classBody = '';


        const regex = /\/\*\*\s*\n([^\*]*(\*[^\/])?)*\*\/|@MethodMock\(.*\)|@Method\(.*\)|@MethodPipe\(.*\)|public (.|\n|\r)*? {/g;
        const mockRegex = /@MethodMock\((.*)\)/
        let m;
        const mocks_and_methods = {};
        let jsonSchema = {};

        let Tuple: any = {};
        while ((m = regex.exec(content)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (m.index === regex.lastIndex) {
                regex.lastIndex++;
            }
            m.forEach((match, groupIndex) => {

                if (!match)
                    return;

                if (match.indexOf('@MethodMock') === 0) {
                    Tuple.result = `return new MethodResult(${mockRegex.exec(match)[1]}); `;
                }

                if (match.indexOf('/*') === 0) {
                    Tuple.comment = match;
                }

                if (match.indexOf('@Method(') === 0) {
                    Tuple.method = match;
                }
                if (match.indexOf('@MethodPipe(') === 0) {
                    Tuple.method = match;
                }
                if (match.indexOf('public') === 0) {
                    Tuple.contract = match;
                    mocks_and_methods[Tuple.method] = Tuple;
                    Tuple = {};
                }


            });
        }


        Object.values(mocks_and_methods).forEach((tuple: any) => {
            jsonSchema[tuple.method] = jsonSchema[tuple.method] || {};
            if (tuple.comment) {
                jsonSchema[tuple.method].comment = tuple.comment
                classBody += `\n  ${tuple.comment}`;
            }
            if (tuple.method) {
                jsonSchema[tuple.method].contract = tuple.contract;
                classBody += `\n  ${tuple.method}\n    ${tuple.contract}\n        ${(tuple.result ? tuple.result : methodResult)} 
    }
    `;
            }
        });


        let fullPath = path.join(this.target, 'contracts', `${className.toLocaleLowerCase()}.ts`);
        shell.mkdir('-p', path.join(this.target, 'contracts'));
        fs.writeFileSync(fullPath, HEADER + fileHead + classDefinition + classBody + '\n}');
        let jsonPath = path.join(this.target, 'contracts', `${className.toLocaleLowerCase()}.json`);

        fs.writeFileSync(jsonPath, JSON.stringify(jsonSchema, null, 2));
    }

    ProxifyFromBinding(controllerPath: any, className: string, packageName?: string) {
        //read controller file
        let content = fs.readFileSync(path.join(this.source, controllerPath), 'utf-8');

        // let newPackageName = packageName.replace('@tmla-tiles', '@tmla-contracts');
        // destination = path.resolve(path.join('..', '..', newPackageName, destination))
        shell.mkdir('-p', this.target);
        console.log('> Generating binding contract:', className, packageName);

        //find the @MethodConfig
        // let loc = content.indexOf('@MessageWorkers(');

        let fileHead = `import { Proxy, MessageConfig, MessageHandler, MessageWorker, MessageWorkers, Files, Verbs, MethodType, Body, Response, Request, Param, Query, SecurityContext, MethodError, MethodResult } from '@methodus/server'; \n`;

        /*start custom*/
        let startCustom = content.indexOf('/*start custom*/');
        let endCustom = content.indexOf('/*end custom*/');
        if (startCustom > 0) {
            fileHead += content.substring(startCustom, endCustom);
            fileHead += '/*end custom*/\n';
        }

        if (this.configuration.models) {
            const keys = Object.keys(this.configuration.models);
            fileHead += `import { ${keys.map((elem: string) => { return (elem.endsWith('Model') ? elem : elem + 'Model') }).join(', ')} } from '../'; \n`;
        }

        if (this.configuration.includes) {
            Object.keys(this.configuration.includes).forEach((key) => {
                const currentBindingInclude = this.configuration.includes[key];
                if (currentBindingInclude.alias) {
                    fileHead += `import * as ${currentBindingInclude.alias} from '../';\n`;
                }
                else {
                    fileHead += `import { ${key} } from '../';\n`;
                }
            })
        }


        if (packageName)
            fileHead = fileHead.replace(/\.\.\/\.\.\//g, packageName + '/');

        let indexOfMethodConfig = content.indexOf('@MessageConfig(');
        let proxyDecorator = `@Proxy.ProxyClass('${className}', '${controllerPath.replace(/\.\.\//g, '').replace('.ts', '')}') \n`
        let classDefinition = proxyDecorator + content.substring(indexOfMethodConfig, content.indexOf('{', indexOfMethodConfig)) + ' {\n';
        //classDefinition = splice(classDefinition, classDefinition.indexOf('export'), 0, proxyDecorator);

        let notClean = true;
        let methodResult = `return new MethodResult({});`;
        let classBody = '';




        const regex = /\/\*\*\s*\n([^\*]*(\*[^\/])?)*\*\/|@MessageWorker\(.*\)|@MessageWorkers\(.*\)|@MessageHandler\(.*\)|public.+{/g;
        const mockRegex = /@MethodMock\((.*)\)/
        let m;
        const mocks_and_methods = {};
        let Tuple: any = {};
        while ((m = regex.exec(content)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (m.index === regex.lastIndex) {
                regex.lastIndex++;
            }
            m.forEach((match, groupIndex) => {

                if (!match)
                    return;

                if (match.indexOf('/*') === 0) {
                    Tuple.comment = match;
                }

                if (match.indexOf('@MethodMock') === 0) {
                    Tuple.result = `return new MethodResult(${mockRegex.exec(match)[1]}); `;
                }
                if (match.indexOf('@MessageWorker(') === 0 ||
                    match.indexOf('@MessageWorkers(') === 0 ||
                    match.indexOf('@MessageHandler(') === 0) {
                    Tuple.method = match;
                }

                if (match.indexOf('public') === 0) {
                    Tuple.contract = match;
                    mocks_and_methods[Tuple.method] = Tuple;
                    Tuple = {};
                }
            });
        }


        Object.values(mocks_and_methods).forEach((tuple: any) => {
            if (tuple.comment) {
                classBody += `\n ${tuple.comment}`;
            }

            if (tuple.method) {
                classBody += `\n ${tuple.method}\n    ${tuple.contract}\n        ${(tuple.result ? tuple.result : methodResult)} 
    }
`;
            }
        });
        let fullPath = path.join(this.target, 'contracts', `${className.toLocaleLowerCase()}.ts`);
        shell.mkdir('-p', path.join(this.target, 'contracts'));
        fs.writeFileSync(fullPath, HEADER + fileHead + classDefinition + classBody + ' \n}');
    }


}
