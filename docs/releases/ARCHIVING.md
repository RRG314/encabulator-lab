# Archive Encabulator Lab on Zenodo

Before publishing the first GitHub release, sign in to Zenodo with the GitHub account authorized to manage `RRG314/encabulator-lab`. In Zenodo’s GitHub settings, click **Sync now** and enable the repository. Confirm it appears in the enabled list. [Zenodo GitHub settings](https://zenodo.org/account/settings/github/) · [Enable a repository](https://help.zenodo.org/docs/github/enable-repository/)

Publish the reviewed `v0.1.0` GitHub draft when it is ready. Keep `package.json`, `CITATION.cff`, and `.zenodo.json` aligned with the version on the draft’s target commit. Zenodo reads `.zenodo.json` for the GitHub archive. GitHub uses `CITATION.cff` to display citation metadata. [Zenodo metadata](https://help.zenodo.org/docs/github/describe-software/)

The Zenodo integration archives the repository snapshot at the release tag. GitHub hosts the eight engineering packages and their SHA-256 manifest as release attachments. To rebuild the packages, clone the GitHub repository with tags and run `python3 scripts/package-release.py /path/to/output --ref v0.1.0`. [Zenodo discussion of additional GitHub release assets](https://github.com/zenodo/zenodo/issues/1728)

After Zenodo processes the published release, check the record’s title, creator, version, license, and downloadable archive. Use the version DOI to cite this snapshot and add it to the published release notes and the current citation metadata. The draft does not trigger archiving. [Archive a GitHub release](https://help.zenodo.org/docs/github/archive-software/github-upload/)
