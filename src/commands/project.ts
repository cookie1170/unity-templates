import {
    Config,
    configBasePath,
    getConfig,
    getProjectTemplatesConfig,
    ProjectTemplatesConfig,
} from "../config";
import { readdir, rm, mkdir, exists, cp } from "node:fs/promises";
import ora, { Ora } from "ora";
import { Choice, question, select, confirm } from "@topcli/prompts";
import { $ } from "bun";
import { syncCommand } from "./sync";

const savedProjectTemplatesPath: string = `${configBasePath}/project-templates`;
const editorProjectTemplatesPath: string =
    "Editor/Data/Resources/PackageManager/ProjectTemplates";

export async function projectCommand(): Promise<void> {
    if (!(await exists(savedProjectTemplatesPath))) {
        await mkdir(savedProjectTemplatesPath);
    }

    const config: ProjectTemplatesConfig = await getProjectTemplatesConfig();

    const projectNames: string[] = await readdir(config.projectsPath);

    const projects: Choice<string>[] = projectNames.map((project) => {
        return {
            value: project,
            label: project,
        };
    });

    const selectedProject = await select("Select project", {
        choices: projects,
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

    const dependencies: any = await Bun.file(
        `${project}/Packages/manifest.json`
    )
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

    if (await confirm("Sync templates?")) {
        syncCommand();
    }
}

export async function syncProjects(
    editorPath: string,
    spinner: Ora
): Promise<void> {
    const templatesPath: string = `${editorPath}/${editorProjectTemplatesPath}`;
    const existingTemplates: string[] = (await readdir(templatesPath)).filter(
        (template) => template.startsWith("com.unity.template.custom")
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

        await cp(
            `${savedProjectTemplatesPath}/${template}`,
            `${templatesPath}/${template}`
        );
    }
}

type ProjectTemplateInfo = {
    name: string;
    displayName: string;
    description: string;
    version: string;
};

async function getTemplateInfo(
    selectedProject: string
): Promise<ProjectTemplateInfo> {
    const templateInfoPath = `${selectedProject}/template-info.json`;

    if (!(await Bun.file(templateInfoPath).exists())) {
        await Bun.write(templateInfoPath, await createTemplateInfo(), {
            createPath: true,
        });
    }

    const templateInfo: ProjectTemplateInfo = await Bun.file(
        templateInfoPath
    ).json();

    const semanticVersion: string[] = templateInfo.version.split(".");
    let majorVersion: number = parseInt(semanticVersion[0] ?? "0");
    let minorVersion: number = parseInt(semanticVersion[1] ?? "0");
    let patchVersion: number = parseInt(semanticVersion[2] ?? "0");

    const versionChoice = await select("Select version action", {
        choices: [
            { value: "patch", label: "Bump patch" },
            { value: "minor", label: "Bump minor" },
            { value: "major", label: "Bump major" },
            { value: "nothing", label: "Do nothing" },
        ],
    });

    switch (versionChoice) {
        case "patch": {
            patchVersion++;
            break;
        }

        case "minor": {
            minorVersion++;
            patchVersion = 0;
            break;
        }
        case "major": {
            majorVersion++;
            minorVersion = 0;
            patchVersion = 0;
            break;
        }

        case "nothing": {
            break;
        }
    }

    const updatedVersion = `${majorVersion}.${minorVersion}.${patchVersion}`;
    console.log(`Updated version: ${updatedVersion}`);
    templateInfo.version = updatedVersion;

    await Bun.write(templateInfoPath, JSON.stringify(templateInfo, null, 2));

    return templateInfo;
}

async function createTemplateInfo(): Promise<string> {
    const name: string = await question("Input template name");

    const displayName: string = await question("Input display name");

    const description: string = await question("Input description");

    const version: string = await question("Input version", {
        defaultValue: "1.0.0",
    });

    const templateInfo = {
        name: name,
        displayName: displayName,
        description: description,
        version: version,
    };

    return JSON.stringify(templateInfo, null, 2);
}
