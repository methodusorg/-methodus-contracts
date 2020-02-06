import {
    Project, ScriptTarget, createWrappedNode, ClassDeclaration, TypeFormatFlags, IndentationText, NewLineKind, QuoteKind,
    Decorator, MethodDeclaration, ConstructorDeclaration,
    FormatCodeSettings, UserPreferences, SourceFile
} from 'ts-morph';
import * as path from 'path';
import { HEADER, Configuration } from '../builder-models/interfaces';


export class MethodusProject {
    project: Project;
    sourceFiles: any[];

    constructor(public projectPath: string, public packageName: string) {
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
                declaration: true,
                sourceMap: true,
                preserveConstEnums: true,
                emitDecoratorMetadata: true,
                experimentalDecorators: true,
                outDir: `${projectPath}/lib`,
                tsConfigFilePath: `${projectPath}/tsconfig.json`
            }
        });
        this.project.addExistingSourceFiles(`${projectPath}/src/**/*{.ts}`);
        this.sourceFiles = this.project.getSourceFiles();
    }

    HandleConstructor(constructor, isClient = false) {
        if (isClient) {
            constructor.getParameters().forEach((param) => {
                const decorators = param.getDecorators();
                if (decorators.length) {
                    const decoratorRef = decorators[0];
                    if (decoratorRef.getText().indexOf('@M.') !== 0) {
                        decoratorRef.replaceWithText(`@M.${decoratorRef.getText().substr(1)}`)
                    }
                }
            });
        }
    }

    HandleMethod(method, isClient = false) {
        let isMocked = false;
        method.getDecorators().forEach((decoratorRef) => {
            if (decoratorRef.getName() === 'Method' || decoratorRef.getName() === 'MethodPipe') {
                decoratorRef.getArguments().forEach((argument, index) => {
                    if (index > 1) {
                        try {
                            decoratorRef.removeArgument(argument);
                            return;
                        } catch (error) {
                            console.error(error);
                        }
                    }
                    try {
                        if (isClient && argument.getText().indexOf('Verbs.') === 0) {
                            argument.replaceWithText(`M.${argument.getText()}`)
                        }
                    } catch (error) {
                        console.error(error);
                    }
                });


            }
            if (isClient) {
                try {
                    if (decoratorRef.getText().indexOf('@M.') !== 0) {
                        decoratorRef.replaceWithText(`@M.${decoratorRef.getText().substr(1)}`)
                    }
                } catch (error) {
                    console.error(error);
                }
            }
        });



        const xparams = method.getParameters();

        xparams.forEach((arg, i) => {
            const paramDecorator = arg.getDecorators();
            if (paramDecorator && paramDecorator[0] && paramDecorator[0].getName() === 'SecurityContext') {
                arg.remove();
            } else {
                if (isClient && paramDecorator[0] && paramDecorator[0].getText().indexOf('@M') !== 0) {
                    paramDecorator[0].replaceWithText(`@M.P.${paramDecorator[0].getText().substr(1)}`)
                }
            }
        });


        if (isClient) {
            method.getDecorators().forEach((decoratorRef) => {
                if (decoratorRef.getName() === 'MethodMock') {
                    const mockResult = decoratorRef.getStructure().arguments[0];
                    decoratorRef.remove();
                    method.getStatements().forEach((statement) => {
                        statement.remove();
                    });
                    const params = method.getStructure().parameters;
                    const argsRow = params.map((argument) => {
                        return argument.name;
                    }).join(',');
                    method.setBodyText(writer => writer.writeLine(`return  ${mockResult}.apply(this, [${argsRow}]);`));
                    isMocked = true;
                }
            });
        }




        if (!isMocked) {
            method.getStatements().forEach((statement) => {
                statement.remove();
            });
        }
        if (method.getReturnTypeNode()) {
            let retType = method.getReturnTypeNode().getText()
            if (retType.indexOf('Promise<') > -1) {
                retType = retType.replace('Promise<', '');
                retType = retType.substr(0, retType.length - 1);
            }

            if (isClient) {
                if (retType.indexOf('MethodResult<') > -1) {
                    retType = retType.replace('MethodResult<', '');
                    retType = retType.substr(0, retType.length - 1);
                }

                const retNode = method.getReturnTypeNode()
                if (retType === 'MethodResult') {
                    retType = 'any';
                }

                retNode.replaceWithText(`Promise<${retType}>`);
            }


            if (!isMocked) {
                const returnStr = `        return null! as ${retType};\n    `
                method.insertText(method.getBody().getEnd() - 1, returnStr);
            }

        }
    }


    HandleIncludeFile(sourceFile, dirName: string, isClient = false) {
        const basePath = path.join(this.projectPath, 'src', 'includes');
        this.project.createDirectory(basePath);
        this.project.saveSync();

        const filePath = path.join(basePath, sourceFile.getBaseName());
        const targetFile = this.project.createSourceFile(filePath, sourceFile.getStructure(), { overwrite: true });
        if (isClient) {
            targetFile.getImportDeclarations().forEach((importDec) => {
                if (importDec.getText().indexOf('@methodus/server') > -1) {
                    importDec.replaceWithText(`import * as M from '@methodus/client'`);
                }
            });
        }

        targetFile.saveSync();
    }

    ProxifyFromFile(file, dirName: string, contractKey, isClient = false) {

        const basePath = path.join(this.projectPath, 'src', dirName);
        this.project.createDirectory(basePath);
        this.project.saveSync();

        // create the file
        const sourceFile = this.project.createSourceFile(path.join(basePath, `${file.getBaseName()}`), undefined, { overwrite: true });
        sourceFile.insertText(0, writer => writer.writeLine(HEADER));

        const classes = file.getClasses();
        if (classes) {
            if (!isClient) {

                sourceFile.addImportDeclaration({
                    moduleSpecifier: '@methodus/server',
                    namedImports: [
                        'Proxy',
                        'MethodConfig',
                        'MethodConfigBase',
                        'Method',
                        'Param',
                        'Query',
                        'Headers',
                        'Body',
                        'SecurityContext',
                        'Files',
                        'Verbs',
                        'MethodResult',
                        'MethodMock',
                        'Injectable',
                        'Inject'
                    ]
                });
            } else {
                sourceFile.addImportDeclaration({
                    moduleSpecifier: '@methodus/client',
                    namespaceImport: 'M'
                });
            }
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
                    if (decoratorRef.getName() === 'MethodConfig' || decoratorRef.getName() === 'MethodConfigBase') {
                        decoratorRef.getArguments().forEach((argument, index) => {
                            if (index === 1) {
                                try {
                                    argument.replaceWithText('[]');
                                } catch (error) {
                                    console.error(error);
                                }
                            }
                        });
                    }

                    if (isClient && decoratorRef.getText().indexOf('@M.') !== 0) {
                        decoratorRef.replaceWithText(`@M.${decoratorRef.getText().substr(1)}`)
                    }
                });

                if (!isClient) {
                    targetClass.insertDecorator(0, {
                        name: 'Proxy.ProxyClass',
                        arguments: [`'${this.packageName}'`, `'${classDec.getName()}'`, `'${file.getFilePath()}'`]
                    });
                }

                targetClass.getConstructors().forEach((method) => {
                    this.HandleConstructor(method, isClient);
                });

                targetClass.getMethods().forEach((method) => {
                    this.HandleMethod(method, isClient);
                });

                targetClass.getStaticMethods().forEach((method) => {
                    this.HandleMethod(method, isClient);
                });

                if (isClient) {
                    sourceFile.addStatements(`new ${classDec.getName()}()`);
                }

                sourceFile.saveSync();


            } catch (error) {
                console.error(error);
            }
        }
    }


    ProxifyFromModel(file, dirName: string, modelKey: string) {
        const basePath = path.join(this.projectPath, 'src', dirName);
        this.project.createDirectory(basePath);
        this.project.saveSync();


        // create the file
        const sourceFile = this.project.createSourceFile(path.join(basePath, `${file.getBaseName()}`), undefined, { overwrite: true });


        const classes = file.getClasses();
        if (!classes[0]) {
            console.log(`file ${file.getFilePath()} doesn't contain a class model`);
            return;
        }
        const classDec = createWrappedNode(classes[0].compilerNode) as ClassDeclaration;
        const modelClass = sourceFile.addClass(classDec.getStructure());


        modelClass.getProperties().forEach((prop) => {
            prop.getDecorators().forEach((decorator) => {
                decorator.remove();
            });
        });

        modelClass.removeExtends();
        const constructor = modelClass.getConstructors()[0];
        if (constructor) {
            constructor.removeBody().addBody();
        }
        modelClass.getDecorators().forEach((decorator) => {
            decorator.remove();
        });


        const format: FormatCodeSettings = {

        }

        const prefernces: UserPreferences = {
            importModuleSpecifierPreference: 'non-relative'
        }

        try {

            sourceFile.fixMissingImports(format, prefernces);
            sourceFile.saveSync();
        } catch (error) {
            console.error(file.getFilePath());
            console.error(error);
        }
    }



    Exportify(buildConfiguration: Configuration,
        target: string, packageName: string, isClient = false): SourceFile {
        const indexPath = path.join(this.projectPath, 'src', 'index.ts');
        const indexFile = this.project.createSourceFile(indexPath, undefined, { overwrite: true });

        ['models', 'includes', 'contracts'].forEach((name) => {
            if (buildConfiguration[name] && Object.keys(buildConfiguration[name]).length > 0) {
                indexFile.addExportDeclaration({
                    moduleSpecifier: `./${name}/`,

                });
            }
        });
        indexFile.saveSync();
        return indexFile;
    }



}
