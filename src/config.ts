import Conf from "conf";
import { confirm, question } from "@topcli/prompts";
import { formatToPath } from "./misc";
import path from "node:path";

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
    config.clear();

    const editorPath = formatToPath(
        // TODO: use OS-based path instead!
        await question("Please input the path to the Unity editor", {
            defaultValue: path.join("~", "Unity", "Hub", "Editor"),
        })
    );

    const projectsPath = formatToPath(
        // TODO: use OS-based path instead!
        await question("Please input your projects path", {
            defaultValue: path.join("~", "Projects", "Unity"),
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
