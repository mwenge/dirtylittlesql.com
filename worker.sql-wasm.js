
// We are modularizing this manually because the current modularize setting in Emscripten has some issues:
// https://github.com/kripken/emscripten/issues/5820
// In addition, When you use emcc's modularization, it still expects to export a global object called `Module`,
// which is able to be used/called before the WASM is loaded.
// The modularization below exports a promise that loads and resolves to the actual sql.js module.
// That way, this module can't be used before the WASM is finished loading.

// We are going to define a function that a user will call to start loading initializing our Sql.js library
// However, that function might be called multiple times, and on subsequent calls, we don't actually want it to instantiate a new instance of the Module
// Instead, we want to return the previously loaded module

// TODO: Make this not declare a global if used in the browser
var initSqlJsPromise = undefined;

var initSqlJs = function (moduleConfig) {

    if (initSqlJsPromise){
      return initSqlJsPromise;
    }
    // If we're here, we've never called this function before
    initSqlJsPromise = new Promise(function (resolveModule, reject) {

        // We are modularizing this manually because the current modularize setting in Emscripten has some issues:
        // https://github.com/kripken/emscripten/issues/5820

        // The way to affect the loading of emcc compiled modules is to create a variable called `Module` and add
        // properties to it, like `preRun`, `postRun`, etc
        // We are using that to get notified when the WASM has finished loading.
        // Only then will we return our promise

        // If they passed in a moduleConfig object, use that
        // Otherwise, initialize Module to the empty object
        var Module = typeof moduleConfig !== 'undefined' ? moduleConfig : {};

        // EMCC only allows for a single onAbort function (not an array of functions)
        // So if the user defined their own onAbort function, we remember it and call it
        var originalOnAbortFunction = Module['onAbort'];
        Module['onAbort'] = function (errorThatCausedAbort) {
            reject(new Error(errorThatCausedAbort));
            if (originalOnAbortFunction){
              originalOnAbortFunction(errorThatCausedAbort);
            }
        };

        Module['postRun'] = Module['postRun'] || [];
        Module['postRun'].push(function () {
            // When Emscripted calls postRun, this promise resolves with the built Module
            resolveModule(Module);
        });

        // There is a section of code in the emcc-generated code below that looks like this:
        // (Note that this is lowercase `module`)
        // if (typeof module !== 'undefined') {
        //     module['exports'] = Module;
        // }
        // When that runs, it's going to overwrite our own modularization export efforts in shell-post.js!
        // The only way to tell emcc not to emit it is to pass the MODULARIZE=1 or MODULARIZE_INSTANCE=1 flags,
        // but that carries with it additional unnecessary baggage/bugs we don't want either.
        // So, we have three options:
        // 1) We undefine `module`
        // 2) We remember what `module['exports']` was at the beginning of this function and we restore it later
        // 3) We write a script to remove those lines of code as part of the Make process.
        //
        // Since those are the only lines of code that care about module, we will undefine it. It's the most straightforward
        // of the options, and has the side effect of reducing emcc's efforts to modify the module if its output were to change in the future.
        // That's a nice side effect since we're handling the modularization efforts ourselves
        module = undefined;

        // The emcc-generated code and shell-post.js code goes below,
        // meaning that all of it runs inside of this promise. If anything throws an exception, our promise will abort

var e;e||(e=typeof Module !== 'undefined' ? Module : {});null;
e.onRuntimeInitialized=function(){function a(h,l){this.Ta=h;this.db=l;this.Ra=1;this.nb=[]}function b(h,l){this.db=l;l=ca(h)+1;this.gb=da(l);if(null===this.gb)throw Error("Unable to allocate memory for the SQL string");k(h,n,this.gb,l);this.lb=this.gb;this.bb=this.rb=null}function c(h){this.filename="dbfile_"+(4294967295*Math.random()>>>0);null!=h&&ea(this.filename,h);this.handleError(g(this.filename,d));this.db=r(d,"i32");ic(this.db);jc(this.db);kc(this.db);this.hb={};this.Za={}}var d=v(4),f=e.cwrap,
g=f("sqlite3_open","number",["string","number"]),m=f("sqlite3_close_v2","number",["number"]),p=f("sqlite3_exec","number",["number","string","number","number","number"]),w=f("sqlite3_changes","number",["number"]),u=f("sqlite3_prepare_v2","number",["number","string","number","number","number"]),C=f("sqlite3_sql","string",["number"]),J=f("sqlite3_normalized_sql","string",["number"]),aa=f("sqlite3_prepare_v2","number",["number","number","number","number","number"]),lc=f("sqlite3_bind_text","number",["number",
"number","number","number","number"]),pb=f("sqlite3_bind_blob","number",["number","number","number","number","number"]),mc=f("sqlite3_bind_double","number",["number","number","number"]),nc=f("sqlite3_bind_int","number",["number","number","number"]),oc=f("sqlite3_bind_parameter_index","number",["number","string"]),pc=f("sqlite3_step","number",["number"]),qc=f("sqlite3_errmsg","string",["number"]),rc=f("sqlite3_column_count","number",["number"]),sc=f("sqlite3_data_count","number",["number"]),tc=f("sqlite3_column_double",
"number",["number","number"]),qb=f("sqlite3_column_text","string",["number","number"]),uc=f("sqlite3_column_blob","number",["number","number"]),vc=f("sqlite3_column_bytes","number",["number","number"]),wc=f("sqlite3_column_type","number",["number","number"]),xc=f("sqlite3_column_name","string",["number","number"]),yc=f("sqlite3_reset","number",["number"]),zc=f("sqlite3_clear_bindings","number",["number"]),Ac=f("sqlite3_finalize","number",["number"]),Bc=f("sqlite3_create_function_v2","number","number string number number number number number number number".split(" ")),
Cc=f("sqlite3_value_type","number",["number"]),Dc=f("sqlite3_value_bytes","number",["number"]),Ec=f("sqlite3_value_text","string",["number"]),Fc=f("sqlite3_value_blob","number",["number"]),Gc=f("sqlite3_value_double","number",["number"]),Hc=f("sqlite3_result_double","",["number","number"]),rb=f("sqlite3_result_null","",["number"]),Ic=f("sqlite3_result_text","",["number","string","number","number"]),Jc=f("sqlite3_result_blob","",["number","number","number","number"]),Kc=f("sqlite3_result_int","",["number",
"number"]),sb=f("sqlite3_result_error","",["number","string","number"]),ic=f("RegisterExtensionFunctions","number",["number"]),jc=f("RegisterCSVTable","number",["number"]),kc=f("RegisterVSVTable","number",["number"]);a.prototype.bind=function(h){if(!this.Ta)throw"Statement closed";this.reset();return Array.isArray(h)?this.Fb(h):null!=h&&"object"===typeof h?this.Gb(h):!0};a.prototype.step=function(){if(!this.Ta)throw"Statement closed";this.Ra=1;var h=pc(this.Ta);switch(h){case 100:return!0;case 101:return!1;
default:throw this.db.handleError(h);}};a.prototype.Bb=function(h){null==h&&(h=this.Ra,this.Ra+=1);return tc(this.Ta,h)};a.prototype.Jb=function(h){null==h&&(h=this.Ra,this.Ra+=1);h=qb(this.Ta,h);if("function"!==typeof BigInt)throw Error("BigInt is not supported");return BigInt(h)};a.prototype.Kb=function(h){null==h&&(h=this.Ra,this.Ra+=1);return qb(this.Ta,h)};a.prototype.getBlob=function(h){null==h&&(h=this.Ra,this.Ra+=1);var l=vc(this.Ta,h);h=uc(this.Ta,h);for(var q=new Uint8Array(l),t=0;t<l;t+=
1)q[t]=x[h+t];return q};a.prototype.get=function(h,l){l=l||{};null!=h&&this.bind(h)&&this.step();h=[];for(var q=sc(this.Ta),t=0;t<q;t+=1)switch(wc(this.Ta,t)){case 1:var A=l.useBigInt?this.Jb(t):this.Bb(t);h.push(A);break;case 2:h.push(this.Bb(t));break;case 3:h.push(this.Kb(t));break;case 4:h.push(this.getBlob(t));break;default:h.push(null)}return h};a.prototype.getColumnNames=function(){for(var h=[],l=rc(this.Ta),q=0;q<l;q+=1)h.push(xc(this.Ta,q));return h};a.prototype.getAsObject=function(h,l){h=
this.get(h,l);l=this.getColumnNames();for(var q={},t=0;t<l.length;t+=1)q[l[t]]=h[t];return q};a.prototype.getSQL=function(){return C(this.Ta)};a.prototype.getNormalizedSQL=function(){return J(this.Ta)};a.prototype.run=function(h){null!=h&&this.bind(h);this.step();return this.reset()};a.prototype.wb=function(h,l){null==l&&(l=this.Ra,this.Ra+=1);h=fa(h);var q=ha(h);this.nb.push(q);this.db.handleError(lc(this.Ta,l,q,h.length-1,0))};a.prototype.Eb=function(h,l){null==l&&(l=this.Ra,this.Ra+=1);var q=ha(h);
this.nb.push(q);this.db.handleError(pb(this.Ta,l,q,h.length,0))};a.prototype.vb=function(h,l){null==l&&(l=this.Ra,this.Ra+=1);this.db.handleError((h===(h|0)?nc:mc)(this.Ta,l,h))};a.prototype.Hb=function(h){null==h&&(h=this.Ra,this.Ra+=1);pb(this.Ta,h,0,0,0)};a.prototype.xb=function(h,l){null==l&&(l=this.Ra,this.Ra+=1);switch(typeof h){case "string":this.wb(h,l);return;case "number":this.vb(h,l);return;case "bigint":this.wb(h.toString(),l);return;case "boolean":this.vb(h+0,l);return;case "object":if(null===
h){this.Hb(l);return}if(null!=h.length){this.Eb(h,l);return}}throw"Wrong API use : tried to bind a value of an unknown type ("+h+").";};a.prototype.Gb=function(h){var l=this;Object.keys(h).forEach(function(q){var t=oc(l.Ta,q);0!==t&&l.xb(h[q],t)});return!0};a.prototype.Fb=function(h){for(var l=0;l<h.length;l+=1)this.xb(h[l],l+1);return!0};a.prototype.reset=function(){this.freemem();return 0===zc(this.Ta)&&0===yc(this.Ta)};a.prototype.freemem=function(){for(var h;void 0!==(h=this.nb.pop());)ia(h)};
a.prototype.free=function(){this.freemem();var h=0===Ac(this.Ta);delete this.db.hb[this.Ta];this.Ta=0;return h};b.prototype.next=function(){if(null===this.gb)return{done:!0};null!==this.bb&&(this.bb.free(),this.bb=null);if(!this.db.db)throw this.pb(),Error("Database closed");var h=ka(),l=v(4);la(d);la(l);try{this.db.handleError(aa(this.db.db,this.lb,-1,d,l));this.lb=r(l,"i32");var q=r(d,"i32");if(0===q)return this.pb(),{done:!0};this.bb=new a(q,this.db);this.db.hb[q]=this.bb;return{value:this.bb,
done:!1}}catch(t){throw this.rb=y(this.lb),this.pb(),t;}finally{ma(h)}};b.prototype.pb=function(){ia(this.gb);this.gb=null};b.prototype.getRemainingSQL=function(){return null!==this.rb?this.rb:y(this.lb)};"function"===typeof Symbol&&"symbol"===typeof Symbol.iterator&&(b.prototype[Symbol.iterator]=function(){return this});c.prototype.createCSVTable=function(h,l){if(!this.db)throw"Database closed";if(null==h)throw"No data for CSV file";let q="csvfile_"+(4294967295*Math.random()>>>0);null!=h&&ea(q,h);
postMessage({progress:"Loading CSV File"});this.handleError(p(this.db,'CREATE VIRTUAL TABLE temp."'+l+"\" USING csv(filename='"+q+"', header=true);",0,0,d));h="Table"+l.replace(/ /g,"").replace(".csv","");postMessage({progress:"Converting file "+l+" to table '"+h+"'. This may take a couple of minutes for files over 100MB in size."});this.handleError(p(this.db,"CREATE TABLE "+h+' AS\n SELECT * FROM temp."'+l+'";',0,0,d));postMessage({progress:"Cleaning up"});this.handleError(p(this.db,'DROP TABLE temp."'+
l+'";',0,0,d))};c.prototype.createVSVTable=function(h,l,q,t,A){if(!this.db)throw"Database closed";if(null==h)throw"No data for VSV file";postMessage({progress:"Loading "+l+"..."});let G="vsvfile_"+(4294967295*Math.random()>>>0);null!=h&&ea(G,h);this.handleError(p(this.db,'CREATE VIRTUAL TABLE "'+l+"\" USING vsv(filename='"+G+"', fsep='\\x"+q+"', header="+A+", affinity=real);",0,0,d));t?(postMessage({vsvtable:l,vsvback:G}),postMessage({progress:"File "+l+" loaded."})):(h="Table"+l.replace(/ /g,"").replace(".",
""),postMessage({progress:"Converting file "+l+" to table '"+h+"'. This may take a couple of minutes for files over 100MB in size."}),this.handleError(p(this.db,"CREATE TABLE "+h+' AS\n SELECT * FROM temp."'+l+'";',0,0,d)),postMessage({progress:"Table loaded."}),this.handleError(p(this.db,'DROP TABLE temp."'+l+'";',0,0,d)))};c.prototype.run=function(h,l){if(!this.db)throw"Database closed";if(l){h=this.prepare(h,l);try{h.step()}finally{h.free()}}else this.handleError(p(this.db,h,0,0,d));return this};
c.prototype.exec=function(h,l,q){if(!this.db)throw"Database closed";var t=ka(),A=null;try{var G=ca(h)+1,H=v(G);k(h,x,H,G);var ja=H;var ba=v(4);for(h=[];0!==r(ja,"i8");){la(d);la(ba);this.handleError(aa(this.db,ja,-1,d,ba));var D=r(d,"i32");ja=r(ba,"i32");if(0!==D){G=null;A=new a(D,this);for(null!=l&&A.bind(l);A.step();)null===G&&(G={columns:A.getColumnNames(),values:[]},h.push(G)),G.values.push(A.get(null,q));A.free()}}return h}catch(O){throw A&&A.free(),O;}finally{ma(t)}};c.prototype.each=function(h,
l,q,t,A){"function"===typeof l&&(t=q,q=l,l=void 0);h=this.prepare(h,l);try{for(;h.step();)q(h.getAsObject(null,A))}finally{h.free()}if("function"===typeof t)return t()};c.prototype.prepare=function(h,l){la(d);this.handleError(u(this.db,h,-1,d,0));h=r(d,"i32");if(0===h)throw"Nothing to prepare";var q=new a(h,this);null!=l&&q.bind(l);return this.hb[h]=q};c.prototype.iterateStatements=function(h){return new b(h,this)};c.prototype["export"]=function(){Object.values(this.hb).forEach(function(l){l.free()});
Object.values(this.Za).forEach(na);this.Za={};this.handleError(m(this.db));var h=oa(this.filename);this.handleError(g(this.filename,d));this.db=r(d,"i32");return h};c.prototype.close=function(){null!==this.db&&(Object.values(this.hb).forEach(function(h){h.free()}),Object.values(this.Za).forEach(na),this.Za={},this.handleError(m(this.db)),pa("/"+this.filename),this.db=null)};c.prototype.handleError=function(h){if(0===h)return null;h=qc(this.db);throw Error(h);};c.prototype.getRowsModified=function(){return w(this.db)};
c.prototype.create_function=function(h,l){Object.prototype.hasOwnProperty.call(this.Za,h)&&(na(this.Za[h]),delete this.Za[h]);var q=qa(function(t,A,G){for(var H,ja=[],ba=0;ba<A;ba+=1){var D=r(G+4*ba,"i32"),O=Cc(D);if(1===O||2===O)D=Gc(D);else if(3===O)D=Ec(D);else if(4===O){O=D;D=Dc(O);O=Fc(O);for(var vb=new Uint8Array(D),Aa=0;Aa<D;Aa+=1)vb[Aa]=x[O+Aa];D=vb}else D=null;ja.push(D)}try{H=l.apply(null,ja)}catch(Nc){sb(t,Nc,-1);return}switch(typeof H){case "boolean":Kc(t,H?1:0);break;case "number":Hc(t,
H);break;case "string":Ic(t,H,-1,-1);break;case "object":null===H?rb(t):null!=H.length?(A=ha(H),Jc(t,A,H.length,-1),ia(A)):sb(t,"Wrong API use : tried to return a value of an unknown type ("+H+").",-1);break;default:rb(t)}});this.Za[h]=q;this.handleError(Bc(this.db,h,l.length,1,0,q,0,0,0));return this};e.Database=c};var ra={},z;for(z in e)e.hasOwnProperty(z)&&(ra[z]=e[z]);
var sa="./this.program",ta="object"===typeof window,ua="function"===typeof importScripts,va="object"===typeof process&&"object"===typeof process.versions&&"string"===typeof process.versions.node,B="",wa,xa,ya,za,Ba;
if(va)B=ua?require("path").dirname(B)+"/":__dirname+"/",wa=function(a,b){za||(za=require("fs"));Ba||(Ba=require("path"));a=Ba.normalize(a);return za.readFileSync(a,b?null:"utf8")},ya=function(a){a=wa(a,!0);a.buffer||(a=new Uint8Array(a));a.buffer||E("Assertion failed: undefined");return a},xa=function(a,b,c){za||(za=require("fs"));Ba||(Ba=require("path"));a=Ba.normalize(a);za.readFile(a,function(d,f){d?c(d):b(f.buffer)})},1<process.argv.length&&(sa=process.argv[1].replace(/\\/g,"/")),process.argv.slice(2),
"undefined"!==typeof module&&(module.exports=e),e.inspect=function(){return"[Emscripten Module object]"};else if(ta||ua)ua?B=self.location.href:"undefined"!==typeof document&&document.currentScript&&(B=document.currentScript.src),B=0!==B.indexOf("blob:")?B.substr(0,B.lastIndexOf("/")+1):"",wa=function(a){var b=new XMLHttpRequest;b.open("GET",a,!1);b.send(null);return b.responseText},ua&&(ya=function(a){var b=new XMLHttpRequest;b.open("GET",a,!1);b.responseType="arraybuffer";b.send(null);return new Uint8Array(b.response)}),
xa=function(a,b,c){var d=new XMLHttpRequest;d.open("GET",a,!0);d.responseType="arraybuffer";d.onload=function(){200==d.status||0==d.status&&d.response?b(d.response):c()};d.onerror=c;d.send(null)};var Ca=e.print||console.log.bind(console),F=e.printErr||console.warn.bind(console);for(z in ra)ra.hasOwnProperty(z)&&(e[z]=ra[z]);ra=null;e.thisProgram&&(sa=e.thisProgram);var Da=[],Ea;function na(a){Ea.delete(I.get(a));Da.push(a)}
function qa(a){if(!Ea){Ea=new WeakMap;for(var b=0;b<I.length;b++){var c=I.get(b);c&&Ea.set(c,b)}}if(Ea.has(a))a=Ea.get(a);else{if(Da.length)b=Da.pop();else{try{I.grow(1)}catch(g){if(!(g instanceof RangeError))throw g;throw"Unable to grow wasm table. Set ALLOW_TABLE_GROWTH.";}b=I.length-1}try{I.set(b,a)}catch(g){if(!(g instanceof TypeError))throw g;if("function"===typeof WebAssembly.Function){var d={i:"i32",j:"i64",f:"f32",d:"f64"},f={parameters:[],results:[]};for(c=1;4>c;++c)f.parameters.push(d["viii"[c]]);
c=new WebAssembly.Function(f,a)}else{d=[1,0,1,96];f={i:127,j:126,f:125,d:124};d.push(3);for(c=0;3>c;++c)d.push(f["iii"[c]]);d.push(0);d[1]=d.length-2;c=new Uint8Array([0,97,115,109,1,0,0,0].concat(d,[2,7,1,1,101,1,102,0,0,7,5,1,1,102,0,0]));c=new WebAssembly.Module(c);c=(new WebAssembly.Instance(c,{e:{f:a}})).exports.f}I.set(b,c)}Ea.set(a,b);a=b}return a}var Fa;e.wasmBinary&&(Fa=e.wasmBinary);var noExitRuntime=e.noExitRuntime||!0;"object"!==typeof WebAssembly&&E("no native wasm support detected");
function la(a){var b="i32";"*"===b.charAt(b.length-1)&&(b="i32");switch(b){case "i1":x[a>>0]=0;break;case "i8":x[a>>0]=0;break;case "i16":Ga[a>>1]=0;break;case "i32":K[a>>2]=0;break;case "i64":L=[0,(M=0,1<=+Math.abs(M)?0<M?(Math.min(+Math.floor(M/4294967296),4294967295)|0)>>>0:~~+Math.ceil((M-+(~~M>>>0))/4294967296)>>>0:0)];K[a>>2]=L[0];K[a+4>>2]=L[1];break;case "float":Ha[a>>2]=0;break;case "double":Ia[a>>3]=0;break;default:E("invalid type for setValue: "+b)}}
function r(a,b){b=b||"i8";"*"===b.charAt(b.length-1)&&(b="i32");switch(b){case "i1":return x[a>>0];case "i8":return x[a>>0];case "i16":return Ga[a>>1];case "i32":return K[a>>2];case "i64":return K[a>>2];case "float":return Ha[a>>2];case "double":return Ia[a>>3];default:E("invalid type for getValue: "+b)}return null}var Ja,Ka=!1;function La(a){var b=e["_"+a];b||E("Assertion failed: Cannot call unknown function "+(a+", make sure it is exported"));return b}
function Ma(a,b,c,d){var f={string:function(u){var C=0;if(null!==u&&void 0!==u&&0!==u){var J=(u.length<<2)+1;C=v(J);k(u,n,C,J)}return C},array:function(u){var C=v(u.length);x.set(u,C);return C}};a=La(a);var g=[],m=0;if(d)for(var p=0;p<d.length;p++){var w=f[c[p]];w?(0===m&&(m=ka()),g[p]=w(d[p])):g[p]=d[p]}c=a.apply(null,g);return c=function(u){0!==m&&ma(m);return"string"===b?y(u):"boolean"===b?!!u:u}(c)}var Na=0,Oa=1;
function ha(a){var b=Na==Oa?v(a.length):da(a.length);a.subarray||a.slice?n.set(a,b):n.set(new Uint8Array(a),b);return b}var Pa="undefined"!==typeof TextDecoder?new TextDecoder("utf8"):void 0;
function Qa(a,b,c){var d=b+c;for(c=b;a[c]&&!(c>=d);)++c;if(16<c-b&&a.subarray&&Pa)return Pa.decode(a.subarray(b,c));for(d="";b<c;){var f=a[b++];if(f&128){var g=a[b++]&63;if(192==(f&224))d+=String.fromCharCode((f&31)<<6|g);else{var m=a[b++]&63;f=224==(f&240)?(f&15)<<12|g<<6|m:(f&7)<<18|g<<12|m<<6|a[b++]&63;65536>f?d+=String.fromCharCode(f):(f-=65536,d+=String.fromCharCode(55296|f>>10,56320|f&1023))}}else d+=String.fromCharCode(f)}return d}function y(a,b){return a?Qa(n,a,b):""}
function k(a,b,c,d){if(!(0<d))return 0;var f=c;d=c+d-1;for(var g=0;g<a.length;++g){var m=a.charCodeAt(g);if(55296<=m&&57343>=m){var p=a.charCodeAt(++g);m=65536+((m&1023)<<10)|p&1023}if(127>=m){if(c>=d)break;b[c++]=m}else{if(2047>=m){if(c+1>=d)break;b[c++]=192|m>>6}else{if(65535>=m){if(c+2>=d)break;b[c++]=224|m>>12}else{if(c+3>=d)break;b[c++]=240|m>>18;b[c++]=128|m>>12&63}b[c++]=128|m>>6&63}b[c++]=128|m&63}}b[c]=0;return c-f}
function ca(a){for(var b=0,c=0;c<a.length;++c){var d=a.charCodeAt(c);55296<=d&&57343>=d&&(d=65536+((d&1023)<<10)|a.charCodeAt(++c)&1023);127>=d?++b:b=2047>=d?b+2:65535>=d?b+3:b+4}return b}function Ra(a){var b=ca(a)+1,c=da(b);c&&k(a,x,c,b);return c}var Sa,x,n,Ga,K,Ha,Ia;
function Ta(){var a=Ja.buffer;Sa=a;e.HEAP8=x=new Int8Array(a);e.HEAP16=Ga=new Int16Array(a);e.HEAP32=K=new Int32Array(a);e.HEAPU8=n=new Uint8Array(a);e.HEAPU16=new Uint16Array(a);e.HEAPU32=new Uint32Array(a);e.HEAPF32=Ha=new Float32Array(a);e.HEAPF64=Ia=new Float64Array(a)}var I,Ua=[],Va=[],Wa=[];function Xa(){var a=e.preRun.shift();Ua.unshift(a)}var Ya=0,Za=null,$a=null;e.preloadedImages={};e.preloadedAudios={};
function E(a){if(e.onAbort)e.onAbort(a);F(a);Ka=!0;throw new WebAssembly.RuntimeError("abort("+a+"). Build with -s ASSERTIONS=1 for more info.");}function ab(){return N.startsWith("data:application/octet-stream;base64,")}var N;N="sql-wasm.wasm";if(!ab()){var bb=N;N=e.locateFile?e.locateFile(bb,B):B+bb}function cb(){var a=N;try{if(a==N&&Fa)return new Uint8Array(Fa);if(ya)return ya(a);throw"both async and sync fetching of the wasm failed";}catch(b){E(b)}}
function db(){if(!Fa&&(ta||ua)){if("function"===typeof fetch&&!N.startsWith("file://"))return fetch(N,{credentials:"same-origin"}).then(function(a){if(!a.ok)throw"failed to load wasm binary file at '"+N+"'";return a.arrayBuffer()}).catch(function(){return cb()});if(xa)return new Promise(function(a,b){xa(N,function(c){a(new Uint8Array(c))},b)})}return Promise.resolve().then(function(){return cb()})}var M,L;
function eb(a){for(;0<a.length;){var b=a.shift();if("function"==typeof b)b(e);else{var c=b.Ub;"number"===typeof c?void 0===b.ob?I.get(c)():I.get(c)(b.ob):c(void 0===b.ob?null:b.ob)}}}function fb(a){return a.replace(/\b_Z[\w\d_]+/g,function(b){return b===b?b:b+" ["+b+"]"})}
function gb(){function a(m){return(m=m.toTimeString().match(/\(([A-Za-z ]+)\)$/))?m[1]:"GMT"}var b=(new Date).getFullYear(),c=new Date(b,0,1),d=new Date(b,6,1);b=c.getTimezoneOffset();var f=d.getTimezoneOffset(),g=Math.max(b,f);K[hb()>>2]=60*g;K[ib()>>2]=Number(b!=f);c=a(c);d=a(d);c=Ra(c);d=Ra(d);f<b?(K[jb()>>2]=c,K[jb()+4>>2]=d):(K[jb()>>2]=d,K[jb()+4>>2]=c)}var kb;
function lb(a,b){for(var c=0,d=a.length-1;0<=d;d--){var f=a[d];"."===f?a.splice(d,1):".."===f?(a.splice(d,1),c++):c&&(a.splice(d,1),c--)}if(b)for(;c;c--)a.unshift("..");return a}function P(a){var b="/"===a.charAt(0),c="/"===a.substr(-1);(a=lb(a.split("/").filter(function(d){return!!d}),!b).join("/"))||b||(a=".");a&&c&&(a+="/");return(b?"/":"")+a}
function mb(a){var b=/^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/.exec(a).slice(1);a=b[0];b=b[1];if(!a&&!b)return".";b&&(b=b.substr(0,b.length-1));return a+b}function nb(a){if("/"===a)return"/";a=P(a);a=a.replace(/\/$/,"");var b=a.lastIndexOf("/");return-1===b?a:a.substr(b+1)}
function ob(){if("object"===typeof crypto&&"function"===typeof crypto.getRandomValues){var a=new Uint8Array(1);return function(){crypto.getRandomValues(a);return a[0]}}if(va)try{var b=require("crypto");return function(){return b.randomBytes(1)[0]}}catch(c){}return function(){E("randomDevice")}}
function tb(){for(var a="",b=!1,c=arguments.length-1;-1<=c&&!b;c--){b=0<=c?arguments[c]:"/";if("string"!==typeof b)throw new TypeError("Arguments to path.resolve must be strings");if(!b)return"";a=b+"/"+a;b="/"===b.charAt(0)}a=lb(a.split("/").filter(function(d){return!!d}),!b).join("/");return(b?"/":"")+a||"."}var ub=[];function wb(a,b){ub[a]={input:[],output:[],fb:b};xb(a,yb)}
var yb={open:function(a){var b=ub[a.node.rdev];if(!b)throw new Q(43);a.tty=b;a.seekable=!1},close:function(a){a.tty.fb.flush(a.tty)},flush:function(a){a.tty.fb.flush(a.tty)},read:function(a,b,c,d){if(!a.tty||!a.tty.fb.Cb)throw new Q(60);for(var f=0,g=0;g<d;g++){try{var m=a.tty.fb.Cb(a.tty)}catch(p){throw new Q(29);}if(void 0===m&&0===f)throw new Q(6);if(null===m||void 0===m)break;f++;b[c+g]=m}f&&(a.node.timestamp=Date.now());return f},write:function(a,b,c,d){if(!a.tty||!a.tty.fb.sb)throw new Q(60);
try{for(var f=0;f<d;f++)a.tty.fb.sb(a.tty,b[c+f])}catch(g){throw new Q(29);}d&&(a.node.timestamp=Date.now());return f}},zb={Cb:function(a){if(!a.input.length){var b=null;if(va){var c=Buffer.alloc(256),d=0;try{d=za.readSync(process.stdin.fd,c,0,256,null)}catch(f){if(f.toString().includes("EOF"))d=0;else throw f;}0<d?b=c.slice(0,d).toString("utf-8"):b=null}else"undefined"!=typeof window&&"function"==typeof window.prompt?(b=window.prompt("Input: "),null!==b&&(b+="\n")):"function"==typeof readline&&(b=
readline(),null!==b&&(b+="\n"));if(!b)return null;a.input=fa(b,!0)}return a.input.shift()},sb:function(a,b){null===b||10===b?(Ca(Qa(a.output,0)),a.output=[]):0!=b&&a.output.push(b)},flush:function(a){a.output&&0<a.output.length&&(Ca(Qa(a.output,0)),a.output=[])}},Ab={sb:function(a,b){null===b||10===b?(F(Qa(a.output,0)),a.output=[]):0!=b&&a.output.push(b)},flush:function(a){a.output&&0<a.output.length&&(F(Qa(a.output,0)),a.output=[])}};
function Bb(a){a=65536*Math.ceil(a/65536);var b=Cb(65536,a);if(!b)return 0;n.fill(0,b,b+a);return b}
var R={Xa:null,Ya:function(){return R.createNode(null,"/",16895,0)},createNode:function(a,b,c,d){if(24576===(c&61440)||4096===(c&61440))throw new Q(63);R.Xa||(R.Xa={dir:{node:{Wa:R.Oa.Wa,Va:R.Oa.Va,lookup:R.Oa.lookup,ib:R.Oa.ib,rename:R.Oa.rename,unlink:R.Oa.unlink,rmdir:R.Oa.rmdir,readdir:R.Oa.readdir,symlink:R.Oa.symlink},stream:{ab:R.Pa.ab}},file:{node:{Wa:R.Oa.Wa,Va:R.Oa.Va},stream:{ab:R.Pa.ab,read:R.Pa.read,write:R.Pa.write,ub:R.Pa.ub,jb:R.Pa.jb,kb:R.Pa.kb}},link:{node:{Wa:R.Oa.Wa,Va:R.Oa.Va,
readlink:R.Oa.readlink},stream:{}},yb:{node:{Wa:R.Oa.Wa,Va:R.Oa.Va},stream:Db}});c=Eb(a,b,c,d);S(c.mode)?(c.Oa=R.Xa.dir.node,c.Pa=R.Xa.dir.stream,c.Qa={}):32768===(c.mode&61440)?(c.Oa=R.Xa.file.node,c.Pa=R.Xa.file.stream,c.Ua=0,c.Qa=null):40960===(c.mode&61440)?(c.Oa=R.Xa.link.node,c.Pa=R.Xa.link.stream):8192===(c.mode&61440)&&(c.Oa=R.Xa.yb.node,c.Pa=R.Xa.yb.stream);c.timestamp=Date.now();a&&(a.Qa[b]=c,a.timestamp=c.timestamp);return c},Vb:function(a){return a.Qa?a.Qa.subarray?a.Qa.subarray(0,a.Ua):
new Uint8Array(a.Qa):new Uint8Array(0)},zb:function(a,b){var c=a.Qa?a.Qa.length:0;c>=b||(b=Math.max(b,c*(1048576>c?2:1.125)>>>0),0!=c&&(b=Math.max(b,256)),c=a.Qa,a.Qa=new Uint8Array(b),0<a.Ua&&a.Qa.set(c.subarray(0,a.Ua),0))},Rb:function(a,b){if(a.Ua!=b)if(0==b)a.Qa=null,a.Ua=0;else{var c=a.Qa;a.Qa=new Uint8Array(b);c&&a.Qa.set(c.subarray(0,Math.min(b,a.Ua)));a.Ua=b}},Oa:{Wa:function(a){var b={};b.dev=8192===(a.mode&61440)?a.id:1;b.ino=a.id;b.mode=a.mode;b.nlink=1;b.uid=0;b.gid=0;b.rdev=a.rdev;S(a.mode)?
b.size=4096:32768===(a.mode&61440)?b.size=a.Ua:40960===(a.mode&61440)?b.size=a.link.length:b.size=0;b.atime=new Date(a.timestamp);b.mtime=new Date(a.timestamp);b.ctime=new Date(a.timestamp);b.Ib=4096;b.blocks=Math.ceil(b.size/b.Ib);return b},Va:function(a,b){void 0!==b.mode&&(a.mode=b.mode);void 0!==b.timestamp&&(a.timestamp=b.timestamp);void 0!==b.size&&R.Rb(a,b.size)},lookup:function(){throw Fb[44];},ib:function(a,b,c,d){return R.createNode(a,b,c,d)},rename:function(a,b,c){if(S(a.mode)){try{var d=
Gb(b,c)}catch(g){}if(d)for(var f in d.Qa)throw new Q(55);}delete a.parent.Qa[a.name];a.parent.timestamp=Date.now();a.name=c;b.Qa[c]=a;b.timestamp=a.parent.timestamp;a.parent=b},unlink:function(a,b){delete a.Qa[b];a.timestamp=Date.now()},rmdir:function(a,b){var c=Gb(a,b),d;for(d in c.Qa)throw new Q(55);delete a.Qa[b];a.timestamp=Date.now()},readdir:function(a){var b=[".",".."],c;for(c in a.Qa)a.Qa.hasOwnProperty(c)&&b.push(c);return b},symlink:function(a,b,c){a=R.createNode(a,b,41471,0);a.link=c;return a},
readlink:function(a){if(40960!==(a.mode&61440))throw new Q(28);return a.link}},Pa:{read:function(a,b,c,d,f){var g=a.node.Qa;if(f>=a.node.Ua)return 0;a=Math.min(a.node.Ua-f,d);if(8<a&&g.subarray)b.set(g.subarray(f,f+a),c);else for(d=0;d<a;d++)b[c+d]=g[f+d];return a},write:function(a,b,c,d,f,g){b.buffer===x.buffer&&(g=!1);if(!d)return 0;a=a.node;a.timestamp=Date.now();if(b.subarray&&(!a.Qa||a.Qa.subarray)){if(g)return a.Qa=b.subarray(c,c+d),a.Ua=d;if(0===a.Ua&&0===f)return a.Qa=b.slice(c,c+d),a.Ua=
d;if(f+d<=a.Ua)return a.Qa.set(b.subarray(c,c+d),f),d}R.zb(a,f+d);if(a.Qa.subarray&&b.subarray)a.Qa.set(b.subarray(c,c+d),f);else for(g=0;g<d;g++)a.Qa[f+g]=b[c+g];a.Ua=Math.max(a.Ua,f+d);return d},ab:function(a,b,c){1===c?b+=a.position:2===c&&32768===(a.node.mode&61440)&&(b+=a.node.Ua);if(0>b)throw new Q(28);return b},ub:function(a,b,c){R.zb(a.node,b+c);a.node.Ua=Math.max(a.node.Ua,b+c)},jb:function(a,b,c,d,f,g){if(0!==b)throw new Q(28);if(32768!==(a.node.mode&61440))throw new Q(43);a=a.node.Qa;if(g&
2||a.buffer!==Sa){if(0<d||d+c<a.length)a.subarray?a=a.subarray(d,d+c):a=Array.prototype.slice.call(a,d,d+c);d=!0;c=Bb(c);if(!c)throw new Q(48);x.set(a,c)}else d=!1,c=a.byteOffset;return{Qb:c,mb:d}},kb:function(a,b,c,d,f){if(32768!==(a.node.mode&61440))throw new Q(43);if(f&2)return 0;R.Pa.write(a,b,0,d,c,!1);return 0}}},Hb=null,Ib={},T=[],Jb=1,U=null,Kb=!0,V={},Q=null,Fb={};
function W(a,b){a=tb("/",a);b=b||{};if(!a)return{path:"",node:null};var c={Ab:!0,tb:0},d;for(d in c)void 0===b[d]&&(b[d]=c[d]);if(8<b.tb)throw new Q(32);a=lb(a.split("/").filter(function(m){return!!m}),!1);var f=Hb;c="/";for(d=0;d<a.length;d++){var g=d===a.length-1;if(g&&b.parent)break;f=Gb(f,a[d]);c=P(c+"/"+a[d]);f.cb&&(!g||g&&b.Ab)&&(f=f.cb.root);if(!g||b.$a)for(g=0;40960===(f.mode&61440);)if(f=Lb(c),c=tb(mb(c),f),f=W(c,{tb:b.tb}).node,40<g++)throw new Q(32);}return{path:c,node:f}}
function Mb(a){for(var b;;){if(a===a.parent)return a=a.Ya.Db,b?"/"!==a[a.length-1]?a+"/"+b:a+b:a;b=b?a.name+"/"+b:a.name;a=a.parent}}function Nb(a,b){for(var c=0,d=0;d<b.length;d++)c=(c<<5)-c+b.charCodeAt(d)|0;return(a+c>>>0)%U.length}function Ob(a){var b=Nb(a.parent.id,a.name);if(U[b]===a)U[b]=a.eb;else for(b=U[b];b;){if(b.eb===a){b.eb=a.eb;break}b=b.eb}}
function Gb(a,b){var c;if(c=(c=Pb(a,"x"))?c:a.Oa.lookup?0:2)throw new Q(c,a);for(c=U[Nb(a.id,b)];c;c=c.eb){var d=c.name;if(c.parent.id===a.id&&d===b)return c}return a.Oa.lookup(a,b)}function Eb(a,b,c,d){a=new Qb(a,b,c,d);b=Nb(a.parent.id,a.name);a.eb=U[b];return U[b]=a}function S(a){return 16384===(a&61440)}var Rb={r:0,"r+":2,w:577,"w+":578,a:1089,"a+":1090};function Sb(a){var b=["r","w","rw"][a&3];a&512&&(b+="w");return b}
function Pb(a,b){if(Kb)return 0;if(!b.includes("r")||a.mode&292){if(b.includes("w")&&!(a.mode&146)||b.includes("x")&&!(a.mode&73))return 2}else return 2;return 0}function Tb(a,b){try{return Gb(a,b),20}catch(c){}return Pb(a,"wx")}function Ub(a,b,c){try{var d=Gb(a,b)}catch(f){return f.Sa}if(a=Pb(a,"wx"))return a;if(c){if(!S(d.mode))return 54;if(d===d.parent||"/"===Mb(d))return 10}else if(S(d.mode))return 31;return 0}function Vb(a){var b=4096;for(a=a||0;a<=b;a++)if(!T[a])return a;throw new Q(33);}
function Wb(a,b){Xb||(Xb=function(){},Xb.prototype={});var c=new Xb,d;for(d in a)c[d]=a[d];a=c;b=Vb(b);a.fd=b;return T[b]=a}var Db={open:function(a){a.Pa=Ib[a.node.rdev].Pa;a.Pa.open&&a.Pa.open(a)},ab:function(){throw new Q(70);}};function xb(a,b){Ib[a]={Pa:b}}
function Yb(a,b){var c="/"===b,d=!b;if(c&&Hb)throw new Q(10);if(!c&&!d){var f=W(b,{Ab:!1});b=f.path;f=f.node;if(f.cb)throw new Q(10);if(!S(f.mode))throw new Q(54);}b={type:a,Wb:{},Db:b,Ob:[]};a=a.Ya(b);a.Ya=b;b.root=a;c?Hb=a:f&&(f.cb=b,f.Ya&&f.Ya.Ob.push(b))}function Zb(a,b,c){var d=W(a,{parent:!0}).node;a=nb(a);if(!a||"."===a||".."===a)throw new Q(28);var f=Tb(d,a);if(f)throw new Q(f);if(!d.Oa.ib)throw new Q(63);return d.Oa.ib(d,a,b,c)}
function X(a,b){return Zb(a,(void 0!==b?b:511)&1023|16384,0)}function $b(a,b,c){"undefined"===typeof c&&(c=b,b=438);Zb(a,b|8192,c)}function ac(a,b){if(!tb(a))throw new Q(44);var c=W(b,{parent:!0}).node;if(!c)throw new Q(44);b=nb(b);var d=Tb(c,b);if(d)throw new Q(d);if(!c.Oa.symlink)throw new Q(63);c.Oa.symlink(c,b,a)}
function pa(a){var b=W(a,{parent:!0}).node,c=nb(a),d=Gb(b,c),f=Ub(b,c,!1);if(f)throw new Q(f);if(!b.Oa.unlink)throw new Q(63);if(d.cb)throw new Q(10);try{V.willDeletePath&&V.willDeletePath(a)}catch(g){F("FS.trackingDelegate['willDeletePath']('"+a+"') threw an exception: "+g.message)}b.Oa.unlink(b,c);Ob(d);try{if(V.onDeletePath)V.onDeletePath(a)}catch(g){F("FS.trackingDelegate['onDeletePath']('"+a+"') threw an exception: "+g.message)}}
function Lb(a){a=W(a).node;if(!a)throw new Q(44);if(!a.Oa.readlink)throw new Q(28);return tb(Mb(a.parent),a.Oa.readlink(a))}function bc(a,b){a=W(a,{$a:!b}).node;if(!a)throw new Q(44);if(!a.Oa.Wa)throw new Q(63);return a.Oa.Wa(a)}function cc(a){return bc(a,!0)}function dc(a,b){a="string"===typeof a?W(a,{$a:!0}).node:a;if(!a.Oa.Va)throw new Q(63);a.Oa.Va(a,{mode:b&4095|a.mode&-4096,timestamp:Date.now()})}
function ec(a){a="string"===typeof a?W(a,{$a:!0}).node:a;if(!a.Oa.Va)throw new Q(63);a.Oa.Va(a,{timestamp:Date.now()})}function fc(a,b){if(0>b)throw new Q(28);a="string"===typeof a?W(a,{$a:!0}).node:a;if(!a.Oa.Va)throw new Q(63);if(S(a.mode))throw new Q(31);if(32768!==(a.mode&61440))throw new Q(28);var c=Pb(a,"w");if(c)throw new Q(c);a.Oa.Va(a,{size:b,timestamp:Date.now()})}
function gc(a,b,c,d){if(""===a)throw new Q(44);if("string"===typeof b){var f=Rb[b];if("undefined"===typeof f)throw Error("Unknown file open mode: "+b);b=f}c=b&64?("undefined"===typeof c?438:c)&4095|32768:0;if("object"===typeof a)var g=a;else{a=P(a);try{g=W(a,{$a:!(b&131072)}).node}catch(m){}}f=!1;if(b&64)if(g){if(b&128)throw new Q(20);}else g=Zb(a,c,0),f=!0;if(!g)throw new Q(44);8192===(g.mode&61440)&&(b&=-513);if(b&65536&&!S(g.mode))throw new Q(54);if(!f&&(c=g?40960===(g.mode&61440)?32:S(g.mode)&&
("r"!==Sb(b)||b&512)?31:Pb(g,Sb(b)):44))throw new Q(c);b&512&&fc(g,0);b&=-131713;d=Wb({node:g,path:Mb(g),flags:b,seekable:!0,position:0,Pa:g.Pa,Tb:[],error:!1},d);d.Pa.open&&d.Pa.open(d);!e.logReadFiles||b&1||(hc||(hc={}),a in hc||(hc[a]=1,F("FS.trackingDelegate error on read file: "+a)));try{V.onOpenFile&&(g=0,1!==(b&2097155)&&(g|=1),0!==(b&2097155)&&(g|=2),V.onOpenFile(a,g))}catch(m){F("FS.trackingDelegate['onOpenFile']('"+a+"', flags) threw an exception: "+m.message)}return d}
function Lc(a){if(null===a.fd)throw new Q(8);a.qb&&(a.qb=null);try{a.Pa.close&&a.Pa.close(a)}catch(b){throw b;}finally{T[a.fd]=null}a.fd=null}function Mc(a,b,c){if(null===a.fd)throw new Q(8);if(!a.seekable||!a.Pa.ab)throw new Q(70);if(0!=c&&1!=c&&2!=c)throw new Q(28);a.position=a.Pa.ab(a,b,c);a.Tb=[]}
function Oc(a,b,c,d,f){if(0>d||0>f)throw new Q(28);if(null===a.fd)throw new Q(8);if(1===(a.flags&2097155))throw new Q(8);if(S(a.node.mode))throw new Q(31);if(!a.Pa.read)throw new Q(28);var g="undefined"!==typeof f;if(!g)f=a.position;else if(!a.seekable)throw new Q(70);b=a.Pa.read(a,b,c,d,f);g||(a.position+=b);return b}
function Pc(a,b,c,d,f,g){if(0>d||0>f)throw new Q(28);if(null===a.fd)throw new Q(8);if(0===(a.flags&2097155))throw new Q(8);if(S(a.node.mode))throw new Q(31);if(!a.Pa.write)throw new Q(28);a.seekable&&a.flags&1024&&Mc(a,0,2);var m="undefined"!==typeof f;if(!m)f=a.position;else if(!a.seekable)throw new Q(70);b=a.Pa.write(a,b,c,d,f,g);m||(a.position+=b);try{if(a.path&&V.onWriteToFile)V.onWriteToFile(a.path)}catch(p){F("FS.trackingDelegate['onWriteToFile']('"+a.path+"') threw an exception: "+p.message)}return b}
function oa(a){var b={encoding:"binary"};b=b||{};b.flags=b.flags||0;b.encoding=b.encoding||"binary";if("utf8"!==b.encoding&&"binary"!==b.encoding)throw Error('Invalid encoding type "'+b.encoding+'"');var c,d=gc(a,b.flags);a=bc(a).size;var f=new Uint8Array(a);Oc(d,f,0,a,0);"utf8"===b.encoding?c=Qa(f,0):"binary"===b.encoding&&(c=f);Lc(d);return c}
function Qc(){Q||(Q=function(a,b){this.node=b;this.Sb=function(c){this.Sa=c};this.Sb(a);this.message="FS error"},Q.prototype=Error(),Q.prototype.constructor=Q,[44].forEach(function(a){Fb[a]=new Q(a);Fb[a].stack="<generic error, no stack>"}))}var Rc;function Sc(a,b){var c=0;a&&(c|=365);b&&(c|=146);return c}
function ea(a,b){var c=a?P("//"+a):"/";a=Sc(!0,!0);c=Zb(c,(void 0!==a?a:438)&4095|32768,0);if(b){if("string"===typeof b){for(var d=Array(b.length),f=0,g=b.length;f<g;++f)d[f]=b.charCodeAt(f);b=d}dc(c,a|146);d=gc(c,577);Pc(d,b,0,b.length,0,void 0);Lc(d);dc(c,a)}}
function Tc(a,b,c){a=P("/dev/"+a);var d=Sc(!!b,!!c);Uc||(Uc=64);var f=Uc++<<8|0;xb(f,{open:function(g){g.seekable=!1},close:function(){c&&c.buffer&&c.buffer.length&&c(10)},read:function(g,m,p,w){for(var u=0,C=0;C<w;C++){try{var J=b()}catch(aa){throw new Q(29);}if(void 0===J&&0===u)throw new Q(6);if(null===J||void 0===J)break;u++;m[p+C]=J}u&&(g.node.timestamp=Date.now());return u},write:function(g,m,p,w){for(var u=0;u<w;u++)try{c(m[p+u])}catch(C){throw new Q(29);}w&&(g.node.timestamp=Date.now());return u}});
$b(a,d,f)}var Uc,Y={},Xb,hc,Vc={};
function Wc(a,b,c){try{var d=a(b)}catch(f){if(f&&f.node&&P(b)!==P(Mb(f.node)))return-54;throw f;}K[c>>2]=d.dev;K[c+4>>2]=0;K[c+8>>2]=d.ino;K[c+12>>2]=d.mode;K[c+16>>2]=d.nlink;K[c+20>>2]=d.uid;K[c+24>>2]=d.gid;K[c+28>>2]=d.rdev;K[c+32>>2]=0;L=[d.size>>>0,(M=d.size,1<=+Math.abs(M)?0<M?(Math.min(+Math.floor(M/4294967296),4294967295)|0)>>>0:~~+Math.ceil((M-+(~~M>>>0))/4294967296)>>>0:0)];K[c+40>>2]=L[0];K[c+44>>2]=L[1];K[c+48>>2]=4096;K[c+52>>2]=d.blocks;K[c+56>>2]=d.atime.getTime()/1E3|0;K[c+60>>2]=
0;K[c+64>>2]=d.mtime.getTime()/1E3|0;K[c+68>>2]=0;K[c+72>>2]=d.ctime.getTime()/1E3|0;K[c+76>>2]=0;L=[d.ino>>>0,(M=d.ino,1<=+Math.abs(M)?0<M?(Math.min(+Math.floor(M/4294967296),4294967295)|0)>>>0:~~+Math.ceil((M-+(~~M>>>0))/4294967296)>>>0:0)];K[c+80>>2]=L[0];K[c+84>>2]=L[1];return 0}var Xc=void 0;function Yc(){Xc+=4;return K[Xc-4>>2]}function Z(a){a=T[a];if(!a)throw new Q(8);return a}var Zc;Zc=va?function(){var a=process.hrtime();return 1E3*a[0]+a[1]/1E6}:function(){return performance.now()};
var $c={};function ad(){if(!bd){var a={USER:"web_user",LOGNAME:"web_user",PATH:"/",PWD:"/",HOME:"/home/web_user",LANG:("object"===typeof navigator&&navigator.languages&&navigator.languages[0]||"C").replace("-","_")+".UTF-8",_:sa||"./this.program"},b;for(b in $c)void 0===$c[b]?delete a[b]:a[b]=$c[b];var c=[];for(b in a)c.push(b+"="+a[b]);bd=c}return bd}var bd;
function Qb(a,b,c,d){a||(a=this);this.parent=a;this.Ya=a.Ya;this.cb=null;this.id=Jb++;this.name=b;this.mode=c;this.Oa={};this.Pa={};this.rdev=d}Object.defineProperties(Qb.prototype,{read:{get:function(){return 365===(this.mode&365)},set:function(a){a?this.mode|=365:this.mode&=-366}},write:{get:function(){return 146===(this.mode&146)},set:function(a){a?this.mode|=146:this.mode&=-147}}});Qc();U=Array(4096);Yb(R,"/");X("/tmp");X("/home");X("/home/web_user");
(function(){X("/dev");xb(259,{read:function(){return 0},write:function(b,c,d,f){return f}});$b("/dev/null",259);wb(1280,zb);wb(1536,Ab);$b("/dev/tty",1280);$b("/dev/tty1",1536);var a=ob();Tc("random",a);Tc("urandom",a);X("/dev/shm");X("/dev/shm/tmp")})();
(function(){X("/proc");var a=X("/proc/self");X("/proc/self/fd");Yb({Ya:function(){var b=Eb(a,"fd",16895,73);b.Oa={lookup:function(c,d){var f=T[+d];if(!f)throw new Q(8);c={parent:null,Ya:{Db:"fake"},Oa:{readlink:function(){return f.path}}};return c.parent=c}};return b}},"/proc/self/fd")})();function fa(a,b){var c=Array(ca(a)+1);a=k(a,c,0,c.length);b&&(c.length=a);return c}
var dd={a:function(a,b,c,d){E("Assertion failed: "+y(a)+", at: "+[b?y(b):"unknown filename",c,d?y(d):"unknown function"])},r:function(a,b){kb||(kb=!0,gb());a=new Date(1E3*K[a>>2]);K[b>>2]=a.getSeconds();K[b+4>>2]=a.getMinutes();K[b+8>>2]=a.getHours();K[b+12>>2]=a.getDate();K[b+16>>2]=a.getMonth();K[b+20>>2]=a.getFullYear()-1900;K[b+24>>2]=a.getDay();var c=new Date(a.getFullYear(),0,1);K[b+28>>2]=(a.getTime()-c.getTime())/864E5|0;K[b+36>>2]=-(60*a.getTimezoneOffset());var d=(new Date(a.getFullYear(),
6,1)).getTimezoneOffset();c=c.getTimezoneOffset();a=(d!=c&&a.getTimezoneOffset()==Math.min(c,d))|0;K[b+32>>2]=a;a=K[jb()+(a?4:0)>>2];K[b+40>>2]=a;return b},w:function(a,b){try{a=y(a);if(b&-8)var c=-28;else{var d;(d=W(a,{$a:!0}).node)?(a="",b&4&&(a+="r"),b&2&&(a+="w"),b&1&&(a+="x"),c=a&&Pb(d,a)?-2:0):c=-44}return c}catch(f){return"undefined"!==typeof Y&&f instanceof Q||E(f),-f.Sa}},D:function(a,b){try{return a=y(a),dc(a,b),0}catch(c){return"undefined"!==typeof Y&&c instanceof Q||E(c),-c.Sa}},t:function(a){try{return a=
y(a),ec(a),0}catch(b){return"undefined"!==typeof Y&&b instanceof Q||E(b),-b.Sa}},E:function(a,b){try{var c=T[a];if(!c)throw new Q(8);dc(c.node,b);return 0}catch(d){return"undefined"!==typeof Y&&d instanceof Q||E(d),-d.Sa}},u:function(a){try{var b=T[a];if(!b)throw new Q(8);ec(b.node);return 0}catch(c){return"undefined"!==typeof Y&&c instanceof Q||E(c),-c.Sa}},b:function(a,b,c){Xc=c;try{var d=Z(a);switch(b){case 0:var f=Yc();return 0>f?-28:gc(d.path,d.flags,0,f).fd;case 1:case 2:return 0;case 3:return d.flags;
case 4:return f=Yc(),d.flags|=f,0;case 12:return f=Yc(),Ga[f+0>>1]=2,0;case 13:case 14:return 0;case 16:case 8:return-28;case 9:return K[cd()>>2]=28,-1;default:return-28}}catch(g){return"undefined"!==typeof Y&&g instanceof Q||E(g),-g.Sa}},H:function(a,b){try{var c=Z(a);return Wc(bc,c.path,b)}catch(d){return"undefined"!==typeof Y&&d instanceof Q||E(d),-d.Sa}},x:function(a,b,c){try{var d=T[a];if(!d)throw new Q(8);if(0===(d.flags&2097155))throw new Q(28);fc(d.node,c);return 0}catch(f){return"undefined"!==
typeof Y&&f instanceof Q||E(f),-f.Sa}},A:function(a,b){try{if(0===b)return-28;if(b<ca("/")+1)return-68;k("/",n,a,b);return a}catch(c){return"undefined"!==typeof Y&&c instanceof Q||E(c),-c.Sa}},B:function(){return 0},e:function(){return 42},k:function(a,b,c){Xc=c;try{var d=Z(a);switch(b){case 21509:case 21505:return d.tty?0:-59;case 21510:case 21511:case 21512:case 21506:case 21507:case 21508:return d.tty?0:-59;case 21519:if(!d.tty)return-59;var f=Yc();return K[f>>2]=0;case 21520:return d.tty?-28:
-59;case 21531:a=f=Yc();if(!d.Pa.Lb)throw new Q(59);return d.Pa.Lb(d,b,a);case 21523:return d.tty?0:-59;case 21524:return d.tty?0:-59;default:E("bad ioctl syscall "+b)}}catch(g){return"undefined"!==typeof Y&&g instanceof Q||E(g),-g.Sa}},F:function(a,b){try{return a=y(a),Wc(cc,a,b)}catch(c){return"undefined"!==typeof Y&&c instanceof Q||E(c),-c.Sa}},G:function(a,b){try{return a=y(a),a=P(a),"/"===a[a.length-1]&&(a=a.substr(0,a.length-1)),X(a,b),0}catch(c){return"undefined"!==typeof Y&&c instanceof Q||
E(c),-c.Sa}},K:function(a,b,c,d,f,g){try{a:{g<<=12;var m=!1;if(0!==(d&16)&&0!==a%65536)var p=-28;else{if(0!==(d&32)){var w=Bb(b);if(!w){p=-48;break a}m=!0}else{var u=T[f];if(!u){p=-8;break a}var C=g;if(0!==(c&2)&&0===(d&2)&&2!==(u.flags&2097155))throw new Q(2);if(1===(u.flags&2097155))throw new Q(2);if(!u.Pa.jb)throw new Q(43);var J=u.Pa.jb(u,a,b,C,c,d);w=J.Qb;m=J.mb}Vc[w]={Nb:w,Mb:b,mb:m,fd:f,Pb:c,flags:d,offset:g};p=w}}return p}catch(aa){return"undefined"!==typeof Y&&aa instanceof Q||E(aa),-aa.Sa}},
J:function(a,b){try{var c=Vc[a];if(0!==b&&c){if(b===c.Mb){var d=T[c.fd];if(d&&c.Pb&2){var f=c.flags,g=c.offset,m=n.slice(a,a+b);d&&d.Pa.kb&&d.Pa.kb(d,m,g,b,f)}Vc[a]=null;c.mb&&ia(c.Nb)}var p=0}else p=-28;return p}catch(w){return"undefined"!==typeof Y&&w instanceof Q||E(w),-w.Sa}},h:function(a,b,c){Xc=c;try{var d=y(a),f=c?Yc():0;return gc(d,b,f).fd}catch(g){return"undefined"!==typeof Y&&g instanceof Q||E(g),-g.Sa}},z:function(a,b,c){try{a=y(a);if(0>=c)var d=-28;else{var f=Lb(a),g=Math.min(c,ca(f)),
m=x[b+g];k(f,n,b,c+1);x[b+g]=m;d=g}return d}catch(p){return"undefined"!==typeof Y&&p instanceof Q||E(p),-p.Sa}},v:function(a){try{a=y(a);var b=W(a,{parent:!0}).node,c=nb(a),d=Gb(b,c),f=Ub(b,c,!0);if(f)throw new Q(f);if(!b.Oa.rmdir)throw new Q(63);if(d.cb)throw new Q(10);try{V.willDeletePath&&V.willDeletePath(a)}catch(g){F("FS.trackingDelegate['willDeletePath']('"+a+"') threw an exception: "+g.message)}b.Oa.rmdir(b,c);Ob(d);try{if(V.onDeletePath)V.onDeletePath(a)}catch(g){F("FS.trackingDelegate['onDeletePath']('"+
a+"') threw an exception: "+g.message)}return 0}catch(g){return"undefined"!==typeof Y&&g instanceof Q||E(g),-g.Sa}},i:function(a,b){try{return a=y(a),Wc(bc,a,b)}catch(c){return"undefined"!==typeof Y&&c instanceof Q||E(c),-c.Sa}},y:function(a){try{return a=y(a),pa(a),0}catch(b){return"undefined"!==typeof Y&&b instanceof Q||E(b),-b.Sa}},I:function(){return 2147483648},m:function(a,b,c){n.copyWithin(a,b,b+c)},d:function(a){var b=n.length;a>>>=0;if(2147483648<a)return!1;for(var c=1;4>=c;c*=2){var d=b*
(1+.2/c);d=Math.min(d,a+100663296);d=Math.max(a,d);0<d%65536&&(d+=65536-d%65536);a:{try{Ja.grow(Math.min(2147483648,d)-Sa.byteLength+65535>>>16);Ta();var f=1;break a}catch(g){}f=void 0}if(f)return!0}return!1},q:function(a){for(var b=Zc();Zc()-b<a;);},o:function(a,b){var c=0;ad().forEach(function(d,f){var g=b+c;f=K[a+4*f>>2]=g;for(g=0;g<d.length;++g)x[f++>>0]=d.charCodeAt(g);x[f>>0]=0;c+=d.length+1});return 0},p:function(a,b){var c=ad();K[a>>2]=c.length;var d=0;c.forEach(function(f){d+=f.length+1});
K[b>>2]=d;return 0},c:function(a){try{var b=Z(a);Lc(b);return 0}catch(c){return"undefined"!==typeof Y&&c instanceof Q||E(c),c.Sa}},n:function(a,b){try{var c=Z(a);x[b>>0]=c.tty?2:S(c.mode)?3:40960===(c.mode&61440)?7:4;return 0}catch(d){return"undefined"!==typeof Y&&d instanceof Q||E(d),d.Sa}},g:function(a,b,c,d){try{a:{for(var f=Z(a),g=a=0;g<c;g++){var m=K[b+(8*g+4)>>2],p=Oc(f,x,K[b+8*g>>2],m,void 0);if(0>p){var w=-1;break a}a+=p;if(p<m)break}w=a}K[d>>2]=w;return 0}catch(u){return"undefined"!==typeof Y&&
u instanceof Q||E(u),u.Sa}},l:function(a,b,c,d,f){try{var g=Z(a);a=4294967296*c+(b>>>0);if(-9007199254740992>=a||9007199254740992<=a)return-61;Mc(g,a,d);L=[g.position>>>0,(M=g.position,1<=+Math.abs(M)?0<M?(Math.min(+Math.floor(M/4294967296),4294967295)|0)>>>0:~~+Math.ceil((M-+(~~M>>>0))/4294967296)>>>0:0)];K[f>>2]=L[0];K[f+4>>2]=L[1];g.qb&&0===a&&0===d&&(g.qb=null);return 0}catch(m){return"undefined"!==typeof Y&&m instanceof Q||E(m),m.Sa}},s:function(a){try{var b=Z(a);return b.Pa&&b.Pa.fsync?-b.Pa.fsync(b):
0}catch(c){return"undefined"!==typeof Y&&c instanceof Q||E(c),c.Sa}},f:function(a,b,c,d){try{a:{for(var f=Z(a),g=a=0;g<c;g++){var m=Pc(f,x,K[b+8*g>>2],K[b+(8*g+4)>>2],void 0);if(0>m){var p=-1;break a}a+=m}p=a}K[d>>2]=p;return 0}catch(w){return"undefined"!==typeof Y&&w instanceof Q||E(w),w.Sa}},j:function(a){var b=Date.now();K[a>>2]=b/1E3|0;K[a+4>>2]=b%1E3*1E3|0;return 0},L:function(a){var b=Date.now()/1E3|0;a&&(K[a>>2]=b);return b},C:function(a,b){if(b){var c=b+8;b=1E3*K[c>>2];b+=K[c+4>>2]/1E3}else b=
Date.now();a=y(a);try{var d=W(a,{$a:!0}).node;d.Oa.Va(d,{timestamp:Math.max(b,b)});var f=0}catch(g){if(!(g instanceof Q)){b:{f=Error();if(!f.stack){try{throw Error();}catch(m){f=m}if(!f.stack){f="(no stack trace available)";break b}}f=f.stack.toString()}e.extraStackTrace&&(f+="\n"+e.extraStackTrace());f=fb(f);throw g+" : "+f;}f=g.Sa;K[cd()>>2]=f;f=-1}return f}};
(function(){function a(f){e.asm=f.exports;Ja=e.asm.M;Ta();I=e.asm.Da;Va.unshift(e.asm.N);Ya--;e.monitorRunDependencies&&e.monitorRunDependencies(Ya);0==Ya&&(null!==Za&&(clearInterval(Za),Za=null),$a&&(f=$a,$a=null,f()))}function b(f){a(f.instance)}function c(f){return db().then(function(g){return WebAssembly.instantiate(g,d)}).then(function(g){return g}).then(f,function(g){F("failed to asynchronously prepare wasm: "+g);E(g)})}var d={a:dd};Ya++;e.monitorRunDependencies&&e.monitorRunDependencies(Ya);
if(e.instantiateWasm)try{return e.instantiateWasm(d,a)}catch(f){return F("Module.instantiateWasm callback failed with error: "+f),!1}(function(){return Fa||"function"!==typeof WebAssembly.instantiateStreaming||ab()||N.startsWith("file://")||"function"!==typeof fetch?c(b):fetch(N,{credentials:"same-origin"}).then(function(f){return WebAssembly.instantiateStreaming(f,d).then(b,function(g){F("wasm streaming compile failed: "+g);F("falling back to ArrayBuffer instantiation");return c(b)})})})();return{}})();
e.___wasm_call_ctors=function(){return(e.___wasm_call_ctors=e.asm.N).apply(null,arguments)};e._sqlite3_free=function(){return(e._sqlite3_free=e.asm.O).apply(null,arguments)};var cd=e.___errno_location=function(){return(cd=e.___errno_location=e.asm.P).apply(null,arguments)};e._sqlite3_step=function(){return(e._sqlite3_step=e.asm.Q).apply(null,arguments)};e._sqlite3_finalize=function(){return(e._sqlite3_finalize=e.asm.R).apply(null,arguments)};
e._sqlite3_prepare_v2=function(){return(e._sqlite3_prepare_v2=e.asm.S).apply(null,arguments)};e._sqlite3_reset=function(){return(e._sqlite3_reset=e.asm.T).apply(null,arguments)};e._sqlite3_clear_bindings=function(){return(e._sqlite3_clear_bindings=e.asm.U).apply(null,arguments)};e._sqlite3_value_blob=function(){return(e._sqlite3_value_blob=e.asm.V).apply(null,arguments)};e._sqlite3_value_text=function(){return(e._sqlite3_value_text=e.asm.W).apply(null,arguments)};
e._sqlite3_value_bytes=function(){return(e._sqlite3_value_bytes=e.asm.X).apply(null,arguments)};e._sqlite3_value_double=function(){return(e._sqlite3_value_double=e.asm.Y).apply(null,arguments)};e._sqlite3_value_int=function(){return(e._sqlite3_value_int=e.asm.Z).apply(null,arguments)};e._sqlite3_value_type=function(){return(e._sqlite3_value_type=e.asm._).apply(null,arguments)};e._sqlite3_result_blob=function(){return(e._sqlite3_result_blob=e.asm.$).apply(null,arguments)};
e._sqlite3_result_double=function(){return(e._sqlite3_result_double=e.asm.aa).apply(null,arguments)};e._sqlite3_result_error=function(){return(e._sqlite3_result_error=e.asm.ba).apply(null,arguments)};e._sqlite3_result_int=function(){return(e._sqlite3_result_int=e.asm.ca).apply(null,arguments)};e._sqlite3_result_int64=function(){return(e._sqlite3_result_int64=e.asm.da).apply(null,arguments)};e._sqlite3_result_null=function(){return(e._sqlite3_result_null=e.asm.ea).apply(null,arguments)};
e._sqlite3_result_text=function(){return(e._sqlite3_result_text=e.asm.fa).apply(null,arguments)};e._sqlite3_column_count=function(){return(e._sqlite3_column_count=e.asm.ga).apply(null,arguments)};e._sqlite3_data_count=function(){return(e._sqlite3_data_count=e.asm.ha).apply(null,arguments)};e._sqlite3_column_blob=function(){return(e._sqlite3_column_blob=e.asm.ia).apply(null,arguments)};e._sqlite3_column_bytes=function(){return(e._sqlite3_column_bytes=e.asm.ja).apply(null,arguments)};
e._sqlite3_column_double=function(){return(e._sqlite3_column_double=e.asm.ka).apply(null,arguments)};e._sqlite3_column_text=function(){return(e._sqlite3_column_text=e.asm.la).apply(null,arguments)};e._sqlite3_column_type=function(){return(e._sqlite3_column_type=e.asm.ma).apply(null,arguments)};e._sqlite3_column_name=function(){return(e._sqlite3_column_name=e.asm.na).apply(null,arguments)};e._sqlite3_bind_blob=function(){return(e._sqlite3_bind_blob=e.asm.oa).apply(null,arguments)};
e._sqlite3_bind_double=function(){return(e._sqlite3_bind_double=e.asm.pa).apply(null,arguments)};e._sqlite3_bind_int=function(){return(e._sqlite3_bind_int=e.asm.qa).apply(null,arguments)};e._sqlite3_bind_text=function(){return(e._sqlite3_bind_text=e.asm.ra).apply(null,arguments)};e._sqlite3_bind_parameter_index=function(){return(e._sqlite3_bind_parameter_index=e.asm.sa).apply(null,arguments)};e._sqlite3_sql=function(){return(e._sqlite3_sql=e.asm.ta).apply(null,arguments)};
e._sqlite3_normalized_sql=function(){return(e._sqlite3_normalized_sql=e.asm.ua).apply(null,arguments)};e._sqlite3_errmsg=function(){return(e._sqlite3_errmsg=e.asm.va).apply(null,arguments)};e._sqlite3_exec=function(){return(e._sqlite3_exec=e.asm.wa).apply(null,arguments)};e._sqlite3_changes=function(){return(e._sqlite3_changes=e.asm.xa).apply(null,arguments)};e._sqlite3_close_v2=function(){return(e._sqlite3_close_v2=e.asm.ya).apply(null,arguments)};
e._sqlite3_create_function_v2=function(){return(e._sqlite3_create_function_v2=e.asm.za).apply(null,arguments)};e._sqlite3_open=function(){return(e._sqlite3_open=e.asm.Aa).apply(null,arguments)};var da=e._malloc=function(){return(da=e._malloc=e.asm.Ba).apply(null,arguments)},ia=e._free=function(){return(ia=e._free=e.asm.Ca).apply(null,arguments)};e._RegisterExtensionFunctions=function(){return(e._RegisterExtensionFunctions=e.asm.Ea).apply(null,arguments)};
e._RegisterCSVTable=function(){return(e._RegisterCSVTable=e.asm.Fa).apply(null,arguments)};e._RegisterVSVTable=function(){return(e._RegisterVSVTable=e.asm.Ga).apply(null,arguments)};
var jb=e.__get_tzname=function(){return(jb=e.__get_tzname=e.asm.Ha).apply(null,arguments)},ib=e.__get_daylight=function(){return(ib=e.__get_daylight=e.asm.Ia).apply(null,arguments)},hb=e.__get_timezone=function(){return(hb=e.__get_timezone=e.asm.Ja).apply(null,arguments)},ka=e.stackSave=function(){return(ka=e.stackSave=e.asm.Ka).apply(null,arguments)},ma=e.stackRestore=function(){return(ma=e.stackRestore=e.asm.La).apply(null,arguments)},v=e.stackAlloc=function(){return(v=e.stackAlloc=e.asm.Ma).apply(null,
arguments)},Cb=e._memalign=function(){return(Cb=e._memalign=e.asm.Na).apply(null,arguments)};e.cwrap=function(a,b,c,d){c=c||[];var f=c.every(function(g){return"number"===g});return"string"!==b&&f&&!d?La(a):function(){return Ma(a,b,c,arguments)}};e.UTF8ToString=y;e.stackSave=ka;e.stackRestore=ma;e.stackAlloc=v;var ed;$a=function fd(){ed||gd();ed||($a=fd)};
function gd(){function a(){if(!ed&&(ed=!0,e.calledRun=!0,!Ka)){e.noFSInit||Rc||(Rc=!0,Qc(),e.stdin=e.stdin,e.stdout=e.stdout,e.stderr=e.stderr,e.stdin?Tc("stdin",e.stdin):ac("/dev/tty","/dev/stdin"),e.stdout?Tc("stdout",null,e.stdout):ac("/dev/tty","/dev/stdout"),e.stderr?Tc("stderr",null,e.stderr):ac("/dev/tty1","/dev/stderr"),gc("/dev/stdin",0),gc("/dev/stdout",1),gc("/dev/stderr",1));Kb=!1;eb(Va);if(e.onRuntimeInitialized)e.onRuntimeInitialized();if(e.postRun)for("function"==typeof e.postRun&&
(e.postRun=[e.postRun]);e.postRun.length;){var b=e.postRun.shift();Wa.unshift(b)}eb(Wa)}}if(!(0<Ya)){if(e.preRun)for("function"==typeof e.preRun&&(e.preRun=[e.preRun]);e.preRun.length;)Xa();eb(Ua);0<Ya||(e.setStatus?(e.setStatus("Running..."),setTimeout(function(){setTimeout(function(){e.setStatus("")},1);a()},1)):a())}}e.run=gd;if(e.preInit)for("function"==typeof e.preInit&&(e.preInit=[e.preInit]);0<e.preInit.length;)e.preInit.pop()();gd();


        // The shell-pre.js and emcc-generated code goes above
        return Module;
    }); // The end of the promise being returned

  return initSqlJsPromise;
} // The end of our initSqlJs function

