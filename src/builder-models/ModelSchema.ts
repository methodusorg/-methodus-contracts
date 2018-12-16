export class ModelSchema {
    /**
     *
     */
    constructor(name) {
        this.name = name;
        this.properties = {};

    }
    name: string;
    properties: any;
}

export class ModelSchemaNode {
    /**
     *
     */
    constructor(public node) {


    }
}
