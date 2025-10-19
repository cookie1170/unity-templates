import { exists, mkdir, mkdtemp, readdir } from "node:fs/promises";
import { getConfig, getConfigFolder } from "./config";
import ora, { Ora } from "ora";
import path from "node:path";
import { homedir, tmpdir } from "node:os";
import { existsSync } from "fs";
import { rmSync } from "node:fs";

const tmpPrefix: string = path.join(tmpdir(), `unity-templates-nodejs-`);
let tmpDirs: string[] = [];

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
    if (spinner !== undefined) spinner.text = `Making temporary folder`;

    const folder: string = await mkdtemp(tmpPrefix).catch(async (reason) => {
        const warningString = `Failed to create temporary folder:\n${reason}\nFalling back to config dir\nThis might fail to get cleaned up, make sure to run 'unity-templates open-config' and check\n`;

        if (spinner !== undefined) spinner.warn(warningString).start();
        else console.warn(warningString);

        const tmpPath: string = path.join(getConfigFolder(), `tmp-${Date.now()}`);
        await mkdir(tmpPath, { recursive: true });

        return tmpPath;
    });
    tmpDirs.push(folder);
    return folder;
}

export function cleanupTemporary(silent: boolean): void {
    if (tmpDirs.length <= 0) return;

    const spinner = ora({ text: "Cleaning up temporary directories", isSilent: silent }).start();

    for (const tmpDir of tmpDirs) {
        spinner.text = `Removing temporary directory ${tmpDir}`;
        rmSync(tmpDir, {
            recursive: true,
            force: true,
        });
    }

    spinner.succeed("Cleaned up temporary directories");
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
