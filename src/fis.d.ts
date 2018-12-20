interface Fis {
    project : any;
    log : any;
    config : any;
    on : (str :string , cb :Function)=> any;
}


declare let fis: Fis;