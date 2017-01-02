export const NULL_TYPE = "null";

export const BOOL_TYPE = "boolean";
export const INT_TYPE = "integer";
export const NUM_TYPE = "number";
export const STR_TYPE = "string";

export const ARRAY_TYPE = "array";
export const OBJ_TYPE = "object";

export function isPrimitive(s: ISchema): boolean {
    return s.type===STR_TYPE ||
        s.type==BOOL_TYPE ||
        s.type==INT_TYPE ||
        s.type==NUM_TYPE ||
        s.type==NULL_TYPE;
}

export var types = {
    "null": NULL_TYPE,

    "bool": BOOL_TYPE,
    "int": INT_TYPE,
    "number": NUM_TYPE,
    "string": STR_TYPE,
    
    "array": ARRAY_TYPE,
    "object": OBJ_TYPE,
}

export type SchemaMap = { [key: string]: ISchema };

// JSON Schema interface
export interface ISchema {
    // numbers
    multipleOf?: number;           // 5.1.1
    maximum?: number;              // 5.1.2
    exclusiveMaximum?: boolean;    // 5.1.2
    minimum?: number;              // 5.1.3
    exclusiveMinimum?: boolean;    // 5.1.3

    // strings
    maxLength?: number;            // 5.2.1
    minLength?: number;            // 5.2.2
    pattern?: string;              // 5.2.3

    // arrays
    items?: ISchema | ISchema[];   // 5.3.1
    additionalItems?: boolean;     // 5.3.1
    maxItems?: number;             // 5.3.2
    minItems?: number;             // 5.3.3
    uniqueItems?: boolean;         // 5.3.4

    // objects
    maxProperties?: number;                   // 5.4.1
    minProperties?: number;                   // 5.4.2
    required?: Array<string>;                 // 5.4.3
    properties?: SchemaMap;                   // 5.4.4
    additionalProperties?: boolean | ISchema; // 5.4.4
    patternProperties?: SchemaMap;            // 5.4.4
    dependencies?: SchemaMap | string[];      // 5.4.5

    // universal
    enum?: any[];                  // 5.5.1
    type?: string | string[];      // 5.5.2
    allOf?: ISchema[];             // 5.5.3
    anyOf?: ISchema[];             // 5.5.4
    oneOf?: ISchema[];             // 5.5.5
    not?: ISchema[];               // 5.5.6
    definitions?: { [key: string]: ISchema } // 5.5.7
    
    title?: string;                // 6.1
    description?: string;          // 6.1
    "default"?: any;               // 6.2

    format?: string                // 7

    // Extra (non-standard) field for additional hints
    // about UI appearance or XenGen functionality.
    hints?: Hints;
    xengen?: XenGen;
}

export interface XenGen {
    fqn?: string;
}

export interface Hints {
    hidden?: boolean;
    readOnly?: boolean;
    image?: string;
    units?: string;
    order?: Array<string>;
    style?: string;
}
