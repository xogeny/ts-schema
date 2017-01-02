import _ = require('lodash');

import { ISchema, types } from './schema';
import { Path, PathElement, serializePath } from './access';
import { Issue, NodeMap, IssueType, NodeCallback, schemaDetails, 
         RecordNodes, VerboseRecordNodes, ValidationNode } from './nodes';

const isDefined = (v: any) => v!==undefined;

const isInteger = (v: any) => _.isNumber(v) && (v % 1)==0;

const typeContains = (s: ISchema, c: string): boolean => {
    if (_.isString(s.type)) {
        return s.type===c;
    }
    
    if (!_.isArray(s.type)) return false;
    
    return _.some(s.type, (v: string) => v===c);
}

function countIssues(m: NodeMap): number {
    let sum = 0;
    for(let k in m) {
        sum += m[k].issues.length;
    }
    return sum;
}

export function validationData(schema: ISchema, v: any, req: boolean,
                               path?: Path, spath?: Path)
: NodeMap {
    let ret: NodeMap = {};
    validate(schema, v, req, RecordNodes(ret), path, spath)
    return ret;
}

// TODO: Optimize this by checking to see if this particular
// value and schema have already been validated (assumes
// immutability).
export function validate(s: ISchema, v: any, req: boolean,
                         f: NodeCallback, path?: Path, spath?: Path)
: void {
    path = path || [];
    spath = spath || [];
    let oneOf: number = null;
    
    // Now lets go looking for issues
    let issues: Issue[] = [];

    // Helper routines
    let add = (t: IssueType, s: string, e: string, v: any) => {
        issues.push(new Issue(t, s, e, v));
    }
    let cat = (i: Issue[]) => {
        issues = issues.concat(i);
    }
    
    // We start with integers and numbers...
    if (_.isNumber(v)) {
        // 5.1.1
        if (isDefined(s.multipleOf)) {
            cat(check511(v as number, s.multipleOf));
        }

        // 5.1.2
        if (isDefined(s.maximum)) {
            cat(check512(v as number, s.exclusiveMaximum, s.maximum));
        }

        // 5.1.3
        if (isDefined(s.minimum)) {
            cat(check513(v as number, s.exclusiveMinimum, s.minimum));
        }
    }

    // 5.2 (strings)
    // 5.2.1: maxLength
    // 5.2.2: minLength
    // 5.2.3: pattern

    // 5.3 (arrays)
    // 5.3.1 additionalItems and items (TODO)
    // 5.3.2 maxItems
    // 5.3.3 minItems
    // 5.3.4 uniqueItems

    // 5.4 (objects)
    if (_.isObject(v)) {
        // 5.4.1 maxProperties
        cat(check541(v as {}, s.maxProperties));
        // 5.4.2 minProperties
        cat(check542(v as {}, s.maxProperties));
        // 5.4.3 required
        let [is, reqs] = check543(v as {}, s.required);
        cat(is);
        // 5.4.4 properties, additionalProperties, patternProperties
        cat(check544(v as {}, reqs, s.additionalProperties,
                     s.properties, s.patternProperties, f, path, spath));
        // 5.4.5 dependencies
        if (isDefined(s.dependencies)) {
            cat(check545(v, s, path, spath));
        }
    }

    // 5.5 (universal)
    // 5.5.1 enum
    if (isDefined(s.enum)) {
        cat(check551(v, s.enum));
    }

    // 5.5.2 type
    if (isDefined(s.type)) {
        cat(check552(v, s));
    }

    // 5.5.3 allOf
    if (isDefined(s.allOf)) {
        cat(check553(v, s));
    }

    // 5.5.4 anyOf
    if (isDefined(s.anyOf)) {
        cat(check554(v, s));
    }

    // 5.5.5 oneOf
    if (isDefined(s.oneOf)) {
        let [issues, o] = check555(v, s, f, path, spath);
        oneOf = o;
        cat(issues);
    }

    // 5.5.6 not
    if (isDefined(s.not)) {
        cat(check556(v, s));
    }

    // 5.5.7 definitions -> N/A

    // 7.3.1 format = date-time
    // 7.3.2 format = email
    // 7.3.3 format = hostname
    // 7.3.4 format = ipv4
    // 7.3.5 format = ipv6
    // 7.3.5 format = uri
    if (isDefined(s.format)) {
        cat(check73(v, s));
    }

    let id = serializePath(path);
    let details = schemaDetails(s, spath, oneOf, req);

    // TODO: Include information about if any of the children
    // failed validation (tail end)
    f(id, path, details, v, issues);
}

