# Plume

<img src="https://deiu.github.io/solid-plume/img/logo.png">

*Plume* is a 100% client-side blogging platform, built using [Solid standards](https://github.com/solid/), in which data is decoupled from the application itself. This means that you can host the application on any Web server, without having to install anything -- no database, no messing around with Node.js, it has 0 dependencies! It also means that other similar applications will be able to reuse the data resulting from your posts, without having to go through a complicated API.

Plume uses [Markdown](https://en.wikipedia.org/wiki/Markdown) to provide you with the easiest and fastest experience for writing beautiful articles.

It currently does not support dynamic configuration of data spaces, which means you will have to either run it on your own Web server, or manually upload it to your account -- you can use [https://databox.me]( https://databox.me) as storge. The next version will allow you to run it from Github, like all the other [Solid apps](https://github.com/solid/solid-apps) we currently offer.

## Configuration

Before being able to use Plume, you will have to manually set some config values. First you need to copy/rename the `config-example.json` file to `config.json`. Then you need to set the `postsURL` value to have it point to an **existing** container on a [Solid-friendly server](https://github.com/solid/solid-platform) that holds your blog posts. Finally, you should also set the `owners` variable by adding your own WebID, in order to be able to access the editor UI and to create new posts.

Here is an example of the configuration file:

```
{
    "owners": ["https://example.org/profile#me"],
    "title": "Plume",
    "tagline": "Light as a feather",
    "picture": "img/logo.svg",
    "fadeText": true,
    "showSources": true,
    "cacheUnit": "days",
    "defaultPath": "posts",
    "postsURL": "https://account.databox.me/Public/blog/posts/"
}
```

Here is what each config parameter maeans:

* `owner`: a list of URLs (WebIDs) of the people who can post on the blog
* `title`: the title of the blog
* `tagline`: tagline/subtitle
* `picture`: the picture to display on the blog's header
* `fadeText`: true/false - shortens the posts length when viewing the full blog
* `showSources`: true/false - it will add a button/link that points to the source of the blog post (the actual resource)
* `cacheUnit`: minutes/hours/days/ - validity of certain cached data (you shouldn't really need to change it)
* `defaultPath`: this value will be suggested to the user if the blog needs to be initialized
* `postsURL`: the URL of the folder (container) holding the posts for the blog
