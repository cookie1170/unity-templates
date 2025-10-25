import { access, mkdir, mkdtemp, readdir } from "node:fs/promises";
import { getConfig, getConfigFolder } from "./config";
import ora, { Ora } from "ora";
import path from "node:path";
import { homedir, tmpdir } from "node:os";
import { rmSync } from "node:fs";
import { isValidUnityProject } from "unity-helper";

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

export async function makeOrReaddir(dir: string): Promise<string[]> {
    await mkdir(dir, { recursive: true });
    return await readdir(dir);
}

export async function exists(file: string): Promise<boolean> {
    try {
        await access(file);
        return true;
    } catch {
        return false;
    }
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

export function getOptsAction(
    action: (opts: any) => void | Promise<void>
): (_: any, command: any) => void | Promise<void> {
    return (_, command: any) => action(command.optsWithGlobals());
}