function check511(v: number, multipleOf: any): Issue[] {
    if (!_.isNumber(multipleOf)) {
        return [
            new Issue(IssueType.InvalidSchema, "5.1.1.1",
                      "be a number, but got "+typeof(multipleOf),
                      multipleOf)];
    }
    
    if (multipleOf==0) {
        return [new Issue(IssueType.InvalidSchema, "5.1.1.1",
                          "multipleOf cannot be zero", multipleOf)];
    }

    if (v % multipleOf !== 0) {
        return [new Issue(IssueType.InvalidMultiple,
                          "5.1.1.2",
                          "be a multiple of "+multipleOf, v)];
    }
    return [];
}

function check512(v: number, exmax: any, max: any): Issue[] {
    let ex: boolean = false;
    if (isDefined(exmax)) {
        if (!_.isBoolean(exmax)) {
            return [new Issue(IssueType.InvalidSchema, "5.1.2",
                              "exclusiveMaximum must be a boolean", exmax)];
        }
        ex = exmax as boolean;
    }
    if (!_.isNumber(max)) {
        return [new Issue(IssueType.InvalidSchema, "5.1.2",
                          "maximum must be a number", max)];
    }

    let m = max as number;
    if (ex) {
        if (v>=m) {
            return [new Issue(IssueType.TooLarge, "5.1.2",
                              "be less than "+m, v)];
        }
    } else {
        if (v>m) {
            return [new Issue(IssueType.TooLarge, "5.1.2",
                              "be less than or equal to "+m, v)];
        }
    }
    return [];
}

function check513(v: number, exmin: any, min: any): Issue[] {
    let ex: boolean = false;
    if (isDefined(exmin)) {
        if (!_.isBoolean(exmin)) {
            return [new Issue(IssueType.InvalidSchema, "5.1.3",
                              "exclusiveMinimum must be a boolean",
                             exmin)];
        }
        ex = exmin as boolean;
    }
    if (!_.isNumber(min)) {
        return [new Issue(IssueType.InvalidSchema, "5.1.3",
                          "maximum must be a number", min)];
    }

    let m = min as number;
    if (ex) {
        if (v<=m) {
            return [new Issue(IssueType.TooLarge, "5.1.3",
                              "be greater than "+m, v)];
        }
    } else {
        if (v<m) {
            return [new Issue(IssueType.TooLarge, "5.1.3",
                              "be greater than or equal to "+m, v)];
        }
    }
    return [];
}

function check541(v: {}, maxp: any): Issue[] {
    let keys = Object.keys(v);
    if (!isDefined(maxp)) return [];

    if (!isInteger(maxp) || (isInteger(maxp) && maxp<0)) {
        return [new Issue(IssueType.InvalidSchema, "5.4.1",
                          "be a positive integer", maxp)];
    }

    if (keys.length>maxp) {
        return [new Issue(IssueType.TooManyProperties, "5.4.1",
                          "contain less than "+maxp+" properties", keys)];
    }

    return [];
}

function check542(v: {}, minp: any): Issue[] {
    let keys = Object.keys(v);
    if (!isDefined(minp)) return [];

    if (!isInteger(minp) || (isInteger(minp) && minp<0)) {
        return [new Issue(IssueType.InvalidSchema, "5.4.1",
                          "be a non-negative integer", minp)];
    }

    if (keys.length<minp) {
        return [new Issue(IssueType.TooManyProperties, "5.4.1",
                          "contain at least "+minp+" properties", keys)];
    }

    return [];
}

