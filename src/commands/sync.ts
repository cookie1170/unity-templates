import { readdir } from "fs/promises";
import { Config, getConfig } from "../config";
import { syncProjects } from "./project";
import ora from "ora";

export async function syncCommand() {
    const config: Config = await getConfig();
    const versions: string[] = await readdir(`${config.editorPath}`);
    for (const version of versions) {
        const projectSpinner = ora(
            `"Syncing project templates for ${version}"`
        ).start();
        await syncProjects(`${config.editorPath}/${version}`, projectSpinner);
        projectSpinner.succeed(`Synced project templates for ${version}`);
    }
}
