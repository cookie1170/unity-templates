import { readdir } from "node:fs/promises";
import { getConfig } from "./config";

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
        return { version: version, path: `${editorPath}/${version}` };
    });
}

export type EditorVersion = {
    version: string;
    path: string;
};
