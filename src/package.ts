import fs from 'fs';
import path from 'path';

export const OUT_DIR = 'dist';
export const SRC_DIR = 'src';

function findPackage(dirPath: string): string | undefined {
    let parent;
    let dir = path.resolve(dirPath);

    do {
        let pkgJson = path.join(dir, 'package.json');
        if (fs.existsSync(pkgJson)) {
            return pkgJson;
        }
        parent = dir;
        dir = path.dirname(dir);
    } while (dir !== parent); // . ror /
}

export class PackageJson {
    dirty = false;
    baseDir: string;
    constructor(public file: string, public data: Record<string, any>) {
        this.baseDir = path.dirname(file);
    }

    get srcDir(): string | undefined {
        return this.data.ts_dual_module?.srcDir;
    }

    set srcDir(srcDir: string) {
        if (!this.data.ts_dual_module) {
            this.data.ts_dual_module = {};
        }
        this.data.ts_dual_module.srcDir = srcDir;
        this.dirty = true;
    }

    get outDir(): string | undefined {
        return this.data.ts_dual_module?.outDir;
    }

    set outDir(outDir: string) {
        if (!this.data.ts_dual_module) {
            this.data.ts_dual_module = {};
        }
        this.data.ts_dual_module.outDir = outDir;
        this.dirty = true;
    }

    get exports(): Record<string, string> | undefined {
        return this.data.ts_dual_module?.exports;
    }

    set exports(exports: Record<string, string>) {
        if (!this.data.ts_dual_module) {
            this.data.ts_dual_module = {};
        }
        this.data.ts_dual_module.exports = exports;
        this.dirty = true;
    }

    get resolvedSrcDir() {
        return path.join(this.baseDir, this.srcDir || SRC_DIR);
    }

    get resolvedOutDir() {
        return path.join(this.baseDir, this.outDir || OUT_DIR);
    }

    get defaultTsConfig() {
        return path.join(this.baseDir, 'tsconfig.json');
    }

    resolveTsConfig(type: 'cjs' | 'esm') {
        if (type === 'esm') {
            const esmConfig = path.join(this.baseDir, 'tsconfig.esm.json');
            return fs.existsSync(esmConfig) ? esmConfig : this.defaultTsConfig;
        } else if (type === 'cjs') {
            const cjsConfig = path.join(this.baseDir, 'tsconfig.cjs.json');
            return fs.existsSync(cjsConfig) ? cjsConfig : this.defaultTsConfig;
        } else {
            return this.defaultTsConfig;
        }
    }

    generateExports() {
        const outDir = this.outDir || OUT_DIR;
        const exportMap = this.exports || {};
        const root = {
            "types": `./${outDir}/types/index.d.ts`,
            "default": `./${outDir}/esm/index.js`,
            "import": `./${outDir}/esm/index.js`,
            "require": `./${outDir}/cjs/index.js`,
        }
        const entries = Object.entries(exportMap);
        if (!entries.length) {
            this.data.exports = root
        } else {
            // "typesVersions": {
            //     "*": {
            //         "async": [
            //             "./lib/types/async.d.ts"
            //         ]
            //     }
            // },

            const pkgExports: Record<string, any> = {
                ".": root,
            }
            const dtsMapping: Record<string, string[]> = {};
            const typesVersions: Record<string, any> = {
                "*": dtsMapping
            }
            for (const [key, val] of entries) {
                const [pathName, ext] = computeExportPath(val);
                pkgExports['./' + key] = {
                    "types": `./${outDir}/types/${pathName}.d.ts`,
                    "default": `./${outDir}/esm/${pathName}${ext}`,
                    "import": `./${outDir}/esm/${pathName}${ext}`,
                    "require": `./${outDir}/cjs/${pathName}${ext}`,
                };
                dtsMapping[key] = [`./${outDir}/types/${pathName}.d.ts`];
            }
            this.data.typesVersions = typesVersions;
            this.data.exports = pkgExports;
        }
        this.dirty = true;
    }


    generateTypings() {
        const outDir = this.outDir || OUT_DIR;
        delete this.data.typings;
        this.data.types = `./${outDir}/types/index.d.ts`;
        this.dirty = true;
    }

    save(force = false) {
        if (force || this.dirty) {
            fs.writeFileSync(this.file, JSON.stringify(this.data, null, 2));
            this.dirty = false;
        }
    }

    static loadFile(file: string) {
        let absFile = path.resolve(file);
        const content = fs.readFileSync(absFile, 'utf-8');
        return new PackageJson(absFile, JSON.parse(content));
    }

    static findClosestPackage(dirPath?: string) {
        const path = findPackage(dirPath || process.cwd());
        return path ? PackageJson.loadFile(path) : undefined;
    }
}

function computeExportPath(value: string) {
    const ext = path.extname(value);
    return ext ? [value.slice(0, -ext.length), ext] : [path.join(value, 'index'), '.js'];
}