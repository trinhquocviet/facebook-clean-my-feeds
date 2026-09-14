# Changelog - FB: Clean My Feeds

All notable changes, version history, and release notes for **FB - Clean My Feeds**.

---

## 💡 Tips & Workarounds

### Video Ads Workaround
This userscript does not block video ads (begin-roll, mid-roll, end-roll) directly, however there is a workaround using uBlock Origin:
1. Install [uBlock Origin (uBO)](https://github.com/gorhill/uBlock) in your browser(s).
2. In uBO, navigate to the **"My filters"** tab and paste the following rule:
   ```adblock
   facebook.com##+js(set, Object.prototype.scrubber, undefined)
   ```
*(Note: Has not been officially tested in other content/ad-blockers).*

---

## 📖 Usage Instructions
- **Accessing Settings**:
  - In Facebook, click on the **"Clean my feeds"** icon (mop + bucket) located in the top-right or bottom-left corner.
  - Alternatively, click on your userscript manager icon in the browser toolbar and select **"Settings"** under *FB - Clean my feeds*.
- **Configuring**:
  - Toggle the desired filter options for News Feed, Groups Feed, Videos Feed, Marketplace Feed, etc.
  - Click **Save**, then **Close**.
- **Backup & Export**:
  - It is recommended to export your settings periodically via the Export button (when your browser clears its cache, stored settings may be deleted).

### Known Issues
- **Firefox Private Browsing**: Settings are not saved in Private/Incognito mode.
- **Chrome / Edge Incognito**: Settings are retained only until the browser window is closed.

---

## 🎨 Attributions
- **Mop & Bucket Icon**: Created by [Freepik](https://www.freepik.com) via [Flaticon](https://www.flaticon.com/premium-icon/mop_2383747).

---

## 📜 Release History

### v5.02 (November 2024)
- Updated News Feed Sponsored detection rules.

### v5.01 (October 2024)
- Changed the `detect-changes-engine` component.
- Updated settings dialog box.
- Users can now change the dialog box's UI language.
- Updated label for post hidden component.
- Added Animated GIFs post detection component (News Feed + Groups Feed) (`gif`/`mp4`).
- Removed consecutive hidden posts facility from Watch Videos (FB retains a few posts as you scroll).
- Added Duplicate Video detection component (Watch Videos feed).
- Added Instagram Video detection component (Watch Videos feed).
- Added code to remove "incomplete" Watch Video posts (posts with no content).
- Added icon to open a Watch Videos Feed post in a new window.
- Updated News Feed detection rule.
- Updated Groups Feed detection rule.
- Updated Marketplace detection rules.
- Updated Search posts detection rule.
- Updated News Feed's Sponsored posts detection rule.
- Added option to Disable looping videos in Reels.
- Fixed bug with showing/hiding the FB-CMF button.
- Updated `nf_isSuggested` filter rules.
- Updated `nf_isPeopleYouMayKnow` filter rule.
- Added RegExp option to text filters.
- General code tweaks and optimizations.

### v4.31 (June 2024)
- Reels and Videos: added extra detection rule (dictionary-based).
- Survey: updated detection rule.
- Reels: added option to stop video looping.

### v4.30 (March 2024)
- Hotfix release.
- Updated Marketplace feed detection component.

### v4.29 (February 2024)
- **Hotfix**: Resolved issues where Facebook, Adblockers, and FB-CMF were clashing.
- Adjusted News Feed query rules.
- Temporarily disabled News Feed message/notification tab (restored in subsequent releases).

### v4.28 (January 2024)
- Enabled option to toggle Sponsored post detection rule (for uBO compatibility).
- Added Video "LIVE" detection rule.
- Enabled Reels video controls.
- Added Ukrainian (Україна) localization.
- Added Bulgarian (български) localization.
- Dialog box: reworded "Miscellaneous items" to "Supplementary / information section".
- Dialog box: added "Reset" button to reset options to defaults.
- Fixed bug with Survey detection component.
- Fixed bug with importing settings from a file.
- Revised message/notification tab for News Feed.
- Revised Create Stories detection rule.
- Added option to filter posts by number of Likes.
- Fixed bug with `scanTreeForText()` failing to detect "Anonymous participant".
- Updated Groups Feed filter rules for new HTML structure via (Feeds > Groups).
- Added display of script version number to dialog box.

### v4.27 (December 2023)
- Added Russian (Русский) localization (contributed by GitHub user @Kenya-West).

### v4.26 (November 2023)
- Added `web.facebook.com` to `@match` conditions.
- Added Survey detection component (Home / News Feed).
- Added Follow detection component (Home / News Feed).
- Added Participate detection component (Home / News Feed).
- Updated Marketplace detection rules.

### v4.25 (November 2023)
- Added extra filter rule for `nf_isSuggested()` (for "Suggested for you" posts, contributed by @opello).
- Added News Feed Stories post detection rule.
- Revised `scanTreeForText()` function to include other elements for scanning.
- Fixed bug with Marketplace price filtering.
- Reduced possible conflicts with uBlock Origin and other ad-blockers.
- Code tweaks.

### v4.24 (September 2023)
- Fixed issues with v4.23 selection and detection rules.
- Code tweaks.

### v4.23 (August 2023)
- Fixed bug with showing Marketplace hidden items.
- Updated Marketplace detection rules.
- Split Marketplace text filter into two: prices and description.
- Merged "Stories" with "Stories | Reels | Rooms" detection rules.
- Fixed bug where CMF hidden dialog box text was included in Ctrl+F searches.
- Dropped "Create room" detection component (no longer listed on FB).

### v4.22 (July 2023)
- Updated News Feed posts selection rule (accommodating FB structural changes).
- Updated "Events you may like" detection rule.

### v4.21 (June 2023)
- Updated News Feed detection rules for older HTML structures.
- Updated Watch Videos Feed detection rules.
- Added Greek (Ελληνικά) localization.
- Updated various utility functions.

### v4.20 (May 2023)
- Added "Feeds (most recent)" to clean-up rules.
- Updated Search Feed sponsored posts rule.

### v4.19 (May 2023)
- Updated News Feed posts selection rule.

### v4.18 (May 2023)
- Updated News Feed sponsored posts rule.
- Added News Feed sponsored video posts rule.
- Updated News Feed suggested posts rule.

### v4.17 (March 2023)
- Fixed issue with GreaseMonkey & FireMonkey running userscript.
- Updated News Feed sponsored posts rule.
- Updated Videos Feed sponsored posts rule.
- Added option to hide "# shares" on posts (News & Groups feeds).

### v4.16 (February 2023)
- Fixed issue with `<no message>` setting breaking Facebook layout.
- Code tweaks.

### v4.15 (February 2023)
- Updated News Feed sponsored posts rule.
- Updated Marketplace Feed Item page posts rules.
- Code tweaks.

### v4.14 (January 2023)
- Updated News Feed Suggestion/Recommendation posts rule.
- Updated News Feed verbosity behavior.
- Groups Feed posts: added icon to open post in new window.
