import { readdir } from "fs/promises";
import { Config, getConfig } from "../config";
import { syncProjects } from "./project";
import ora from "ora";
import { multiselect } from "@topcli/prompts";

export async function syncCommand() {
    const config: Config = await getConfig();
    const versions: string[] = await readdir(`${config.editorPath}`);

    const selectedVersions: string[] =
        versions.length <= 1
            ? versions
            : await multiselect("Select versions to sync", {
                  choices: versions,
                  preSelectedChoices: versions,
              });

    for (const version of selectedVersions) {
        const projectSpinner = ora(`"Syncing project templates for ${version}"`).start();
        await syncProjects(`${config.editorPath}/${version}`, projectSpinner);
        projectSpinner.succeed(`Synced project templates for ${version}`);
    }
}
