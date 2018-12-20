declare type FisFile = {
    fullname: string;
    id: string;
    isHtmlLike: boolean;
    realpathNoExt: string;
    subpath: string;
    cache: any;
    release: string | boolean;
};
declare type ArtOption = {
    define?: any;
    filename: string;
    extname: string;
    minimize: boolean;
    cache: boolean;
    compileDebug: boolean;
    escape: boolean;
    root: string;
    rules: any[];
    resolveFilename: any;
    imports: {
        [key: string]: Function;
    };
    native: boolean;
    art: boolean;
};
declare const _default: (content: string, file: FisFile, options: ArtOption) => string;
export = _default;
