# "Find GitHub Template Repository Children" GitHub Action

A GitHub action for finding which repositories, under a single user/organization, are using a certain template.

## Background

This project is forked from [maael/template-repository-usage-action](https://github.com/maael/template-repository-usage-action).
While the original repository updates a README file including the children repositories found, this fork is focused on just providing an output of the found repositories on the GitHub Workflow where used.

## Usage

```yaml
steps:
  - name: Get template children
    uses: David-Lor/template-repository-usage-action@main
    id: template-children
    with:
      token: ${{ secrets.GITHUB_TOKEN }}
      org: David-Lor
      repo: generic-template
  - name: Print action outputs
    run: |-
      echo "Names: ${{ steps.template-children.outputs.names }}"
      echo "FullNames: ${{ steps.template-children.outputs.fullnames }}"
      echo "URLs: ${{ steps.template-children.outputs.urls }}"
      echo "JSON: ${{ steps.template-children.outputs.json }}"
```

### Options

| Option  | Required | Description                                                                                                                                                                                                 | Default                                           |
|---------|----------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------|
| `token` | ❌        | GitHub token or personal access token that can access your private or organization repos, see [here](https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token) for more. | Default GITHUB_TOKEN (only supports public repos) |
| `org`   | ❌        | User or organization that owns the Template repository.                                                                                                                                                     | Owner of repo where action runs                   |
| `repo`  | ❌        | Name of the Template repository.                                                                                                                                                                            | Name of repo where action runs                    |
