interface PortConfig {
    datatype: string;
    description?: string;
    control?: boolean;
    required?: boolean;
    addressable?: boolean;
    scoped?: boolean;
}
interface OutPortConfig extends PortConfig {
}
interface InPortConfig extends PortConfig {
    buffered?: boolean;
    triggering?: boolean;
    default?: any;
    values?: any[];
}
interface NofloComponentOptions {
    description?: string;
    icon?: string;
    ordered?: boolean;
    autoOrdering?: boolean;
    activateOnInput?: boolean;
    inPorts?: {
        [portName: string]: InPortConfig;
    };
    outPorts?: {
        [portName: string]: OutPortConfig;
    };
}
declare type ProcessHandler = (input: ProcessInput, output: ProcessOutput) => void;
interface ProcessInput {
    hasData: (...args: string[]) => boolean;
    getData: (name: string) => any;
}
interface ProcessOutput {
    send: (val: object) => void;
    done: () => void;
}
declare class NofloComponent {
    constructor(options?: NofloComponentOptions);
    description: string;
    icon: string;
    inPorts: {
        add: (name: string, config: InPortConfig) => void;
    };
    outPorts: {
        add: (name: string, config: OutPortConfig) => void;
    };
    process: (handler: ProcessHandler) => void;
}
export { NofloComponent, NofloComponentOptions, PortConfig, OutPortConfig, InPortConfig, ProcessHandler, ProcessInput, ProcessOutput };
