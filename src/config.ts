import Conf from "conf";
import { confirm, question } from "@topcli/prompts";
import { formatToPath } from "./misc";
import path from "node:path";

const defaultEditorPaths: Map<string, string> = new Map([
    ["darvin", path.join("/", "Applications", "Unity", "Hub", "Editor")],
    ["linux", path.join("~", "Unity", "Hub", "Editor")],
    ["win32", path.join("C:", "Program Files", "Unity", "Hub", "Editor")],
]);

const defaultProjectPaths: Map<string, string> = new Map([
    ["darvin", path.join("~", "Projects", "Unity")],
    ["linux", path.join("~", "Projects", "Unity")],
    ["win32", path.join("homedir", "Documents", "Projects", "Unity")],
]);

const schema = {
    editorPath: {
        type: "string",
    },
    projectsPath: {
        type: "string",
    },
};

export const config = new Conf({
    projectName: "unity-templates",
    schema,
});

export async function initCommand() {
    process.platform;
    config.clear();

    const editorPath = formatToPath(
        await question("Please input the path to the Unity editor", {
            defaultValue: defaultEditorPaths.get(process.platform),
        })
    );

    const projectsPath = formatToPath(
        await question("Please input your projects path", {
            defaultValue: defaultProjectPaths.get(process.platform),
        })
    );

    config.set("editorPath", editorPath);
    config.set("projectsPath", projectsPath);
}

export async function getConfig<T = string>(configPath: string): Promise<T> {
    const configValue: string | undefined = config.get(configPath, undefined);

    if (configValue === undefined) {
        if (
            await confirm("Looks like your config is missing. Would you like to set it up now?", {
                initial: true,
            })
        ) {
            await initCommand();
        } else process.exit(1);
    }

    return config.get(configPath);
}

export function getConfigFolder(): string {
    const configPath: string = config.path;
    return configPath.replace("config.json", "");
}
