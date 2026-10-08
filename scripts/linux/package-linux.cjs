const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "../..");
const releaseDir = path.join(root, "release");
const unpackedDir = path.join(releaseDir, "linux-unpacked");
const buildDir = path.join(root, "build");
const scratchDir = path.join(root, "scratch");

const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const version = pkg.version;
const debDepends = [
  "libgtk-3-0",
  "libnotify4",
  "libnss3",
  "libxss1",
  "libxtst6",
  "xdg-utils",
  "libatspi2.0-0",
  "libuuid1",
  "libsecret-1-0",
  "libasound2 | libasound2t64"
];

function getDirectorySize(dir) {
  let size = 0;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.lstatSync(filePath);
    if (stat.isDirectory()) {
      size += getDirectorySize(filePath);
    } else {
      size += stat.size;
    }
  }
  return size;
}

function installIcons(targetPkgDir) {
  const iconSizes = ["512x512", "256x256", "128x128", "64x64", "48x48", "32x32", "16x16"];
  fs.mkdirSync(path.join(targetPkgDir, "usr/share/pixmaps"), { recursive: true });
  fs.copyFileSync(
    path.join(buildDir, "icon.png"),
    path.join(targetPkgDir, "usr/share/pixmaps/netherwrite.png")
  );

  // Also copy icon directly into app root for fallback
  fs.copyFileSync(
    path.join(buildDir, "icon.png"),
    path.join(targetPkgDir, "opt/NetherWrite/icon.png")
  );

  for (const size of iconSizes) {
    const dir = path.join(targetPkgDir, `usr/share/icons/hicolor/${size}/apps`);
    fs.mkdirSync(dir, { recursive: true });
    fs.copyFileSync(
      path.join(buildDir, "icon.png"),
      path.join(dir, "netherwrite.png")
    );
  }
}

async function buildDeb() {
  console.log("Building Debian package...");
  const debPkgDir = path.join(scratchDir, "deb-pkg");
  
  // Clean & recreate structure
  fs.rmSync(debPkgDir, { recursive: true, force: true });
  fs.mkdirSync(path.join(debPkgDir, "DEBIAN"), { recursive: true });
  fs.mkdirSync(path.join(debPkgDir, "opt/NetherWrite"), { recursive: true });
  fs.mkdirSync(path.join(debPkgDir, "usr/bin"), { recursive: true });
  fs.mkdirSync(path.join(debPkgDir, "usr/share/applications"), { recursive: true });

  // Copy files
  execSync(`cp -r "${unpackedDir}"/* "${path.join(debPkgDir, "opt/NetherWrite")}"`);
  installIcons(debPkgDir);

  fs.copyFileSync(
    path.join(root, "packaging/aur/netherwrite/netherwrite.desktop"),
    path.join(debPkgDir, "usr/share/applications/netherwrite.desktop")
  );
  fs.symlinkSync("/opt/NetherWrite/netherwrite", path.join(debPkgDir, "usr/bin/netherwrite"));

  // Write control file
  const control = `Package: netherwrite
Version: ${version}
Section: utils
Priority: optional
Architecture: amd64
Maintainer: NetherWrite <netherwrite@gmail.com>
Depends: ${debDepends.join(", ")}
Description: A local-first knowledge management tool with graph-based note linking
`;
  fs.writeFileSync(path.join(debPkgDir, "DEBIAN/control"), control);

  // Build
  execSync(`dpkg-deb --root-owner-group --build "${debPkgDir}" "${path.join(releaseDir, `netherwrite_${version}_amd64.deb`)}"`);
  console.log("Debian package built successfully!");
}

async function buildPacman() {
  console.log("Building Pacman package...");
  const pacmanPkgDir = path.join(scratchDir, "pacman-pkg");
  
  // Clean & recreate structure
  fs.rmSync(pacmanPkgDir, { recursive: true, force: true });
  fs.mkdirSync(path.join(pacmanPkgDir, "opt/NetherWrite"), { recursive: true });
  fs.mkdirSync(path.join(pacmanPkgDir, "usr/bin"), { recursive: true });
  fs.mkdirSync(path.join(pacmanPkgDir, "usr/share/applications"), { recursive: true });

  // Copy files
  execSync(`cp -r "${unpackedDir}"/* "${path.join(pacmanPkgDir, "opt/NetherWrite")}"`);
  installIcons(pacmanPkgDir);

  fs.copyFileSync(
    path.join(root, "packaging/aur/netherwrite/netherwrite.desktop"),
    path.join(pacmanPkgDir, "usr/share/applications/netherwrite.desktop")
  );

  // Create symlink
  try {
    fs.symlinkSync("/opt/NetherWrite/netherwrite", path.join(pacmanPkgDir, "usr/bin/netherwrite"));
  } catch (err) {
    if (err.code !== "EEXIST") throw err;
  }

  // Calculate size in bytes
  const size = getDirectorySize(pacmanPkgDir);

  // Write .PKGINFO
  const pkginfo = `pkgname = netherwrite
pkgver = ${version}-1
pkgdesc = A local-first knowledge management tool with graph-based note linking
url = https://github.com/varshithm7x/NetherWrite
builddate = ${Math.floor(Date.now() / 1000)}
packager = NetherWrite <netherwrite@gmail.com>
arch = x86_64
size = ${size}
license = Apache-2.0
depend = fuse2
depend = gtk3
depend = nss
depend = libxss
depend = libxtst
depend = libsecret
depend = xdg-utils
`;
  fs.writeFileSync(path.join(pacmanPkgDir, ".PKGINFO"), pkginfo);

  // Build
  execSync(`tar --owner=0 --group=0 --numeric-owner --zstd -cf "${path.join(releaseDir, `netherwrite-${version}-1-x86_64.pkg.tar.zst`)}" -C "${pacmanPkgDir}" .PKGINFO opt usr`);
  console.log("Pacman package built successfully!");
}

async function main() {
  if (!fs.existsSync(unpackedDir)) {
    console.error(`Error: Unpacked directory not found at ${unpackedDir}`);
    process.exit(1);
  }
  
  fs.mkdirSync(scratchDir, { recursive: true });

  try {
    await buildDeb();
    await buildPacman();
  } catch (err) {
    console.error("Packaging failed:", err);
    process.exit(1);
  }
}

main();
