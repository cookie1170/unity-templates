import { confirm, question } from "@topcli/prompts";
import { config } from "../config";
import { formatToPath, readUnityProjects } from "../misc";
import path from "path";
import { initEditorPath, setEditorPath } from "unity-helper";
import ora from "ora";

export async function initCommand(options: any = {}) {
    config.clear();

    let projectsPath: string = "";

    if (options.projectsPath === undefined) {
        while (true) {
            projectsPath = formatToPath(await question("Please input your projects path"));

            if ((await readUnityProjects(projectsPath)).length <= 0) {
                if (await confirm("No valid Unity projects found. Continue anyway?")) break;
            } else break;
        }
    } else projectsPath = options.projectsPath;

    config.set("projectsPath", path.resolve(projectsPath));

    if (options.editorPath !== undefined) {
        setEditorPath(options.editorPath);
        return;
    }

    const spin = ora({
        text: "Trying to launch Unity hub to get the editor path",
        isSilent: options.silent || !options.hub, // commander does weird thing by making --no-hub set options.hub to false even if there is no hub option
    }).start();
    try {
        await initEditorPath(
            () => {
                spin.succeed("Succesfully got the editor path from Unity hub");
            },
            () => {
                spin.fail("Failed to launch Unity hub");
            },
            options.hubOnly,
            !options.hub
        );
    } catch {
        process.exit(1);
    }
}
