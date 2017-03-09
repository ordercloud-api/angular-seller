| master | development |
| --- | --- |
| [![Build Status](https://travis-ci.org/ordercloud-api/angular-admin.svg?branch=master)](https://travis-ci.org/ordercloud-api/angular-admin) | [![Build Status](https://travis-ci.org/ordercloud-api/angular-admin.svg?branch=development)](https://travis-ci.org/ordercloud-api/angular-admin) |

# OrderCloud Angular Admin
An open-source starter application for custom OrderCloud administrative solutions built on AngularJS. Ideally solution
implementers will fork or clone this repository to maintain their customized admin application through merges and
pull requests after new versions are released in the base fork (this repository).

- [Getting Started](#Getting-started)
- [Contributors](#Contributors)

- - - -

## Getting started

### Prerequisites
- [Git (version control)](https://git-scm.com/)
- [Node.js (npm)](http://nodejs.org/)
- [Bower (another package manager)](https://bower.io/#install-bower)
- [Gulp.js (automation)](http://gulpjs.com/)

### Installation
Install the project dependencies:
```sh
$ npm install
```
You should now have a few more directories in your project:
```
./
  |- node_modules/
  |- bower_components/
```
If for some reason the `post-install` script fails, reattempt the bower install manually:
```sh
$ bower install
```

### Local Development
To view your application locally while you work, run the following gulp command:
```sh
$ gulp build
```
This will pull together everything in the projects `./src/` directory and put the result into a new `./build/` folder
(ignored by source control).

After the build succeeds, an express server will fire up and open the app in your default browser @ `http://localhost:3000/`.
Additionally, a watch is initiated so that [BrowserSync](https://browsersync.io/) can automatically refresh the app when
changes to the `./src/` directory are made.

### Running Unit and E2E Tests
[Karma](https://karma-runner.github.io/1.0/index.html), [Jasmine](https://jasmine.github.io/), and [Protrator (e2e test framework for AngularJS)](http://www.protractortest.org/#/)
are our test frameworks of choice, everything you need to run unit or E2E tests should already be installed via npm.

| Task | File Extension | Description |
| --- | --- | --- |
| `gulp test:unit` | `*.spec.js` | Runs only the unit tests |
| `gulp test:e2e` | `*.test.js` | Runs only the E2E tests |
| `gulp test` | `*.spec.js` or `*.test.js` | Runs both the unit and E2E tests |

### Compiling for Production
After you've thoroughly tested your application, you can run the following command to compile your code to a production-ready
state:
```sh
$ gulp compile
```
This will concat all similar file types into a single file, minify the code, and drop the result to a new folder `./compile/`.
Images in the `./src/assets/` directory will be compressed for web optimization and template files will be stringified
and added to the angular `$templateCache` for faster load times.

>While we've worked hard to ensure that your app will behave the same on both build and compile, it is always recommended that
the compiled code be thoroughly tested before moving to production.

When the compile is complete, the express server will fire up again and open the app @ `http://localhost:3000/`. For performance reasons
the watch is not fired on compile like it is on build.

### Deploying to [GitHub Pages](https://pages.github.com/)
Having worked in the B2B world for over 15 years we know that showing development progress is extremely important, especially
during large projects. That is why we've provided an easy way for you to deploy your compiled code directly to a gh-pages branch
for fast and easy demos!
```sh
$ gulp deploy
```
This will push a compiled version of your working copy directly to your default git remote and can be viewed here @ `username.github.io/repository-name`.
> **Important Note!** Your angular app _must **not**_ be in HTML5 mode for the routing on gh-pages to work properly. This
can be changed in `./src/app/app.constants.json` prior to running the task.

> Github pages can take a few minutes (about 10) to propagate before your app will become available.

Of course, this is not the only deployment option available. Angular-based OrderCloud applications are [preconfigured](https://devcenter.heroku.com/categories/nodejs)
to be deployed on [Heroku](https://www.heroku.com/) using their [GitHub integration](https://devcenter.heroku.com/articles/github-integration) and the `./compile` directory is made up of entirely static files that
can be easily deployed to any hosting provider.

## Contributors
The OrderCloud team welcomes any and all open-source contributors to create a pull request for bug fixes, enhancements, or new features (pending review).

Prior to writing any code, be sure to [open an issue](https://github.com/ordercloud-api/angular-admin/issues) with a detailed description of
your problem or proposed enhancement. We may already be on our way to delivering what you want!

The OrderCloud team uses GitHub's standard [fork, branch, pull request workflow](https://gist.github.com/Chaser324/ce0505fbed06b947d962) and
we expect any contributors to follow a similar workflow. Always provide a passing unit test for any fix or enhancement.

Thank you for being a part of the [OrderCloud Community](http://community.ordercloud.io) and helping make our resources the best they can be!

<!--
### Detailed Installation

This section provides a little more detailed understanding of what goes into
starting your first admin app. Though OrderCloud is really simple
to use, it might help to have an understanding of the tools involved here, like
Node.js and Gulp and Bower. If you're completely new to highly organized,
modern JavaScript development, take a few short minutes to read [this overview
of the tools](tools.md) before continuing with this section.

====

`OrderCloud` uses [Gulp](http://gulpjs.com/) as its build system, so
[Node.js](http://nodejs.org) is required.

Install the build dependencies locally:

```sh
$ npm install
```

This will read the `dependencies` (empty by default) and the `devDependencies`
(which contains our build requirements) from `package.json` and install
everything needed into a folder called `node_modules/`.

There are many Bower packages used by `OrderCloud`, like AngularJS and the
OrderCloud-Angular-SDK, which are listed in `bower.js`. To install them into the
`vendor/` directory, simply run:

**This is already installed after running $ npm install

```sh
$ bower install
```

In the future, should you want to add a new Bower package to your app, run the
`install` command and add `--save` to save the dependency in your bower.json file:

```sh
$ bower install packagename --save
```

The `--save` flag tells Bower to add the package at its current version to
our project's `bower.js` file so should another developer download our
application (or we download it from a different computer), we can simply run the
`bower install` command as above and all our dependencies will be installed for
us. Neat!

Technically, `OrderCloud` is now ready to go.

To ensure your setup works, build your application and then run it with the following
commands:

```sh
$ gulp build
```

The built files are placed in the `build/` directory by default. And you application
should automatically open in the browser window on a localhost!

`watch` actually starts a few other processes in the background to help you develop your
application. Using `browser-sync` and some built in gulp functions the app is now watching
for changes in your source directory. Should you make any changes to your html or js files
the app should automatically reload your application with the appropriate changes. Also
if you make any changes to your style sheets (less or css) the app will rebuild those changes
and inject them directly into the application, without reloading the entire page! 

When you're ready to push your app into production, just run the `compile`
command:

```sh
$ gulp compile
```

This will concatenate and minify your sources and place them by default into the
`compile/` directory. There will only be three files (excluding assets): `index.html`,
`OrderCloud.js`, and `OrderCloud.css`. All of the vendor dependencies like
AngularJS styles and the OrderCloud-SDK itself have been added to them for super-easy
deploying. If you use any assets (`src/assets/`) then they will be copied to
`compile/` as is.

Lastly, a complete build is always available by simply running the default
task, which runs `build` and then `compile`:

```sh
$ gulp
```
 -->
