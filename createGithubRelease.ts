import { $ } from "bun";
import { rename, rm } from "node:fs/promises";
import packageJson from "./package.json";
import ora from "ora";
import { program } from "commander";

program.option("-d --dry-run", "Don't upload anything");
program.parse();

const buildPlatforms: BuildPlatform[] = [
    {
        bunName: "bun-linux-x64",
        name: "linux-x64",
        srcFileExtension: "",
        targetFileExtension: ".x86_64",
    },
    {
        bunName: "bun-linux-arm64",
        name: "linux-arm64",
        srcFileExtension: "",
        targetFileExtension: ".x86_64",
    },
    {
        bunName: "bun-windows-x64",
        name: "windows-x64",
        srcFileExtension: ".exe",
        targetFileExtension: ".exe",
    },
    {
        bunName: "bun-darwin-x64",
        name: "macos-x64",
        srcFileExtension: "",
        targetFileExtension: "",
    },
    {
        bunName: "bun-darwin-arm64",
        name: "macos-arm64",
        srcFileExtension: "",
        targetFileExtension: "",
    },
];

const spin = ora("Removing old binaries").start();
await rm("./bin", { recursive: true, force: true });

let succeededPlatforms: BuildPlatform[] = [];

for (const platform of buildPlatforms) {
    try {
        spin.text = `Building for ${platform.name}`;
        await Bun.build({
            compile: true,
            entrypoints: ["./src/index.ts"],
            outdir: "./bin",
            target: platform.bunName,
        });

        await rename(
            `./bin/src${platform.srcFileExtension}`,
            `./bin/unity-templates-${platform.name}${platform.targetFileExtension}`
        );

        succeededPlatforms.push(platform);
    } catch {
        spin.warn(`Failed to compile binary for ${platform.name}`).start();
    }
}

const version = packageJson.version;
const tag = `v${version}`;

if (!program.opts().dryRun) {
    spin.text = `Pushing tags`;
    await $`git push --tags`.quiet();

    spin.text = `Creating github release for tag ${tag}`;
    await $`gh release create ${tag} --generate-notes`.quiet();

    for (const platform of succeededPlatforms) {
        spin.text = `Uploading binary for ${platform.name}`;
        await $`gh release upload ${tag} ./bin/unity-templates-${platform.name}${platform.targetFileExtension}`.quiet();
    }
}

spin.succeed(`Created release for tag ${tag} with ${succeededPlatforms.length} binaries`);

type BuildPlatform = {
    bunName: string;
    name: string;
    srcFileExtension: string;
    targetFileExtension: string;
};
