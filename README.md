## Contribution

Fork this repo and develop on a separate feature branch. Make pull request to master.

## Create / edit levels

Run `npm run dev:level` and navigate to `localhost:1234?level=0`. Change the `level` parameter to change the level to be edited. Levels can be found from `src/levels`.

To create new level:

- create new file: `src/levels/level-<some number>.js`
- import the new level at `src/levels/index.js` and append the imported level to the exported array
- set `LEVEL_COUNT` constant to equal the number of levels at `gameController.js`

## Develop server locally

Run `npm run dev:server` and navigate to `localhost:8000`.

## Develop game client locally

Serve game locally with `npm run dev:server`. Apply client changes by running `npm run build` to apply changes in the client code.

## Architecture
