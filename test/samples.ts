import { ISchema } from '../src';
import _ = require('lodash');

export const name: ISchema = {
    "type": "string"
};

export const ageNoDef: ISchema = {
    "description": "Age in years",
    "hints": { "units": "years" },
    "type": "integer",
    "minimum": 0,
    "maximum": 150,
}

export const ageNoDefEx: ISchema = {
    "description": "Age in years",
    "type": "integer",
    "hints": { "units": "years" },
    "minimum": 0,
    "exclusiveMinimum": true,
    "maximum": 150,
    "exclusiveMaximum": true,
}

export const ageDef18: ISchema = {
    "description": "Age in years",
    "hints": { "units": "years" },
    "type": "integer",
    "minimum": 0,
    "default": 18,
}

export const sample1: ISchema = {
    "title": "Example Schema",
    "type": "object",
    "properties": {
        "firstName": {
            "type": "string",
            "title": "First Name",
        },
        "lastName": {
            "type": "string",
            "title": "Last Name",
        },
        "age": ageNoDef,
    },
    "required": ["firstName", "lastName"]
}

export const sample2: ISchema = {
    "title": "Example Schema",
    "type": "object",
    "properties": {
        "firstName": name,
        "lastName": name,
        "age": ageDef18,
    },
    "additionalProperties": true,
    "required": ["firstName", "lastName"]
}

export const sample3: ISchema = {
    "title": "Example Schema",
    "type": "object",
    "properties": {
        "firstName": name,
        "lastName": name,
        "age": ageDef18,
    },
    "additionalProperties": { "type": "string" },
    "required": ["firstName", "lastName"]
}

export const mortgage: ISchema = {
    "type": "object",
    "title": "Mortgage Application",
    "properties": {
        "signer": _.assign({}, sample1, { "title": "Signer" }),
        "co-signer": sample1, // TODO: Make oneOf(null, sample1)
    }
}

export const mortgageData: any = {
    "signer": {
        "firstName": "Barack",
        "lastName": "Obama",
        "age": 52,
    },
    "co-signer": {
        "firstName": "Michelle",
        "lastName": "Obama",
        "age": 50,
    }
}

export const choice1: ISchema = {
    "enum": [1, "hi", true]
}

export const cond: ISchema = {
    "default": { "key": "key1" },
    title: "One Of",
    oneOf: [{
        type: "object",
        title: "Key 1",
        properties: {
            "key": {
                "type": "string",
                "enum": ["key1", "key2"],
            },
        },
        dependencies: {
            "key": {
                "enum": ["key1"],
            }
        },
    }, {
            type: "object",
            title: "Key 2",
            properties: {
                "key": {
                    "type": "string",
                    "enum": ["key1", "key2"],
                },
            },
            dependencies: {
                "key": {
                    "enum": ["key2"],
                }
            },
        }]
};

