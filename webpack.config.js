const path = require("node:path");
const fs = require("node:fs");
const webpack = require("webpack");
const yaml = require("yaml");

const ROOT = __dirname;
const DIST = path.join(ROOT, "apps/api/dist");
const API_SRC = path.join(ROOT, "apps/api/src/routes");

const LAMBDAS = {
	"inboxpilot-auth-register": "auth/register.ts",
	"inboxpilot-auth-login": "auth/login.ts",
	"inboxpilot-auth-verify": "auth/verify.ts",
	"inboxpilot-api-keys": "keys.ts",
	"inboxpilot-accounts": "accounts.ts",
	"inboxpilot-connect-gmail": "connect/gmail.ts",
	"inboxpilot-gmail-callback": "auth/gmail-callback.ts",
};

function buildSpec() {
	const domain = process.env.INBOXPILOT_DOMAIN || "example.com";
	const apiDomain = `api.${domain}`;
	const raw = fs
		.readFileSync(path.join(ROOT, "swagger.yaml"), "utf8")
		.replace("__DOMAIN__", apiDomain);
	return JSON.stringify(yaml.parse(raw));
}

function makeLambdaConfig(name, entry, plugins = []) {
	return {
		name,
		mode: "production",
		target: "node22",
		entry: { index: entry },
		output: {
			path: path.join(DIST, name),
			filename: "[name].js",
			libraryTarget: "commonjs2",
		},
		resolve: {
			extensions: [".ts", ".js"],
		},
		externals: [/^@aws-sdk\/.*/],
		module: {
			rules: [
				{
					test: /\.ts$/,
					use: {
						loader: "babel-loader",
						options: {
							presets: [
								["@babel/preset-env", { targets: { node: "22" } }],
								"@babel/preset-typescript",
							],
						},
					},
					exclude: /node_modules/,
				},
			],
		},
		plugins,
		optimization: {
			minimize: false,
		},
	};
}

const configs = Object.entries(LAMBDAS).map(([name, src]) =>
	makeLambdaConfig(name, path.join(API_SRC, src)),
);

configs.push(
	makeLambdaConfig("inboxpilot-docs", path.join(API_SRC, "docs.ts"), [
		new webpack.DefinePlugin({ SPEC: buildSpec() }),
	]),
);

module.exports = configs;
