import { spawnSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { PackageJson } from './package.js';
import { initConfig } from './init.js';

//--noEmit
//--composite false
//--declaration, -d
//--declarationDir
//--outDir
//--module, -m
//--moduleResolution
function buildArgsMap(args: string[]) {
    const out: Record<string, string> = {};
    let key: string | null = null;
    for (let i = 0, l = args.length; i < l; i++) {
        const arg = args[i];
        if (arg.startsWith('-')) {
            key = arg;
            out[key] = '';
        } else if (key) {
            out[key] = arg;
            key = null;
        }
    }

    //remove  --outDir
    delete out['--outDir'];
    // remove --declaration alias
    delete out['-d'];
    // use --module instead of -m
    if (!out['--module']) {
        let module = out['-m'];
        if (module) {
            out['--module'] = module;
            delete out['-m'];
        }
    }

    return out;
}

function esm_buildParams(outDir: string, genTypes: boolean, params: Record<string, string>) {
    params['--noEmit'] = 'false';
    params['--composite'] = 'false';
    params['--declaration'] = genTypes ? 'true' : 'false';
    if (genTypes) {
        params['--declarationDir'] = `${outDir}/types`;
        params['--declarationMap'] = "true";
    } else {
        delete params['--declarationDir'];
        delete params['--declarationMap'];
    }
    params['--outDir'] = `${outDir}/esm`;
    if (!params['--module']) {
        params['--module'] = 'nodenext';
        params['--moduleResolution'] = 'nodenext';
    }
    return params;
}

function cjs_buildParams(outDir: string, genTypes: boolean, params: Record<string, string>) {
    params['--noEmit'] = 'false';
    params['--composite'] = 'false';
    params['--declaration'] = genTypes ? 'true' : 'false';
    if (genTypes) {
        params['--declarationDir'] = `${outDir}/types`;
        params['--declarationMap'] = "true";
    } else {
        delete params['--declarationDir'];
        delete params['--declarationMap'];
    }
    params['--outDir'] = `${outDir}/cjs`;
    params['--module'] = 'commonjs';
    params['--moduleResolution'] = 'node10';
    return params;
}

export async function build(pkg: PackageJson, args: string[]) {
    const params = buildArgsMap(args);
    let isEsm = '--esm' in params;
    let isCjs = '--cjs' in params;
    let genEsmTypes = true;
    let genCjsTypes = false;
    if (!isEsm && !isCjs) {
        isEsm = true;
        isCjs = true;
    }
    if (!isEsm && isCjs) {
        genCjsTypes = true;
    }
    delete params['--esm'];
    delete params['--cjs'];

    const projectDir = path.resolve(path.dirname(pkg.file));
    let outDir = pkg.outDir;
    if (!outDir) {
        outDir = await initConfig(pkg);
    }
    outDir = path.join(projectDir, outDir);
    if (isEsm) {
        _build(esm_buildParams(outDir, genEsmTypes, params));
    }
    if (isCjs) {
        _build(cjs_buildParams(outDir, genCjsTypes, params));
        fs.writeFileSync(`${outDir}/cjs/package.json`, JSON.stringify({ type: 'commonjs' }, null, 2));
    }
}

function _build(params: Record<string, string>) {
    const args = ['npx', 'tsc'];
    for (const key of Object.keys(params)) {
        const val = params[key];
        args.push(key);
        val && args.push(val);
    }
    const r = spawnSync('npx', args, {
        stdio: ['inherit', 'inherit', 'inherit'],
    })
    if (r.status) {
        process.exit(r.status);
    }
}
