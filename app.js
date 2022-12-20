const { Octokit, App } = require("octokit");
const express = require('express')
const yaml = require('js-yaml');

const webapp = express()
const port = 3000
const org = process.env.GH_ORG_NAME
const appId = process.env.GH_APP_ID 
const installationId = process.env.GH_INSTALLATION_ID 
let octokit

const app = new App({ appId, privateKey: require('fs').readFileSync('./key.pem') });

const conn = async () => {
  const { data: slug } = await app.octokit.rest.apps.getAuthenticated();
  octokit = await app.getInstallationOctokit(installationId);
}

conn()

//   http://localhost:3000/api/capabilities
webapp.get('/api/capabilities', async (req, res) => {
  try {
    const repos = await getRepos()
    capabilities = repos.data.filter(function (repo) {
      return repo.name.includes("capability")
    }).map(repo => repo.name.replace("-capability", ""))
    res.json(capabilities)
  } catch (err) {
    console.log(err)
    res.json([])
  }
})

//   http://localhost:3000/api/capability/iis-capability/tags
webapp.get('/api/capability/:capability/tags', async (req, res) => {
  try {
    const tags = await getTags("tomanval", req.params.capability)
    tagVersions = tags.data.map(tag => tag.name)
    res.json(tagVersions)
  } catch (err) {
    res.json([])
  }
})

//   http://localhost:3000/api/capability/iis-capability/tag/main/directives
webapp.get('/api/capability/:capability/tag/:tag/directives', async (req, res) => {
  try {
    const files = await getContents("tomanval", req.params.capability, "validation")
    directives = files.data.map(directive => directive.name.replace(".yml", ""))
    res.json(directives)
  } catch (err) {
    res.json([])
  }
})

//   http://localhost:3000/api/capability/iis-capability/tag/main/directive/iis_caching
webapp.get('/api/capability/:capability/tag/:tag/directive/:directive', async (req, res) => {
  try {
    const file = await getContents("tomanval", req.params.capability, `validation/${req.params.directive}.yml`, req.params.tag)
    directive = yaml.load(Buffer.from(file.data.content, 'base64'), 'utf8')
    res.json(directive)
  } catch (err) {
    res.json({})
  }
})

webapp.listen(port, () => {
  console.log(`Listening on port ${port}`)
})

const getRepos = async () => await octokit.request(`GET /orgs/${org}/repos`)

const getTags = async (owner, repo) => await octokit.request(`GET /repos/${owner}/${repo}/tags`)

const getContents = async (owner, repo, path, tag) => await octokit.request(`GET /repos/${owner}/${repo}/contents/${path}/?ref=${tag}`)



