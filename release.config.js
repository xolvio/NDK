module.exports = {
  branches: ['main'],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    '@semantic-release/changelog',
    [
      'semantic-release-yarn',
      {
        npmPublish: true,
        tarballDir: 'dist',
      },
    ],
    [
      '@semantic-release/github',
      {
        assets: 'dist/*.tgz',
      },
    ],
    [
      '@semantic-release/git',
      {
        assets: ['package.json', 'yarn.lock', 'CHANGELOG.md'],
        message: 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
      },
    ],
  ],
};
