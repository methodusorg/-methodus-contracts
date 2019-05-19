
import * as path from 'path';
import * as fs from 'fs';
import * as shell from 'shelljs';
import * as colors from 'colors';
import { HEADER, Configuration } from './interfaces';
const ROOTSRC = 'src';
const Console = console;

function handleIncludes(buildConfiguration, body) {
    if (buildConfiguration.includes) {
        Object.keys(buildConfiguration.includes).forEach((modelKey: string) => {
            const currentBindingInclude = buildConfiguration.includes[modelKey];
            if (currentBindingInclude.path.indexOf('.ts') > -1) {
                if (!currentBindingInclude.alias) {
                    body += `export { ${modelKey}  } from './includes/${modelKey.toLocaleLowerCase()}';\n`;
                } else {
                    body += `export * from './includes/${modelKey.toLocaleLowerCase()}';\n`;
                }
            }
        });
    }
    return body;
}

function handleModels(buildConfiguration, body) {
    if (buildConfiguration.models) {
        Object.keys(buildConfiguration.models).forEach((modelKey: string) => {
            const fixedModelName = (modelKey.endsWith('Model')) ? modelKey : modelKey + 'Model';
            body += `import { ${modelKey} as ${fixedModelName} } from './models/${modelKey.toLocaleLowerCase()}';\n`;
            body += `export { ${modelKey} as ${fixedModelName} } from './models/${modelKey.toLocaleLowerCase()}';\n`;
        });
    }
    return body;

}
export function Exportify(buildConfiguration: Configuration,
    target: string, packageName: string, isClient = false) {

    const head = `/**/\n`;
    let body = '';
    body = handleIncludes(buildConfiguration, body);
    body = handleModels(buildConfiguration, body);

    if (buildConfiguration.contracts) {
        const contracts = Object.assign({}, buildConfiguration.contracts);
        Object.keys(contracts).forEach((contractsKey: string) => {
            body += `import { ${contractsKey} } from './contracts/${contractsKey.toLocaleLowerCase()}';\n`;
            body += `export { ${contractsKey} } from './contracts/${contractsKey.toLocaleLowerCase()}';\n`;
        });
    }

    if (buildConfiguration.contracts) {
        const contracts = buildConfiguration.contracts;
        body += `


            export function getAll(): string[] {
                return [` +
            Object.keys(contracts).map((key) => `'${key}'`).join(',');
        body += `]
            }`;

        body += `
            export function get(contractName: string) {
                switch (contractName) {`;
        Object.keys(contracts).forEach((contractsKey: string) => {

            body += `
                    case '${contractsKey}':
                        return ${contractsKey};`;
        });

        body += `
                }
            }`;

    }

    shell.mkdir('-p', target);
    fs.writeFileSync(path.join(target, ROOTSRC, 'index.ts'), `${HEADER}${head}${body}\n`);
}

export function ModelsIndex(buildConfiguration: Configuration, source: string, target: string, packageName: string) {

    const head = `/**/\n`;
    let body = '';

    if (buildConfiguration.models) {
        Object.keys(buildConfiguration.models).forEach((modelKey: string) => {

            let cleanKey = modelKey;
            if (!cleanKey.endsWith('Model')) {
                cleanKey = cleanKey + 'Model';
            }
            body += `export {${modelKey} as ${cleanKey}} from './${modelKey.toLocaleLowerCase()}';\n`;
        });
    }

    shell.mkdir('-p', target);
    fs.writeFileSync(path.join(target, 'index.ts'), `${HEADER}${head}${body}\n`);
}

export function UseTemplate(fileName, targetFileName, destFolder, replacement?) {
    let content = fs.readFileSync(path.resolve(path.join(__dirname, '../../../template', fileName)), 'utf-8');
    if (replacement) {
        Object.keys(replacement).forEach((entry) => content = content.replace(`{${entry}}`, replacement[entry]));
    }
    Console.log(colors.blue(`> ${fileName} --> ${targetFileName}`));
    fs.writeFileSync(path.join(destFolder, targetFileName), content + '\n');
}
export function UseCustomTemplate(fileName, targetFileName, destFolder, replacement?) {
    let content = fs.readFileSync(path.resolve(fileName), 'utf-8');
    if (replacement) {
        Object.keys(replacement).forEach((entry) => content = content.replace(`{${entry}}`, replacement[entry]));
    }
    Console.log(colors.blue(`> ${fileName} --> ${targetFileName}`));
    fs.writeFileSync(path.join(destFolder, targetFileName), content + '\n');
}
