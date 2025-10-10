import { BunFile } from "bun";
import { readdir } from "fs/promises";

export const configBasePath: string = `${process.env.HOME}/.config/unity-templates`;
const commonConfigPath: string = `${configBasePath}/config/common.json`;
const projectTemplatesConfigPath: string = `${configBasePath}config/project-templates.json`;

export type Config = {
    editorPath: string;
};

export type ProjectTemplatesConfig = {
    projectsPath: string;
};

export async function getConfig(): Promise<Config> {
    return await getOrCreateConfigFile<Config>(commonConfigPath, getDefaultConfig);
}

export async function getProjectTemplatesConfig(): Promise<ProjectTemplatesConfig> {
    return await getOrCreateConfigFile<ProjectTemplatesConfig>(
        projectTemplatesConfigPath,
        getDefaultProjectTemplatesConfig
    );
}

async function getOrCreateConfigFile<T>(path: string, getDefault: Function): Promise<T> {
    let file: BunFile = Bun.file(path);

    if (!(await file.exists())) {
        await file.write(getDefault());
        file = Bun.file(path);
    }

    if (process.env.HOME === undefined) throw new Error("$HOME env variable is undefined!");

    const home: string = process.env.HOME;

    const text: string = await file.text().then((s) => s.replaceAll("$HOME", home));

    const config: T = JSON.parse(text);

    return config;
}

function getDefaultConfig(): string {
    const config: Config = {
        editorPath: "$HOME/Unity/Hub/Editor",
    };

    return JSON.stringify(config);
}

function getDefaultProjectTemplatesConfig(): string {
    const config: ProjectTemplatesConfig = {
        projectsPath: "$HOME/Projects/Unity",
    };

    return JSON.stringify(config);
}
export async function getEditorVersions(): Promise<EditorVersion[]> {
    const config: Config = await getConfig();
    const versions: string[] = await readdir(`${config.editorPath}`);

    return versions.map((version) => {
        return { version: version, path: `${config.editorPath}/${version}` };
    });
}

export type EditorVersion = {
    version: string;
    path: string;
};
