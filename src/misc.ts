import { exists, mkdir, readdir, rm } from "node:fs/promises";
import { getConfig, getConfigFolder } from "./config";
import { Ora } from "ora";
import path from "node:path";
import { homedir } from "node:os";
import { existsSync } from "fs";

export function formatPath(path: string): string {
    if (process.platform != "win32") {
        return path.replace(homedir(), "~");
    }

    return path.replace(homedir(), "%UserProfile%");
}

export function formatToPath(input: string): string {
    if (process.platform != "win32") {
        return input.replace("~", homedir());
    }

    return input.replace("%UserProfile%", homedir());
}

export function formatPlural(input: string, count: number): string {
    if (count != 1) input += "s";

    return input;
}

export async function readUnityEditorVersions(
    editorPathOverride: string | undefined = undefined
): Promise<EditorVersion[]> {
    const editorPath: string = editorPathOverride ?? (await getConfig("editorPath"));

    if (!(await exists(editorPath))) return [];

    const versions: string[] = await readdir(editorPath);

    return versions.map((version) => {
        return { version: version, path: path.join(editorPath as string, version) };
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
        await rm(path.join(configFolder, temporaryFile), {
            recursive: true,
            force: true,
        });
    }
}

export type EditorVersion = {
    version: string;
    path: string;
};
export async function readUnityProjects(
    projectsPathOverride: string | undefined = undefined
): Promise<string[]> {
    const projectsPath: string = projectsPathOverride ?? (await getConfig("projectsPath"));

    if (!(await exists(projectsPath))) return [];

    return (await readdir(projectsPath)).filter((project) => {
        const projectPath: string = path.join(projectsPath, project);

        return isValidUnityProject(projectPath);
    });
}

export function isValidUnityProject(projectPath: string): boolean {
    const assetsPath: string = path.join(projectPath, "Assets");
    if (!existsSync(assetsPath)) return false;

    const packagesPath: string = path.join(projectPath, "Packages");
    if (!existsSync(packagesPath)) return false;

    const packageManifest: string = path.join(packagesPath, "manifest.json");

    if (!existsSync(packageManifest)) return false;

    const projectSettings: string = path.join(projectPath, "ProjectSettings");
    if (!existsSync(projectSettings)) return false;

    return true;
}

export function isValidUnityEditor(editorInstallationPath: string): boolean {
    const hubMetadata: string = path.join(editorInstallationPath, "metadata.hub.json");
    if (!existsSync(hubMetadata)) return false;

    const editorPath: string = path.join(editorInstallationPath, "Editor");
    if (!existsSync(editorPath)) return false;

    const dataPath: string = path.join(editorPath, "Data");
    if (!existsSync(dataPath)) return false;

    const resourcesPath: string = path.join(dataPath, "Resources");
    if (!existsSync(resourcesPath)) return false;

    const scriptTemplatesPath: string = path.join(resourcesPath, "ScriptTemplates");
    if (!existsSync(scriptTemplatesPath)) return false;

    const projectTemplatesPath: string = path.join(resourcesPath, "PackageManager", "ProjectTemplates");
    if (!existsSync(projectTemplatesPath)) return false;

    return true;
}
