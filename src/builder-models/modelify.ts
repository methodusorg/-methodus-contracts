import * as path from 'path';
import * as fs from 'fs';
import * as shelljs from 'shelljs';
import { HEADER, Configuration } from './interfaces';
import { ModelSchema } from './ModelSchema';
const ROOTSRC = 'src';
const excludeList = ['collectionName', 'transform'];
const Console = console;
export class Modelify {
    buildConfiguration: Configuration;
    allModels: any;
    source: string;
    target: string;
    isClient = false;
    constructor(configuration: Configuration, source: string, target: string, isClient = false) {
        this.source = source;
        this.target = target;
        this.isClient = isClient;
        this.buildConfiguration = configuration;
        if (this.buildConfiguration.models) {
            this.allModels = Object.keys(this.buildConfiguration.models);
        }
    }

    ProxifyFromModel(modelSource: any, className: string, packageName: string) {

        shelljs.mkdir('-p', this.target);
        Console.log('Generating Model for:', className);
        let modelBody = '';
        try {
            let basicSourcePath = path.join(this.source, modelSource);
            if (this.buildConfiguration.srcFolder) {
                basicSourcePath = path.join(this.source, this.buildConfiguration.srcFolder, modelSource);
            }
            const content = fs.readFileSync(basicSourcePath, 'utf-8');
            let customeSection = '';
            /*start custom*/
            const openPhrase = '/*start custom*/', closePhrase = '/*end custom*/';
            const startCustom = content.indexOf(openPhrase);
            const endCustom = content.indexOf(closePhrase);
            if (startCustom > 0) {
                customeSection += content.substring(startCustom + openPhrase.length, endCustom);
                customeSection += '\n';
            }

            const modelSchema = new ModelSchema(className);
            let basicPath = path.join(this.source, modelSource);
            let sourcePath = path.join(this.source, modelSource);
            if (this.buildConfiguration.buildFolder) {
                basicPath = path.join(this.source, this.buildConfiguration.buildFolder, modelSource);
                sourcePath = basicPath;
            } else if (this.buildConfiguration.srcFolder) {
                basicPath = path.join(this.source, this.buildConfiguration.srcFolder, modelSource);
                sourcePath = basicPath;
            }
            if (this.buildConfiguration.srcFolder) {
                sourcePath = path.join(this.source, this.buildConfiguration.srcFolder, modelSource);
            }
            // load the text too
            const fileContent = fs.readFileSync(sourcePath, { encoding: 'utf-8' });

            const modelRequire = require(basicPath.replace('.ts', ''));
            let importRow = '';
            let importTypes: any = [];
            Object.keys(modelRequire).forEach((modelClassKey) => {

                const innerClass = modelRequire[modelClassKey];
                const odm = innerClass.odm;
                if (odm) {
                    importTypes = this.concatImportTypes(odm, importTypes);

                    if (fileContent.indexOf(`${modelClassKey}<`) > -1) {// check for generics
                        modelClassKey = modelClassKey + '<T>';
                    }
                    modelBody += `export interface ${modelClassKey} {\n`;
                    this.filterProps(innerClass.odm.fields).forEach((odmItem) => {
                        modelSchema.properties[this.fixProperty(odm.fields[odmItem])] = odm.fields[odmItem];
                        // tslint:disable-next-line:max-line-length
                        modelBody += `${this.fixProperty(odm.fields[odmItem])}?: ${this.parseType(odm.fields[odmItem].type, importTypes)};\n`;
                    });
                    modelBody += `}\n`;
                }
            });

            if (importTypes.length) {
                importRow = `import { ${importTypes.join(',')} } from '../';\n`;
            }
            const modlesPath = path.join(this.target, ROOTSRC, 'models');
            shelljs.mkdir('-p', modlesPath);
            fs.writeFileSync(path.join(modlesPath, `${className.toLocaleLowerCase()}.ts`),
                `${HEADER}${importRow}${customeSection}${modelBody}\n`);

            const schemasPath = path.join(this.target, 'schemas');
            shelljs.mkdir('-p', schemasPath);
            const jsonPath = path.join(schemasPath, `${className.toLocaleLowerCase()}.json`);
            fs.writeFileSync(jsonPath, JSON.stringify(modelSchema, null, 2) + '\n');

        } catch (ex) {
            console.error(ex);
        }
    }

    filterProps(odm) {
        const filtered = Object.keys(odm).filter((prop) => excludeList.indexOf(prop) === -1);
        Console.log(`> fields: ${filtered}`);
        return filtered;
    }

    fixProperty(prop) {
        const name = prop.displayName || prop.propertyKey;
        return name ? name.replace(/\./g, '_') : '';
    }
    concatImportTypes(odm, importTypes) {

        Object.keys(odm.fields).forEach((type) => {
            let modelName = odm.fields[type].type;
            if (modelName && this.allModels.indexOf(modelName) > -1) { // the type is one of the Models in  the package
                if (!modelName.endsWith('Model')) {// fix the Model suffix -- temporay solution
                    modelName = modelName + 'Model';
                }
                if (importTypes.indexOf(modelName) === -1) { // don't insert it twice
                    importTypes.push(modelName); // added to import list
                }
            }
        });
        return importTypes;
    }

    parseType(typeName: string, importTypes: string[]) {
        switch (typeName) {
            case 'Array':
                return 'Array<any>';
            case 'Date':
                return typeName;
            case 'String':
                return 'string';
            case 'Object':
                return 'any';
        }

        if (importTypes.indexOf(typeName + 'Model') > -1) {
            return typeName + 'Model';
        }
        return typeName;
    }
}
