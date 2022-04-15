import * as core from '@actions/core'
import * as github from '@actions/github'

interface Response {
  repositoryOwner: {
    repositories: {
      pageInfo: {
        hasNextPage: boolean
        endCursor?: string
      }
      nodes: ResponseRepository[]
    }
  }
}

interface ResponseRepository {
  name: string
  nameWithOwner: string
  url: string
  templateRepository: null | {
    name: string
    owner: {
      login: string
    }
  }
}

interface Repository {
  name: string
  nameWithOwner: string
  url: string
}

async function run(): Promise<void> {
  try {
    const token: string = core.getInput('token')
    const octokit = github.getOctokit(token, {
      previews: ['baptiste']
    })
    const {repo} = github.context
    const targetOrg = core.getInput('org') || repo.owner
    const targetTemplateRepoName = core.getInput('repo') || repo.repo

    let items: ResponseRepository[] = []
    let nextPageCursor: string | null | undefined = null

    do {
      const result: Response = await octokit.graphql(
        `
        query orgRepos($owner: String!, $afterCursor: String) {
          repositoryOwner(login: $owner) {
            repositories(first: 100, after:$afterCursor, orderBy:{field:CREATED_AT, direction:DESC}) {
              pageInfo {
                hasNextPage
                endCursor
              }
              nodes {
                name
                nameWithOwner
                url
                templateRepository {
                  name
                  owner {
                    login
                  }
                }
              }
            }
          }
        }
      `,
        {
          owner: targetOrg,
          afterCursor: nextPageCursor
        }
      )
      nextPageCursor = result.repositoryOwner.repositories.pageInfo.hasNextPage
        ? result.repositoryOwner.repositories.pageInfo.endCursor
        : undefined

      items = items.concat(result.repositoryOwner.repositories.nodes)
    } while (nextPageCursor !== undefined)

    core.info(
      `Checking ${items.length} repositories for repositories from ${targetTemplateRepoName}...`
    )

    handleResults(targetOrg, targetTemplateRepoName, items)
  } catch (error) {
    core.setFailed(error.message)
  }
}

function handleResults(
  targetOrg: string,
  targetTemplateRepo: string,
  foundRepos: ResponseRepository[]
): void {
  const parsedFoundRepos: Repository[] = foundRepos
    .filter(
      d =>
        d.templateRepository &&
        d.templateRepository.name === targetTemplateRepo &&
        d.templateRepository.owner.login === targetOrg
    )
    .map(d => {
      return {
        name: d.name,
        nameWithOwner: d.nameWithOwner,
        url: d.url
      }
    })

  const names: string[] = parsedFoundRepos.map(d => d.name)
  const fullNames: string[] = parsedFoundRepos.map(d => d.nameWithOwner)
  const urls: string[] = parsedFoundRepos.map(d => d.url)

  core.setOutput('json', JSON.stringify(parsedFoundRepos))
  core.setOutput('names', JSON.stringify(names))
  core.setOutput('fullnames', JSON.stringify(fullNames))
  core.setOutput('urls', JSON.stringify(urls))
}

// noinspection JSIgnoredPromiseFromCall
run()