// This function not only returns issues for any missing fields,
// it also returns a list of the required properties.  This is then
// used in check544 to report to children whether they are required.
// (see check544)
function check543(v: {}, required: any): [Issue[], string[]] {
    if (!isDefined(required)) return [[], []];

    if (!_.isArray(required)) {
        return [[new Issue(IssueType.InvalidSchema, "5.4.3",
                           "value must be an array", required)], []];
    }

    if (_.size(required)==0) {
        return [[new Issue(IssueType.InvalidSchema, "5.4.3",
                           "value cannot be empty", required)], []];
    }

    if (_.uniq(required).length!=required.length) {
        return [[new Issue(IssueType.InvalidSchema, "5.4.3",
                           "contents must be unique", required)], []];
    }

    if (!_.every(required, _.isString)) {
        return [[new Issue(IssueType.InvalidSchema, "5.4.3",
                           "must contain only strings", required)], []];
    }

    var ret: Issue[] = [];
    (required as string[]).forEach((req: string) => {
        if (!_.has(v, req)) {
            ret.push(new Issue(IssueType.MissingProperty, "5.4.3",
                               "contain property '"+req+"'", req));
        }
    });
    return [ret, (required as string[])];
}

function check544_prop(path: Path, spath: Path, k: string, reqs: string[],
                       checked: { [key: string]: boolean },
                       props: {}, pprops: {}, add: any, v: {},
                       f: NodeCallback) {
    // This is the path to the property
    let ppath = [...path, k];
    let pid = serializePath(ppath);
    let req = reqs.indexOf(k)>=0;

    // So far, the property hasn't been checked
    checked[k] = false;

    // We need to create a list of schemas to check this specific
    // child against.
    var toCheck: { schema: ISchema, t: string, id: string }[] = [];

    // If a matching key is found in "properties", use the schema
    // associated with that key.
    if (isDefined(props[k])) {
        toCheck.push({
            schema: props[k],
            t: "properties",
            id: k
        });
    }

    // Now check all patterns in "patternProperties" to see if the
    // property we are processing matches any of those patterns...
    for(let pattern in pprops) {
        let r = new RegExp(pattern);
        // If we find a match, add that schema to the list of
        // schemas to check
        if (r.test(k)) {
            toCheck.push({
                schema: pprops[pattern],
                t: "patternProperties",
                id: k
            });
        }
    }

    // If we get here *AND* we haven't found anything *AND*
    // additionalProperties is an object, then use that
    // schema as well.
    if (toCheck.length==0 && _.isObject(add)) {
        toCheck.push({schema: add, t: "additionalProperties", id: "ap"});
    }

    // Now, we need to check the value for the current property, k,
    // against all the schemas we've collected to check against.

    // We want to find the best match, so we'll use these to keep
    // track...
    let maxIssues = Infinity;
    let bestSchema: ISchema = null;
    let leastIssues: NodeMap = null;
    let tid: string = null;
    let sid: string = null;

    // If there is only one to check, we can simplify this
    // search for the optimal schema.
    // NB - This is an IMPORTANT optimization.  It avoids LOTS of unnecessary
    // copying for sub trees (in a geometrically costly way).
    if (toCheck.length==1) {
        validate(toCheck[0].schema, v[k], req, f, ppath, [...spath, toCheck[0].id]);
        checked[k] = true;
        return;
    }

    // TODO: Analyze this to try and improve performance.  The basic idea here
    // is to validate each possible matching schema and find the one that has
    // the fewest issues or the first one with no issues and then choose that
    // as the matching schema.  However, to do this, we currently run a validation
    // of the entire subtree and capture all issues (all the way down) and use
    // that as our metric for how "bad" or "good" a given schema is as a match.
    // But this can be quite costly (especially without the optimization above)
    // because of all the _.cloning and _.sizing.
    
    // Now, we loop over all schemas to check...
    for(let i=0; i<toCheck.length && maxIssues>0; i++) {
        // This will be used to track the issues associated
        // with each schema we consider.
        let submap: NodeMap = {}
        
        // Attempt to validate with this schema
        validate(toCheck[i].schema, v[k], req, RecordNodes(submap),
                 ppath, [...spath, toCheck[i].t, toCheck[i].id]);

        // Extract how many issues there were...
        let ni = countIssues(submap);

        // If this is better than anything we've found so far
        // (which is sure to be true on the first iteration, BTW),
        // record the details of this schema.
        if (ni<maxIssues) {
            maxIssues = ni;
            bestSchema = toCheck[i].schema;
            leastIssues = _.clone(submap);
            tid = toCheck[i].t;
            sid = toCheck[i].id;
        }
        // Also, marked that we actually checked this property
        // against a schema.
        checked[k] = true;
    }

    // Report back on the best case (if there was one)...
    if (bestSchema!==null) {
        for(let cid in leastIssues) {
            validate(bestSchema, v[k], req, f, ppath, [...spath, tid, sid]);
            // TODO: The following approach should be much faster
            // (no need to repeat the validation).  But it seems
            // to be the source of several bugs.  So I'm leaving this
            // as a future optimization.
            // Because it doesn't propagate issues with nested children?
            //f(cid, bestSchema, v[k], leastIssues[cid].issues);
        }
    }

    // Check if nothing matched but "additionalProperties==true"
    if (checked[k]===false && _.isBoolean(add) && add===true) {
        // Any additional properties are allowed, so do validation
        // with the most open schema possible (top type)
        validate({}, v[k], req, f, ppath, [...spath, "additionalProperties"]);
        checked[k] = true;
    }
}

