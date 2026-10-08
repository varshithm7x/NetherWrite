cask "netherwrite" do
  version "1.0.0"

  on_arm do
    sha256 "REPLACE_WITH_ARM64_DMG_SHA256"
    url "https://github.com/varshithm7x/NetherWrite/releases/download/v#{version}/NetherWrite-#{version}-arm64.dmg"
  end

  on_intel do
    sha256 "REPLACE_WITH_X64_DMG_SHA256"
    url "https://github.com/varshithm7x/NetherWrite/releases/download/v#{version}/NetherWrite-#{version}.dmg"
  end

  name "NetherWrite"
  desc "Local-first knowledge management app built around Markdown and graph navigation"
  homepage "https://github.com/varshithm7x/NetherWrite"

  app "NetherWrite.app"

  zap trash: [
    "~/Library/Application Support/NetherWrite",
    "~/Library/Preferences/com.netherwrite.app.plist",
    "~/Library/Saved Application State/com.netherwrite.app.savedState",
  ]
end
