import mocha = require('mocha');
import _ = require('lodash');

import * as samples from './samples';

import schema = require('../src');

import { expect } from 'chai';

function noissues(s: schema.NodeMap, id: string) {
    let issues = s[id].issues;
    let n = _.size(issues);
    if (n!==0) {
        console.log("Unexpected issues: ", issues);
    }
    expect(n).to.equal(0);
}

function issues(s: schema.NodeMap, id: string, ...section: string[]) {
    expect(_.size(s[id].issues)).to.equal(section.length);
    for(let i=0; i<section.length; i++) {
        expect(s[id].issues[i].section).to.equal(section[i]);
    }
}

describe("Section 5.1", () => {
    it("should allow numbers", () => {
        let v = schema.validationData(samples.ageNoDef, 10, false);
        noissues(v, "");
    });
    it("should catch numbers that are too large (non-ex)", () => {
        let v = schema.validationData(samples.ageNoDef, 150, false);
        noissues(v, "");
        
        v = schema.validationData(samples.ageNoDef, 200, false);
        issues(v, "", "5.1.2");
    });
    it("should catch numbers that are too small (non-ex)", () => {
        let v = schema.validationData(samples.ageNoDef, 0, false);
        noissues(v, "");
        
        v = schema.validationData(samples.ageNoDef, -10, false);
        issues(v, "", "5.1.3");
    });
    it("should catch numbers that are too large (exclusive)", () => {
        let v = schema.validationData(samples.ageNoDefEx, 150, false);
        issues(v, "", "5.1.2");
        
        v = schema.validationData(samples.ageNoDef, 200, false);
        issues(v, "", "5.1.2");
    });
    it("should catch numbers that are too small (exclusive)", () => {
        let v = schema.validationData(samples.ageNoDefEx, 0, false);
        issues(v, "", "5.1.3");
        
        v = schema.validationData(samples.ageNoDef, -10, false);
        issues(v, "", "5.1.3");        
    });
});

describe("Section 5.4", () => {
    it("should check required properties", () => {
        let v = schema.validationData(samples.sample1, {}, false);
        issues(v, "", "5.4.3", "5.4.3");

        v = schema.validationData(samples.sample1, {
            "firstName": "Michael",
            "lastName": "Tiller",
            "age": 40,
        }, false);

        expect(v).keys("", "/age", "/firstName", "/lastName");
        noissues(v, "");
        expect(v["/age"].details.required).to.be.equal(false);
        expect(v["/firstName"].details.required).to.be.equal(true);
        expect(v["/lastName"].details.required).to.be.equal(true);
    })
    it("should validate children", () => {
        let v = schema.validationData(samples.sample1, {
            "firstName": "Michael",
            "lastName": "Tiller",
            "age": "40",
        }, false);
        // No issues with this level of the scheme, but there should
        // be issues with the children...
        expect(v).keys("", "/age", "/firstName", "/lastName");
        noissues(v, "");
        issues(v, "/age", "5.5.2");
    });
    it("should validate grand-children", () => {
        let v = schema.validationData(samples.mortgage, samples.mortgageData, false);
        expect(v).keys("", "/co-signer", "/co-signer/age",
                       "/co-signer/firstName", "/co-signer/lastName",
                       "/signer", "/signer/age",
                       "/signer/firstName", "/signer/lastName");
        expect(v["/signer/firstName"].details.schema).to.be.deep.equal(
            samples.mortgage.properties["signer"].properties["firstName"]);
        expect(v["/signer/firstName"].details.schema.type).to.be.equal("string");
    });
    it("should allow additionalProperties", () => {
        // This schema allows any additional properties
        let v = schema.validationData(samples.sample2, {
            "firstName": "Michael",
            "lastName": "Tiller",
            "age": 40,
            "extra": 5,
            "more": true,
        }, false);

        // No issues with this level of the scheme, but there should
        // be issues with the children...
        noissues(v, "");

        // This schema only allows strings for additional properties
        v = schema.validationData(samples.sample3, {
            "firstName": "Michael",
            "lastName": "Tiller",
            "age": 40,
            "extra": 5,
            "more": true,
        }, false);
        // No issues with this level of the scheme, but there should
        // be issues with the children...
        noissues(v, "");
        noissues(v, "/firstName");
        noissues(v, "/lastName");
        issues(v, "/extra", "5.5.2");
        issues(v, "/more", "5.5.2");
    });
});

describe("Section 5.5", () => {
    it("should check number enums", () => {
        let v = schema.validationData(samples.choice1, 2, false);
        issues(v, "", "5.5.1");

        v = schema.validationData(samples.choice1, 1, false);
        noissues(v, "");

        v = schema.validationData(samples.choice1, "hi", false);
        noissues(v, "");

        v = schema.validationData(samples.choice1, "bye", false);
        issues(v, "", "5.5.1");

        v = schema.validationData(samples.choice1, true, false);
        noissues(v, "");

        v = schema.validationData(samples.choice1, null, false);
        issues(v, "", "5.5.1");
        
        v = schema.validationData(samples.choice1, false, false);
        issues(v, "", "5.5.1");
    });
    it("should catch invalid numbers", () => {
        let v = schema.validationData(samples.ageNoDef, "10", false);
        issues(v, "", "5.5.2");
    });
    it("should check oneOf", () => {
        let v = schema.validationData(samples.cond, {"key": "key2"}, false);
        noissues(v, "");
    });
});
