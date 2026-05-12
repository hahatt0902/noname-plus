import { spawn } from "node:child_process";

const commands = [
	"corepack pnpm -F @noname/fs dev --debug --dirname=../../apps/core",
	"corepack pnpm -F @noname/server dev",
	"corepack pnpm -F ./packages/extension/** build:watch",
	"corepack pnpm -F noname dev --open",
];

const children = commands.map(command =>
	spawn(command, {
		shell: true,
		stdio: "inherit",
	})
);

const shutdown = () => {
	for (const child of children) {
		if (!child.killed) {
			child.kill();
		}
	}
	process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
