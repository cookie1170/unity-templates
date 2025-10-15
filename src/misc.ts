import { mkdir, readdir, rm } from "node:fs/promises";
import { getConfig, getConfigFolder } from "./config";
import { Ora } from "ora";
import path from "node:path";

export function formatPath(path: string): string {
    if (process.env.HOME !== undefined) {
        return path.replace(process.env.HOME, "~");
    }

    return path;
}

export function formatToPath(input: string): string {
    if (process.env.HOME !== undefined) {
        return input.replace("~", process.env.HOME);
    }

    return input;
}

export async function getEditorVersions(): Promise<EditorVersion[]> {
    const editorPath = await getConfig("editorPath");
    const versions: string[] = await readdir(`${editorPath}`);

    return versions.map((version) => {
        return { version: version, path: path.join(editorPath, version) };
    });
}

export async function makeOrReaddir(dir: string): Promise<string[]> {
    await mkdir(dir, { recursive: true });
    return await readdir(dir);
}

export async function makeTemporary(spinner: Ora | undefined = undefined): Promise<string> {
    const configFolder = getConfigFolder();

    const tempPath: string = path.join(configFolder, "tmp-${Date.now()");
    if (spinner !== undefined) spinner.text = `Making temporary folder at ${tempPath}`;

    await mkdir(tempPath);
    return tempPath;
}

export async function clearTemporary(spinner: Ora | undefined = undefined): Promise<void> {
    const configFolder = getConfigFolder();
    const temporaryFiles: string[] = (await readdir(configFolder)).filter((dir) => dir.startsWith("tmp"));

    for (const temporaryFile of temporaryFiles) {
        if (spinner !== undefined) spinner.text = `Removing temporary folder ${temporaryFile}`;
        await rm(path.join(configFolder, temporaryFile), { recursive: true, force: true });
    }
}

export type EditorVersion = {
    version: string;
    path: string;
};
