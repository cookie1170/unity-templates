import ora from "ora";
import { getConfigFolder } from "../config";
import { exists, rm } from "node:fs/promises";
import { formatPath } from "../misc";
import { savedScriptTemplatesPath } from "./script";
import { savedProjectTemplatesPath } from "./project";

export async function clearAllCommand() {
    const configFolder = getConfigFolder();
    const spinner = ora(`Removing ${formatPath(configFolder)}`).start();

    if (!(await exists(configFolder))) {
        spinner.fail("Config folder not found");
        process.exit(1);
    }

    await rm(configFolder, { recursive: true, force: true });
    spinner.succeed("Cleared config!");
}

export async function clearConfigCommand() {
    const configFolder = getConfigFolder();
    const configFile = `${configFolder}/config.json`;

    const spinner = ora(`Removing ${formatPath(configFile)}`).start();

    if (!(await exists(configFile))) {
        spinner.fail("Config file not found");
        process.exit(1);
    }

    await rm(configFile);
}

export async function clearScriptTemplatesCommand() {
    const spinner = ora(`Removing ${formatPath(savedScriptTemplatesPath)}`).start();

    if (!(await exists(savedScriptTemplatesPath))) {
        spinner.fail("Script templates path not found");
        process.exit(1);
    }

    await rm(savedScriptTemplatesPath, { recursive: true, force: true });
}

export async function clearProjectTemplatesCommand() {
    const spinner = ora(`Removing ${formatPath(savedProjectTemplatesPath)}`).start();

    if (!(await exists(savedScriptTemplatesPath))) {
        spinner.fail("Project templates path not found");
        process.exit(1);
    }

    await rm(savedScriptTemplatesPath, { recursive: true, force: true });
}
