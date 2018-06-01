const excludedProps = ['constructor'];
const debug = require('debug')('contracts');
const path = require('path');
const fs = require('fs');
var shell = require('shelljs');
import { HEADER, Configuration, KeysConfiguration, ModelConfiguration } from './interfaces';


export class Clientify {
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

        // let newPackageName = packageName.replace('@tmla-tiles', '@tmla-contracts');
        // destination = path.resolve(path.join('..', '..', newPackageName, destination))
        shell.mkdir('-p', this.target);
        console.log('> Generating client contract:', className, packageName);

        //find the @MethodConfig

        let fileHead =
            `import * as M from '@methodus/client';
import { MethodResult } from '@methodus/client';
`;

        /*start custom*/
        // let startCustom = content.indexOf('/*start custom*/');
        // let endCustom = content.indexOf('/*end custom*/');
        // if (startCustom > 0) {
        //     fileHead += content.substring(startCustom, endCustom);
        // }

        if (this.configuration.models) {
            const keys = Object.keys(this.configuration.models);
            fileHead += `import { ${keys.map((elem: string) => { return (elem.endsWith('Model') ? elem : elem + 'Model') }).join(',')} } from '../';\n`;
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

        if (packageName)
            fileHead = fileHead.replace(/\.\.\/\.\.\//g, packageName + '/');

        let indexOfMethodConfig = content.indexOf('@MethodConfig(');
        let classDefinition = content.substring(indexOfMethodConfig, content.indexOf('{', indexOfMethodConfig)) + ' {\n';
        //classDefinition = splice(classDefinition, classDefinition.indexOf('export'), 0, proxyDecorator);
        classDefinition = classDefinition.replace(/\@MethodConfig/g, '@M.MethodConfig');
        classDefinition = classDefinition.replace(/, \[.*?\]/g, '');
        classDefinition += `\n public static base: string;`;
        let notClean = true;
        let methodResult = `return new M.MethodResult({} as any);`;

        let classBody = '';

        const regex = /\/\*\*\s*\n([^\*]*(\*[^\/])?)*\*\/|@MethodMock\(.*\)|@Method\(.*\)|public.+{/g;
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
                if (match.indexOf('@Method(') === 0) {
                    //find return type


                    Tuple.method = match;
                }

                if (match.indexOf('public') === 0) {

                    //find return type
                    Tuple.contract = match;
                    mocks_and_methods[Tuple.method] = Tuple;
                    Tuple = {};
                }
            });
        }


        Object.values(mocks_and_methods).forEach((tuple: any) => {
            if (tuple.comment) {
                classBody += `\n  ${tuple.comment}`;
            }
            if (tuple.method) {
                //try to resolve result value
                const resultRegex = /\<MethodResult<([^\)]+)\>\>/
                const m = resultRegex.exec(tuple.contract);
                if (m.length > 1) {
                    methodResult = `return {} as ${m[1]};`;
                    tuple.contract = tuple.contract.replace(m[0], `<${m[1]}>`);
                }



                classBody += `\n  ${tuple.method}\n    ${tuple.contract}\n        ${(tuple.result ? tuple.result : methodResult)} 
        }
        `;
            }
        });








        // while (notClean) {
        //     let methodHead = `    ` + content.substring(loc, content.indexOf('{', loc + 1) + 1);

        //     classBody += methodHead + methodResult;
        //     loc = content.indexOf('@Method(', loc + 1);
        //     if (loc === -1)
        //         notClean = false;
        // }

        const replaceList = ['Method', 'Param', 'Proxy', 'MethodConfig', 'Body', 'Query', 'Response', 'Request', 'Files', 'Cookies', 'Headers', 'MethodResult', 'MethodError'];
        classBody = classBody.replace(/\Verbs./g, 'M.Verbs.');

        classBody = classBody.replace(/, \[.*?\]/g, '');
        classBody = classBody.replace(/, @SecurityContext\(\) att: Tmla.ISecurityContext/g, '');

        classBody = classBody.replace(/, @SecurityContext\(\) att/g, '');
        classBody = classBody.replace(/@SecurityContext\(\) att: Tmla.ISecurityContext/g, '');

        replaceList.forEach((value: string) => {
            classBody = classBody.replace(new RegExp('@' + value, 'g'), '@M.' + value);
        });



        let fullPath = path.join(this.target, 'contracts', `${className.toLocaleLowerCase()}.ts`);
        shell.mkdir('-p', path.join(this.target, 'contracts'));
        fs.writeFileSync(fullPath, HEADER + fileHead + classDefinition + classBody + ' \n    }');
    }



}
