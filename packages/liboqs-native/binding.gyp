{
	"targets": [
		{
			"target_name": "liboqs_native",
			"sources": ["src/addon.cc"],
			"include_dirs": [
				"<!@(node -p \"require('node-addon-api').include\")",
				"<!(node -e \"const { resolve } = require('node:path'); const dir = process.env.OQS_INCLUDE_PATH ?? resolve(process.cwd(), 'tooling/liboqs-src/build/include'); process.stdout.write(dir + '\\n');\")"
			],
			"dependencies": ["<!(node -p \"require('node-addon-api').gyp\")"],
			"cflags_cc": ["-std=c++17", "-fexceptions"],
			"cflags_cc!": ["-fno-exceptions"],
			"xcode_settings": {
				"GCC_ENABLE_CPP_EXCEPTIONS": "YES",
				"CLANG_CXX_LIBRARY": "libc++",
				"MACOSX_DEPLOYMENT_TARGET": "15.0"
			},
			"defines": ["NAPI_CPP_EXCEPTIONS"],
			"conditions": [
				[
					"OS==\"win\"",
					{
						"libraries": [
							"<!(node -e \"const { resolve } = require('node:path'); const dir = process.env.OQS_LIB_PATH ?? resolve(process.cwd(), 'tooling/liboqs-src/build/bin'); process.stdout.write(resolve(dir, 'oqs.lib') + '\\n');\")"
						]
					}
				],
				[
					"OS!=\"win\"",
					{
						"libraries": [
							"<!(node -e \"const { resolve } = require('node:path'); const dir = process.env.OQS_LIB_PATH ?? resolve(process.cwd(), 'tooling/liboqs-src/build/lib'); process.stdout.write(resolve(dir, 'liboqs.a') + '\\n');\")"
						]
					}
				]
			]
		}
	]
}

