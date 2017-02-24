# Deploying to your fork to gh-pages
>This only works on the [development](https://github.com/ordercloud-api/angular-admin/tree/development) branch
>
>System Requirements: Git, Node.js, Bower, Gulp

1. Fork the [repository](https://github.com/ordercloud-api/angular-admin) under your user
2. Pull down the code using Git or SourceTree
3. Checkout the [development](https://github.com/ordercloud-api/angular-admin/tree/development) branch
4. Run the following commands (windows command prompt or terminal) from the project root directory
  * `npm install`
  * `bower install` (if the post npm install scripts fail)
  * `gulp build`
  * `gulp deploy` (you may be asked to sign in)
5. That's it! You should now have a working app at **[[git username]].github.io/angular-admin**
