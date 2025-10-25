import { confirm, question } from "@topcli/prompts";
import { config } from "../config";
import { formatToPath, readUnityProjects } from "../misc";
import path from "path";
import { initEditorPath } from "unity-helper";

export async function initCommand() {
    config.clear();

    await initEditorPath();

    let projectsPath: string = "";
    while (true) {
        projectsPath = formatToPath(await question("Please input your projects path"));

        if ((await readUnityProjects(projectsPath)).length <= 0) {
            if (await confirm("No valid Unity projects found. Continue anyway?")) break;
        } else break;
    }

    config.set("projectsPath", path.resolve(projectsPath));
}
