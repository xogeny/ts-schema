import { Path } from './access';
import { ISchema } from './schema';
import _ = require('lodash');

import { serializePath } from './access';

export enum IssueType {
    Unimplemented,
    InvalidSchema,
    InvalidInstanceType,
    InvalidMultiple,
    TooLarge,
    TooSmall,
    TooManyProperties,
    MissingProperty,
    PropertyMismatch,
    EnumMismatch,
    CardinalityError,
    InvalidType,
}

export class Issue {
    constructor(public type: IssueType, public section: string,
                public exp: string, public val: any) {
    }
}

export function schemaDetails(s: ISchema, spath: Path, oneOf: number, req: boolean)
: SchemaDetails {
    let sid = serializePath(spath);
    return {
        sid: sid,
        schema: _.clone(s), // Necessary?
        oneOf: oneOf,
        required: req,
    };
}

export interface SchemaDetails {
    schema: ISchema;
    sid: string;
    // Was this value required?
    required: boolean;
    // If the schema is a oneOf, which of the "one" matched
    oneOf: number;
};

export interface ValidationNode {
    path: Path;
    value: any;
    details: SchemaDetails;
    issues: Issue[];
}

export type NodeMap = { [key: string]: ValidationNode };

export type NodeCallback = (id: string, path: Path, schema: SchemaDetails,
                             v: any, issues: Issue[]) => void;

export function VerboseRecordNodes(result: NodeMap): NodeCallback {
    return (id: string, path: Path, details: SchemaDetails,
            v: any, issues: Issue[]) => {
                if (_.has(result, id)) {
                    console.warn("Overwriting result for ", id);
                }
                result[id] = {
                    path: path,
                    details: details,
                    value: v,
                    issues: issues,
                }
                console.log("post-keys = ", Object.keys(result));
            };
}

export function RecordNodes(result: NodeMap): NodeCallback {
    return (id: string, path: Path, details: SchemaDetails, v: any,
            issues: Issue[]) => {
                if (_.has(result, id)) {
                    console.warn("Overwriting result for ", id);
                }
                result[id] = {
                    path: path,
                    details: details,
                    value: v,
                    issues: issues,
                }
            }
}
