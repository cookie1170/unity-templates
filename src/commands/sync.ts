import { Config, EditorVersion, getConfig, getEditorVersions } from "../config";
import { syncProjects } from "./project";
import { multiselect } from "@topcli/prompts";
import { syncScriptTemplates as syncScripts } from "./script";

export async function syncCommand() {
    const config: Config = await getConfig();
    const versions: EditorVersion[] = await getEditorVersions();

    const versionChoices: string[] = versions.map((version) => version.version);
    const selectedVersions: EditorVersion[] = (
        versions.length <= 1
            ? versionChoices
            : await multiselect("Select versions to sync", {
                  choices: versionChoices,
                  preSelectedChoices: versionChoices,
              })
    ).map((version) => {
        return { version: version, path: `${config.editorPath}/${version}` };
    });

    for (const version of selectedVersions) {
        await syncProjects(version);
        await syncScripts(version);
    }
}
