import { Project, ScriptTarget, createWrappedNode, ClassDeclaration, TypeFormatFlags, IndentationText, NewLineKind, QuoteKind, Decorator, MethodDeclaration } from 'ts-morph';
import * as path from 'path';
import { HEADER, Configuration } from '../builder-models/interfaces';





export class MethodusProject {
    project: Project;
    sourceFiles: any[];

    constructor(public projectPath: string, public packageName: string) {
        console.log('project path', projectPath);
        this.project = new Project({
            manipulationSettings: {
                // TwoSpaces, FourSpaces, EightSpaces, or Tab
                indentationText: IndentationText.Tab,
                // LineFeed or CarriageReturnLineFeed
                newLineKind: NewLineKind.CarriageReturnLineFeed,
                // Single or Double
                quoteKind: QuoteKind.Single,
                // Whether to change shorthand property assignments to property assignments
                // and add aliases to import & export specifiers (see more information in
                // the renaming section of the documentation).
                usePrefixAndSuffixTextForRename: false
            },
            compilerOptions: {
                tsConfigFilePath: `${projectPath}/tsconfig.json`
            }
        });
        this.project.addExistingSourceFiles(`${projectPath}/**/*{.ts}`);
        this.sourceFiles = this.project.getSourceFiles();
    }



    HandleMethod(method) {

        const xparams = method.getParameters();
        // console.log(xparams[0].getName());
        // const argItr = createWrappedNode(method.compilerNode) as MethodDeclaration;
        // const params = argItr.getParameters();
        xparams.forEach((arg, i) => {
            const paramDecorator = arg.getDecorators();
            if (paramDecorator[0].getName() === 'SecurityContext') {
                arg.remove();
                //paramDecorator[0].remove();
            }
        });



        method.getStatements().forEach((statement) => {
            statement.remove();
        });
        const thePromise = method.getReturnType().getApparentType();

        let retType = thePromise.getText(undefined, TypeFormatFlags.WriteTypeArgumentsOfSignature);

        if (retType.indexOf('Promise<') > -1) {
            retType = retType.replace('Promise<', '');
            retType = retType.substr(0, retType.length - 1);
        }
        method.insertText(method.getBody()!.getEnd() - 1, `        return new MethodResult(null!);\n    `);


    }

    HandleIncludeFile(sourceFile, dirName: string) {
        const basePath = path.join(this.projectPath, 'src', 'includes');
        this.project.createDirectory(basePath);
        this.project.saveSync();

        const filePath = path.join(basePath, sourceFile.getBaseName());
        const targetFile = this.project.createSourceFile(filePath, sourceFile.getStructure(), { overwrite: true });
        targetFile.saveSync();
    }

    ProxifyFromFile(file, dirName: string, contractKey) {

        const basePath = path.join(this.projectPath, 'src', dirName);
        this.project.createDirectory(basePath);
        this.project.saveSync();

        // create the file
        const sourceFile = this.project.createSourceFile(path.join(basePath, `${contractKey}.ts`), undefined, { overwrite: true });
        sourceFile.insertText(0, writer => writer.writeLine(HEADER));



        const classes = file.getClasses();
        if (classes) {
            sourceFile.addImportDeclaration({
                moduleSpecifier: "@methodus/server",
                namedImports: [
                    'Proxy',
                    'MethodConfig',
                    'MethodConfigBase',
                    'Method',
                    'Param',
                    'Query',
                    'Headers',
                    'Files',
                    'Verbs',
                    'MethodResult',
                    'MethodMock',
                ]
            });

            sourceFile.addImportDeclaration({
                moduleSpecifier: `../models`,

            });

            sourceFile.addImportDeclaration({
                moduleSpecifier: `../contracts`,

            });


            const classDec = createWrappedNode(classes[0].compilerNode) as ClassDeclaration;


            try {
                const targetClass = sourceFile.addClass(classDec.getStructure());
                // //methodConfig decorator
                targetClass.getDecorators().forEach((decoratorRef) => {
                    if (decoratorRef.getName() === 'MethodConfig') {
                        decoratorRef.getArguments().forEach((argument, index) => {
                            if (index > 0) {
                                try {
                                    decoratorRef.removeArgument(argument);

                                } catch (error) {
                                    console.error(error);
                                }
                            }
                        });
                    }
                });


                targetClass.insertDecorator(0, {
                    name: "Proxy.ProxyClass",
                    arguments: [`'${this.packageName}'`, `'${classDec.getName()}'`, `'${file.getFilePath()}'`]
                });

                targetClass.getMethods().forEach((method) => {
                    this.HandleMethod(method);
                });

                targetClass.getStaticMethods().forEach((method) => {
                    this.HandleMethod(method);
                });
                sourceFile.saveSync();



            } catch (error) {
                console.error(error);
            }
        }


        // try {
        //     sourceFile.saveSync();


        // } catch (error) {
        //     console.error(error);
        // }


    }


