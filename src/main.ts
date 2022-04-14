import {promises as fs} from 'fs'
import path from 'path'
import * as core from '@actions/core'
import * as github from '@actions/github'

interface Response {
  repositoryOwner: {
    repositories: {
      pageInfo: {
        hasNextPage: boolean
        endCursor?: string
      }
      nodes: Item[]
    }
  }
}
interface Item {
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

async function run(): Promise<void> {
  try {
    const authorEmail =
      core.getInput('author_email') || 'matt.a.elphy@gmail.com'
    const authorName = core.getInput('author_name') || 'Matthew Elphick'

    const token: string = core.getInput('token')
    const octokit = github.getOctokit(token, {
      previews: ['baptiste']
    })
    const {repo} = github.context
    const org = core.getInput('org') || repo.owner
    const repoName = core.getInput('repo') || repo.repo

    let items: Item[] = []
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
          owner: org,
          afterCursor: nextPageCursor
        }
      )
      nextPageCursor = result.repositoryOwner.repositories.pageInfo.hasNextPage
        ? result.repositoryOwner.repositories.pageInfo.endCursor
        : undefined

      items = items.concat(result.repositoryOwner.repositories.nodes)
    } while (nextPageCursor !== undefined)

    core.info(
      `Checking ${items.length} repositories for repositories from ${repoName}`
    )

    const reposProducedByThis = items
      .filter(
        d =>
          d.templateRepository &&
          d.templateRepository.name === repoName &&
          d.templateRepository.owner.login === org
      )
      .map(d => {
        name: d.nameWithOwner;
        url: d.url;
      })

    core.setOutput("repositories", JSON.stringify(reposProducedByThis))
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