// This function checks the values of additionalProperties, properties
// and patternProperties to see if all the provided keys in the value
// match one of those.  In addition, a list of required fields is passed
// in so that this function can include whether a given field is required
// when reporting about the children.  This is useful because if we don't
// cascade required fields, we'd have to navigate back to the *parent*
// schema some how (and even then, there are lots of corner cases
// to consider when validating required fields).
//
// To put it another way, if we didn't cascade information about required
// fields down, how would you determine if a given value was required?
function check544(v: {}, reqs: string[], add: any, props: any, pprops: any,
                  f: NodeCallback, path: Path, spath: Path)
: Issue[] {
    // Check if additionalProperties is defined correctly.  If not,
    // return an InvalidSchema issue.
    if (isDefined(add)) {
        // Should be either a boolean or an object
        if (!_.isBoolean(add) && !_.isObject(add)) {
            return [new Issue(IssueType.InvalidSchema, "5.4.4",
                              "additionalProperties must be a boolean or schema",
                               add)];
        }
    } else {
        // If additionalProperties isn't defined, use the default value.
        add = {};
    }

    // Check if properties is defined correctly.  If not,
    // return an InvalidSchema issue.
    if (isDefined(props)) {
        // Should be an object
        if (!_.isObject(props)) {
            return [new Issue(IssueType.InvalidSchema, "5.4.4",
                              "properties must be an object", props)];
        }
        // And the value associated with each key should be an
        // object as well.
        Object.keys(props).forEach((k: string) => {
            if (!_.isObject(props[k])) {
                return [new Issue(IssueType.InvalidSchema, "5.4.4",
                                  "each value in properties must be a schema",
                                  pprops[k])];
            }
        });
    } else {
        // If properties isn't defined, use the default value...
        props = {};
    }

    // Check if patternProperties is defined.
    if (isDefined(pprops)) {
        // If it isn't an object, return an InvalidSchema issue
        if (!_.isObject(pprops)) {
            return [new Issue(IssueType.InvalidSchema, "5.4.4",
                              "patternProperty must be an object", pprops)];
        }

        // Check each of the keys for issues...
        let issues: Issue[] = [];
        Object.keys(pprops).forEach((k: string) => {
            // The key should be a valid regular expression
            if (!_.isRegExp(k)) {
                issues.push(new Issue(IssueType.InvalidSchema, "5.4.4",
                                      "patternProperty key must be a "+
                                      "regular expression", k));
            }
            // And the value should be an object
            if (!_.isObject(pprops[k])) {
                issues.push(new Issue(IssueType.InvalidSchema, "5.4.4",
                                      "each value in patternProperty "+
                                      "must be a schema",
                                      pprops[k]));
            }
        });

        // If we found any issues with the patternProperties, just return
        // those for now.
        if (issues.length>0) return issues;
    } else {
        // If patternProperties isn't defined, use the default...
        pprops = {};
    }

    // Create an initially empty set of issues
    let issues: Issue[] = [];

    // Used to indicate if any validation was performed on
    // a given property (i.e., a matching schema was found)
    let checked: { [key: string]: boolean } = {};

    // Loop over all properties and try to find a schema to validate
    // against.
    Object.keys(v).forEach((k: string) => check544_prop(path, spath, k, reqs,
                                                        checked, props, pprops,
                                                        add, v, f));

    Object.keys(checked).forEach((k: string) => {
        if (checked[k]===false) {
            issues.push(new Issue(IssueType.PropertyMismatch, "5.4.4",
                                  "not contain property "+k, k));
        }
    });
    
    return issues;
}

