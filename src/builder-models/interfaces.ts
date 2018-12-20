export interface KeysConfiguration {
    [key: string]: Configuration;
}

export interface ModelConfiguration {
    path: string;
}

export interface IncludeConfiguration {
    path: string;
}

export interface DeclarationConfiguration {
    path: string;
}

export interface BindindConfiguration {
    server: string;
    path: string;
}

export interface Configuration {
    buildPath: string;
    packageName: string;
    contractNameServer: string;
    contractNameClient: string;
    npmrc: string;
    models: Map<string, ModelConfiguration>;
    contracts: Map<string, ModelConfiguration>;
    includes: Map<string, IncludeConfiguration>;
    declarations: Map<string, DeclarationConfiguration>;
    bindings: Map<string, BindindConfiguration>;
    dependencies: Map<string, string>;
}

export const HEADER = `
// TMLA methodus contract.
// Generated at: ${new Date()}
`;
