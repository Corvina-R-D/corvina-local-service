import typia from "typia";
import * as artifactsService from "../services/artifacts-service";
import { ISearchArtifactsRequest } from "../services/artifacts-service";
export const assertISearchArtifactsRequest = (input: any): ISearchArtifactsRequest => {
    const $guard = (typia.createAssert as any).guard;
    const $join = (typia.createAssert as any).join;
    const __is = (input: any): input is ISearchArtifactsRequest => {
        const $join = (typia.createAssert as any).join;
        const $io0 = (input: any): boolean => "number" === typeof input.page && "number" === typeof input.pageSize && (undefined === input.search || "string" === typeof input.search) && (undefined === input.type || "string" === typeof input.type) && (undefined === input.labels || "object" === typeof input.labels && null !== input.labels && false === Array.isArray(input.labels) && $io1(input.labels)) && (undefined === input.repositoryName || "string" === typeof input.repositoryName) && (undefined === input.isLatest || "boolean" === typeof input.isLatest);
        const $io1 = (input: any): boolean => Object.keys(input).every(key => {
            const value = input[key];
            if (undefined === value)
                return true;
            if (RegExp(/(.*)/).test(key))
                return "string" === typeof value;
            return true;
        });
        return "object" === typeof input && null !== input && $io0(input);
    };
    if (false === __is(input))
        ((input: any, _path: string, _exceptionable: boolean = true): input is ISearchArtifactsRequest => {
            const $ao0 = (input: any, _path: string, _exceptionable: boolean = true): boolean => ("number" === typeof input.page || $guard(_exceptionable, {
                path: _path + ".page",
                expected: "number",
                value: input.page
            })) && ("number" === typeof input.pageSize || $guard(_exceptionable, {
                path: _path + ".pageSize",
                expected: "number",
                value: input.pageSize
            })) && (undefined === input.search || "string" === typeof input.search || $guard(_exceptionable, {
                path: _path + ".search",
                expected: "(string | undefined)",
                value: input.search
            })) && (undefined === input.type || "string" === typeof input.type || $guard(_exceptionable, {
                path: _path + ".type",
                expected: "(string | undefined)",
                value: input.type
            })) && (undefined === input.labels || ("object" === typeof input.labels && null !== input.labels && false === Array.isArray(input.labels) || $guard(_exceptionable, {
                path: _path + ".labels",
                expected: "(Record<string, string> | undefined)",
                value: input.labels
            })) && $ao1(input.labels, _path + ".labels", true && _exceptionable)) && (undefined === input.repositoryName || "string" === typeof input.repositoryName || $guard(_exceptionable, {
                path: _path + ".repositoryName",
                expected: "(string | undefined)",
                value: input.repositoryName
            })) && (undefined === input.isLatest || "boolean" === typeof input.isLatest || $guard(_exceptionable, {
                path: _path + ".isLatest",
                expected: "(boolean | undefined)",
                value: input.isLatest
            }));
            const $ao1 = (input: any, _path: string, _exceptionable: boolean = true): boolean => false === _exceptionable || Object.keys(input).every(key => {
                const value = input[key];
                if (undefined === value)
                    return true;
                if (RegExp(/(.*)/).test(key))
                    return "string" === typeof value || $guard(_exceptionable, {
                        path: _path + $join(key),
                        expected: "string",
                        value: value
                    });
                return true;
            });
            return ("object" === typeof input && null !== input || $guard(true, {
                path: _path + "",
                expected: "ISearchArtifactsRequest",
                value: input
            })) && $ao0(input, _path + "", true);
        })(input, "$input", true);
    return input;
};
export const assertIArtifactIn = (input: any): artifactsService.IArtifactIn => {
    const $guard = (typia.createAssert as any).guard;
    const $join = (typia.createAssert as any).join;
    const __is = (input: any): input is artifactsService.IArtifactIn => {
        const $join = (typia.createAssert as any).join;
        const $io0 = (input: any): boolean => "string" === typeof input.localPath && "string" === typeof input.repositoryName && (undefined === input.version || "string" === typeof input.version) && "string" === typeof input.type && (undefined === input.labels || "object" === typeof input.labels && null !== input.labels && false === Array.isArray(input.labels) && $io1(input.labels)) && (undefined === input.publicAccess || "boolean" === typeof input.publicAccess);
        const $io1 = (input: any): boolean => Object.keys(input).every(key => {
            const value = input[key];
            if (undefined === value)
                return true;
            if (RegExp(/(.*)/).test(key))
                return "string" === typeof value;
            return true;
        });
        return "object" === typeof input && null !== input && $io0(input);
    };
    if (false === __is(input))
        ((input: any, _path: string, _exceptionable: boolean = true): input is artifactsService.IArtifactIn => {
            const $ao0 = (input: any, _path: string, _exceptionable: boolean = true): boolean => ("string" === typeof input.localPath || $guard(_exceptionable, {
                path: _path + ".localPath",
                expected: "string",
                value: input.localPath
            })) && ("string" === typeof input.repositoryName || $guard(_exceptionable, {
                path: _path + ".repositoryName",
                expected: "string",
                value: input.repositoryName
            })) && (undefined === input.version || "string" === typeof input.version || $guard(_exceptionable, {
                path: _path + ".version",
                expected: "(string | undefined)",
                value: input.version
            })) && ("string" === typeof input.type || $guard(_exceptionable, {
                path: _path + ".type",
                expected: "string",
                value: input.type
            })) && (undefined === input.labels || ("object" === typeof input.labels && null !== input.labels && false === Array.isArray(input.labels) || $guard(_exceptionable, {
                path: _path + ".labels",
                expected: "(Record<string, string> | undefined)",
                value: input.labels
            })) && $ao1(input.labels, _path + ".labels", true && _exceptionable)) && (undefined === input.publicAccess || "boolean" === typeof input.publicAccess || $guard(_exceptionable, {
                path: _path + ".publicAccess",
                expected: "(boolean | undefined)",
                value: input.publicAccess
            }));
            const $ao1 = (input: any, _path: string, _exceptionable: boolean = true): boolean => false === _exceptionable || Object.keys(input).every(key => {
                const value = input[key];
                if (undefined === value)
                    return true;
                if (RegExp(/(.*)/).test(key))
                    return "string" === typeof value || $guard(_exceptionable, {
                        path: _path + $join(key),
                        expected: "string",
                        value: value
                    });
                return true;
            });
            return ("object" === typeof input && null !== input || $guard(true, {
                path: _path + "",
                expected: "IArtifactIn",
                value: input
            })) && $ao0(input, _path + "", true);
        })(input, "$input", true);
    return input;
};
export const assertIArtifact = (input: any): artifactsService.IArtifact => {
    const $guard = (typia.createAssert as any).guard;
    const $join = (typia.createAssert as any).join;
    const __is = (input: any): input is artifactsService.IArtifact => {
        const $join = (typia.createAssert as any).join;
        const $io0 = (input: any): boolean => "string" === typeof input.id && (undefined === input.author || "string" === typeof input.author) && "string" === typeof input.type && "number" === typeof input.size && "string" === typeof input.uploadedAt && (undefined === input.labels || "object" === typeof input.labels && null !== input.labels && false === Array.isArray(input.labels) && $io1(input.labels)) && "string" === typeof input.repositoryName && "string" === typeof input.resourceUrl && (undefined === input.versions || Array.isArray(input.versions) && input.versions.every((elem: any) => "string" === typeof elem)) && (undefined === input.isLatest || "boolean" === typeof input.isLatest);
        const $io1 = (input: any): boolean => Object.keys(input).every(key => {
            const value = input[key];
            if (undefined === value)
                return true;
            if (RegExp(/(.*)/).test(key))
                return "string" === typeof value;
            return true;
        });
        return "object" === typeof input && null !== input && $io0(input);
    };
    if (false === __is(input))
        ((input: any, _path: string, _exceptionable: boolean = true): input is artifactsService.IArtifact => {
            const $ao0 = (input: any, _path: string, _exceptionable: boolean = true): boolean => ("string" === typeof input.id || $guard(_exceptionable, {
                path: _path + ".id",
                expected: "string",
                value: input.id
            })) && (undefined === input.author || "string" === typeof input.author || $guard(_exceptionable, {
                path: _path + ".author",
                expected: "(string | undefined)",
                value: input.author
            })) && ("string" === typeof input.type || $guard(_exceptionable, {
                path: _path + ".type",
                expected: "string",
                value: input.type
            })) && ("number" === typeof input.size || $guard(_exceptionable, {
                path: _path + ".size",
                expected: "number",
                value: input.size
            })) && ("string" === typeof input.uploadedAt || $guard(_exceptionable, {
                path: _path + ".uploadedAt",
                expected: "string",
                value: input.uploadedAt
            })) && (undefined === input.labels || ("object" === typeof input.labels && null !== input.labels && false === Array.isArray(input.labels) || $guard(_exceptionable, {
                path: _path + ".labels",
                expected: "(Record<string, string> | undefined)",
                value: input.labels
            })) && $ao1(input.labels, _path + ".labels", true && _exceptionable)) && ("string" === typeof input.repositoryName || $guard(_exceptionable, {
                path: _path + ".repositoryName",
                expected: "string",
                value: input.repositoryName
            })) && ("string" === typeof input.resourceUrl || $guard(_exceptionable, {
                path: _path + ".resourceUrl",
                expected: "string",
                value: input.resourceUrl
            })) && (undefined === input.versions || (Array.isArray(input.versions) || $guard(_exceptionable, {
                path: _path + ".versions",
                expected: "(Array<string> | undefined)",
                value: input.versions
            })) && input.versions.every((elem: any, _index1: number) => "string" === typeof elem || $guard(_exceptionable, {
                path: _path + ".versions[" + _index1 + "]",
                expected: "string",
                value: elem
            }))) && (undefined === input.isLatest || "boolean" === typeof input.isLatest || $guard(_exceptionable, {
                path: _path + ".isLatest",
                expected: "(boolean | undefined)",
                value: input.isLatest
            }));
            const $ao1 = (input: any, _path: string, _exceptionable: boolean = true): boolean => false === _exceptionable || Object.keys(input).every(key => {
                const value = input[key];
                if (undefined === value)
                    return true;
                if (RegExp(/(.*)/).test(key))
                    return "string" === typeof value || $guard(_exceptionable, {
                        path: _path + $join(key),
                        expected: "string",
                        value: value
                    });
                return true;
            });
            return ("object" === typeof input && null !== input || $guard(true, {
                path: _path + "",
                expected: "IArtifact",
                value: input
            })) && $ao0(input, _path + "", true);
        })(input, "$input", true);
    return input;
};
export const assertIRepository = (input: any): artifactsService.IRepository => {
    const $guard = (typia.createAssert as any).guard;
    const $join = (typia.createAssert as any).join;
    const __is = (input: any): input is artifactsService.IRepository => {
        const $join = (typia.createAssert as any).join;
        const $io0 = (input: any): boolean => "string" === typeof input.id && (undefined === input.author || "string" === typeof input.author) && "string" === typeof input.uploadedAt && (undefined === input.labels || "object" === typeof input.labels && null !== input.labels && false === Array.isArray(input.labels) && $io1(input.labels)) && "string" === typeof input.name && "string" === typeof input.resourceUrl && (undefined === input.versions || Array.isArray(input.versions) && input.versions.every((elem: any) => "string" === typeof elem));
        const $io1 = (input: any): boolean => Object.keys(input).every(key => {
            const value = input[key];
            if (undefined === value)
                return true;
            if (RegExp(/(.*)/).test(key))
                return "string" === typeof value;
            return true;
        });
        return "object" === typeof input && null !== input && $io0(input);
    };
    if (false === __is(input))
        ((input: any, _path: string, _exceptionable: boolean = true): input is artifactsService.IRepository => {
            const $ao0 = (input: any, _path: string, _exceptionable: boolean = true): boolean => ("string" === typeof input.id || $guard(_exceptionable, {
                path: _path + ".id",
                expected: "string",
                value: input.id
            })) && (undefined === input.author || "string" === typeof input.author || $guard(_exceptionable, {
                path: _path + ".author",
                expected: "(string | undefined)",
                value: input.author
            })) && ("string" === typeof input.uploadedAt || $guard(_exceptionable, {
                path: _path + ".uploadedAt",
                expected: "string",
                value: input.uploadedAt
            })) && (undefined === input.labels || ("object" === typeof input.labels && null !== input.labels && false === Array.isArray(input.labels) || $guard(_exceptionable, {
                path: _path + ".labels",
                expected: "(Record<string, string> | undefined)",
                value: input.labels
            })) && $ao1(input.labels, _path + ".labels", true && _exceptionable)) && ("string" === typeof input.name || $guard(_exceptionable, {
                path: _path + ".name",
                expected: "string",
                value: input.name
            })) && ("string" === typeof input.resourceUrl || $guard(_exceptionable, {
                path: _path + ".resourceUrl",
                expected: "string",
                value: input.resourceUrl
            })) && (undefined === input.versions || (Array.isArray(input.versions) || $guard(_exceptionable, {
                path: _path + ".versions",
                expected: "(Array<string> | undefined)",
                value: input.versions
            })) && input.versions.every((elem: any, _index1: number) => "string" === typeof elem || $guard(_exceptionable, {
                path: _path + ".versions[" + _index1 + "]",
                expected: "string",
                value: elem
            })));
            const $ao1 = (input: any, _path: string, _exceptionable: boolean = true): boolean => false === _exceptionable || Object.keys(input).every(key => {
                const value = input[key];
                if (undefined === value)
                    return true;
                if (RegExp(/(.*)/).test(key))
                    return "string" === typeof value || $guard(_exceptionable, {
                        path: _path + $join(key),
                        expected: "string",
                        value: value
                    });
                return true;
            });
            return ("object" === typeof input && null !== input || $guard(true, {
                path: _path + "",
                expected: "IRepository",
                value: input
            })) && $ao0(input, _path + "", true);
        })(input, "$input", true);
    return input;
};
export const assertIPageIRepository = (input: any): artifactsService.IPage<artifactsService.IRepository> => {
    const $guard = (typia.createAssert as any).guard;
    const $join = (typia.createAssert as any).join;
    const __is = (input: any): input is artifactsService.IPage<artifactsService.IRepository> => {
        const $join = (typia.createAssert as any).join;
        const $io0 = (input: any): boolean => "number" === typeof input.number && "number" === typeof input.totalPages && "number" === typeof input.totalElements && "number" === typeof input.size && "boolean" === typeof input.last && (Array.isArray(input.content) && input.content.every((elem: any) => "object" === typeof elem && null !== elem && $io1(elem)));
        const $io1 = (input: any): boolean => "string" === typeof input.id && (undefined === input.author || "string" === typeof input.author) && "string" === typeof input.uploadedAt && (undefined === input.labels || "object" === typeof input.labels && null !== input.labels && false === Array.isArray(input.labels) && $io2(input.labels)) && "string" === typeof input.name && "string" === typeof input.resourceUrl && (undefined === input.versions || Array.isArray(input.versions) && input.versions.every((elem: any) => "string" === typeof elem));
        const $io2 = (input: any): boolean => Object.keys(input).every(key => {
            const value = input[key];
            if (undefined === value)
                return true;
            if (RegExp(/(.*)/).test(key))
                return "string" === typeof value;
            return true;
        });
        return "object" === typeof input && null !== input && $io0(input);
    };
    if (false === __is(input))
        ((input: any, _path: string, _exceptionable: boolean = true): input is artifactsService.IPage<artifactsService.IRepository> => {
            const $ao0 = (input: any, _path: string, _exceptionable: boolean = true): boolean => ("number" === typeof input.number || $guard(_exceptionable, {
                path: _path + ".number",
                expected: "number",
                value: input.number
            })) && ("number" === typeof input.totalPages || $guard(_exceptionable, {
                path: _path + ".totalPages",
                expected: "number",
                value: input.totalPages
            })) && ("number" === typeof input.totalElements || $guard(_exceptionable, {
                path: _path + ".totalElements",
                expected: "number",
                value: input.totalElements
            })) && ("number" === typeof input.size || $guard(_exceptionable, {
                path: _path + ".size",
                expected: "number",
                value: input.size
            })) && ("boolean" === typeof input.last || $guard(_exceptionable, {
                path: _path + ".last",
                expected: "boolean",
                value: input.last
            })) && ((Array.isArray(input.content) || $guard(_exceptionable, {
                path: _path + ".content",
                expected: "Array<IRepository>",
                value: input.content
            })) && input.content.every((elem: any, _index1: number) => ("object" === typeof elem && null !== elem || $guard(_exceptionable, {
                path: _path + ".content[" + _index1 + "]",
                expected: "IRepository",
                value: elem
            })) && $ao1(elem, _path + ".content[" + _index1 + "]", true && _exceptionable)));
            const $ao1 = (input: any, _path: string, _exceptionable: boolean = true): boolean => ("string" === typeof input.id || $guard(_exceptionable, {
                path: _path + ".id",
                expected: "string",
                value: input.id
            })) && (undefined === input.author || "string" === typeof input.author || $guard(_exceptionable, {
                path: _path + ".author",
                expected: "(string | undefined)",
                value: input.author
            })) && ("string" === typeof input.uploadedAt || $guard(_exceptionable, {
                path: _path + ".uploadedAt",
                expected: "string",
                value: input.uploadedAt
            })) && (undefined === input.labels || ("object" === typeof input.labels && null !== input.labels && false === Array.isArray(input.labels) || $guard(_exceptionable, {
                path: _path + ".labels",
                expected: "(Record<string, string> | undefined)",
                value: input.labels
            })) && $ao2(input.labels, _path + ".labels", true && _exceptionable)) && ("string" === typeof input.name || $guard(_exceptionable, {
                path: _path + ".name",
                expected: "string",
                value: input.name
            })) && ("string" === typeof input.resourceUrl || $guard(_exceptionable, {
                path: _path + ".resourceUrl",
                expected: "string",
                value: input.resourceUrl
            })) && (undefined === input.versions || (Array.isArray(input.versions) || $guard(_exceptionable, {
                path: _path + ".versions",
                expected: "(Array<string> | undefined)",
                value: input.versions
            })) && input.versions.every((elem: any, _index2: number) => "string" === typeof elem || $guard(_exceptionable, {
                path: _path + ".versions[" + _index2 + "]",
                expected: "string",
                value: elem
            })));
            const $ao2 = (input: any, _path: string, _exceptionable: boolean = true): boolean => false === _exceptionable || Object.keys(input).every(key => {
                const value = input[key];
                if (undefined === value)
                    return true;
                if (RegExp(/(.*)/).test(key))
                    return "string" === typeof value || $guard(_exceptionable, {
                        path: _path + $join(key),
                        expected: "string",
                        value: value
                    });
                return true;
            });
            return ("object" === typeof input && null !== input || $guard(true, {
                path: _path + "",
                expected: "IPage<IRepository>",
                value: input
            })) && $ao0(input, _path + "", true);
        })(input, "$input", true);
    return input;
};
export const stringifyIArtifact = (input: artifactsService.IArtifact): string => {
    const $string = (typia.createStringify as any).string;
    const $join = (typia.createStringify as any).join;
    const $io1 = (input: any): boolean => Object.keys(input).every(key => {
        const value = input[key];
        if (undefined === value)
            return true;
        if (RegExp(/(.*)/).test(key))
            return "string" === typeof value;
        return true;
    });
    const $so0 = (input: any): any => `{${undefined === input.author ? "" : `"author":${undefined !== input.author ? $string(input.author) : undefined},`}${undefined === input.labels ? "" : `"labels":${undefined !== input.labels ? $so1(input.labels) : undefined},`}${undefined === input.versions ? "" : `"versions":${undefined !== input.versions ? `[${input.versions.map((elem: any) => $string(elem)).join(",")}]` : undefined},`}${undefined === input.isLatest ? "" : `"isLatest":${undefined !== input.isLatest ? input.isLatest : undefined},`}"id":${$string(input.id)},"type":${$string(input.type)},"size":${input.size},"uploadedAt":${$string(input.uploadedAt)},"repositoryName":${$string(input.repositoryName)},"resourceUrl":${$string(input.resourceUrl)}}`;
    const $so1 = (input: any): any => `{${Object.entries(input).map(([key, value]: [string, any]) => { if (undefined === value)
        return ""; return `${JSON.stringify(key)}:${$string(value)}`; }).filter(str => "" !== str).join(",")}}`;
    return $so0(input);
};
export const stringifyIPageIArtifact = (input: artifactsService.IPage<artifactsService.IArtifact>): string => {
    const $string = (typia.createStringify as any).string;
    const $join = (typia.createStringify as any).join;
    const $io1 = (input: any): boolean => "string" === typeof input.id && (undefined === input.author || "string" === typeof input.author) && "string" === typeof input.type && "number" === typeof input.size && "string" === typeof input.uploadedAt && (undefined === input.labels || "object" === typeof input.labels && null !== input.labels && false === Array.isArray(input.labels) && $io2(input.labels)) && "string" === typeof input.repositoryName && "string" === typeof input.resourceUrl && (undefined === input.versions || Array.isArray(input.versions) && input.versions.every((elem: any) => "string" === typeof elem)) && (undefined === input.isLatest || "boolean" === typeof input.isLatest);
    const $io2 = (input: any): boolean => Object.keys(input).every(key => {
        const value = input[key];
        if (undefined === value)
            return true;
        if (RegExp(/(.*)/).test(key))
            return "string" === typeof value;
        return true;
    });
    const $so0 = (input: any): any => `{"number":${input.number},"totalPages":${input.totalPages},"totalElements":${input.totalElements},"size":${input.size},"last":${input.last},"content":${`[${input.content.map((elem: any) => $so1(elem)).join(",")}]`}}`;
    const $so1 = (input: any): any => `{${undefined === input.author ? "" : `"author":${undefined !== input.author ? $string(input.author) : undefined},`}${undefined === input.labels ? "" : `"labels":${undefined !== input.labels ? $so2(input.labels) : undefined},`}${undefined === input.versions ? "" : `"versions":${undefined !== input.versions ? `[${input.versions.map((elem: any) => $string(elem)).join(",")}]` : undefined},`}${undefined === input.isLatest ? "" : `"isLatest":${undefined !== input.isLatest ? input.isLatest : undefined},`}"id":${$string(input.id)},"type":${$string(input.type)},"size":${input.size},"uploadedAt":${$string(input.uploadedAt)},"repositoryName":${$string(input.repositoryName)},"resourceUrl":${$string(input.resourceUrl)}}`;
    const $so2 = (input: any): any => `{${Object.entries(input).map(([key, value]: [string, any]) => { if (undefined === value)
        return ""; return `${JSON.stringify(key)}:${$string(value)}`; }).filter(str => "" !== str).join(",")}}`;
    return $so0(input);
};
