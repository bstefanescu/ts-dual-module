import { build } from './build.js';
import { addExport, init } from './init.js';
import { PackageJson } from './package.js';



export function main() {
    const pkg = PackageJson.findClosestPackage();
    if (!pkg) {
        console.error('No package.json found');
        process.exit(1);
    }
    if (pkg.data.type !== 'module') {
        console.error('Invalid package.json. Only ESM packages (type: "module") are supported.');
        process.exit(1);
    }
    const args = process.argv.slice(2);
    const cmd = args[0];
    if (cmd === 'init') {
        init(pkg, args.slice(1));
    } else if (cmd === 'build') {
        build(pkg, args.slice(1));
    } else if (cmd === 'export') {
        addExport(pkg, args.slice(1));
    } else {
        console.log('Usage: ts-dual-mod <command> [options]');
        console.log('Commands:');
        console.log('  build   Build the package');
        console.log('          You can pass any tsc option but --outDir');
        console.log('  init    Initialize ts-dual-mod');
        console.log('          Use --force to reset the existing outDir and the tsconfig.json');
        console.log('  export  Add a sub-path export to the package.json.');
        console.log('          Syntax: export path filePathInOutDir');
    }
}
