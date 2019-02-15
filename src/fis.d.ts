interface Fis {
    project : any;
    log : any;
    config : any;
	on : (str :string , cb :Function)=> any;
	util : FisUtil;
}
interface FisUtil {
	exists(filepath :string) : boolean;
	readJSON(path :string) : any;
}


declare let fis: Fis;


declare type FisFile = {
	fullname: string;
	id: string;
	isHtmlLike: boolean;
	realpathNoExt: string;
	subpath: string;
	cache: any;
	release: string | boolean;
};

declare type KeyValueObject = { [k: string]: any };


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
	imports: { [key: string]: Function };
	native: boolean;
	art: boolean;
};
