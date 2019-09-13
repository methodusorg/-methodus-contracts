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

        xparams.forEach((arg, i) => {
            const paramDecorator = arg.getDecorators();
            if (paramDecorator[0].getName() === 'SecurityContext') {
                arg.remove();
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
        method.insertText(method.getBody().getEnd() - 1, `        return new MethodResult(null!);\n    `);


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
    }



    Exportify(buildConfiguration: Configuration,
        target: string, packageName: string, isClient = false) {
        const indexPath = path.join(this.projectPath, 'src', 'index.ts');
        const indexFile = this.project.createSourceFile(indexPath, undefined, { overwrite: true });
        if (buildConfiguration.contracts) {
            const contracts = Object.assign({}, buildConfiguration.contracts);
            Object.keys(contracts).forEach((contractsKey: string) => {
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

        indexFile.saveSync();
        return indexFile;
    }
}