export const realWorld: ISchema = {
    hints: {
        order: [
            "reactor",
            "controller",
            "coolant_loop",
        ],
        style: "tab"
    },
    "properties": {
        "controller": {
            "description": "Controller",
            "hints": {
                "image": "/static/reactor.png",
                "order": [
                    "Advanced",
                    "Basic"
                ],
                "style": "",
            },
            "properties": {
                "Advanced": {
                    "description": "Advanced",
                    "hints": {
                        "image": "/static/reactor.png",
                        "order": ["valve_pos"],
                        "style": "",
                    },
                    "properties": {
                        "valve_pos": {
                            "default": 1,
                            "description": "Normalized valve position",
                            "title": "Valve Position",
                            "type": "number",
                            "xengen": {
                                "fqn": "controller.valve_pos"
                            }
                        }
                    },
                    "title": "Advanced",
                    "type": "object"
                },
                "Basic": {
                    "description": "Basic",
                    "hints": {
                        "order": [
                            "mflow_pump"
                        ],
                        "style": "",
                    },
                    "properties": {
                        "mflow_pump": {
                            "default": 0.01,
                            "description": "Pump flow",
                            "hints": {
                                "units": "kg/s",
                            },
                            "title": "Nominal pump flow",
                            "type": "number",
                            "xengen": {
                                "fqn": "controller.mflow_pump"
                            },
                        }
                    },
                    "title": "Basic",
                    "type": "object"
                }
            },
            "title": "Controller",
            "type": "object"
        },
        "coolant_loop": {
            "description": "Coolant Loop",
            "hints": {
                "image": "/static/reactor.png",
                "order": [
                    "Advanced",
                    "Basic"
                ],
                "style": "",
            },
            "properties": {
                "Advanced": {
                    "description": "Advanced",
                    "hints": {
                        "order": [
                            "diameter",
                            "length"
                        ],
                        "style": "",
                    },
                    "properties": {
                        "diameter": {
                            "default": 0.01,
                            "description": "Diameter of circular pipe",
                            "hints": {
                                "units": "m",
                            },
                            "title": "Radiator Diameter",
                            "type": "number",
                            "xengen": {
                                "fqn": "coolant_loop.diameter"
                            },
                        },
                        "length": {
                            "default": 10,
                            "description": "Length",
                            "hints": {
                                "units": "m",
                            },
                            "title": "Radiator Length",
                            "type": "number",
                            "xengen": {
                                "fqn": "coolant_loop.length"
                            }
                        }
                    },
                    "title": "Advanced",
                    "type": "object"
                },
                "Basic": {
                    "description": "Basic",
                    "hints": {
                        "order": [
                            "T_amb",
                            "convec_table[1,1]",
                            "convec_table[1,2]",
                            "convec_table[2,1]",
                            "convec_table[2,2]",
                            "convec_table[3,1]",
                            "convec_table[3,2]",
                            "cooling_factor"
                        ],
                        "style": "",
                    },
                    "properties": {
                        "T_amb": {
                            "default": 293.15,
                            "description": "ambient temperature",
                            "hints": {
                                "units": "K",
                            },
                            "title": "Ambient Temperature",
                            "type": "number",
                            "xengen": {
                                "fqn": "coolant_loop.T_amb"
                            }
                        },
                        "convec_table[1,1]": {
                            "default": 0.001,
                            "description": "Table matrix (grid = first column; e.g., table=[0,2])",
                            "title": "Convection Table",
                            "type": "number",
                            "xengen": {
                                "fqn": "coolant_loop.convec_table[1,1]"
                            }
                        },
                        "convec_table[1,2]": {
                            "default": 1,
                            "description": "Table matrix (grid = first column; e.g., table=[0,2])",
                            "title": "Convection Table",
                            "type": "number",
                            "xengen": {
                                "fqn": "coolant_loop.convec_table[1,2]"
                            },
                        },
                        "convec_table[2,1]": {
                            "default": 0.002,
                            "description": "Table matrix (grid = first column; e.g., table=[0,2])",
                            "title": "Convection Table",
                            "type": "number",
                            "xengen": {
                                "fqn": "coolant_loop.convec_table[2,1]"
                            }
                        },
                        "convec_table[2,2]": {
                            "default": 2,
                            "description": "Table matrix (grid = first column; e.g., table=[0,2])",
                            "title": "Convection Table",
                            "type": "number",
                            "xengen": {
                                "fqn": "coolant_loop.convec_table[2,2]"
                            }
                        },
                        "convec_table[3,1]": {
                            "default": 0.003,
                            "description": "Table matrix (grid = first column; e.g., table=[0,2])",
                            "title": "Convection Table",
                            "type": "number",
                            "xengen": {
                                "fqn": "coolant_loop.convec_table[3,1]"
                            }
                        },
                        "convec_table[3,2]": {
                            "default": 3,
                            "description": "Table matrix (grid = first column; e.g., table=[0,2])",
                            "title": "Convection Table",
                            "type": "number",
                            "xengen": {
                                "fqn": "coolant_loop.convec_table[3,2]"
                            }
                        },
                        "cooling_factor": {
                            "default": 1,
                            "description": "radiator heat transfer enhancement",
                            "title": "Heat Transfer Enhancement",
                            "type": "number",
                            "xengen": {
                                "fqn": "coolant_loop.cooling_factor"
                            }
                        }
                    },
                    "title": "Basic",
                    "type": "object"
                }
            },
            "title": "Coolant Loop",
            "type": "object"
        },
        "reactor": {
            "description": "Reactor",
            "hints": {
                "image": "/static/reactor.png",
                "order": [
                    "Basic"
                ],
                "style": "",
            },
            "properties": {
                "Basic": {
                    "description": "Basic",
                    "hints": {
                        "order": [
                            "rtype",
                            "C_rod",
                            "C_rod2",
                            "cooling",
                            "Q_reactor",
                            "sweep",
                        ],
                        "style": "",
                    },
                    "properties": {
                        "rtype": {
                            "default": "fission",
                            "type": "string",
                            "title": "Reactor Type",
                            "description": "Pick your poison",
                            "enum": ["fission", "fusion"],
                        },
                        "C_rod": {
                            "default": 10,
                            "description": "Heat capacity of element (= cp*m)",
                            "hints": {
                                "units": "J/K",
                            },
                            "minimum": 0,
                            "title": "Rod Heat Capacitance",
                            "type": "number",
                            "xengen": {
                                "fqn": "reactor.C_rod"
                            }
                        },
                        "C_rod2": {
                            hints: {
                                readOnly: true,
                            },
                            "description": "A computed property",
                            "title": "Capacitance Squared",
                            "type": "number",
                            "maximum": 100,
                        },
                        "cooling": {
                            "default": true,
                            "description": "Activate retro-encabulator",
                            "title": "Retro-Encabulator",
                            "type": "boolean",
                        },
                        "Q_reactor": {
                            "default": 1500,
                            "description": "fixed reactor heat",
                            "hints": {
                                "units": "W",
                            },
                            "minimum": -10000,
                            "maximum": 200000,
                            "title": "Reactor Heat",
                            "type": "number",
                            "xengen": {
                                "fqn": "reactor.Q_reactor"
                            }
                        },
                        "sweep": {
                            "title": "Sweep Data",
                            "description": "Sweep of some stuff",
                            "type": "array",
                            "items": {
                                "title": "A data point",
                                "description": "Data collected somewhere",
                                "type": "object",
                                "hints": {
                                    "order": ["y", "x", "z"],
                                },
                                "properties": {
                                    "x": {
                                        "title": "X Value",
                                        "type": "number"
                                    },
                                    "y": {
                                        "title": "Input",
                                        "description": "Independent variable",
                                        "type": "number"
                                    },
                                    "z": {
                                        "title": "Output",
                                        "type": "number"
                                    },
                                }
                            }
                        }
                    },
                    "title": "Basic",
                    "type": "object"
                }
            },
            "title": "Reactor",
            "type": "object"
        }
    },
    "title": "",
    "type": "object"
};
