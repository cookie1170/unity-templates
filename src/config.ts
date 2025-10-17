import Conf from "conf";
import { confirm } from "@topcli/prompts";
import { initCommand } from "./commands/init";

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
