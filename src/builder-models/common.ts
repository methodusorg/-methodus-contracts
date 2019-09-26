import { ModelsIndex } from './exportify';
const PKGJSON = 'package.json';
import * as path from 'path';
import { MethodusProject } from '../ast/project';
import * as rimraf from 'rimraf';

const ROOTSRC = 'src';

export class Common {

    public static newCommonFlow(configuration, packageName, target, source, isClient) {
        const trashPath = path.join(target, 'build');
        rimraf.sync(trashPath);

        const sourceProject = new MethodusProject(source, packageName);
        const targetProject = new MethodusProject(target, packageName);

        if (configuration.models && Object.keys(configuration.models).length > 0) {
            Object.keys(configuration.models).forEach((modelKey) => {
                const model = configuration.models[modelKey];
                const modelFile = sourceProject.project.addExistingSourceFile(path.join(source, model.path));
                targetProject.ProxifyFromModel(modelFile, 'models', modelKey.toLocaleLowerCase());
            });
            ModelsIndex(configuration, source, path.join(target, ROOTSRC, 'models'), packageName);
        }


        if (configuration.contracts) {
            Object.keys(configuration.contracts).forEach((contractKey) => {
                const contract = configuration.contracts[contractKey];
                const sourceFile = sourceProject.project.addExistingSourceFile(path.join(source, contract.path));
                targetProject.ProxifyFromFile(sourceFile, 'contracts', contractKey.toLocaleLowerCase(), isClient);
            });
        }

        if (configuration.includes) {
            Object.keys(configuration.includes).forEach((includeKey) => {
                const include = configuration.includes[includeKey];
                const sourceFile = sourceProject.project.addExistingSourceFile(path.join(source, include.path));
                targetProject.HandleIncludeFile(sourceFile, 'includes', isClient);
            });
        }

        targetProject.Exportify(configuration, target, packageName, isClient);
        targetProject.project.getSourceFiles().forEach((finalFile) => {
            finalFile.fixMissingImports();

            finalFile.getImportDeclarations().forEach((importDec) => {
                const children = importDec.getChildren();

                if (children.length === 3) {
                    importDec.remove();
                }

            });
            finalFile.saveSync();
        });
    }
}
