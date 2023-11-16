"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const commandDir = path_1.default.dirname(__dirname) + path_1.default.sep + "commands" + path_1.default.sep;
const commandMap = new Map();
fs_1.default.readdirSync(commandDir).filter((element => element.endsWith('.js'))).forEach(file => {
    const Command = require(commandDir + file.toString());
    commandMap.set(Command.default.command.name, Command.default);
});
const jsonFormat = [];
commandMap.forEach((value) => jsonFormat.push(value.command.toJSON()));
async function handle(client, interaction) {
    if (!interaction.isChatInputCommand())
        return;
    const execute = commandMap.get(interaction.commandName)?.execute;
    if (!execute) {
        console.log(`\x1b[31mCould not execute command for ${interaction.commandName}!\x1b[0m\n`);
        return;
    }
    execute(client, interaction);
}
exports.default = {
    handle: handle,
    jsonFormat: jsonFormat
};
