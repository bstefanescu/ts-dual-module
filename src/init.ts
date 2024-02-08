import path from 'path';
import fs from 'fs';
import { PackageJson } from "./package";
import enquirer from 'enquirer';
const { prompt } = enquirer;

export async function init(pkg: PackageJson, args: string[]) {
    const force = args.includes('--force');
    if (force || !pkg.data.ts_dual_mod) {
        initConfig(pkg);
    }

    if (force || !fs.existsSync(path.join(pkg.baseDir, 'tsconfig.json'))) {
        // generate a tsconfig.json
        console.log('Generating tsconfig.json file.');
        const fileURL = new URL("../templates/tsconfig.json", import.meta.url);
        const content = fs.readFileSync(fileURL, "utf8");
        fs.writeFileSync(path.join(pkg.baseDir, 'tsconfig.json'), content);
    }
}

export async function initConfig(pkg: PackageJson) {
    const answers = await prompt([
        {
            type: 'input',
            name: 'outDir',
            message: 'Output directory for the build:',
            initial: pkg.outDir || 'dist'
        },
        // {
        //     type: 'input',
        //     name: 'srcDir',
        //     message: 'Sources directory (where you write your .ts files):',
        //     initial: pkg.srcDir || 'src'
        // }
    ]);
    const outDir: string = (answers as any).outDir.trim() || 'dist';
    // const srcDir: string = (answers as any).srcDir.trim() || 'src';
    pkg.outDir = outDir;
    // pkg.srcDir = srcDir;
    pkg.generateExports();
    pkg.generateTypings();
    pkg.save();
    return outDir;
}

export function addExport(pkg: PackageJson, args: string[]) {
    const [name, path] = args;
    const exportsMap = pkg.exports || {};
    exportsMap[name] = path;
    pkg.exports = exportsMap;
    pkg.generateExports();
    pkg.save();
}

