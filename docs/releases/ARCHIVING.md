# Archive Encabulator Lab on Zenodo

## Published v0.1.0

Check the Zenodo account for an existing version record. If the published tag still needs a deposit, use the source ZIP from the GitHub release, choose **Software**, and use the title, creator, license and version from its archival metadata. Link the release page as the source. [GitHub release](https://github.com/RRG314/encabulator-lab/releases/tag/v0.1.0) · [Tagged archival metadata](https://github.com/RRG314/encabulator-lab/blob/v0.1.0/.zenodo.json) · [Zenodo manual software upload](https://help.zenodo.org/docs/github/archive-software/manual-upload/)

GitHub hosts the eight engineering packages and their SHA-256 manifest as release attachments. To rebuild the packages, clone the GitHub repository with tags and run `python3 scripts/package-release.py /path/to/output --ref v0.1.0`. The Zenodo GitHub integration archives the repository snapshot at the release tag. [Zenodo discussion of additional GitHub release assets](https://github.com/zenodo/zenodo/issues/1728)

## Later releases

Before publishing a new version, sign in to Zenodo with GitHub, select **Sync now** in the GitHub settings and enable `RRG314/encabulator-lab`. Keep `package.json`, `CITATION.cff`, and `.zenodo.json` aligned with the release tag. Zenodo reads `.zenodo.json` for GitHub archiving. GitHub uses `CITATION.cff` for its citation display. [Zenodo GitHub settings](https://zenodo.org/account/settings/github/) · [Enable a repository](https://help.zenodo.org/docs/github/enable-repository/) · [Zenodo metadata](https://help.zenodo.org/docs/github/describe-software/)

Once Zenodo processes a published release, verify the title, creator, version, license and downloadable archive. Record its version DOI in the release notes and associated citation material. [Archive a GitHub release](https://help.zenodo.org/docs/github/archive-software/github-upload/)
