import { readdir, rm, mkdir, exists, cp } from "node:fs/promises";
import ora from "ora";
import { question, select, required } from "@topcli/prompts";
import { $ } from "bun";
import { syncPrompt } from "./sync";
import { getConfig, getConfigFolder } from "../config";
import {
    clearTemporary,
    EditorVersion,
    formatPlural,
    isValidUnityProject,
    makeOrReaddir,
    makeTemporary,
    readUnityProjects,
} from "../misc";
import path from "node:path";

const semverRegex =
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/gm;

export const savedProjectTemplatesPath: string = path.join(getConfigFolder(), "project-templates");
const editorProjectTemplatesPath: string = path.join(
    "Editor",
    "Data",
    "Resources",
    "PackageManager",
    "ProjectTemplates"
);

export async function projectCommand(options: any): Promise<void> {
    if (!(await exists(savedProjectTemplatesPath))) {
        await mkdir(savedProjectTemplatesPath);
    }

    const projectNames: string[] = await readUnityProjects();

    let project: string;

    if (options.project === undefined) {
        const selectedProject = await select("Select project", {
            choices: projectNames,
            autocomplete: true,
        });

        project = path.join(await getConfig("projectsPath"), selectedProject);
    } else project = options.project.replace("@projects", await getConfig("projectsPath"));

    if (!(await isValidUnityProject(project))) {
        ora({ isSilent: options.silent }).fail("Invalid Unity project");
        process.exit(1);
    }

    const templateInfo: ProjectTemplateInfo = await getTemplateInfo(
        project,
        options.versionAction,
        options.silent
    );

    const templateFile = Bun.file(
        path.join(savedProjectTemplatesPath, `com.unity.template.custom-${templateInfo.name}.tgz`)
    );
    if (await templateFile.exists()) {
        await templateFile.delete();
    }

    const spin = ora({ text: "Reading dependencies", isSilent: options.silent }).start();

    const dependencies: any = await Bun.file(path.join(project, "Packages", "manifest.json"))
        .json()
        .then((result) => result.dependencies);

    const tempPath = await makeTemporary(spin);

    spin.text = "Creating package";
    await mkdir(path.join(tempPath, "package"));
    spin.text = "Creating ProjectData~";
    await mkdir(path.join(tempPath, "package", "ProjectData"));

    spin.text = "Creating package json";
    const packageJsonFile = Bun.file(path.join(tempPath, "package", "package.json"));
    const packageJson = {
        dependencies: {},
        description: "",
        displayName: "",
        host: "hub",
        name: "",
        type: "template",
        version: "1.0.0",
    };
    packageJson.name = `com.unity.template.${templateInfo.name}`;
    packageJson.displayName = templateInfo.displayName;
    packageJson.description = templateInfo.description;
    packageJson.version = templateInfo.version;
    packageJson.dependencies = dependencies;
    await Bun.write(packageJsonFile, JSON.stringify(packageJson, null, 2));

    const projectData = path.join(tempPath, "package", "ProjectData~");

    spin.text = "Copying assets";
    await cp(path.join(project, "Assets"), path.join(projectData, "Assets"), {
        recursive: true,
        force: true,
    });

    spin.text = "Copying packages";
    await cp(path.join(project, "Packages"), path.join(projectData, "Packages"), {
        recursive: true,
        force: true,
    });
    spin.text = "Copying project settings";
    await cp(path.join(project, "ProjectSettings"), path.join(projectData, "ProjectSettings"), {
        recursive: true,
        force: true,
    });

    spin.text = "Checking for .gitignore";
    const gitIgnore = Bun.file(path.join(project, ".gitignore"));

    if (await gitIgnore.exists()) {
        spin.text = "Copying .gitignore";
        await Bun.write(path.join(projectData, ".gitignore"), gitIgnore);
    }

    spin.text = "Removing ProjectVersion.txt";
    const projectVersion = path.join(projectData, "ProjectSettings", "ProjectVersion.txt");
    if (await exists(projectVersion))
        await rm(projectVersion, {
            force: true,
        });

    spin.text = "Archiving the template";
    await $`mv ${path.join(tempPath, "package")} ${path.join(savedProjectTemplatesPath, "package")}`;
    await $`tar caf ${path.join(
        savedProjectTemplatesPath,
        `com.unity.template.custom-${templateInfo.name}.tgz`
    )} --directory ${savedProjectTemplatesPath} package`;
    await rm(path.join(savedProjectTemplatesPath, "package"), {
        recursive: true,
        force: true,
    });

    await clearTemporary(spin);
    spin.succeed("Done! Open Unity Hub to see your new template");

    await syncPrompt(options.sync, options.silent);
}