    ProxifyFromModel(file, dirName: string, modelKey: string) {
        const basePath = path.join(this.projectPath, 'src', dirName);
        this.project.createDirectory(basePath);
        this.project.saveSync();

        // create the file
        const sourceFile = this.project.createSourceFile(path.join(basePath, `${modelKey}.ts`), undefined, { overwrite: true });
        sourceFile.insertText(0, writer => writer.writeLine(HEADER));


        const classes = file.getClasses();
        const classDec = createWrappedNode(classes[0].compilerNode) as ClassDeclaration;
        const modelClass = sourceFile.addClass(classDec.getStructure());


        modelClass.getProperties().forEach((prop) => {
            prop.getDecorators().forEach((decorator) => {
                decorator.remove();
            });
        });

        modelClass.removeExtends();
        modelClass.getDecorators().forEach((decorator) => {
            decorator.remove();
        });



        sourceFile.saveSync();

        // shelljs.mkdir('-p', this.target);
        // Console.log('Generating Model for:', className);
        // let modelBody = '';
        // try {
        //     let basicSourcePath = path.join(this.source, modelSource);
        //     if (this.buildConfiguration.srcFolder) {
        //         basicSourcePath = path.join(this.source, this.buildConfiguration.srcFolder, modelSource);
        //     }
        //     const content = fs.readFileSync(basicSourcePath, 'utf-8');
        //     let customeSection = '';
        //     /*start custom*/
        //     const openPhrase = '/*start custom*/', closePhrase = '/*end custom*/';
        //     const startCustom = content.indexOf(openPhrase);
        //     const endCustom = content.indexOf(closePhrase);
        //     if (startCustom > 0) {
        //         customeSection += content.substring(startCustom + openPhrase.length, endCustom);
        //         customeSection += '\n';
        //     }

        //     const modelSchema = new ModelSchema(className);
        //     let basicPath = path.join(this.source, modelSource);
        //     let sourcePath = path.join(this.source, modelSource);
        //     if (this.buildConfiguration.buildFolder) {
        //         basicPath = path.join(this.source, this.buildConfiguration.buildFolder, modelSource);
        //         sourcePath = basicPath;
        //     } else if (this.buildConfiguration.srcFolder) {
        //         basicPath = path.join(this.source, this.buildConfiguration.srcFolder, modelSource);
        //         sourcePath = basicPath;
        //     }
        //     if (this.buildConfiguration.srcFolder) {
        //         sourcePath = path.join(this.source, this.buildConfiguration.srcFolder, modelSource);
        //     }
        //     // load the text too
        //     const fileContent = fs.readFileSync(sourcePath, { encoding: 'utf-8' });

        //     const modelRequire = require(basicPath.replace('.ts', ''));
        //     let importRow = '';
        //     let importTypes: any = [];
        //     Object.keys(modelRequire).forEach((modelClassKey) => {

        //         const innerClass = modelRequire[modelClassKey];
        //         const odm = innerClass.odm;
        //         if (odm) {
        //             importTypes = this.concatImportTypes(odm, importTypes);

        //             if (fileContent.indexOf(`${modelClassKey}<`) > -1) {// check for generics
        //                 modelClassKey = modelClassKey + '<T>';
        //             }
        //             modelBody += `export interface ${modelClassKey} {\n`;
        //             this.filterProps(innerClass.odm.fields).forEach((odmItem) => {
        //                 modelSchema.properties[this.fixProperty(odm.fields[odmItem])] = odm.fields[odmItem];
        //                 // tslint:disable-next-line:max-line-length
        //                 modelBody += `${this.fixProperty(odm.fields[odmItem])}?: ${this.parseType(odm.fields[odmItem].type, importTypes)};\n`;
        //             });
        //             modelBody += `}\n`;
        //         }
        //     });

        //     if (importTypes.length) {
        //         importRow = `import { ${importTypes.join(',')} } from '../';\n`;
        //     }
        //     const modlesPath = path.join(this.target, ROOTSRC, 'models');
        //     shelljs.mkdir('-p', modlesPath);
        //     fs.writeFileSync(path.join(modlesPath, `${className.toLocaleLowerCase()}.ts`),
        //         `${HEADER}${importRow}${customeSection}${modelBody}\n`);

        //     const schemasPath = path.join(this.target, 'schemas');
        //     shelljs.mkdir('-p', schemasPath);
        //     const jsonPath = path.join(schemasPath, `${className.toLocaleLowerCase()}.json`);
        //     fs.writeFileSync(jsonPath, JSON.stringify(modelSchema, null, 2) + '\n');

        // } catch (ex) {
        //     console.error(ex);
        // }
    }



    Exportify(buildConfiguration: Configuration,
        target: string, packageName: string, isClient = false) {
        const indexPath = path.join(this.projectPath, 'src', 'index.ts');
        const indexFile = this.project.createSourceFile(indexPath, undefined, { overwrite: true });
        if (buildConfiguration.contracts) {
            const contracts = Object.assign({}, buildConfiguration.contracts);
            Object.keys(contracts).forEach((contractsKey: string) => {

                // indexFile.addImportDeclaration({
                //     moduleSpecifier: `./contracts/${contractsKey.toLocaleLowerCase()}`,
                //     namedImports: [contractsKey]
                // });
                indexFile.addExportDeclaration({
                    moduleSpecifier: `./contracts/${contractsKey.toLocaleLowerCase()}`,
                    namedExports: [contractsKey]
                });
            });
        }

        if (buildConfiguration.models) {
            Object.keys(buildConfiguration.models).forEach((modelKey: string) => {
                indexFile.addExportDeclaration({
                    moduleSpecifier: `./models/${modelKey.toLocaleLowerCase()}`,
                    namedExports: [modelKey]
                });
            });
        }


        //indexFile.saveSync();
        return indexFile;

    }

}