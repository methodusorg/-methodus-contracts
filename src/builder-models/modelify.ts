const excludedProps = ['constructor'];
import * as path from 'path';
import * as fs from 'fs';
import * as shelljs from 'shelljs';
import { HEADER, Configuration, KeysConfiguration, ModelConfiguration } from './interfaces';
import { ModelSchema, ModelSchemaNode } from './ModelSchema';

//import { ODM } from '@tmla/data';



const excludeList = ['collectionName', 'transform'];


export class Modelify {
    buildConfiguration: Configuration;
    allModels: any;
    source: string;
    target: string;
    isClient: boolean = false;
    constructor(Configuration: Configuration, source, target, isClient?) {
        this.source = source;
        this.target = target;
        this.isClient = isClient;
        this.buildConfiguration = Configuration;
        if (this.buildConfiguration.models) {
            this.allModels = Object.keys(this.buildConfiguration.models);
        }

    }

    ProxifyFromModel(modelSource: any, className: string, packageName: string) {



        shelljs.mkdir('-p', this.target);
        console.log('Generating Model for:', className);
        let modelBody = '';
        try {




            let content = fs.readFileSync(path.join(this.source, modelSource), 'utf-8');

            if (this.isClient) {
                content = content.replace(/@tmla-contracts\//g, '@tmla-client/');
            }

            //find the @MethodConfig

            let customeSection = '';

            /*start custom*/
            const openPhrase = '/*start custom*/', closePhrase = '/*end custom*/';
            let startCustom = content.indexOf(openPhrase);
            let endCustom = content.indexOf(closePhrase);
            if (startCustom > 0) {
                customeSection += content.substring(startCustom + openPhrase.length, endCustom);
                customeSection += '\n';
            }


            const modelSchema = new ModelSchema(className);
            const modelRequire = require(path.join(this.source, modelSource).replace('.ts', ''));
            let importRow = '';
            let importTypes = [];
            for (var modelClass in modelRequire) {
                const innerClass = modelRequire[modelClass];
                const odm = innerClass.odm;
                if (odm) {
                    importTypes = this.concatImportTypes(odm, importTypes);
                    modelBody += `export interface ${modelClass} {\n`
                    this.filterProps(innerClass.odm.fields).forEach(odmItem => {
                        modelSchema.properties[this.fixProperty(odm.fields[odmItem])] = odm.fields[odmItem];
                        modelBody += `${this.fixProperty(odm.fields[odmItem])}?: ${this.parseType(odm.fields[odmItem].type, importTypes)};\n`
                    });
                    modelBody += `}\n`;
                }


            }
            if (importTypes.length) {
                importRow = `import { ${importTypes.join(',')} } from '../';\n`;
            }

            shelljs.mkdir('-p', path.join(this.target, 'models'));
            fs.writeFileSync(path.join(this.target, 'models', `${className.toLocaleLowerCase()}.ts`), HEADER + importRow + customeSection + modelBody);
            //fs.writeFileSync(path.join(this.target, 'models', `${className.toLocaleLowerCase()}.schema`), JSON.stringify(modelSchema, null, 2));

        } catch (ex) {
            console.error(ex);

        }

    }

    capitalize(str) {
        str = str.toLowerCase();
        return str[0].toUpperCase() + str.substr(1);
    }

    filterProps(odm) {
        let filtered = Object.keys(odm).filter(prop => excludeList.indexOf(prop) === -1);
        console.log(`> fields: ${filtered}`)
        return filtered;
    }

    fixProperty(prop) {
        let name = prop.displayName || prop.propertyKey;
        return name ? name.replace(/\./g, '_') : '';
    }
    concatImportTypes(odm, importTypes) {
        for (let type in odm.fields) {
            let modelName = odm.fields[type].type;
            if (modelName) { //we have a type
                if (this.allModels.indexOf(modelName) > -1) { //the type is one of the Models in  the package
                    if (!modelName.endsWith('Model')) {//fix the Model suffix -- temporay solution
                        modelName = modelName + 'Model';
                    }
                    if (importTypes.indexOf(modelName) === -1) { //don't insert it twice
                        importTypes.push(modelName); // added to import list
                    }
                }
            }

        }
        return importTypes;
    }

    parseType(typeName: string, importTypes: Array<string>) {
        switch (typeName) {
            case 'Array':
                return 'Array<any>';
            case 'Date':
                return typeName;
            case 'Object':
                return 'any';
        }

        if (importTypes.indexOf(typeName + 'Model') > -1) {
            return typeName + 'Model';
        }
        return typeName.toLowerCase();
    }
}