function check545(v: any, s: ISchema, path: Path, spath: Path)
: Issue[] {
    if (!_.isObject(s.dependencies)) {
        return [new Issue(IssueType.InvalidSchema, "5.4.5",
                          "dependencies must be an object", s.dependencies)];
    }
    let issues: Issue[] = [];
    for(let k in s.dependencies) {
        let d = s.dependencies[k];
        if (_.isObject(d)) {
            let submap: NodeMap = {};
            let kpath = [...path, k];
            let kid = serializePath(kpath);
            validate(d, v[k], false, RecordNodes(submap), kpath,
                     [...spath, "dependencies", k]);
            issues = [...issues, ...(submap[kid].issues)];
        } else if (_.isString(d)) {
            if (!_.has(v, d)) {
                issues.push(new Issue(IssueType.MissingProperty, "5.4.5",
                                      "have a property named "+k, v));
            }
        } else {
            issues.push(new Issue(IssueType.InvalidSchema, "5.4.5",
                                  "dependencies properties must be "+
                                  "an object or a string", k));
        }
    }
    return issues;
}

function check551(v: any, evals: any): Issue[] {
    if (!_.isArray(evals)) {
        return [new Issue(IssueType.InvalidSchema, "5.5.1",
                          "enum must be an array", evals)];
    }

    for(let i=0; i<evals.length; i++) {
        if (_.some(evals, (x: any) => _.isEqual(x, v))) {
            return [];
        }
    }
    return [new Issue(IssueType.EnumMismatch, "5.5.1",
                      "be one of "+evals.toString(), v)];
}

function check552(v: any, s: ISchema): Issue[] {
    // 5.5.2 type
    if ((_.isNumber(v) && typeContains(s, types.number)) ||
        (_.isBoolean(v) && typeContains(s, types.bool)) ||
        (isInteger(v) && typeContains(s, types.int)) ||
        (_.isString(v) && typeContains(s, types.string)) ||
        (_.isNull(v) && typeContains(s, types.null)) ||
        (_.isObject(v) && typeContains(s, types.object)) ||
        (_.isArray(v) && typeContains(s, types.array))) {
        // Do nothing (just clearer to write this way...
    } else {
        if (_.isArray(s.type)) {
            let ta = s.type as string[];
            if (s.type.length==1) {
                return [new Issue(IssueType.InvalidType, "5.5.2",
                                  "be of type "+ta[0], v)];
            } else {
                return [new Issue(IssueType.InvalidType, "5.5.2",
                                  "be one of "+(ta.join(", ")), v)];
            }
        } else {
            return [new Issue(IssueType.InvalidType, "5.5.2",
                              "be of type "+s.type, v)];
        }
    }
    return [];
}

function check553(v: any, s: ISchema): Issue[] {
    return [new Issue(IssueType.Unimplemented, "5.5.3", "be implemented", null)];
}

function check554(v: any, s: ISchema): Issue[] {
    return [new Issue(IssueType.Unimplemented, "5.5.4", "be implemented", null)];
}

function check555(v: any, s: ISchema, f: NodeCallback, path: Path, spath: Path)
: [Issue[], number] {
    if (!_.isArray(s.oneOf)) {
        return [[new Issue(IssueType.InvalidSchema, "5.5.5",
                           "oneOf must be an array", s.oneOf)], null];
    }
    let match: ISchema = null;
    let matchn: number = null;
    let arr = s.oneOf as ISchema[];
    for(let i=0;i<arr.length;i++) {
        let submap: NodeMap = {}
        validate(arr[i], v, false, RecordNodes(submap), path, spath);
        if (countIssues(submap)===0) {
            if (match===null) {
                match = arr[i];
                matchn = i;
            } else {
                return [[new Issue(IssueType.CardinalityError, "5.5.5",
                                   "matched multiple options", v)], null];
            }
        }
    }
    if (match==null) {
        return [[new Issue(IssueType.CardinalityError, "5.5.5",
                           "matched no options", v)], null];
    }

    let opath = [...spath, "oneOf", matchn];
    validate(match, v, false, f, path, opath);
    return [[], matchn];
}

function check556(v: any, s: ISchema): Issue[] {
    return [new Issue(IssueType.Unimplemented, "5.5.5", "be implemented", null)];
}

function check73(v: any, s: ISchema): Issue[] {
    return [new Issue(IssueType.Unimplemented, "7.3.x", "be implemented", null)];
}
