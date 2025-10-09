import { BunFile } from "bun";
import { spinner } from "@bunli/utils";

const configPath: string = `${process.env.HOME}/.config/unity-templates/config.json`;

export type Config = {
    editorPath: string;
};

export async function getConfig(): Promise<Config> {
    let configFile: BunFile = Bun.file(configPath);

    if (!(await configFile.exists())) {
        await configFile.write(getDefaultConfig());
        configFile = Bun.file(configPath);
    }

    const config: Config = await configFile.json();

    if (process.env.HOME === undefined)
        throw new Error("$HOME env variable is undefined!");

    const home: string = process.env.HOME;

    config.editorPath = config.editorPath.replace("$HOME", home);

    return config;
}

function getDefaultConfig(): string {
    const config: Config = {
        editorPath: "$HOME/Unity/Hub/Editor",
    };

    return JSON.stringify(config);
}
