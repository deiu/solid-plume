# Plume

<img src="https://deiu.github.io/solid-plume/img/logo.svg" style="width: 100px;">

*Plume* is a 100% client-side blogging platform, built using [Solid standards](https://github.com/solid/), in which data is decoupled from the application itself. This means that you can host the application on any Web server, without having to install anything -- no database, no messing around with Node.js, it has 0 dependencies! It also means that other similar applications will be able to reuse the data resulting from your posts, without having to go through a complicated API.

Plume uses [Markdown](https://en.wikipedia.org/wiki/Markdown) to provide you with the easiest and fastest experience for writing beautiful articles.

It currently does not support dynamic configuration of data spaces, which means you will have to either run it on your own Web server, or manually upload it to your account on [https://databox.me]( https://databox.me). The next version will allow you to run it from Github, like all the other [Solid apps](https://github.com/solid/solid-apps) we currently offer.

If you know what you're doing, you can manually edit the `/app/config.js` file and set some config values. For instance you can set the `dataContainer` value to have it point to an **existing** container on a [Solid-friendly server](https://github.com/solid/solid-platform). You should also set the `owner` to your own WebID, to be able to access the editor UI.

```
Plume.config = {
	owner: 'https://example.org/profile#me',
	...
	dataContainer: 'https://account.databox.me/Public/blog/posts/'
}
```
