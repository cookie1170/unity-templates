import { syncProjects } from "./project";
import { multiselect, confirm } from "@topcli/prompts";
import { syncScripts } from "./script";
import { getConfig } from "../config";
import { EditorVersion, getEditorVersions } from "../misc";

export async function syncCommand() {
    const versions: EditorVersion[] = await getEditorVersions();
    const editorPath: string = await getConfig("editorPath");

    const versionChoices: string[] = versions.map((version) => version.version);
    const selectedVersions: EditorVersion[] = (
        versions.length <= 1
            ? versionChoices
            : await multiselect("Select versions to sync", {
                  choices: versionChoices,
                  preSelectedChoices: versionChoices,
              })
    ).map((version) => {
        return { version: version, path: `${editorPath}/${version}` };
    });

    for (const version of selectedVersions) {
        await syncProjects(version);
        await syncScripts(version);
    }
}

export async function syncPrompt(override: boolean | undefined = undefined) {
    if (override === undefined) {
        if (await confirm("Sync now?", { initial: true })) syncCommand();
        return;
    }

    if (override) syncCommand();
}
