//这个文件会帮助我们打包 packages下的模块， 最终打包输出js文件
import esbuild from 'esbuild'
import minimist from "minimist";
import {resolve,dirname} from 'path';
import {fileURLToPath} from "url"
import {createRequire} from "module";

//ndoe 中的命令函数参数通过process 来获取 process.argv 
//node dev.js (要打包的名字 -f 打包格式)=== process.argv.slice(2)
const args= minimist(process.argv.slice(2));

const __file=fileURLToPath(import.meta.url); //获取绝对路径文件
const __dirname=dirname(__file);
const require=createRequire(import.meta.url);

const target = args._[0]||'';//打包的哪个项目
const format= args.f||'iife';//打包输出的模块格式规范

//入口文件 
const entry=resolve(__dirname,`../packages/${target}/src/index.ts`);

const pkg=require(`../packages/${target}/package.json`);

esbuild.context({
    entryPoints: [entry],//入口文件
    bundle: true, //统一打包到一起
    outfile: resolve(__dirname,`../packages/${target}/dist/${target}.js`),
    format,
    platform: 'browser',
    sourcemap: true,//可以调试源代码，
    globalName: pkg.buildOptions?.name,//iife模块的全局变量名
}).then((ctx)=>{
  console.log('esbuild context ready');
  return ctx.watch(); //监控入口文件 进行持续打包
})
