const excludedProps = ['constructor'];
const debug = require('debug')('contracts');
const path = require('path');
const fs = require('fs');
var shell = require('shelljs');
import * as colors from 'colors';

import { HEADER, Configuration, KeysConfiguration, ModelConfiguration } from './interfaces';



/*


*/
export function Exportify(buildConfiguration: Configuration, target: string, packageName: string, isClient: boolean = false) {

    let head = `/**/\n`;
    let body = '';

    if (buildConfiguration.includes) {
        Object.keys(buildConfiguration.includes).forEach((modelKey: string) => {
            const currentBindingInclude = buildConfiguration.includes[modelKey];
            if (!currentBindingInclude.alias) {
                body += `export { ${modelKey}  } from './includes/${modelKey.toLocaleLowerCase()}';\n`;
            } else {
                body += `export * from './includes/${modelKey.toLocaleLowerCase()}';\n`;
            }
        })
    }

    if (buildConfiguration.models) {
        Object.keys(buildConfiguration.models).forEach((modelKey: string) => {

            let fixedModelName = (modelKey.endsWith('Model')) ? modelKey : modelKey + 'Model';
            body += `import { ${modelKey} as ${fixedModelName} } from './models/${modelKey.toLocaleLowerCase()}';\n`;
            body += `export { ${modelKey} as ${fixedModelName} } from './models/${modelKey.toLocaleLowerCase()}';\n`;
        })
    }

    if (buildConfiguration.contracts) {

        const contracts = Object.assign({}, buildConfiguration.contracts);

        Object.keys(contracts).forEach((contractsKey: string) => {

            body += `import { ${contractsKey} } from './contracts/${contractsKey.toLocaleLowerCase()}';\n`;
            body += `export { ${contractsKey} } from './contracts/${contractsKey.toLocaleLowerCase()}';\n`;
        });
    }

    if (!isClient && buildConfiguration.bindings) {
        const bindings = Object.assign({}, buildConfiguration.bindings);
        Object.keys(bindings).forEach((contractsKey: string) => {

            body += `import { ${contractsKey} } from './contracts/${contractsKey.toLocaleLowerCase()}';\n`;
            body += `export { ${contractsKey} } from './contracts/${contractsKey.toLocaleLowerCase()}';\n`;
        });
    }

    if (buildConfiguration.contracts) {
        const contracts = buildConfiguration.contracts;
        body += `
            export function getSchema(schemaType: string) {

                const schema = require('./models/' + schemaType.toLowerCase() + '.schema');
            }

            export function getAll(): string[] {
                return [` +
            Object.keys(contracts).map(key => `'${key}'`).join(',')
        body += `]            
            }`

        body += `
            export function get(contractName: string) {
                switch (contractName) {`
        Object.keys(contracts).forEach((contractsKey: string) => {

            body += `
                    case '${contractsKey}':
                        return ${contractsKey};`
        })


        body += `
                }
            }`

    }

    if (!isClient && buildConfiguration.bindings) {
        const bindings = buildConfiguration.bindings;
        body += `
            export function getAdditional(): any[] {
                return [` +
            Object.keys(bindings).map(key => `{contract:  '${key}', 
                                              transport  :'${bindings[key].transport}',
                                              server: '${bindings[key].server}'}`).join(',')
        body += `]            
            }`
    }



 
    shell.mkdir('-p', target);
    fs.writeFileSync(path.join(target, 'index.ts'), HEADER + head + body);
}



export function ModelsIndex(buildConfiguration: Configuration, source: string, target: string, packageName: string) {

    // console.log(`building index file for`, packageName)
    let head = `/**/\n`;
    let body = '';

    if (buildConfiguration.models) {
        Object.keys(buildConfiguration.models).forEach((modelKey: string) => {

            let cleanKey = modelKey;
            if (!cleanKey.endsWith('Model')) {
                cleanKey = cleanKey + 'Model';
            }


            //body += `import {${modelKey} as ${modelKey}Model} from '${model.dest}/${modelKey.toLocaleLowerCase()}';\n`;
            body += `export {${modelKey} as ${cleanKey}} from './${modelKey.toLocaleLowerCase()}';\n`;
        })
    }

    shell.mkdir('-p', target);
    fs.writeFileSync(path.join(target, 'index.ts'), HEADER + head + body);
}


export function UseTemplate(fileName, targetFileName, destFolder, replacement?) {
    let content = fs.readFileSync(path.resolve(path.join(__dirname, '../../template', fileName)), 'utf-8');
    if (replacement) {
        Object.keys(replacement).forEach(entry =>
            content = content.replace('${' + entry + '}', replacement[entry])
        );
    }
    console.log(colors.blue(`> ${fileName} --> ${targetFileName}`));
    fs.writeFileSync(path.join(destFolder, targetFileName), content);
}