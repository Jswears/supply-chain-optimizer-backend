"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var esbuild_1 = require("esbuild");
var esbuild_plugin_tsc_1 = require("esbuild-plugin-tsc");
var glob_1 = require("glob");
var archiver_1 = require("archiver");
var fs_1 = require("fs");
var path_1 = require("path");
console.log('Cleaning dist and zipped folders...');
fs_1.default.rmSync('dist', { recursive: true, force: true });
fs_1.default.rmSync('infrastructure/build', { recursive: true, force: true });
console.log('🔃Building...');
// Get command line arguments - check if a specific function name was provided
var args = process.argv.slice(2);
var functionArg = args.find(function (arg) { return !arg.startsWith('--'); });
var entryPoints = glob_1.glob.sync('src/services/**/*.ts');
// Filter entry points if a specific function was requested
function getFilteredEntryPoints(funcName) {
    if (!funcName) {
        return entryPoints;
    }
    var filtered = entryPoints.filter(function (entry) {
        var baseName = path_1.default.basename(entry, path_1.default.extname(entry));
        return baseName === funcName;
    });
    if (filtered.length === 0) {
        console.error("Error: Function \"".concat(funcName, "\" not found in src/services/**/*.ts"));
        console.log('Available functions:');
        entryPoints.forEach(function (entry) {
            console.log("- ".concat(path_1.default.basename(entry, path_1.default.extname(entry))));
        });
        process.exit(1);
    }
    return filtered;
}
function buildAndZip() {
    return __awaiter(this, void 0, void 0, function () {
        var filteredEntries;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    filteredEntries = getFilteredEntryPoints(functionArg);
                    if (functionArg) {
                        console.log("Building only the \"".concat(functionArg, "\" function..."));
                    }
                    else {
                        console.log("Building all ".concat(filteredEntries.length, " functions..."));
                    }
                    return [4 /*yield*/, Promise.all(filteredEntries.map(function (entry) { return __awaiter(_this, void 0, void 0, function () {
                            var functionName, functionDistDir;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        functionName = path_1.default.basename(entry, path_1.default.extname(entry));
                                        functionDistDir = "dist/".concat(functionName);
                                        fs_1.default.mkdirSync(functionDistDir, { recursive: true });
                                        console.log("Building ".concat(functionName, "..."));
                                        return [4 /*yield*/, esbuild_1.default.build({
                                                entryPoints: [entry],
                                                outdir: functionDistDir,
                                                bundle: true,
                                                platform: 'node',
                                                target: 'node22',
                                                sourcemap: true,
                                                minify: true,
                                                plugins: [(0, esbuild_plugin_tsc_1.default)()],
                                            })];
                                    case 1:
                                        _a.sent();
                                        console.log("Zipping ".concat(functionName, "..."));
                                        return [4 /*yield*/, zipDirectory(functionDistDir, "infrastructure/build/".concat(functionName, ".zip"))];
                                    case 2:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); }))];
                case 1:
                    _a.sent();
                    console.log('✅All builds and zips completed.');
                    return [2 /*return*/];
            }
        });
    });
}
function zipDirectory(sourceDir, outPath) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            if (!fs_1.default.existsSync('infrastructure/build')) {
                fs_1.default.mkdirSync('infrastructure/build', { recursive: true });
            }
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    var output = fs_1.default.createWriteStream(outPath);
                    var archive = (0, archiver_1.default)('zip', { zlib: { level: 9 } });
                    output.on('close', function () {
                        console.log("Zipped ".concat(sourceDir, " -> ").concat(outPath, " (").concat(archive.pointer(), " bytes)"));
                        resolve();
                    });
                    output.on('error', reject);
                    archive.on('error', reject);
                    archive.pipe(output);
                    archive.directory(sourceDir, false);
                    archive.finalize();
                })];
        });
    });
}
buildAndZip().catch(function (err) {
    console.error('Build failed:', err);
    process.exit(1);
});
