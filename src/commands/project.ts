import { configBasePath, getProjectTemplatesConfig, ProjectTemplatesConfig } from "../config";
import { readdir, rm, mkdir, exists, cp } from "node:fs/promises";
import ora, { Ora } from "ora";
import { question, select, confirm, required } from "@topcli/prompts";
import { $, semver } from "bun";
import { syncCommand } from "./sync";

const semverRegex =
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/gm;

const savedProjectTemplatesPath: string = `${configBasePath}/project-templates`;
const editorProjectTemplatesPath: string = "Editor/Data/Resources/PackageManager/ProjectTemplates";

export async function projectCommand(): Promise<void> {
    if (!(await exists(savedProjectTemplatesPath))) {
        await mkdir(savedProjectTemplatesPath);
    }

    const config: ProjectTemplatesConfig = await getProjectTemplatesConfig();

    const projectNames: string[] = await readdir(config.projectsPath);

    const selectedProject = await select("Select project", {
        choices: projectNames,
        autocomplete: true,
    });

    const project: string = `${config.projectsPath}/${selectedProject}`;

    const templateInfo: ProjectTemplateInfo = await getTemplateInfo(project);

    const templateFile = Bun.file(
        `${savedProjectTemplatesPath}/com.unity.template.custom-${templateInfo.name}.tgz`
    );
    if (await templateFile.exists()) {
        await templateFile.delete();
    }

    const spin = ora("Reading dependencies").start();

    const dependencies: any = await Bun.file(`${project}/Packages/manifest.json`)
        .json()
        .then((result) => result.dependencies);

    const tempPath = `${configBasePath}/tmp-${Date.now()}`;

    spin.text = `Making temporary path at ${tempPath}`;
    await mkdir(tempPath);

    spin.text = "Creating package";
    await mkdir(`${tempPath}/package`);
    spin.text = "Creating ProjectData~";
    await mkdir(`${tempPath}/package/ProjectData~`);

    spin.text = "Creating package json";
    const packageJsonFile = Bun.file(`${tempPath}/package/package.json`);
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

    const projectData = `${tempPath}/package/ProjectData~`;

    spin.text = "Copying assets";
    await cp(`${project}/Assets`, `${projectData}/Assets`, {
        recursive: true,
        force: true,
    });
    spin.text = "Copying packages";
    await cp(`${project}/Packages`, `${projectData}/Packages`, {
        recursive: true,
        force: true,
    });
    spin.text = "Copying project settings";
    await cp(`${project}/ProjectSettings`, `${projectData}/ProjectSettings`, {
        recursive: true,
        force: true,
    });

    spin.text = "Checking for .gitignore";
    const gitIgnore = Bun.file(`${project}/.gitignore`);

    if (await gitIgnore.exists()) {
        spin.text = "Copying .gitignore";
        await Bun.write(`${projectData}/.gitignore`, gitIgnore);
    }

    spin.text = "Removing ProjectVersion.txt";
    await rm(`${project}/ProjectSettings/ProjectVersion.txt`, {
        force: true,
    });

    spin.text = "Archiving the template";
    await $`mv ${tempPath}/package ${savedProjectTemplatesPath}/package`;
    await $`tar caf ${savedProjectTemplatesPath}/com.unity.template.custom-${templateInfo.name}.tgz --directory ${savedProjectTemplatesPath} package`;
    await rm(`${savedProjectTemplatesPath}/package`, {
        recursive: true,
        force: true,
    });

    spin.text = "Removing temporary directory";
    await rm(tempPath, { force: true, recursive: true });
    spin.succeed("Done! Open Unity Hub to see your new template");

    if (await confirm("Sync templates?", { initial: true })) {
        syncCommand();
    }
}

export async function syncProjects(editorPath: string, spinner: Ora): Promise<void> {
    const templatesPath: string = `${editorPath}/${editorProjectTemplatesPath}`;
    const existingTemplates: string[] = (await readdir(templatesPath)).filter((template) =>
        template.startsWith("com.unity.template.custom")
    );

    spinner.text = "Removing existing custom templates";
    for (const template of existingTemplates) {
        const templatePath = `${templatesPath}/${template}`;
        await rm(templatePath);
    }

    if (!(await exists(savedProjectTemplatesPath))) {
        await mkdir(savedProjectTemplatesPath);
    }

    const customTemplates: string[] = await readdir(savedProjectTemplatesPath);
    for (const template of customTemplates) {
        spinner.text = `Copying ${template}`;

        await cp(`${savedProjectTemplatesPath}/${template}`, `${templatesPath}/${template}`);
    }
}

type ProjectTemplateInfo = {
    name: string;
    displayName: string;
    description: string;
    version: string;
};

async function getTemplateInfo(selectedProject: string): Promise<ProjectTemplateInfo> {
    const templateInfoPath = `${selectedProject}/template-info.json`;

    if (!(await Bun.file(templateInfoPath).exists())) {
        await Bun.write(templateInfoPath, await createTemplateInfo(), {
            createPath: true,
        });
    }

    const templateInfo: ProjectTemplateInfo = await Bun.file(templateInfoPath).json();

    try {
        const semanticVersion: string[] = templateInfo.version.split(".");
        let majorVersion: number = parseInt(semanticVersion[0] ?? "0");
        let minorVersion: number = parseInt(semanticVersion[1] ?? "0");
        let patchVersion: number = parseInt(semanticVersion[2] ?? "0");
        const patchBump: string = `${majorVersion}.${minorVersion}.${patchVersion + 1}`;
        const minorBump: string = `${majorVersion}.${minorVersion + 1}.0`;
        const majorBump: string = `${majorVersion + 1}.0.0`;
        const nothingBump: string = `${majorVersion}.${minorVersion}.${patchVersion}`;

        const versionAction = await select("Select version action", {
            choices: [
                { value: patchBump, label: "Bump patch", description: patchBump },
                { value: minorBump, label: "Bump minor", description: minorBump },
                { value: majorBump, label: "Bump major", description: majorBump },
                { value: "custom", label: "Custom", description: "Input a custom version" },
                { value: nothingBump, label: "Do nothing", description: nothingBump },
            ],
        });

        templateInfo.version =
            versionAction !== "custom" ? versionAction : await inputSemver("Input custom version");
    } catch (e) {
        templateInfo.version = "1.0.0";
    }

    await Bun.write(templateInfoPath, JSON.stringify(templateInfo, null, 2));

    return templateInfo;
}

async function createTemplateInfo(): Promise<string> {
    const name: string = await question("Input template name", { validators: [required()] });

    const displayName: string = await question("Input display name", { validators: [required()] });

    const description: string = await question("Input description", { validators: [required()] });

    const version: string = await inputSemver("Input version");

    const templateInfo = {
        name: name,
        displayName: displayName,
        description: description,
        version: version,
    };

    return JSON.stringify(templateInfo, null, 2);
}

async function inputSemver(message: string): Promise<string> {
    while (true) {
        const value = await question(message, {
            defaultValue: "1.0.0",
        });

        const result = value.search(semverRegex);
        if (result === -1) {
            console.log("Must be a valid semantic version!");
            continue;
        }

        return value;
    }
}
