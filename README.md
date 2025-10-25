# unity-templates

A command line (CLI) tool for handling custom project and script templates for the [Unity](https://unity.com/) game engine

# Installation

## Method 1: npm

NOTE: This method requires you to have [npm](https://www.npmjs.com/) and [nodejs](https://nodejs.org/) installed on your system. If you're not sure how to install them, check out the [documentation](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm). You can also use a different package manager like [bun](https://bun.sh/)

Simply open your terminal and run

```bash
npm install --global unity-templates
```

To install a specific version use

```bash
npm install --global unity-templates@<semantic-version>
```

To update it run

```bash
npm update --global unity-templates
```

To uninstall it run

```bash
npm uninstall --global unity-templates
```

## Method 2: Binary

Alternatively, if you don't want to use a package manager, you can simply download the binary files from the [latest release on GitHub](https://github.com/cookie1170/unity-templates/releases/latest)

# Usage

To run a command, use

```bash
unity-templates [command] [options]
```

To get a list of commands, simply run

```bash
unity-templates --help
```

To get help on a specific command, run

```bash
unity-templates [command] --help
```

or

```bash
unity-templates help [command]
```

### Global options

-   `-S --silent`: Makes the commands not output any text, except for interactive prompts

-   `-s --sync`: Automatically accepts the sync prompt

-   `--no-sync`: Automatically declines the sync prompt

# Commands

## `unity-templates init`

To initialize the config file, run

```bash
unity-templates init
```

This will interactively prompt you for the directory for your Unity projects (used by `unity-templates project`)

Then, it will try to launch Unity hub and retrieve the editor path there. If that fails, it will interactively prompt you to input the path

This will also automatically get run if you try to use other commands without having run this first

### Options:

-   `-p --projects-path <path>`: Automatically set the projects path to avoid an interactive prompt.

-   `-e --editor-path <path>`: Automatically set the editor path to avoid launching Unity hub or an interactive prompt.

-   `--hub-only`: Only try to get the editor path using Unity hub. Exits with exit code one if Unity hub can't be launched

-   `--no-hub`: Don't try to launc Unity hub to get the editor path. Immediately prompts for the editor path

## `unity-templates sync`

To add your custom templates to Unity editor installations, run

```bash
unity-templates sync
```

This will ask you which editor versions to sync (if there's more than one), then, for each editor version:

-   Remove your custom project templates from the editor path (they're still stored in the config).
-   Copy your custom project templates from `{config-dir}/project-templates` to `{editor-version}/EditorData/Resources/PackageManager/ProjectTemplates`, which is where Unity Hub reads them from.

-   Reset all the script templates back to their default values (they're still kept in the config).
-   Copy all your overriden script templates from `{confir-dir}/script-templates` to `{editor-version}/Editor/Data/Resources/ScriptTemplates`, which is where Unity reads them from.

### Options:

-   `-a --all`: Syncs all editor versions without prompting

## `unity-templates project`

To interactively create a project template from a unity project, run

```bash
unity-templates project
```

This will ask you to select a project from the your project directory (which you specified when running `unity-templates init`)

It will next check if there's a `template-info.json` file present in the root of the project directory.

If the file is **not** present, it will interactively set it up. The file should contain:

-   The template name (`"name"`), in `kebab-case` (all lowercase, each word separated by a hyphen).

-   The template display name (`"displayName"`), which is the name shown in Unity Hub when creating a new project with the template.

-   The template description (`"description"`), which is the description shown in Unity Hub when creating a new project with the template.

-   The template version (`"version"`), which is the semantic version shown in Unity Hub.

After, it will ask for the version action, which can be one of the following:

-   "Bump patch": Bumps the patch version.
-   "Bump minor": Bumps the minor version.
-   "Bump major": Bumps the major version.
-   "Custom": Lets you input a custom semantic version.
-   "Do nothing": Doesn't change the version.

Then, it will create the project template and copy it to `{config-dir}/project-templates/com.unity.template.custom-{name}.tgz` as a gzip-compressed tarball

Finally, it asks if you would like to sync the templates (i.e. run `unity-templates sync`)

### Options:

-   `-p --project <project>`: Specify a project path instead of selecting it interactively

-   `-a --version-action <action>`: Specify a version action instead of selecting it interactively. `<action>` is either a valid semantic version or:
    -   `nothing`: Do nothing
    -   `patch`: Bump the patch version
    -   `minor`: Bump the minor version
    -   `major`: Bump the major version

## `unity-templates script`

To interactively create and edit custom script templates, run

```bash
unity-templates script
```

This will ask you to select a list of script templates you would like to edit.

After which, each script template will be opened in your default text editor and wait until you select one of the following options:

-   "Next", which will proceed to editing the next script template.
-   "Cancel", which stops editing script templates.
-   "Open again", which opens the file again if you accidentally closed it.
-   "Go back", which goes back to editing the previous script template.

Finally, it asks if you would like to sync the templates (i.e. run `untiy-templates sync`)

### Options:

-   `-f --files <files...>`: Create the script templates from a space separated list of files (`<files...>`) in the order that they're selected in. The templates are still interactively selected if no `--templates` option is passed

-   `-t --templates <templates...>`: Automatically select the templates from a space separated list of short names. The templates are interactively edited if no `--files` option is passed or there are not enough files. Template short names include:
    -   `mono-behaviour`: MonoBehaviour Script
    -   `scriptable-object`: ScriptableObject Script
    -   `test`: Test Script
    -   `empty`: Empty C# Script
    -   `compute`: Compute Shader
    -   `surface`: Standard Surface Shader
    -   `unlit`: Unlit Shader
    -   `image-effect`: Image Effect Shader
    -   `ray-tracing`: Ray Tracing Shader
    -   `state-machine-behaviour`: State Machine Behaviour Script
    -   `sub-state-machine-behaviour`: Sub State Machine Behaviour Script
    -   `edit-mode-test-assembly`: Edit Mode Test Assembly
    -   `test-assembly`: Test Assembly
    -   `asmdef`: Assembly Definition
    -   `asmref`: Assembly Definition Reference
    -   `scene-template-pipeline`: Scene Template Pipeline
    -   `playable-behaviour`: Playable Behaviour Script
    -   `playable-asset`: Playable Asset Script

## `unity-templates open-config`

To open the config path in your default application, run

```bash
unity-templates open-config
```

### Options:

-   `-f --file <file>`: Specify the file (or directory) to open. `<file>` can be:
    -   `common`: Open the common `config.json` file
    -   `project`: Open the folder for saved project templates
    -   `script`: Open the folder for saved script templates

## `unity-templates clear`

To clear saved files, run

```bash
unity-templates clear [command]
```

`command` can be any of:

-   `all`: Clears all of the saved files.
-   `config`: Clears the config file.
-   `script`: Clears and resets to default selected script templates. Options:

    -   `-a --all`: Clears all custom script templates.

-   `project`: Clears selected project templates. Options:

    -   `-a --all`: CLears all custom project templates

# Troubleshooting

### Command not found:

If you installed the package globally (the `--global` is very important!) but your shell tells you that the command is missing, the package executable path might be missing from your `PATH` environment variable.

If you're not sure how to add it to your `PATH`, for Windows you can [change it with the GUI](https://youtu.be/9umV9jD6n80) and then restart your terminal and for MacOS and Linux, you can use `export PATH="$PATH:/your/path/here"`. Note, however, that this does NOT persist between shell sessions. If you want it to persist, you need to add it to your `.bashrc` or `.zshrc` (or others) depending on your shell, which are typically in your home directory.

If you're not sure where the executable is located, then run `npm config get prefix` to get the prefix path. The package executables are in `{prefix}/bin` on MacOS and Linux and directly in `prefix` on Windows. For more info see the [npm documentation](https://docs.npmjs.com/cli/configuring-npm/folders)
