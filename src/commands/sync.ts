import { syncProjects } from "./project";
import { multiselect, confirm } from "@topcli/prompts";
import { syncScripts } from "./script";
import { getConfig } from "../config";
import { EditorVersion, readUnityEditorVersions } from "../misc";
import path from "node:path";

export async function syncCommand(options: any) {
    const versions: EditorVersion[] = await readUnityEditorVersions();
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
        return { version: version, path: path.join(editorPath, version) };
    });

    for (const version of selectedVersions) {
        await syncProjects(version, options.silent);
        await syncScripts(version, options.silent);
    }
}

export async function syncPrompt(
    override: boolean | undefined = undefined,
    silent: boolean,
    beforeSync: ((didSync: boolean) => void | Promise<void>) | undefined = undefined
) {
    if (override === undefined) {
        trySync(await confirm("Sync now?", { initial: true }));
        return;
    }

    trySync(override);

    async function trySync(didAccept: boolean) {
        if (beforeSync !== undefined) await beforeSync(didAccept);
        if (didAccept) await syncCommand({ silent: silent });
    }
}
