

// 设置 ENV
process.env.NODE_ENV = 'development';
process.env.BABEL_ENV = 'development';

// 保证 unhandle process 能抛出异常
process.on('unhandledRejection', (err) => {
    throw err;
});

// 加载环境变量
require('./lib/env');

const fs = require('fs-extra');
const path = require('path');
const babel = require('babel-core');
const assert = require('assert');
const glob = require('glob');
const chalk = require('chalk');
const { rmdir, mkdir } = require('./utils');
const babelConfig = require('./lib/babelConfig');

const ES_PATTERN = /\.(js|jsx|mjs)$/;

async function run(basedir) {
    const srcDir = path.join(basedir, 'src');
    const destDir = path.join(basedir, 'lib');

    assert(fs.existsSync(srcDir), `${srcDir} directory should exists`);

    console.log(chalk.cyan('Starting to transform src files to lib ...\n'));

    // remove old destDir
    console.log(' - %s %s', chalk.yellow('remove'), destDir);
    await rmdir(destDir);
    await mkdir(destDir);

    // transform
    const files = glob.sync('**/*.*', {
        cwd: srcDir,
    });

    for (const file of files) {
        const srcFile = path.join(srcDir, file);
        let destFile = path.join(destDir, file);

        // 如果是 ES 代码, 就 transform
        if (file.match(ES_PATTERN)) {
            console.log(' - %s %s', chalk.green('transform'), file);
            destFile = destFile.replace(ES_PATTERN, '.js');
            const content = fs.readFileSync(srcFile, 'utf8');
            await mkdir(path.dirname(destFile));
            fs.writeFileSync(destFile, babel.transform(content, babelConfig).code);
        } else {
            console.log(' - %s %s', chalk.green('copy'), file);
            await fs.copy(srcFile, destFile);
        }
    }
    console.log(chalk.green('\nTransform successfully!'));
}

run(process.cwd())
    .catch((err) => {
        console.error(chalk.red(err.stack || err));
        process.exit(1);
    });
