import { confirm, question } from "@topcli/prompts";
import { config } from "../config";
import { formatToPath, readUnityEditorVersions } from "../misc";
import path from "path";
import { readUnityProjects } from "../misc";

const defaultEditorPaths: Map<string, string> = new Map([
    ["darvin", path.join("Applications", "Unity", "Hub", "Editor")],
    ["linux", path.join("~", "Unity", "Hub", "Editor")],
    ["win32", path.join("C:", "Program Files", "Unity", "Hub", "Editor")],
]);

export async function initCommand() {
    config.clear();

    let editorPath: string;
    while (true) {
        editorPath = formatToPath(
            await question("Please input the path to the Unity editor", {
                defaultValue: defaultEditorPaths.get(process.platform),
            })
        );

        if ((await readUnityEditorVersions(editorPath)).length <= 0) {
            if (await confirm("No valid Unity editor installations found. Continue anyway?")) break;
        } else break;
    }

    let projectsPath: string = "";
    while (true) {
        projectsPath = formatToPath(await question("Please input your projects path"));

        if ((await readUnityProjects(projectsPath)).length <= 0) {
            if (await confirm("No valid Unity projects found. Continue anyway?")) break;
        } else break;
    }

    config.set("editorPath", editorPath);
    config.set("projectsPath", projectsPath);
}
