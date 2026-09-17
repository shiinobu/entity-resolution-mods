import {
    Command,
    Files,
    RegisterCommand,
} from "@hotbunny/hackhub-content-sdk";

import { formatSearchMatches, matchGlobPattern, searchFilesForPattern } from "./q03-log-tools.js";

type Q03ZgrepTools = Parameters<Command["Run"]>[0];

const buildFileName = (name: string, extension: string | undefined): string =>
    extension ? `${name}.${extension}` : name;

const splitGlobPath = (globPath: string): { readonly dirPath: string; readonly pattern: string } => {
    const lastSlash = globPath.lastIndexOf("/");

    if (lastSlash < 0) {
        return { dirPath: ".", pattern: globPath };
    }

    return {
        dirPath: globPath.slice(0, lastSlash) || "/",
        pattern: globPath.slice(lastSlash + 1),
    };
};

@RegisterCommand({ default: true, scope: "remote" })
export class Q03ZgrepCommand extends Command {
    CommandName = "zgrep";
    Description = "Search archived/rotated (.gz) log files for a text pattern.";

    override async Run(tools: Q03ZgrepTools): Promise<void> {
        if (!Files.isRemoteSession()) {
            tools.printError("zgrep: only available inside an SSH session.");
            return;
        }

        const [pattern, globPath] = tools.getArgs();

        if (!pattern || !globPath) {
            tools.printError('Usage: zgrep "<pattern>" <path-or-glob>');
            return;
        }

        const { dirPath, pattern: namePattern } = splitGlobPath(globPath);
        const resolvedDirPath = await Files.resolvePath(dirPath);
        const dir = await Files.getByPath(resolvedDirPath);

        if (!dir || !dir.isFolder) {
            tools.printError(`zgrep: ${dirPath}: No such directory`);
            return;
        }

        const children = await Files.getChildren(dir.id);
        const childNames = children.map((child) => buildFileName(child.name, child.extension));
        const matchedNames = new Set(matchGlobPattern(namePattern, childNames));

        const files = children
            .filter((child) => matchedNames.has(buildFileName(child.name, child.extension)))
            .map((child) => ({
                name: buildFileName(child.name, child.extension),
                content: Files.read(child.id) ?? "",
            }));

        const matches = searchFilesForPattern(files, pattern);

        if (matches.length === 0) {
            tools.println(`zgrep: no match found for '${pattern}' in ${globPath}`);
            return;
        }

        for (const line of formatSearchMatches(matches)) {
            tools.println(line);
        }
    }
}
