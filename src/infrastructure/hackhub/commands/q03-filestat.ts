import {
    Command,
    Files,
    RegisterCommand,
} from "@hotbunny/hackhub-content-sdk";

import { Q03_FILESTAT_METADATA } from "../../../content/index.js";
import { formatFileStat } from "./q03-log-tools.js";

type Q03FilestatTools = Parameters<Command["Run"]>[0];

const buildFileName = (name: string, extension: string | undefined): string =>
    extension ? `${name}.${extension}` : name;

@RegisterCommand({ default: true, scope: "remote" })
export class Q03FilestatCommand extends Command {
    CommandName = "filestat";
    Description = "Report file metadata — last modified and creation dates.";

    override async Run(tools: Q03FilestatTools): Promise<void> {
        if (!Files.isRemoteSession()) {
            tools.printError("filestat: only available inside an SSH session.");
            return;
        }

        const [path] = tools.getArgs();

        if (!path) {
            tools.printError("Usage: filestat <file>");
            return;
        }

        const resolvedPath = await Files.resolvePath(path);
        const file = await Files.getByPath(resolvedPath);

        if (!file || file.isFolder) {
            tools.printError(`filestat: cannot stat '${path}': No such file or directory`);
            return;
        }

        const fileName = buildFileName(file.name, file.extension);

        for (const line of formatFileStat(fileName, Q03_FILESTAT_METADATA[fileName])) {
            tools.println(line);
        }
    }
}
