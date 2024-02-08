# ts-dual-module
Easily build ts projects as dual packaged modules (cjs+esm)

The tool is designed to work on ESM packages (type: "module") and will build both ESM and commonjs versions of your code using typescript. 
The package.json exports is automatically updated to match your build.

You must create a `./tsconfig.json` file in the project root, which will be used by the tool to as the base tsc configuration.  If you don't have one just run `npx tsmod init` and it will create one for you. 

The first time you build you will be asked for the oputput directory name where the generated files will be stored. The default is `dist`.

To start a build run: `npx tsmod build`. You can pass any additional tsc options you need.

### Sub-paths exports

Also, sub-paths exports are supported (this is not working by default with commonjs builds because typescript is only handling subpath exports if moduleResolution >= Node16).

The tool is fxing this by mapping types using a `typesVersions` entry in the package.json

See:
* https://stackoverflow.com/questions/76236503/not-able-to-get-typescript-definitions-working-when-using-subpath-exports
* https://www.npmjs.com/package/typescript-subpath-exports-workaround

To add an export path run: `npx tsmod export mypath path/to/out/file.js`