export async function syncProjects(version: EditorVersion, silent: boolean): Promise<void> {
    const spinner = ora({ text: `Syncing project templates for ${version.version}`, isSilent: silent });

    const templatesPath: string = path.join(version.path, editorProjectTemplatesPath);

    const existingTemplates: string[] = (await readdir(templatesPath)).filter((template) =>
        template.startsWith("com.unity.template.custom")
    );

    spinner.text = "Removing existing custom templates";
    for (const template of existingTemplates) {
        const templatePath = path.join(templatesPath, template);
        await rm(templatePath);
    }

    const customTemplates: string[] = await makeOrReaddir(savedProjectTemplatesPath);

    for (const template of customTemplates) {
        spinner.text = `Copying ${template}`;

        await cp(path.join(savedProjectTemplatesPath, template), path.join(templatesPath, template));
    }

    spinner.succeed(
        `Synced ${customTemplates.length} project ${formatPlural("template", customTemplates.length)} for ${
            version.version
        }`
    );
}

type ProjectTemplateInfo = {
    name: string;
    displayName: string;
    description: string;
    version: string;
};

async function getTemplateInfo(
    selectedProject: string,
    versionAction: string | undefined,
    silent: boolean
): Promise<ProjectTemplateInfo> {
    const templateInfoPath = path.join(selectedProject, "template-info.json");

    if (!(await Bun.file(templateInfoPath).exists())) {
        await Bun.write(templateInfoPath, await createTemplateInfo(), {
            createPath: true,
        });
    }

    const templateInfo: ProjectTemplateInfo = await Bun.file(templateInfoPath).json();
    const semanticVersion: string[] = templateInfo.version.split(".");

    let majorVersion: number = parseInt(semanticVersion[0] ?? "0");
    let minorVersion: number = parseInt(semanticVersion[1] ?? "0");
    let patchVersion: number = parseInt(semanticVersion[2] ?? "0");

    const patchBump: string = `${majorVersion}.${minorVersion}.${patchVersion + 1}`;
    const minorBump: string = `${majorVersion}.${minorVersion + 1}.0`;
    const majorBump: string = `${majorVersion + 1}.0.0`;
    const nothingBump: string = `${majorVersion}.${minorVersion}.${patchVersion}`;

    if (versionAction === undefined) {
        try {
            const versionAction = await select("Select version action", {
                choices: [
                    {
                        value: patchBump,
                        label: "Bump patch",
                        description: patchBump,
                    },
                    {
                        value: minorBump,
                        label: "Bump minor",
                        description: minorBump,
                    },
                    {
                        value: majorBump,
                        label: "Bump major",
                        description: majorBump,
                    },
                    {
                        value: "custom",
                        label: "Custom",
                        description: "Input a custom version",
                    },
                    {
                        value: nothingBump,
                        label: "Do nothing",
                        description: nothingBump,
                    },
                ],
            });

            templateInfo.version =
                versionAction !== "custom"
                    ? versionAction
                    : await inputSemver("Input custom version", silent);
        } catch (e) {
            templateInfo.version = "1.0.0";
        }
    } else {
        switch (versionAction) {
            case "patch": {
                templateInfo.version = patchBump;
                break;
            }

            case "minor": {
                templateInfo.version = minorBump;
                break;
            }

            case "major": {
                templateInfo.version = majorBump;
                break;
            }

            case "nothing": {
                templateInfo.version = nothingBump;
                break;
            }

            default: {
                if (versionAction.search(semverRegex) === -1) {
                    throw new Error(`Invalid semantic version ${versionAction}`);
                }

                templateInfo.version = versionAction;
            }
        }
    }

    await Bun.write(templateInfoPath, JSON.stringify(templateInfo, null, 2));

    return templateInfo;
}

async function createTemplateInfo(): Promise<string> {
    const name: string = await question("Input template name", {
        validators: [required()],
    });

    const displayName: string = await question("Input display name", {
        validators: [required()],
    });

    const description: string = await question("Input description", {
        validators: [required()],
    });

    const version: string = await inputSemver("Input version");

    const templateInfo = {
        name: name,
        displayName: displayName,
        description: description,
        version: version,
    };

    return JSON.stringify(templateInfo, null, 2);
}

async function inputSemver(message: string, silent: boolean = false): Promise<string> {
    while (true) {
        const value = await question(message, {
            defaultValue: "1.0.0",
        });

        const result = value.search(semverRegex);
        if (result === -1) {
            if (!silent) console.log("Must be a valid semantic version");
            continue;
        }

        return value;
    }
}