// This bit below is copied almost exactly from what you get when you use the MODULARIZE=1 flag with emcc
// However, we don't want to use the emcc modularization. See shell-pre.js
if (typeof exports === 'object' && typeof module === 'object'){
    module.exports = initSqlJs;
    // This will allow the module to be used in ES6 or CommonJS
    module.exports.default = initSqlJs;
}
else if (typeof define === 'function' && define['amd']) {
    define([], function() { return initSqlJs; });
}
else if (typeof exports === 'object'){
    exports["Module"] = initSqlJs;
}
/* global initSqlJs */
/* eslint-env worker */
/* eslint no-restricted-globals: ["error"] */

"use strict";

var db;

function onModuleReady(SQL) {
    function createDb(data) {
        if (db != null) db.close();
        db = new SQL.Database(data);
        return db;
    }

    var buff; var data; var result;
    data = this["data"];
    var config = data["config"] ? data["config"] : {};
    switch (data && data["action"]) {
        case "open":
            buff = data["buffer"];
            createDb(buff && new Uint8Array(buff));
            return postMessage({
                id: data["id"],
                ready: true
            });
        case "createCSVTable":
            if (db === null) {
                createDb();
            }
            buff = data["buffer"];
            fileName = data["fileName"];
            return postMessage({
                id: data["id"],
                results: db.createCSVTable(buff && new Uint8Array(buff), fileName)
            });
        case "createVSVTable":
            if (db === null) {
                createDb();
            }
            buff = data["buffer"];
            fileName = data["fileName"];
            sep = data["separator"];
            quick = data["quick"];
            header = data["header"];
            return postMessage({
                id: data["id"],
                results: db.createVSVTable(buff && new Uint8Array(buff), fileName, sep, quick, header)
            });
        case "exec":
            if (db === null) {
                createDb();
            }
            if (!data["sql"]) {
                throw "exec: Missing query string";
            }
            return postMessage({
                id: data["id"],
                results: db.exec(data["sql"], data["params"], config)
            });
        case "each":
            if (db === null) {
                createDb();
            }
            var callback = function callback(row) {
                return postMessage({
                    id: data["id"],
                    row: row,
                    finished: false
                });
            };
            var done = function done() {
                return postMessage({
                    id: data["id"],
                    finished: true
                });
            };
            return db.each(data["sql"], data["params"], callback, done, config);
        case "export":
            buff = db["export"]();
            result = {
                id: data["id"],
                buffer: buff
            };
            try {
                return postMessage(result, [result]);
            } catch (error) {
                return postMessage(result);
            }
        case "close":
            if (db) {
                db.close();
            }
            return postMessage({
                id: data["id"]
            });
        default:
            throw new Error("Invalid action : " + (data && data["action"]));
    }
}

function onError(err) {
    return postMessage({
        id: this["data"]["id"],
        error: err["message"]
    });
}

if (typeof importScripts === "function") {
    db = null;
    var sqlModuleReady = initSqlJs();
    self.onmessage = function onmessage(event) {
        return sqlModuleReady
            .then(onModuleReady.bind(event))
            .catch(onError.bind(event));
    };
}
